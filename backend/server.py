from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from web3 import Web3
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# PulseChain Web3 connection
w3 = Web3(Web3.HTTPProvider(os.environ['PULSECHAIN_RPC_URL']))

# Contract ABI (simplified for demo)
CONTRACT_ABI = []

# LLM Chat for AI insights
llm_chat = LlmChat(
    api_key=os.environ['EMERGENT_LLM_KEY'],
    session_id="plinko-insights",
    system_message="You are an AI analyst for a PlinkoGame on PulseChain. Provide insights on game statistics, jackpot trends, and player behavior."
).with_model("openai", "gpt-4o")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class GamePlay(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_address: str
    slot: int
    payout: float
    is_jackpot: bool
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GameState(BaseModel):
    main_jackpot: float
    mini_jackpot: float
    play_count: int
    host_accumulated: float

class AIInsightRequest(BaseModel):
    query: str

class AIInsightResponse(BaseModel):
    insight: str

@api_router.get("/")
async def root():
    return {"message": "PulseChain Plinko Game API"}

@api_router.get("/game/state", response_model=GameState)
async def get_game_state():
    """
    Get current game state from blockchain
    """
    try:
        contract_address = os.environ.get('CONTRACT_ADDRESS')
        if not contract_address or contract_address == "":
            # Return mock data if contract not deployed
            return GameState(
                main_jackpot=52341.50,
                mini_jackpot=8762.30,
                play_count=52341,
                host_accumulated=261.71
            )
        
        # TODO: Implement actual contract call when deployed
        # contract = w3.eth.contract(address=contract_address, abi=CONTRACT_ABI)
        # state = contract.functions.getGameState().call()
        
        return GameState(
            main_jackpot=52341.50,
            mini_jackpot=8762.30,
            play_count=52341,
            host_accumulated=261.71
        )
    except Exception as e:
        logging.error(f"Error getting game state: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/game/history", response_model=List[GamePlay])
async def get_game_history(limit: int = 50):
    """
    Get recent game plays from database
    """
    try:
        plays = await db.game_plays.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
        
        for play in plays:
            if isinstance(play.get('timestamp'), str):
                play['timestamp'] = datetime.fromisoformat(play['timestamp'])
        
        return plays
    except Exception as e:
        logging.error(f"Error getting game history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/game/record")
async def record_game_play(play: GamePlay):
    """
    Record a game play (called by frontend after blockchain transaction)
    """
    try:
        doc = play.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.game_plays.insert_one(doc)
        return {"success": True}
    except Exception as e:
        logging.error(f"Error recording game play: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/insight", response_model=AIInsightResponse)
async def get_ai_insight(request: AIInsightRequest):
    """
    Get AI-powered insights about game statistics
    """
    try:
        # Get recent game data
        plays = await db.game_plays.find({}, {"_id": 0}).sort("timestamp", -1).limit(100).to_list(100)
        
        # Get current state
        state = await get_game_state()
        
        # Prepare context for AI
        context = f"""
        Current Game State:
        - Main Jackpot: ${state.main_jackpot:,.2f}
        - Mini Jackpot: ${state.mini_jackpot:,.2f}
        - Total Plays: {state.play_count}
        - Recent Plays: {len(plays)}
        
        User Query: {request.query}
        """
        
        # Get AI insight
        message = UserMessage(text=context)
        response = await llm_chat.send_message(message)
        
        return AIInsightResponse(insight=response)
    except Exception as e:
        logging.error(f"Error getting AI insight: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stats")
async def get_statistics():
    """
    Get game statistics
    """
    try:
        total_plays = await db.game_plays.count_documents({})
        total_payouts = await db.game_plays.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$payout"}}}
        ]).to_list(1)
        
        jackpot_wins = await db.game_plays.count_documents({"is_jackpot": True})
        
        return {
            "total_plays": total_plays,
            "total_payouts": total_payouts[0]["total"] if total_payouts else 0,
            "jackpot_wins": jackpot_wins,
            "win_rate": 0.25  # Approx 25% from design
        }
    except Exception as e:
        logging.error(f"Error getting statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()