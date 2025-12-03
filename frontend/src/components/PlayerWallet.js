import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, PlayCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { ENTRY_PRICE_DISPLAY } from '../config/contracts';
import { safeParseNumber, formatTokenAmount } from '@/lib/utils';

const PlayerWallet = ({ 
  pls369Balance,
  isConnected,
  isApproved,
  isApproving,
  onApprove,
  sessionStats,
  error,
}) => {
  const balance = safeParseNumber(pls369Balance, 0);
  const canPlay = balance >= 10; // 10 PLS369 entry fee
  const profitLoss = sessionStats.totalWinnings - sessionStats.totalSpent;
  const isProfit = profitLoss >= 0;

  if (!isConnected) {
    return (
      <Card className="wallet-card" data-testid="player-wallet">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-400" />
            Your Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="connect-prompt">
            <AlertCircle className="w-8 h-8 text-yellow-500 mb-2" />
            <p className="text-gray-400">Connect your wallet to play</p>
            <p className="text-sm text-gray-500 mt-1">Entry fee: {ENTRY_PRICE_DISPLAY}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="wallet-card" data-testid="player-wallet">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-purple-400" />
          Your Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="balance-display">
          <div className="balance-label">PLS369 Balance</div>
          <div className="balance-amount">
            {formatTokenAmount(balance)} <span className="balance-currency">PLS369</span>
          </div>
          <div className="balance-games">
            {canPlay ? (
              <span className="text-green-400">
                ✓ Ready to play (Entry: {ENTRY_PRICE_DISPLAY})
              </span>
            ) : (
              <span className="text-red-400">⚠ Insufficient balance (Need {ENTRY_PRICE_DISPLAY})</span>
            )}
          </div>
        </div>

        {/* Approval Status */}
        <div className="approval-section">
          {isApproved ? (
            <div className="approval-status approved">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Tokens approved for gameplay</span>
            </div>
          ) : (
            <div className="approval-status needs-approval">
              <Button
                onClick={onApprove}
                disabled={isApproving || !canPlay}
                className="approve-button"
              >
                {isApproving ? 'Approving...' : 'Approve PLS369 Tokens'}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                One-time approval needed before playing
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Session Stats */}
        <div className="session-stats">
          <div className="session-header">
            <PlayCircle className="w-4 h-4" />
            <span>Current Session</span>
          </div>
          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-label">Games Played</div>
              <div className="stat-value">{sessionStats.gamesPlayed}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Wins</div>
              <div className="stat-value green">{sessionStats.wins}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Profit/Loss</div>
              <div className={`stat-value ${isProfit ? 'green' : 'red'}`}>
                {isProfit ? <TrendingUp className="w-4 h-4 inline" /> : <TrendingDown className="w-4 h-4 inline" />}
                {isProfit ? '+' : ''}{formatTokenAmount(profitLoss)} PLS369
              </div>
            </div>
          </div>
        </div>

        {/* Current Game Number */}
        {sessionStats.gamesPlayed > 0 && (
          <div className="current-game">
            Next Game: <span className="game-number">#{sessionStats.gamesPlayed + 1}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerWallet;