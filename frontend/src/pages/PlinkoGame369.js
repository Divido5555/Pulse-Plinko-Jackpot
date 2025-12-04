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
  const [gameState, setGameState] = useState(null);
  const [isBallFalling, setIsBallFalling] = useState(false);
  const [finalSlot, setFinalSlot] = useState(null);
  const [banner, setBanner] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [stats, setStats] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Player wallet & session state
  const [playerBalance, setPlayerBalance] = useState(100000); // Start with 100,000 PLS for testing
  const [sessionStats, setSessionStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    totalSpent: 0,
    totalWinnings: 0,
  });
  
  // Local jackpot tracking (grows with each play)
  const [localJackpots, setLocalJackpots] = useState({
    main: 52341.50,
    mini: 8762.30,
  });
  
  // Track jackpot slot indices
  const [miniIndex, setMiniIndex] = useState(null);
  const [mainIndex, setMainIndex] = useState(null);

  useEffect(() => {
    fetchGameState();
    fetchStats();
    const interval = setInterval(() => {
      fetchGameState();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchGameState = async () => {
    try {
      const response = await axios.get(`${API}/game/state`);
      setGameState(response.data);
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

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
    
    // Check balance
    if (playerBalance < ENTRY_FEE_PLS) {
      toast.error('Insufficient balance', {
        description: `You need ${ENTRY_FEE_PLS.toLocaleString()} PLS to play`,
      });
      return;
    }

    // Deduct entry fee
    setPlayerBalance(prev => prev - ENTRY_FEE_PLS);
    setSessionStats(prev => ({
      ...prev,
      totalSpent: prev.totalSpent + ENTRY_FEE_PLS,
    }));

    // Add to jackpots (50% to main, 15% to mini)
    setLocalJackpots(prev => ({
      main: prev.main + (ENTRY_FEE_PLS * 0.50),
      mini: prev.mini + (ENTRY_FEE_PLS * 0.15),
    }));

    // Generate random slot
    const slot = Math.floor(Math.random() * 20);
    setFinalSlot(slot);
    setIsBallFalling(true);
  };

  const handleBallLanded = async (landedSlot) => {
    // Clear banner first
    setBanner(null);
    
    try {
      // Determine outcome
      const prizeSlots = { 1: 1.1, 6: 1.5, 11: 2.0, 15: 3.0, 19: 5.0 };
      const payout = prizeSlots[landedSlot] || 0;
      
      // Check if ball landed on jackpot slots AND passes probability check
      const landedOnMini = landedSlot === miniIndex;
      const landedOnMain = landedSlot === mainIndex;
      
      // Actual jackpot odds (very rare)
      const miniHit = landedOnMini && (Math.random() < (1 / 53000)); // 1 in 53,000
      const mainHit = landedOnMain && (Math.random() < (1 / 1200000)); // 1 in 1.2M

      let winAmount = 0;
      const isWin = payout > 0 || miniHit || mainHit;

      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        wins: isWin ? prev.wins + 1 : prev.wins,
      }));

      // Show result banner AFTER ball lands (with small delay)
      setTimeout(() => {
        if (mainHit) {
          // Main Jackpot: Pay 60%, keep 40% for reset/fees
          winAmount = localJackpots.main * 0.60;
          setPlayerBalance(prev => prev + winAmount);
          setLocalJackpots(prev => ({
            ...prev,
            main: prev.main * 0.40,
          }));
          setSessionStats(prev => ({
            ...prev,
            totalWinnings: prev.totalWinnings + winAmount,
          }));
          setBanner({ kind: 'main', text: 'MAIN JACKPOT!!!' });
          toast.success('MAIN JACKPOT WON!', {
            description: `You won ${winAmount.toLocaleString()} PLS!`,
          });
        } else if (miniHit) {
          // Mini Jackpot: Pay 80%, keep 20% for reset/fees
          winAmount = localJackpots.mini * 0.80;
          setPlayerBalance(prev => prev + winAmount);
          setLocalJackpots(prev => ({
            ...prev,
            mini: prev.mini * 0.20,
          }));
          setSessionStats(prev => ({
            ...prev,
            totalWinnings: prev.totalWinnings + winAmount,
          }));
          setBanner({ kind: 'mini', text: 'MINI JACKPOT!' });
          toast.success('MINI JACKPOT WON!', {
            description: `You won ${winAmount.toLocaleString()} PLS!`,
          });
        } else if (payout > 0) {
          // Regular win from base prize pool
          winAmount = ENTRY_FEE_PLS * payout;
          setPlayerBalance(prev => prev + winAmount);
          setSessionStats(prev => ({
            ...prev,
            totalWinnings: prev.totalWinnings + winAmount,
          }));
          setBanner({ kind: 'win', text: `WIN ${winAmount.toLocaleString()} PLS!` });
          toast.success(`You won ${payout}x!`, {
            description: `${winAmount.toLocaleString()} PLS - Ball landed in slot ${landedSlot}`,
          });
        } else if (landedOnMini || landedOnMain) {
          // Landed on jackpot slot but didn't win - close call!
          setBanner({ kind: 'lose', text: 'So close! Try again!' });
          toast.info('Almost hit the jackpot!', {
            description: `Landed on ${landedOnMini ? 'MINI' : 'MAIN'} slot but didn't trigger. Keep playing!`,
          });
        } else {
          // Loss - jackpots already increased
          setBanner({ kind: 'lose', text: 'Try again!' });
          toast.info('Try again!', {
            description: `Ball landed in slot ${landedSlot}. Jackpots are growing!`,
          });
        }
        
        // Auto-clear banner after 2 seconds
        setTimeout(() => {
          setBanner(null);
        }, 2000);
      }, 300);

      // Record the play
      await axios.post(`${API}/game/record`, {
        player_address: '0x0000000000000000000000000000000000000000',
        slot: landedSlot,
        payout,
        is_jackpot: miniHit || mainHit,
      });

      // Refresh state
      fetchGameState();
      fetchStats();
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