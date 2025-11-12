import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, TrendingUp, TrendingDown, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

const ENTRY_FEE_PLS = 10000;

const PlayerWallet = ({ balance, onDeposit, onWithdraw, sessionStats }) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositForm, setShowDepositForm] = useState(false);

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount', { description: 'Please enter a valid PLS amount' });
      return;
    }
    onDeposit(amount);
    setDepositAmount('');
    setShowDepositForm(false);
    toast.success('Deposit successful!', {
      description: `${amount.toLocaleString()} PLS added to your balance`,
    });
  };

  const handleWithdraw = () => {
    if (balance <= 0) {
      toast.error('No balance to withdraw');
      return;
    }
    onWithdraw(balance);
    toast.success('Withdrawal successful!', {
      description: `${balance.toLocaleString()} PLS withdrawn`,
    });
  };

  const canPlay = balance >= ENTRY_FEE_PLS;
  const profitLoss = sessionStats.totalWinnings - sessionStats.totalSpent;
  const isProfit = profitLoss >= 0;

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
          <div className="balance-label">Available Balance</div>
          <div className="balance-amount">
            {balance.toLocaleString()} <span className="balance-currency">PLS</span>
          </div>
          <div className="balance-games">
            {canPlay ? (
              <span className="text-green-400">
                ✓ {Math.floor(balance / ENTRY_FEE_PLS)} games available
              </span>
            ) : (
              <span className="text-red-400">⚠ Insufficient balance</span>
            )}
          </div>
        </div>

        {/* Deposit/Withdraw Buttons */}
        <div className="wallet-actions">
          {!showDepositForm ? (
            <>
              <Button
                data-testid="deposit-btn"
                onClick={() => setShowDepositForm(true)}
                className="wallet-btn deposit-btn"
                size="sm"
              >
                Deposit PLS
              </Button>
              <Button
                data-testid="withdraw-btn"
                onClick={handleWithdraw}
                variant="outline"
                className="wallet-btn withdraw-btn"
                size="sm"
                disabled={balance <= 0}
              >
                Withdraw All
              </Button>
            </>
          ) : (
            <div className="deposit-form">
              <Input
                data-testid="deposit-input"
                type="number"
                placeholder="Enter PLS amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDeposit()}
                className="deposit-input"
              />
              <div className="deposit-form-actions">
                <Button
                  data-testid="confirm-deposit-btn"
                  onClick={handleDeposit}
                  size="sm"
                  className="confirm-deposit-btn"
                >
                  Confirm
                </Button>
                <Button
                  onClick={() => setShowDepositForm(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

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
                {isProfit ? '+' : ''}{profitLoss.toLocaleString()} PLS
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