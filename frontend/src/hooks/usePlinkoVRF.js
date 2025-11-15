/**
 * React Hook for PlinkoGameVRF Contract Interaction
 * 
 * Handles async VRF flow:
 * 1. User initiates play
 * 2. Contract requests VRF randomness
 * 3. Hook waits for PlayResolved event
 * 4. Updates UI with result
 */

import { useState, useEffect, useCallback } from 'react';
import { getPlinkoVRFContract, getPlinkoVRFContractReadOnly, formatPLS } from '../lib/web3';
import { VRF_CONFIG } from '../config/contracts';

export function usePlinkoVRF() {
  const [gameState, setGameState] = useState({
    mainJackpot: '0',
    miniJackpot: '0',
    playCount: 0,
    hostAccumulated: '0',
    minEntryPls: '0',
  });
  
  const [entryRequirements, setEntryRequirements] = useState({
    minEntryPls: '0',
    vrfFee: '0',
    totalRequired: '0',
  });
  
  const [playState, setPlayState] = useState({
    status: 'idle', // 'idle' | 'requesting' | 'waiting_vrf' | 'resolved' | 'error'
    requestId: null,
    result: null,
    error: null,
  });
  
  const [loading, setLoading] = useState(false);
  
  /**
   * Load game state from contract
   */
  const loadGameState = useCallback(async () => {
    try {
      const contract = await getPlinkoVRFContractReadOnly();
      const state = await contract.getGameState();
      
      setGameState({
        mainJackpot: formatPLS(state[0]),
        miniJackpot: formatPLS(state[1]),
        playCount: Number(state[2]),
        hostAccumulated: formatPLS(state[3]),
        minEntryPls: formatPLS(state[4]),
      });
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  }, []);
  
  /**
   * Load entry requirements
   */
  const loadEntryRequirements = useCallback(async () => {
    try {
      const contract = await getPlinkoVRFContractReadOnly();
      const requirements = await contract.getCurrentEntryRequirements(VRF_CONFIG.callbackGasLimit);
      
      setEntryRequirements({
        minEntryPls: formatPLS(requirements[0]),
        vrfFee: formatPLS(requirements[1]),
        totalRequired: formatPLS(requirements[2]),
      });
    } catch (error) {
      console.error('Failed to load entry requirements:', error);
    }
  }, []);
  
  /**
   * Play game (initiates VRF request)
   */
  const play = useCallback(async () => {
    try {
      setLoading(true);
      setPlayState({ status: 'requesting', requestId: null, result: null, error: null });
      
      const contract = await getPlinkoVRFContract();
      
      // Get total required amount
      const requirements = await contract.getCurrentEntryRequirements(VRF_CONFIG.callbackGasLimit);
      const totalRequired = requirements[2];
      
      // Send play transaction
      const tx = await contract.play(VRF_CONFIG.callbackGasLimit, {
        value: totalRequired,
      });
      
      setPlayState({ status: 'waiting_vrf', requestId: null, result: null, error: null });
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Extract requestId from PlayRequested event
      const playRequestedEvent = receipt.logs
        .map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(event => event && event.name === 'PlayRequested');
      
      if (!playRequestedEvent) {
        throw new Error('PlayRequested event not found');
      }
      
      const requestId = playRequestedEvent.args.requestId;
      
      setPlayState(prev => ({ ...prev, requestId: requestId.toString() }));
      
      // Wait for VRF fulfillment
      await waitForPlayResolved(contract, requestId);
      
      // Reload game state
      await loadGameState();
      await loadEntryRequirements();
      
    } catch (error) {
      console.error('Play failed:', error);
      setPlayState({
        status: 'error',
        requestId: null,
        result: null,
        error: error.message || 'Transaction failed',
      });
    } finally {
      setLoading(false);
    }
  }, [loadGameState, loadEntryRequirements]);
  
  /**
   * Wait for PlayResolved event
   */
  const waitForPlayResolved = useCallback(async (contract, requestId) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        contract.off('PlayResolved', listener);
        reject(new Error('VRF fulfillment timeout'));
      }, VRF_CONFIG.maxWaitTime);
      
      const listener = (player, eventRequestId, slot, payout, isJackpot, event) => {
        if (eventRequestId.toString() === requestId.toString()) {
          clearTimeout(timeout);
          contract.off('PlayResolved', listener);
          
          setPlayState({
            status: 'resolved',
            requestId: requestId.toString(),
            result: {
              slot: Number(slot),
              payout: formatPLS(payout),
              isJackpot,
            },
            error: null,
          });
          
          resolve();
        }
      };
      
      contract.on('PlayResolved', listener);
      
      // Also poll for fulfillment status
      const pollInterval = setInterval(async () => {
        try {
          const fulfilled = await contract.isPlayFulfilled(requestId);
          if (fulfilled) {
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, VRF_CONFIG.pollInterval);
    });
  }, []);
  
  /**
   * Reset play state
   */
  const resetPlayState = useCallback(() => {
    setPlayState({ status: 'idle', requestId: null, result: null, error: null });
  }, []);
  
  // Load initial data
  useEffect(() => {
    loadGameState();
    loadEntryRequirements();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadGameState();
      loadEntryRequirements();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadGameState, loadEntryRequirements]);
  
  return {
    gameState,
    entryRequirements,
    playState,
    loading,
    play,
    resetPlayState,
    refreshGameState: loadGameState,
  };
}
