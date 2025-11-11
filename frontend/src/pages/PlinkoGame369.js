import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Backdrop from '../components/Backdrop';
import GameHeader from '../components/GameHeader';
import PlinkoBoard369 from '../components/PlinkoBoard369';
import ResultBanner from '../components/ResultBanner';
import AdminGate from '../components/AdminGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import '@/styles/pulse369.css';

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
    // Generate random slot
    const slot = Math.floor(Math.random() * 20);
    setFinalSlot(slot);
    setIsBallFalling(true);
  };

  const handleBallLanded = async (landedSlot) => {
    try {
      // Determine outcome
      const prizeSlots = { 1: 1.1, 5: 1.5, 9: 2.0, 13: 3.0, 17: 5.0 };
      const payout = prizeSlots[landedSlot] || 0;
      
      // Simulate mini/main jackpot (very rare)
      const miniHit = Math.random() < 0.0001; // 1 in 10k for demo
      const mainHit = Math.random() < 0.00001; // 1 in 100k for demo

      // Show result banner AFTER ball lands
      if (mainHit) {
        setBanner({ kind: 'main', text: 'MAIN JACKPOT!!!' });
        toast.success('MAIN JACKPOT WON!', {
          description: `You won ${gameState?.main_jackpot} PLS!`,
        });
      } else if (miniHit) {
        setBanner({ kind: 'mini', text: 'MINI JACKPOT!' });
        toast.success('MINI JACKPOT WON!', {
          description: `You won ${gameState?.mini_jackpot} PLS!`,
        });
      } else if (payout > 0) {
        setBanner({ kind: 'win', text: `WIN x${payout.toFixed(1)}!` });
        toast.success(`You won ${payout}x!`, {
          description: `Ball landed in slot ${landedSlot}`,
        });
      } else {
        setBanner({ kind: 'lose', text: 'Try again!' });
        toast.info('Try again!', {
          description: `Ball landed in slot ${landedSlot}`,
        });
      }

      // Record the play
      await axios.post(`${API}/game/record`, {
        player_address: '0x0000000000000000000000000000000000000000',
        slot: landedSlot,
        payout,
        is_jackpot: miniHit || mainHit,
      });

      // Clear banner after delay
      setTimeout(() => {
        setBanner(null);
        setIsBallFalling(false);
      }, 2000);

      // Refresh state
      fetchGameState();
      fetchStats();
    } catch (error) {
      console.error('Error handling ball landed:', error);
      setIsBallFalling(false);
    }
  };

  return (
    <div className="pulse369-container" data-testid="pulse369-game">
      <Backdrop />

      <div className="content-wrapper">
        <GameHeader
          miniAmountPLS={gameState?.mini_jackpot?.toFixed(2) || '0.00'}
          mainAmountPLS={gameState?.main_jackpot?.toFixed(2) || '0.00'}
        />

        <div className="game-layout">
          {/* Main Game Board */}
          <div className="board-column">
            <PlinkoBoard369
              isBallFalling={isBallFalling}
              onLaunch={handleLaunch}
              onBallLanded={handleBallLanded}
              miniAmountPLS={gameState?.mini_jackpot?.toFixed(2) || '0.00'}
              finalSlot={finalSlot}
            />

            {/* How to Play */}
            <Card className="info-card">
              <CardHeader>
                <CardTitle>How to Play</CardTitle>
              </CardHeader>
              <CardContent className="info-content">
                <p><strong>• Entry:</strong> 1 PLS per game (~$1)</p>
                <p><strong>• Winners:</strong> Slots 1, 5, 9, 13, 17 (PLS/PLSX/HEX/INC/PROVEX)</p>
                <p><strong>• Mini Jackpot:</strong> Moves to random slot each play</p>
                <p><strong>• Main Jackpot:</strong> Ultra-rare, life-changing prize</p>
                <p><strong>• Ecosystem:</strong> Every play supports PulseChain tokens</p>
              </CardContent>
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="stats-column">
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