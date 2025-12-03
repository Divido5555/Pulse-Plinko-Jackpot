import os
import logging
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from web3 import Web3

# ---------------------------------------------------------
# Environment / configuration
# ---------------------------------------------------------

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

PULSECHAIN_RPC_URL: Optional[str] = os.getenv("PULSECHAIN_RPC_URL")
CONTRACT_ADDRESS: Optional[str] = os.getenv("PLINKO_GAME_ADDRESS")  # 0x... for PlinkoGame369
CONTRACT_ABI_PATH: Optional[str] = os.getenv("PLINKO_GAME_ABI_PATH")  # optional: path to ABI json

# Web3 client (optional)
w3: Optional[Web3] = None
contract = None

if PULSECHAIN_RPC_URL and CONTRACT_ADDRESS and CONTRACT_ABI_PATH:
    try:
        w3 = Web3(Web3.HTTPProvider(PULSECHAIN_RPC_URL))
        if not w3.is_connected():
            raise RuntimeError("Web3 could not connect to PulseChain RPC")

        abi_file = ROOT_DIR / CONTRACT_ABI_PATH
        if not abi_file.exists():
            raise RuntimeError(f"ABI file not found at {abi_file}")

        import json

        with abi_file.open() as f:
            abi = json.load(f)

        contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=abi)
    except Exception as e:
        logging.error(f"Failed to initialise Web3 / contract: {e}")
        w3 = None
        contract = None

# ---------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------

app = FastAPI(title="Pulse369 DAO • PlinkoGame369 Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("plinko-backend")


# ---------------------------------------------------------
# Models
# ---------------------------------------------------------

class GameState(BaseModel):
    mainJackpot: int
    miniJackpot: int
    playCount: int
    daoAccrued: int
    devAccrued: int
    entryPrice: int
    finalized: bool


class HealthStatus(BaseModel):
    status: str
    web3_connected: bool
    contract_configured: bool


# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------

@app.get("/api/status", response_model=HealthStatus)
async def get_status() -> HealthStatus:
    """
    Simple health check for the backend + optional Web3.
    """
    return HealthStatus(
        status="ok",
        web3_connected=bool(w3 and w3.is_connected()),
        contract_configured=bool(contract),
    )


@app.get("/api/game/state", response_model=GameState)
async def get_game_state():
    """
    Read-only view of the on-chain PlinkoGame369 state.

    If Web3 / contract are not configured, this returns a
    static mock useful for frontend development.
    """
    # If contract is wired up, read real chain data
    if contract is not None:
        try:
            # PlinkoGame369.getGameState() is assumed to return:
            # (mainJackpot, miniJackpot, playCount,
            #  daoAccrued, devAccrued, entryPrice, finalized)
            state = contract.functions.getGameState().call()

            return GameState(
                mainJackpot=state[0],
                miniJackpot=state[1],
                playCount=state[2],
                daoAccrued=state[3],
                devAccrued=state[4],
                entryPrice=state[5],
                finalized=state[6],
            )
        except Exception as e:
            logger.error(f"Error reading on-chain game state: {e}")
            raise HTTPException(status_code=500, detail="Failed to read game state from chain")

    # Fallback: static mock values (for local/dev use only)
    return GameState(
        mainJackpot=3_010_000_000000000000,  # 3010 PLS369 * 1e18, adjust as desired
        miniJackpot=1_504_000_000000000000,  # 1504 PLS369 * 1e18
        playCount=33333,
        daoAccrued=1_600_000_000000000000,   # example numbers
        devAccrued=1_200_000_000000000000,
        entryPrice=10_000000000000000000,    # 10 PLS369 * 1e18
        finalized=False,
    )


# ---------------------------------------------------------
# Shutdown hooks
# ---------------------------------------------------------

@app.on_event("shutdown")
async def on_shutdown():
    # nothing persistent to close right now, but kept for future use
    logger.info("Plinko backend shutting down.")
