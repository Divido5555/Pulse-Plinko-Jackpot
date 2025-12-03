import { useState, useEffect, useCallback } from 'react';
import { Contract, formatUnits, parseUnits, MaxUint256 } from 'ethers';
import { 
  CONTRACT_ADDRESSES, 
  PLS369_TOKEN_ABI, 
  PLINKO_GAME_ABI,
  ENTRY_PRICE 
} from '../config/contracts';

export const useGame = (provider, signer, address) => {
  const [gameState, setGameState] = useState({
    mainJackpot: '0',
    miniJackpot: '0',
    playCount: '0',
    daoAccrued: '0',
    devAccrued: '0',
    entryPrice: '10',
  });
  const [allowance, setAllowance] = useState('0');
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastPlayResult, setLastPlayResult] = useState(null);
  const [error, setError] = useState(null);
  const [randomPoolStatus, setRandomPoolStatus] = useState({ size: 0, index: 0 });

  // Create contract instances
  const getContracts = useCallback(() => {
    if (!provider) return { tokenContract: null, gameContract: null };
    
    const tokenContract = new Contract(
      CONTRACT_ADDRESSES.tokenContract,
      PLS369_TOKEN_ABI,
      signer || provider
    );
    
    const gameContract = new Contract(
      CONTRACT_ADDRESSES.gameContract,
      PLINKO_GAME_ABI,
      signer || provider
    );
    
    return { tokenContract, gameContract };
  }, [provider, signer]);

  // Fetch game state from contract
  const fetchGameState = useCallback(async () => {
    if (!provider) return;
    
    try {
      const { gameContract } = getContracts();
      if (!gameContract) return;

      const state = await gameContract.getGameState();
      const [mainJackpot, miniJackpot, playCount, daoAccrued, devAccrued, entryPrice] = state;

      setGameState({
        mainJackpot: formatUnits(mainJackpot, 18),
        miniJackpot: formatUnits(miniJackpot, 18),
        playCount: playCount.toString(),
        daoAccrued: formatUnits(daoAccrued, 18),
        devAccrued: formatUnits(devAccrued, 18),
        entryPrice: formatUnits(entryPrice, 18),
      });

      // Also fetch random pool status
      const poolStatus = await gameContract.getRandomPoolSize();
      setRandomPoolStatus({
        size: poolStatus.size.toString(),
        index: poolStatus.index.toString(),
      });
    } catch (err) {
      console.error('Error fetching game state:', err);
      setError('Failed to fetch game state');
    }
  }, [provider, getContracts]);

  // Check token allowance
  const checkAllowance = useCallback(async () => {
    if (!provider || !address) return;
    
    try {
      const { tokenContract } = getContracts();
      if (!tokenContract) return;

      const currentAllowance = await tokenContract.allowance(address, CONTRACT_ADDRESSES.gameContract);
      const allowanceFormatted = formatUnits(currentAllowance, 18);
      setAllowance(allowanceFormatted);
      
      // Check if allowance is sufficient for one play
      setIsApproved(currentAllowance >= ENTRY_PRICE);
    } catch (err) {
      console.error('Error checking allowance:', err);
    }
  }, [provider, address, getContracts]);

  // Approve tokens for the game contract
  const approveTokens = useCallback(async (amount = MaxUint256) => {
    if (!signer || !address) {
      setError('Wallet not connected');
      return false;
    }

    setIsApproving(true);
    setError(null);

    try {
      const { tokenContract } = getContracts();
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      // Request approval for max amount (unlimited) or specific amount
      const tx = await tokenContract.approve(CONTRACT_ADDRESSES.gameContract, amount);
      await tx.wait();

      // Refresh allowance
      await checkAllowance();
      
      setIsApproving(false);
      return true;
    } catch (err) {
      console.error('Error approving tokens:', err);
      setError(err.message || 'Failed to approve tokens');
      setIsApproving(false);
      return false;
    }
  }, [signer, address, getContracts, checkAllowance]);

  // Play the game
  const play = useCallback(async () => {
    if (!signer || !address) {
      setError('Wallet not connected');
      return null;
    }

    if (!isApproved) {
      setError('Please approve PLS369 tokens first');
      return null;
    }

    setIsPlaying(true);
    setError(null);
    setLastPlayResult(null);

    try {
      const { gameContract } = getContracts();
      if (!gameContract) {
        throw new Error('Game contract not available');
      }

      // Call the play function
      const tx = await gameContract.play();
      const receipt = await tx.wait();

      // Parse the Play event from the receipt
      let playResult = {
        slot: null,
        payout: '0',
        mainJackpotHit: false,
        miniJackpotHit: false,
        playId: null,
      };

      // Look for Play event in logs
      for (const log of receipt.logs) {
        try {
          const parsed = gameContract.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          
          if (parsed && parsed.name === 'Play') {
            playResult = {
              player: parsed.args.player,
              playId: parsed.args.playId.toString(),
              slot: Number(parsed.args.slot),
              payout: formatUnits(parsed.args.payout, 18),
              mainJackpotHit: parsed.args.mainJackpotHit,
              miniJackpotHit: parsed.args.miniJackpotHit,
            };
            break;
          }
        } catch (e) {
          // Not our event, continue
        }
      }

      setLastPlayResult(playResult);
      
      // Refresh game state and allowance after play
      await fetchGameState();
      await checkAllowance();
      
      setIsPlaying(false);
      return playResult;
    } catch (err) {
      console.error('Error playing game:', err);
      
      // Check for specific error messages
      let errorMessage = 'Failed to play game';
      if (err.message?.includes('Randomness empty') || err.message?.includes('Randomness depleted')) {
        errorMessage = 'Game is temporarily unavailable (no randomness available)';
      } else if (err.message?.includes('Token transfer failed')) {
        errorMessage = 'Insufficient PLS369 balance';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction cancelled';
      }
      
      setError(errorMessage);
      setIsPlaying(false);
      return null;
    }
  }, [signer, address, isApproved, getContracts, fetchGameState, checkAllowance]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await fetchGameState();
    await checkAllowance();
  }, [fetchGameState, checkAllowance]);

  // Fetch initial data when provider/address changes
  useEffect(() => {
    if (provider) {
      fetchGameState();
    }
  }, [provider, fetchGameState]);

  useEffect(() => {
    if (provider && address) {
      checkAllowance();
    }
  }, [provider, address, checkAllowance]);

  // Set up polling for game state updates
  useEffect(() => {
    if (!provider) return;

    const interval = setInterval(() => {
      fetchGameState();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [provider, fetchGameState]);

  return {
    // State
    gameState,
    allowance,
    isApproved,
    isApproving,
    isPlaying,
    lastPlayResult,
    error,
    randomPoolStatus,
    // Actions
    fetchGameState,
    checkAllowance,
    approveTokens,
    play,
    refresh,
    // Clear error
    clearError: () => setError(null),
  };
};

export default useGame;
