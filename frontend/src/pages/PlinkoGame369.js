import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { formatUnits } from 'ethers';
import Backdrop from '../components/Backdrop';
import GameHeader from '../components/GameHeader';
import PlinkoBoard369 from '../components/PlinkoBoard369';
import ResultBanner from '../components/ResultBanner';
import AdminGate from '../components/AdminGate';
import PlayerWallet from '../components/PlayerWallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Wallet } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { ENTRY_PRICE_TOKENS } from '../config/contracts';
import '@/styles/pulse369.css';
import '@/styles/wallet.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PlinkoGame369 = () => {
  // Wallet integration
  const {
    account,
    balance,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToPulseChain,
    playGame,
    fetchGameState: fetchBlockchainGameState,
    fetchBalance,
  } = useWallet();

  const [gameState, setGameState] = useState(null);
  const [isBallFalling, setIsBallFalling] = useState(false);
  const [finalSlot, setFinalSlot] = useState(null);
  const [banner, setBanner] = useState(null);
  const [stats, setStats] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Session stats (local tracking with localStorage persistence)
  const [sessionStats, setSessionStats] = useState(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('pulse369_session_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading session stats:', e);
      }
    }
    return {
      gamesPlayed: 0,
      wins: 0,
      totalSpent: 0,
      totalWinnings: 0,
    };
  });
  
  // Blockchain jackpot values and game stats
  const [jackpots, setJackpots] = useState({
    main: '0',
    mini: '0',
  });
  
  const [blockchainStats, setBlockchainStats] = useState({
    playCount: 0,
    entryPrice: '10',
  });
  
  // Track jackpot slot indices
  const [miniIndex, setMiniIndex] = useState(null);
  const [mainIndex, setMainIndex] = useState(null);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Save session stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pulse369_session_stats', JSON.stringify(sessionStats));
  }, [sessionStats]);

  // Fetch blockchain game state on mount and periodically
  useEffect(() => {
    const loadGameState = async () => {
      // Try to fetch game state whether connected or not
      // This allows viewing jackpots without connecting wallet
      const state = await fetchBlockchainGameState();
      if (state) {
        setJackpots({
          main: state.mainJackpot,
          mini: state.miniJackpot,
        });
        setBlockchainStats({
          playCount: state.playCount,
          entryPrice: state.entryPrice,
        });
        console.log('Blockchain state updated:', state);
      }
    };

    // Initial load
    loadGameState();
    fetchStats();

    // Refresh game state every 10 seconds (faster for active games)
    const interval = setInterval(() => {
      loadGameState();
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchBlockchainGameState]);

  const handleLaunch = async () => {
    // Clear any existing banner immediately
    setBanner(null);
    
    // Check wallet connection
    if (!isConnected) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet to play',
      });
      return;
    }

    // Check network
    if (!isCorrectNetwork) {
      toast.warning('Wrong network', {
        description: 'Please switch to PulseChain network',
      });
      await switchToPulseChain();
      return;
    }

    // Check balance
    const balanceNum = parseFloat(balance);
    if (balanceNum < ENTRY_PRICE_TOKENS) {
      toast.error('Insufficient balance', {
        description: `You need at least ${ENTRY_PRICE_TOKENS} PLS369 to play`,
      });
      return;
    }

    // Update session stats (optimistically)
    setSessionStats(prev => ({
      ...prev,
      totalSpent: prev.totalSpent + ENTRY_PRICE_TOKENS,
    }));

    // Call smart contract play function
    // This waits for blockchain confirmation before proceeding
    console.log('⏳ Waiting for blockchain transaction to complete...');
    const result = await playGame();
    console.log('✅ Blockchain confirmed, result:', result);
    
    if (!result) {
      // Transaction failed or was rejected
      // Revert optimistic update
      setSessionStats(prev => ({
        ...prev,
        totalSpent: Math.max(0, prev.totalSpent - ENTRY_PRICE_TOKENS),
      }));
      return;
    }

    // Game result received and CONFIRMED by blockchain
    // NOW start the animation with the confirmed slot
    console.log('🎲 Starting animation for slot:', result.slot);
    setFinalSlot(result.slot);
    setIsBallFalling(true);
    
    // Store result for later processing when ball lands
    window._lastGameResult = result;
  };

  const handleBallLanded = async (landedSlot) => {
    // Clear banner first
    setBanner(null);
    
    try {
      // Get the result from blockchain (stored in window during handleLaunch)
      const result = window._lastGameResult;
      
      if (!result) {
        console.error('No game result found');
        return;
      }

      const { payout, mainJackpotHit, miniJackpotHit } = result;
      const payoutFormatted = formatUnits(payout, 18);
      const payoutNum = parseFloat(payoutFormatted);
      
      const isWin = payoutNum > 0;

      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        wins: isWin ? prev.wins + 1 : prev.wins,
        totalWinnings: prev.totalWinnings + payoutNum,
      }));

      // Show result banner AFTER ball lands (with small delay)
      setTimeout(() => {
        if (mainJackpotHit) {
          setBanner({ kind: 'main', text: 'MAIN JACKPOT!!!' });
          toast.success('🎉 MAIN JACKPOT WON!', {
            description: `You won ${payoutNum.toLocaleString()} PLS369!`,
          });
        } else if (miniJackpotHit) {
          setBanner({ kind: 'mini', text: 'MINI JACKPOT!' });
          toast.success('🎊 MINI JACKPOT WON!', {
            description: `You won ${payoutNum.toLocaleString()} PLS369!`,
          });
        } else if (isWin) {
          setBanner({ kind: 'win', text: `WIN ${payoutNum.toLocaleString()} PLS369!` });
          toast.success('You won!', {
            description: `${payoutNum.toLocaleString()} PLS369 - Ball landed in slot ${landedSlot}`,
          });
        } else {
          setBanner({ kind: 'lose', text: 'Try again!' });
          toast.info('Try again!', {
            description: `Ball landed in slot ${landedSlot}. Better luck next time!`,
          });
        }
        
        // Auto-clear banner after 2 seconds
        setTimeout(() => {
          setBanner(null);
        }, 2000);
      }, 300);

      // Record the play to backend (for stats)
      try {
        await axios.post(`${API}/game/record`, {
          player_address: account || '0x0000000000000000000000000000000000000000',
          slot: landedSlot,
          payout: payoutNum,
          is_jackpot: mainJackpotHit || miniJackpotHit,
        });
      } catch (error) {
        console.error('Error recording play to backend:', error);
        // Non-critical, continue
      }

      // Refresh blockchain state
      const state = await fetchBlockchainGameState();
      if (state) {
        setJackpots({
          main: state.mainJackpot,
          mini: state.miniJackpot,
        });
      }
      
      // Refresh balance
      await fetchBalance();
      
      fetchStats();
      
      // Clear stored result
      delete window._lastGameResult;
    } catch (error) {
      console.error('Error handling ball landed:', error);
    }
  };

  // Wallet button handler
  const handleWalletAction = async () => {
    if (isConnected) {
      disconnectWallet();
    } else {
      await connectWallet();
    }
  };

  return (
    <div className="pulse369-container" data-testid="pulse369-game">
      <Backdrop />

      <div className="content-wrapper">
        {/* Wallet Connection Button */}
        <div className="wallet-button-container" style={{ 
          position: 'absolute', 
          top: '90px', 
          right: '20px', 
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <Button
            onClick={handleWalletAction}
            disabled={isConnecting}
            variant={isConnected ? "outline" : "default"}
            size="lg"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {isConnecting 
              ? 'Connecting...' 
              : isConnected 
                ? `${account.slice(0, 6)}...${account.slice(-4)}` 
                : 'Connect Wallet'}
          </Button>
          {isConnected && !isCorrectNetwork && (
            <Button
              onClick={switchToPulseChain}
              variant="destructive"
              size="sm"
            >
              Switch to PulseChain
            </Button>
          )}
        </div>

        <GameHeader
          miniAmountPLS={parseFloat(jackpots.mini).toFixed(2)}
          mainAmountPLS={parseFloat(jackpots.main).toFixed(2)}
        />

        <div className="game-layout">
          {/* Main Game Board */}
          <div className="board-column">
            <PlinkoBoard369
              isBallFalling={isBallFalling}
              onLaunch={handleLaunch}
              onBallLanded={handleBallLanded}
              miniAmountPLS={parseFloat(jackpots.mini).toFixed(2)}
              mainAmountPLS={parseFloat(jackpots.main).toFixed(2)}
              finalSlot={finalSlot}
              onJackpotIndicesChange={(mini, main) => {
                setMiniIndex(mini);
                setMainIndex(main);
              }}
            />

            {/* How to Play - Compact */}
            <div className="info-card-compact">
              <div className="info-compact-title">How to Play</div>
              <div className="info-compact-content">
                <span><strong>Entry:</strong> 10 PLS369</span> • 
                <span><strong>Wins:</strong> Slots 3,7,11,15,18</span> • 
                <span><strong>Jackpots:</strong> Slots 10 (Main), 2 & 16 (Mini)</span> • 
                <a 
                  href="https://web.telegram.org/k/#@pulse369dao" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#00d9ff', textDecoration: 'none', fontWeight: 'bold' }}
                >
                  Whitepaper
                </a>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="stats-column">
            {/* Player Balance Card */}
            <Card className="stats-card">
              <CardHeader>
                <CardTitle>Your Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="stat-row">
                  <span>PLS369 Balance</span>
                  <span className="stat-value green">
                    {isConnected ? parseFloat(balance).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="stat-row">
                  <span>Games Played</span>
                  <span className="stat-value">{sessionStats.gamesPlayed}</span>
                </div>
                <div className="stat-row">
                  <span>Total Wins</span>
                  <span className="stat-value green">{sessionStats.wins}</span>
                </div>
                <div className="stat-row">
                  <span>Total Spent</span>
                  <span className="stat-value">{sessionStats.totalSpent.toFixed(2)}</span>
                </div>
                <div className="stat-row">
                  <span>Total Winnings</span>
                  <span className="stat-value purple">{sessionStats.totalWinnings.toFixed(2)}</span>
                </div>
                {sessionStats.gamesPlayed > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSessionStats({
                        gamesPlayed: 0,
                        wins: 0,
                        totalSpent: 0,
                        totalWinnings: 0,
                      });
                      toast.info('Session stats reset');
                    }}
                    style={{ marginTop: '12px', width: '100%' }}
                  >
                    Reset Session Stats
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardHeader>
                <CardTitle>Contract Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="stat-row">
                  <span>Total Plays</span>
                  <span className="stat-value">{blockchainStats.playCount.toLocaleString()}</span>
                </div>
                <div className="stat-row">
                  <span>Entry Price</span>
                  <span className="stat-value">{parseFloat(blockchainStats.entryPrice).toFixed(0)} PLS369</span>
                </div>
                <div className="stat-row">
                  <span>Main Jackpot</span>
                  <span className="stat-value purple">{parseFloat(jackpots.main).toFixed(2)}</span>
                </div>
                <div className="stat-row">
                  <span>Mini Jackpot</span>
                  <span className="stat-value green">{parseFloat(jackpots.mini).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Admin Button */}
            <Button
              data-testid="admin-toggle-btn"
              variant="outline"
              onClick={() => setShowAdmin(!showAdmin)}
              className="admin-toggle"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showAdmin ? 'Hide' : 'Show'} Admin
            </Button>

            {/* Admin Panel (gated) */}
            {showAdmin && (
              <AdminGate connectedAddress={account}>
                <Card className="admin-card">
                  <CardHeader>
                    <CardTitle>Admin Panel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400">Owner wallet only</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Connect wallet matching contract owner to access controls
                    </p>
                  </CardContent>
                </Card>
              </AdminGate>
            )}
          </div>
        </div>
      </div>

      {/* Result Banner */}
      <ResultBanner kind={banner?.kind} text={banner?.text} visible={!!banner} />
    </div>
  );
};

export default PlinkoGame369;