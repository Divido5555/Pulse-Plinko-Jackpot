import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { toast } from 'sonner';
import {
  CONTRACTS,
  PLS369_TOKEN_ABI,
  PLINKO_GAME_ABI,
  PULSECHAIN_CONFIG,
  ENTRY_PRICE_TOKENS,
} from '../config/contracts';

const PULSECHAIN_CHAIN_ID = 369;
const PULSECHAIN_CHAIN_ID_HEX = '0x171';

/**
 * Custom hook for managing wallet connection and blockchain interactions
 * Supports any EIP-1193 compatible wallet (MetaMask, Safe, Rainbow, Coinbase Wallet, etc.)
 */
export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [gameContract, setGameContract] = useState(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if wallet is installed
  const isWalletInstalled = useCallback(() => {
    return typeof window.ethereum !== 'undefined';
  }, []);

  // Switch to PulseChain network
  const switchToPulseChain = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('No wallet detected', {
        description: 'Please install a Web3 wallet like MetaMask',
      });
      return false;
    }

    try {
      // Try to switch to PulseChain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: PULSECHAIN_CHAIN_ID_HEX }],
      });
      return true;
    } catch (switchError) {
      // If chain not added, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [PULSECHAIN_CONFIG],
          });
          toast.success('PulseChain added!', {
            description: 'Network has been added to your wallet',
          });
          return true;
        } catch (addError) {
          console.error('Error adding PulseChain:', addError);
          toast.error('Failed to add PulseChain', {
            description: 'Please add PulseChain network manually',
          });
          return false;
        }
      } else {
        console.error('Error switching to PulseChain:', switchError);
        toast.error('Failed to switch network', {
          description: 'Please switch to PulseChain manually',
        });
        return false;
      }
    }
  }, []);

  // Initialize contracts
  const initializeContracts = useCallback(async (signerInstance) => {
    try {
      const token = new Contract(
        CONTRACTS.PLS369_TOKEN,
        PLS369_TOKEN_ABI,
        signerInstance
      );
      const game = new Contract(
        CONTRACTS.PLINKO_GAME,
        PLINKO_GAME_ABI,
        signerInstance
      );
      setTokenContract(token);
      setGameContract(game);
      return { token, game };
    } catch (error) {
      console.error('Error initializing contracts:', error);
      toast.error('Failed to initialize contracts');
      return null;
    }
  }, []);

  // Fetch token balance
  const fetchBalance = useCallback(async (address, tokenContractInstance) => {
    if (!tokenContractInstance || !address) {
      return '0';
    }
    
    try {
      const bal = await tokenContractInstance.balanceOf(address);
      const formatted = formatUnits(bal, 18);
      setBalance(formatted);
      return formatted;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!isWalletInstalled()) {
      toast.error('No wallet detected', {
        description: 'Please install a Web3 wallet like MetaMask, Safe, or Coinbase Wallet',
      });
      return false;
    }

    setIsConnecting(true);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        toast.error('No accounts found', {
          description: 'Please unlock your wallet',
        });
        setIsConnecting(false);
        return false;
      }

      // Get chain ID
      const currentChainId = await window.ethereum.request({
        method: 'eth_chainId',
      });
      const chainIdDecimal = parseInt(currentChainId, 16);
      setChainId(chainIdDecimal);

      // Check if on PulseChain
      if (chainIdDecimal !== PULSECHAIN_CHAIN_ID) {
        const switched = await switchToPulseChain();
        if (!switched) {
          setIsConnecting(false);
          return false;
        }
      }

      // Initialize provider and signer
      const browserProvider = new BrowserProvider(window.ethereum);
      const signerInstance = await browserProvider.getSigner();
      
      setProvider(browserProvider);
      setSigner(signerInstance);
      setAccount(accounts[0]);

      // Initialize contracts
      const contracts = await initializeContracts(signerInstance);
      
      if (contracts) {
        // Fetch initial balance
        await fetchBalance(accounts[0], contracts.token);
        
        toast.success('Wallet connected!', {
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }

      setIsConnecting(false);
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet', {
        description: error.message || 'Please try again',
      });
      setIsConnecting(false);
      return false;
    }
  }, [isWalletInstalled, switchToPulseChain, initializeContracts, fetchBalance]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setTokenContract(null);
    setGameContract(null);
    setBalance('0');
    setChainId(null);
    toast.info('Wallet disconnected');
  }, []);

  // Check allowance and approve if needed
  const ensureApproval = useCallback(async () => {
    if (!tokenContract || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      // Check current allowance
      const allowance = await tokenContract.allowance(account, CONTRACTS.PLINKO_GAME);
      const entryPriceWei = parseUnits(ENTRY_PRICE_TOKENS.toString(), 18);

      // If allowance is sufficient, return true
      if (allowance >= entryPriceWei) {
        return true;
      }

      // Request approval
      const approvalAmount = '1000000'; // Approve large amount for gas efficiency
      toast.info('Approval needed', {
        description: `Approving ${approvalAmount} PLS369 tokens (for multiple games, saves gas!)`,
        duration: 6000,
      });

      const approveTx = await tokenContract.approve(
        CONTRACTS.PLINKO_GAME,
        parseUnits(approvalAmount, 18) // Approve a large amount for multiple plays
      );

      toast.info('Approving...', {
        description: `Approving ${approvalAmount} PLS369 - This covers many games!`,
        duration: 5000,
      });

      await approveTx.wait();

      toast.success('Approved!', {
        description: 'You can now play the game',
      });

      return true;
    } catch (error) {
      console.error('Error approving tokens:', error);
      toast.error('Approval failed', {
        description: error.message || 'Please try again',
      });
      return false;
    }
  }, [tokenContract, account]);

  // Play the game
  const playGame = useCallback(async () => {
    if (!gameContract || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      // Ensure approval first
      const approved = await ensureApproval();
      
      if (!approved) {
        return null;
      }

      // Check balance
      const balanceWei = parseUnits(balance, 18);
      const entryPriceWei = parseUnits(ENTRY_PRICE_TOKENS.toString(), 18);
      
      if (balanceWei < entryPriceWei) {
        toast.error('Insufficient balance', {
          description: `You need at least ${ENTRY_PRICE_TOKENS} PLS369 to play`,
        });
        return null;
      }

      // Call play function
      toast.info('Playing...', {
        description: 'Transaction submitted, waiting for result',
      });

      const playTx = await gameContract.play();
      const receipt = await playTx.wait();

      // Parse Play event from receipt
      const playEvent = receipt.logs
        .map(log => {
          try {
            return gameContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(event => event && event.name === 'Play');

      if (!playEvent) {
        throw new Error('Play event not found in transaction receipt');
      }

      // Extract game result from event
      const result = {
        slot: Number(playEvent.args.slot),
        payout: playEvent.args.payout,
        mainJackpotHit: playEvent.args.mainJackpotHit,
        miniJackpotHit: playEvent.args.miniJackpotHit,
        playId: playEvent.args.playId,
      };

      // Refresh balance
      await fetchBalance(account, tokenContract);

      return result;
    } catch (error) {
      console.error('Error playing game:', error);
      
      // Handle specific error cases
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction rejected', {
          description: 'You cancelled the transaction',
        });
      } else if (error.message.includes('Randomness empty')) {
        toast.error('Game temporarily unavailable', {
          description: 'Randomness pool needs to be refilled. Please try again later.',
        });
      } else {
        toast.error('Failed to play', {
          description: error.message || 'Please try again',
        });
      }
      
      return null;
    }
  }, [gameContract, account, ensureApproval, balance, fetchBalance, tokenContract]);

  // Fetch game state (jackpots, play count, etc.)
  // This can work without wallet connection using a read-only provider
  const fetchGameState = useCallback(async () => {
    try {
      // If we have a connected contract, use it
      if (gameContract) {
        const state = await gameContract.getGameState();
        return {
          mainJackpot: formatUnits(state._mainJackpot, 18),
          miniJackpot: formatUnits(state._miniJackpot, 18),
          playCount: Number(state._playCount),
          daoAccrued: formatUnits(state._daoAccrued, 18),
          devAccrued: formatUnits(state._devAccrued, 18),
          entryPrice: formatUnits(state._entryPrice, 18),
        };
      }
      
      // Otherwise, create a read-only provider to fetch public data
      if (typeof window.ethereum !== 'undefined') {
        const readProvider = new BrowserProvider(window.ethereum);
        const readGameContract = new Contract(
          CONTRACTS.PLINKO_GAME,
          PLINKO_GAME_ABI,
          readProvider
        );
        const state = await readGameContract.getGameState();
        return {
          mainJackpot: formatUnits(state._mainJackpot, 18),
          miniJackpot: formatUnits(state._miniJackpot, 18),
          playCount: Number(state._playCount),
          daoAccrued: formatUnits(state._daoAccrued, 18),
          devAccrued: formatUnits(state._devAccrued, 18),
          entryPrice: formatUnits(state._entryPrice, 18),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching game state:', error);
      return null;
    }
  }, [gameContract]);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        if (tokenContract) {
          fetchBalance(accounts[0], tokenContract);
        }
      }
    };

    const handleChainChanged = (newChainId) => {
      const chainIdDecimal = parseInt(newChainId, 16);
      setChainId(chainIdDecimal);
      
      if (chainIdDecimal !== PULSECHAIN_CHAIN_ID) {
        toast.warning('Wrong network', {
          description: 'Please switch to PulseChain',
        });
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, disconnectWallet, tokenContract, fetchBalance]);

  // Auto-connect if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!isWalletInstalled()) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts && accounts.length > 0) {
          // Auto-reconnect silently
          connectWallet();
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    checkConnection();
  }, [isWalletInstalled, connectWallet]);

  // Wrapper function to fetch balance with current state
  const refreshBalance = useCallback(async () => {
    if (account && tokenContract) {
      return await fetchBalance(account, tokenContract);
    }
    return '0';
  }, [account, tokenContract, fetchBalance]);

  return {
    account,
    balance,
    chainId,
    isConnected: !!account,
    isConnecting,
    isCorrectNetwork: chainId === PULSECHAIN_CHAIN_ID,
    connectWallet,
    disconnectWallet,
    switchToPulseChain,
    playGame,
    fetchGameState,
    fetchBalance: refreshBalance,
  };
};
