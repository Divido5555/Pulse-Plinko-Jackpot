import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

const GameStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <div data-testid="game-stats" className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-white/70 backdrop-blur border-purple-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Plays</CardTitle>
          <Users className="w-4 h-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {stats.total_plays.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur border-purple-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Payouts</CardTitle>
          <DollarSign className="w-4 h-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            ${stats.total_payouts.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur border-purple-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
          <TrendingUp className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {(stats.win_rate * 100).toFixed(1)}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameStats;