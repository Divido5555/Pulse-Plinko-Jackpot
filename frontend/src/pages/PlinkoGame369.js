import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import Backdrop from '../components/Backdrop';
import GameHeader from '../components/GameHeader';
import PlinkoBoard369 from '../components/PlinkoBoard369';
import ResultBanner from '../components/ResultBanner';
import AdminGate from '../components/AdminGate';
import PlayerWallet from '../components/PlayerWallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useGame } from '../hooks/useGame';
import { WIN_SLOTS, MINI_JACKPOT_INDICES, MAIN_JACKPOT_INDEX } from '../config/slots';
import { ENTRY_PRICE_DISPLAY } from '../config/contracts';
import { safeParseNumber, formatTokenAmount } from '@/lib/utils';
import '@/styles/pulse369.css';
import '@/styles/wallet.css';

const PlinkoGame369 = () => {
  const [isBallFalling, setIsBallFalling] = useState(false);
  const [finalSlot, setFinalSlot] = useState(null);
  const [banner, setBanner] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Session stats (local tracking)
  const [sessionStats, setSessionStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    totalSpent: 0,
    totalWinnings: 0,
  });

  // Wallet hook
  const wallet = useWallet();

  // Game hook
  const game = useGame(wallet.provider, wallet.signer, wallet.address);

  // Handle play button click
  const handleLaunch = useCallback(async () => {
    // Clear any existing banner immediately
    setBanner(null);
    
    // Check if wallet is connected
    if (!wallet.isConnected) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet to play',
      });
      return;
    }

    // Check if correct chain
    if (!wallet.isCorrectChain) {
      toast.error('Wrong network', {
        description: 'Please switch to PulseChain',
      });
      await wallet.switchToPulseChain();
      return;
    }

    // Check if tokens are approved
    if (!game.isApproved) {
      toast.error('Tokens not approved', {
        description: 'Please approve PLS369 tokens first',
      });
      return;
    }

    // Check balance
    const balance = safeParseNumber(wallet.pls369Balance, 0);
    if (balance < 10) {
      toast.error('Insufficient balance', {
        description: `You need ${ENTRY_PRICE_DISPLAY} to play`,
      });
      return;
    }

    // Play the game via contract
    setIsBallFalling(true);
    
    const result = await game.play();
    
    if (result) {
      // Update session stats for spent amount
      setSessionStats(prev => ({
        ...prev,
        totalSpent: prev.totalSpent + 10,
      }));
      
      // Store the final slot from contract result
      setFinalSlot(result.slot);
    } else {
      // Failed to play
      setIsBallFalling(false);
      if (game.error) {
        toast.error('Transaction failed', {
          description: game.error,
        });
      }
    }
  }, [wallet, game]);

  // Handle ball landed (animation complete)
  const handleBallLanded = useCallback(async (landedSlot) => {
    // Clear banner first
    setBanner(null);
    setIsBallFalling(false);
    
    // Get the result from the last play
    const result = game.lastPlayResult;
    
    if (!result) {
      // No result, just update session
      setSessionStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
      }));
      return;
    }

    const payout = safeParseNumber(result.payout, 0);
    const isWin = payout > 0 || result.mainJackpotHit || result.miniJackpotHit;

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      wins: isWin ? prev.wins + 1 : prev.wins,
      totalWinnings: prev.totalWinnings + payout,
    }));

    // Show result banner AFTER ball lands (with small delay)
    setTimeout(() => {
      if (result.mainJackpotHit) {
        setBanner({ kind: 'main', text: 'MAIN JACKPOT!!!' });
        toast.success('MAIN JACKPOT WON!', {
          description: `You won ${formatTokenAmount(payout)} PLS369!`,
        });
      } else if (result.miniJackpotHit) {
        setBanner({ kind: 'mini', text: 'MINI JACKPOT!' });
        toast.success('MINI JACKPOT WON!', {
          description: `You won ${formatTokenAmount(payout)} PLS369!`,
        });
      } else if (payout > 0) {
        const multiplier = WIN_SLOTS[result.slot] || 1;
        setBanner({ kind: 'win', text: `WIN ${formatTokenAmount(payout)} PLS369!` });
        toast.success(`You won ${multiplier}x!`, {
          description: `${formatTokenAmount(payout)} PLS369 - Slot ${result.slot}`,
        });
      } else if (result.slot === MAIN_JACKPOT_INDEX) {
        setBanner({ kind: 'lose', text: 'So close! Main jackpot slot!' });
        toast.info('Almost hit the Main Jackpot!', {
          description: 'Landed on Main slot but didn\'t trigger. Keep playing!',
        });
      } else if (MINI_JACKPOT_INDICES.includes(result.slot)) {
        setBanner({ kind: 'lose', text: 'So close! Mini jackpot slot!' });
        toast.info('Almost hit the Mini Jackpot!', {
          description: 'Landed on Mini slot but didn\'t trigger. Keep playing!',
        });
      } else {
        setBanner({ kind: 'lose', text: 'Try again!' });
        toast.info('Try again!', {
          description: `Slot ${result.slot}. Jackpots are growing!`,
        });
      }
      
      // Auto-clear banner after 2 seconds
      setTimeout(() => {
        setBanner(null);
      }, 2000);
    }, 300);

    // Refresh wallet balance
    await wallet.refreshBalance();
  }, [game.lastPlayResult, wallet]);

  // Handle token approval
  const handleApprove = useCallback(async () => {
    const success = await game.approveTokens();
    if (success) {
      toast.success('Tokens approved!', {
        description: 'You can now play the game',
      });
    }
  }, [game]);

  return (
    <div className="pulse369-container" data-testid="pulse369-game">
      <Backdrop />

      <div className="content-wrapper">
        <GameHeader
          miniAmountPLS369={formatTokenAmount(game.gameState.miniJackpot)}
          mainAmountPLS369={formatTokenAmount(game.gameState.mainJackpot)}
          isConnected={wallet.isConnected}
          isConnecting={wallet.isConnecting}
          formattedAddress={wallet.formattedAddress}
          pls369Balance={wallet.pls369Balance}
          isCorrectChain={wallet.isCorrectChain}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
          isMetaMaskAvailable={wallet.isMetaMaskAvailable}
        />

        <div className="game-layout">
          {/* Main Game Board */}
          <div className="board-column">
            <PlinkoBoard369
              isBallFalling={isBallFalling}
              onLaunch={handleLaunch}
              onBallLanded={handleBallLanded}
              miniAmountPLS369={formatTokenAmount(game.gameState.miniJackpot)}
              mainAmountPLS369={formatTokenAmount(game.gameState.mainJackpot)}
              finalSlot={finalSlot}
              isPlaying={game.isPlaying}
            />

            {/* How to Play - Compact */}
            <div className="info-card-compact">
              <div className="info-compact-title">How to Play</div>
              <div className="info-compact-content">
                <span><strong>Entry:</strong> {ENTRY_PRICE_DISPLAY}</span> • 
                <span><strong>Wins:</strong> Slots 3 (3x), 7 (2x), 11 (5x), 15 (2x), 18 (2x)</span> • 
                <span><strong>Jackpots:</strong> Slots 2, 16 (Mini) & 10 (Main)</span>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="stats-column">
            {/* Player Wallet */}
            <PlayerWallet
              pls369Balance={wallet.pls369Balance}
              isConnected={wallet.isConnected}
              isApproved={game.isApproved}
              isApproving={game.isApproving}
              onApprove={handleApprove}
              sessionStats={sessionStats}
              error={game.error}
            />

            {/* Game Stats from Contract */}
            <Card className="stats-card">
              <CardHeader>
                <CardTitle>Game Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="stat-row">
                  <span>Total Plays</span>
                  <span className="stat-value">{safeParseNumber(game.gameState.playCount, 0).toLocaleString()}</span>
                </div>
                <div className="stat-row">
                  <span>Main Jackpot</span>
                  <span className="stat-value purple">{formatTokenAmount(game.gameState.mainJackpot)} PLS369</span>
                </div>
                <div className="stat-row">
                  <span>Mini Jackpot</span>
                  <span className="stat-value green">{formatTokenAmount(game.gameState.miniJackpot)} PLS369</span>
                </div>
              </CardContent>
            </Card>

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
              <AdminGate connectedAddress={wallet.address}>
                <Card className="admin-card">
                  <CardHeader>
                    <CardTitle>Admin Panel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400">Owner wallet only</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Connect with contract owner wallet to access controls
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