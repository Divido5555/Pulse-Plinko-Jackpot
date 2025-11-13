import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, TrendingUp, TrendingDown, PlayCircle, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const ENTRY_FEE_PLS = 10000;
const DEPOSIT_ADDRESS = '0x8855DEc7627CF4A23A2354F998Dfd57C500A8C51'; // Host wallet for deposits

const PlayerWallet = ({ balance, onDeposit, onWithdraw, sessionStats }) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(DEPOSIT_ADDRESS);
    setAddressCopied(true);
    toast.success('Address copied to clipboard!');
    setTimeout(() => setAddressCopied(false), 2000);
  };

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
    if (!withdrawAddress || withdrawAddress.trim() === '') {
      toast.error('Withdrawal address required', {
        description: 'Please enter a valid PLS address',
      });
      return;
    }
    // Basic address validation (starts with 0x and is 42 characters)
    if (!withdrawAddress.startsWith('0x') || withdrawAddress.length !== 42) {
      toast.error('Invalid address format', {
        description: 'Address must start with 0x and be 42 characters',
      });
      return;
    }
    
    onWithdraw(balance, withdrawAddress);
    setWithdrawAddress('');
    setShowWithdrawForm(false);
    toast.success('Withdrawal initiated!', {
      description: `${balance.toLocaleString()} PLS sent to ${withdrawAddress.substring(0, 10)}...`,
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
          {!showDepositForm && !showWithdrawForm ? (
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
                onClick={() => setShowWithdrawForm(true)}
                variant="outline"
                className="wallet-btn withdraw-btn"
                size="sm"
                disabled={balance <= 0}
              >
                Withdraw
              </Button>
            </>
          ) : showDepositForm ? (
            <div className="deposit-form">
              <div className="deposit-address-container">
                <label className="deposit-address-label">Send PLS to:</label>
                <div className="deposit-address-display">
                  <code className="deposit-address-text">{DEPOSIT_ADDRESS}</code>
                  <Button
                    data-testid="copy-address-btn"
                    onClick={handleCopyAddress}
                    size="sm"
                    variant="ghost"
                    className="copy-btn"
                  >
                    {addressCopied ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Input
                data-testid="deposit-input"
                type="number"
                placeholder="Enter PLS amount deposited"
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
                  Confirm Deposit
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
          ) : (
            <div className="withdraw-form">
              <Input
                data-testid="withdraw-address-input"
                type="text"
                placeholder="Enter withdrawal address (0x...)"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="withdraw-input"
              />
              <div className="withdraw-amount-info">
                Withdrawing: <strong>{balance.toLocaleString()} PLS</strong>
              </div>
              <div className="withdraw-form-actions">
                <Button
                  data-testid="confirm-withdraw-btn"
                  onClick={handleWithdraw}
                  size="sm"
                  className="confirm-withdraw-btn"
                >
                  Confirm Withdraw
                </Button>
                <Button
                  onClick={() => setShowWithdrawForm(false)}
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