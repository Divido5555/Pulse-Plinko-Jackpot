import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Brain, TrendingUp, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import GameStats from '../components/GameStats';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [gameState, setGameState] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [aiQuery, setAiQuery] = useState('');
  const [aiInsight, setAiInsight] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [stateRes, statsRes, historyRes] = await Promise.all([
        axios.get(`${API}/game/state`),
        axios.get(`${API}/stats`),
        axios.get(`${API}/game/history?limit=100`),
      ]);

      setGameState(stateRes.data);
      setStats(statsRes.data);
      setHistory(historyRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai/insight`, {
        query: aiQuery,
      });
      setAiInsight(response.data.insight);
      toast.success('AI insight generated!');
    } catch (error) {
      console.error('Error getting AI insight:', error);
      toast.error('Error getting AI insight');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = history.slice(0, 20).reverse().map((play, index) => ({
    play: index + 1,
    payout: play.payout,
  }));

  return (
    <div data-testid="admin-dashboard" className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b border-white/50 bg-white/30 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Monitor and analyze game performance</p>
            </div>
            <Button
              data-testid="back-to-game-btn"
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="border-purple-200 hover:bg-purple-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Stats Cards */}
          {stats && <GameStats stats={stats} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Jackpot Status */}
            <Card className="bg-white/80 backdrop-blur border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Jackpot Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Main Jackpot</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ${gameState?.main_jackpot.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mini Jackpot</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${gameState?.mini_jackpot.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Host Accumulated</p>
                  <p className="text-xl font-semibold text-green-600">
                    ${gameState?.host_accumulated.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pays out every 1000 plays (Current: {gameState?.play_count % 1000 || 0}/1000)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Chart */}
            <Card className="bg-white/80 backdrop-blur border-purple-100">
              <CardHeader>
                <CardTitle>Recent Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="play" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="payout" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <Card className="bg-white/80 backdrop-blur border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                AI-Powered Insights (GPT-5)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  data-testid="ai-query-input"
                  placeholder="Ask about game statistics, trends, or strategies..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAiQuery()}
                  className="flex-1"
                />
                <Button
                  data-testid="get-ai-insight-btn"
                  onClick={handleAiQuery}
                  disabled={loading}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {loading ? 'Analyzing...' : 'Get Insight'}
                </Button>
              </div>

              {aiInsight && (
                <div data-testid="ai-insight-result" className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-semibold text-purple-900 mb-2">AI Analysis:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{aiInsight}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Games */}
          <Card className="bg-white/80 backdrop-blur border-purple-100">
            <CardHeader>
              <CardTitle>Recent Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Player</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Slot</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Payout</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Jackpot</th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 10).map((play, index) => (
                      <tr key={index} className="border-b hover:bg-purple-50/50">
                        <td className="py-2 px-4 text-sm text-gray-700 font-mono">
                          {play.player_address.substring(0, 10)}...
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-700">{play.slot}</td>
                        <td className="py-2 px-4 text-sm font-semibold text-gray-900">
                          {play.payout.toFixed(2)}x
                        </td>
                        <td className="py-2 px-4 text-sm">
                          {play.is_jackpot ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                              JACKPOT
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-500">
                          {new Date(play.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;