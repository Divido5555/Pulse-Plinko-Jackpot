import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import { formatTokenAmount } from '@/lib/utils';

const WalletButton = ({ 
  isConnected, 
  isConnecting, 
  formattedAddress, 
  pls369Balance, 
  isCorrectChain,
  onConnect, 
  onDisconnect,
  isMetaMaskAvailable 
}) => {
  if (!isMetaMaskAvailable) {
    return (
      <Button variant="outline" className="wallet-button" disabled>
        <AlertCircle className="w-4 h-4 mr-2" />
        Install MetaMask
      </Button>
    );
  }

  if (isConnecting) {
    return (
      <Button variant="outline" className="wallet-button" disabled>
        <Wallet className="w-4 h-4 mr-2 animate-pulse" />
        Connecting...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <div className="wallet-connected">
        {!isCorrectChain && (
          <span className="chain-warning">
            <AlertCircle className="w-4 h-4" />
            Wrong Network
          </span>
        )}
        <div className="wallet-info">
          <span className="wallet-balance">{formatTokenAmount(pls369Balance)} PLS369</span>
          <span className="wallet-address">{formattedAddress}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="disconnect-button"
          onClick={onDisconnect}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant="outline" 
      className="wallet-button connect-button"
      onClick={onConnect}
    >
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
};

const GameHeader = ({ 
  miniAmountPLS369, 
  mainAmountPLS369,
  // Wallet props
  isConnected,
  isConnecting,
  formattedAddress,
  pls369Balance,
  isCorrectChain,
  onConnect,
  onDisconnect,
  isMetaMaskAvailable,
}) => {
  return (
    <header className="game-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="game-title">Pulse369 DAO • PulseChain Plinko Jackpot</h1>
        </div>
        <div className="header-center">
          <div className="jackpot-tickers">
            <div className="ticker mini-ticker">
              <span className="tag">MINI JACKPOT</span>
              <span className="value">{miniAmountPLS369} PLS369</span>
            </div>
            <div className="ticker main-ticker">
              <span className="tag">MAIN JACKPOT</span>
              <span className="value">{mainAmountPLS369} PLS369</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          <WalletButton 
            isConnected={isConnected}
            isConnecting={isConnecting}
            formattedAddress={formattedAddress}
            pls369Balance={pls369Balance}
            isCorrectChain={isCorrectChain}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
            isMetaMaskAvailable={isMetaMaskAvailable}
          />
        </div>
      </div>
    </header>
  );
};

export default GameHeader;