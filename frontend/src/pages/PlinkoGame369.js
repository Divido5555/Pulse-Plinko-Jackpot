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
  
  // Session stats (local tracking)
  const [sessionStats, setSessionStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    totalSpent: 0,
    totalWinnings: 0,
  });
  
  // Blockchain jackpot values
  const [jackpots, setJackpots] = useState({
    main: '0',
    mini: '0',
  });
  
  // Track jackpot slot indices
  const [miniIndex, setMiniIndex] = useState(null);
  const [mainIndex, setMainIndex] = useState(null);

  // Fetch blockchain game state on mount and when connected
  useEffect(() => {
    const loadGameState = async () => {
      if (isConnected) {
        const state = await fetchBlockchainGameState();
        if (state) {
          setJackpots({
            main: state.mainJackpot,
            mini: state.miniJackpot,
          });
        }
      }
    };

    loadGameState();
    fetchStats();

    // Refresh game state every 30 seconds
    const interval = setInterval(() => {
      loadGameState();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, fetchBlockchainGameState]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

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
    const result = await playGame();
    
    if (!result) {
      // Transaction failed or was rejected
      // Revert optimistic update
      setSessionStats(prev => ({
        ...prev,
        totalSpent: Math.max(0, prev.totalSpent - ENTRY_PRICE_TOKENS),
      }));
      return;
    }

    // Game result received from blockchain
    setFinalSlot(result.slot);
    setIsBallFalling(true);
    
    // Store result for later processing
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

  const handleDeposit = (amount) => {
    setPlayerBalance(prev => prev + amount);
  };

  const handleWithdraw = (amount) => {
    setPlayerBalance(0);
    // Reset session stats on withdrawal
    setSessionStats({
      gamesPlayed: 0,
      wins: 0,
      totalSpent: 0,
      totalWinnings: 0,
    });
  };

  return (
    <div className="pulse369-container" data-testid="pulse369-game">
      <Backdrop />

      <div className="content-wrapper">
        <GameHeader
          miniAmountPLS={localJackpots.mini.toFixed(2)}
          mainAmountPLS={localJackpots.main.toFixed(2)}
        />

        <div className="game-layout">
          {/* Main Game Board */}
          <div className="board-column">
            <PlinkoBoard369
              isBallFalling={isBallFalling}
              onLaunch={handleLaunch}
              onBallLanded={handleBallLanded}
              miniAmountPLS={localJackpots.mini.toFixed(2)}
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
                <span><strong>Entry:</strong> 10,000 PLS</span> • 
                <span><strong>Wins:</strong> Slots 1,5,9,13,17</span> • 
                <span><strong>Jackpots:</strong> Land on badges + pass odds</span>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="stats-column">
            {/* Player Wallet */}
            <PlayerWallet
              balance={playerBalance}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
              sessionStats={sessionStats}
            />

            {stats && (
              <Card className="stats-card">
                <CardHeader>
                  <CardTitle>Game Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="stat-row">
                    <span>Total Plays</span>
                    <span className="stat-value">{stats.total_plays.toLocaleString()}</span>
                  </div>
                  <div className="stat-row">
                    <span>Win Rate</span>
                    <span className="stat-value green">{(stats.win_rate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="stat-row">
                    <span>Jackpot Wins</span>
                    <span className="stat-value purple">{stats.jackpot_wins}</span>
                  </div>
                </CardContent>
              </Card>
            )}

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
              <AdminGate connectedAddress={connectedAddress}>
                <Card className="admin-card">
                  <CardHeader>
                    <CardTitle>Admin Panel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400">Host wallet only</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Connect wallet matching HOST_ADDRESS to access controls
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