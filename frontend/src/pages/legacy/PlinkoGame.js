import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, Trophy, Users, DollarSign, Zap } from 'lucide-react';
import { toast } from 'sonner';
import PlinkoBoard from '../components/PlinkoBoard';
import JackpotDisplay from '../components/JackpotDisplay';
import GameStats from '../components/GameStats';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PlinkoGame = () => {
  const [gameState, setGameState] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchGameState();
    fetchStats();
    const interval = setInterval(() => {
      fetchGameState();
      fetchStats();
    }, 30000); // 30 seconds

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

  const handlePlay = async () => {
    setIsPlaying(true);
    
    try {
      // Simulate game play
      const slot = Math.floor(Math.random() * 20);
      const prizeSlots = [12, 13, 14, 15, 16];
      const isPrize = prizeSlots.includes(slot);
      
      const multipliers = {
        12: 1.1, // INCENTIVE
        13: 1.5, // PULSEX
        14: 2.0, // MEDIUM
        15: 3.0, // HEX
        16: 5.0, // PULSE
      };
      
      const payout = isPrize ? multipliers[slot] : 0;
      
      setLastResult({
        slot,
        payout,
        isJackpot: false
      });

      if (isPrize) {
        toast.success(`You won ${payout}x! (${payout} PLS)`, {
          description: `Ball landed in slot ${slot}`,
        });
      } else {
        toast.info('Try again! Better luck next time', {
          description: `Ball landed in slot ${slot}`,
        });
      }

      // Record the play
      await axios.post(`${API}/game/record`, {
        player_address: '0x0000000000000000000000000000000000000000',
        slot,
        payout,
        is_jackpot: false
      });

      // Refresh state
      setTimeout(() => {
        fetchGameState();
        fetchStats();
      }, 1000);
    } catch (error) {
      console.error('Error playing game:', error);
      toast.error('Error playing game', {
        description: 'Please try again',
      });
    } finally {
      setTimeout(() => {
        setIsPlaying(false);
        setLastResult(null);
      }, 3000);
    }
  };

  return (
    <div data-testid="plinko-game-page" className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b border-white/50 bg-white/30 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">PulseChain Plinko</h1>
                <p className="text-sm text-gray-600">Decentralized Gaming on PulseChain 369</p>
              </div>
            </div>
            <Button
              data-testid="admin-dashboard-btn"
              variant="outline"
              onClick={() => window.location.href = '/admin'}
              className="border-purple-200 hover:bg-purple-50"
            >
              Admin Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Jackpots */}
          <div className="lg:col-span-1 space-y-6">
            <JackpotDisplay
              type="main"
              amount={gameState?.main_jackpot || 0}
              odds="1 in 1.2M"
            />
            <JackpotDisplay
              type="mini"
              amount={gameState?.mini_jackpot || 0}
              odds="1 in 53k"
            />
            
            {stats && (
              <Card className="bg-white/70 backdrop-blur border-purple-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Total Plays</span>
                    <span className="font-semibold text-gray-900">{stats.total_plays.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Win Rate</span>
                    <span className="font-semibold text-green-600">{(stats.win_rate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Jackpot Wins</span>
                    <span className="font-semibold text-purple-600">{stats.jackpot_wins}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center Column - Plinko Board */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-lg border-purple-100 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  Drop the Ball!
                </CardTitle>
                <p className="text-gray-600 mt-2">Entry: 1 PLS (~$1)</p>
              </CardHeader>
              <CardContent className="p-8">
                <PlinkoBoard
                  isPlaying={isPlaying}
                  result={lastResult}
                />
                
                <div className="mt-8 flex justify-center">
                  <Button
                    data-testid="play-plinko-btn"
                    onClick={handlePlay}
                    disabled={isPlaying}
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-12 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap className="w-6 h-6 mr-2" />
                        </motion.div>
                        Playing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6 mr-2" />
                        Play Now - 1 PLS
                      </>
                    )}
                  </Button>
                </div>

                {lastResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 text-center"
                  >
                    <p className="text-lg font-semibold text-gray-900">
                      {lastResult.payout > 0
                        ? `🎉 You won ${lastResult.payout}x!`
                        : '💫 Better luck next time!'}
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* How to Play */}
            <Card className="mt-8 bg-white/70 backdrop-blur border-purple-100">
              <CardHeader>
                <CardTitle className="text-lg">How to Play</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <p>1. <strong>Entry Fee:</strong> 1 PLS per game (~$1)</p>
                <p>2. <strong>Prizes:</strong> Land on token slots to win multipliers (1.1x to 5x)</p>
                <p>3. <strong>Jackpots:</strong> Ultra-rare chance to win Main ($1M+) or Mini ($10k+) jackpots</p>
                <p>4. <strong>Ecosystem Support:</strong> Every play supports PulseChain ecosystem tokens</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlinkoGame;