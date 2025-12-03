import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, formatUnits } from 'ethers';
import { PULSECHAIN_CONFIG, CONTRACT_ADDRESSES, PLS369_TOKEN_ABI } from '../config/contracts';
import { Contract } from 'ethers';

export const useWallet = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);
  const [pls369Balance, setPls369Balance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isCorrectChain, setIsCorrectChain] = useState(false);

  // Check if MetaMask is available
  const isMetaMaskAvailable = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

  // Switch to PulseChain network
  const switchToPulseChain = useCallback(async () => {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: PULSECHAIN_CONFIG.chainIdHex }],
      });
      return true;
    } catch (switchError) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: PULSECHAIN_CONFIG.chainIdHex,
              chainName: PULSECHAIN_CONFIG.name,
              nativeCurrency: PULSECHAIN_CONFIG.nativeCurrency,
              rpcUrls: [PULSECHAIN_CONFIG.rpcUrl],
              blockExplorerUrls: [PULSECHAIN_CONFIG.blockExplorer],
            }],
          });
          return true;
        } catch (addError) {
          console.error('Error adding PulseChain:', addError);
          setError('Failed to add PulseChain network');
          return false;
        }
      }
      console.error('Error switching to PulseChain:', switchError);
      setError('Failed to switch to PulseChain');
      return false;
    }
  }, []);

  // Fetch PLS369 balance
  const fetchBalance = useCallback(async (userAddress, browserProvider) => {
    if (!userAddress || !browserProvider) return;
    
    try {
      const tokenContract = new Contract(
        CONTRACT_ADDRESSES.tokenContract,
        PLS369_TOKEN_ABI,
        browserProvider
      );
      const balance = await tokenContract.balanceOf(userAddress);
      setPls369Balance(formatUnits(balance, 18));
    } catch (err) {
      console.error('Error fetching PLS369 balance:', err);
      setPls369Balance('0');
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!isMetaMaskAvailable) {
      setError('MetaMask is not installed');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        setError('No accounts found');
        setIsConnecting(false);
        return false;
      }

      // Switch to PulseChain if needed
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (currentChainId !== PULSECHAIN_CONFIG.chainIdHex) {
        const switched = await switchToPulseChain();
        if (!switched) {
          setIsConnecting(false);
          return false;
        }
      }

      // Create provider and signer
      const browserProvider = new BrowserProvider(window.ethereum);
      const userSigner = await browserProvider.getSigner();
      const userAddress = await userSigner.getAddress();

      setProvider(browserProvider);
      setSigner(userSigner);
      setAddress(userAddress);
      setChainId(PULSECHAIN_CONFIG.chainId);
      setIsCorrectChain(true);
      setIsConnected(true);

      // Fetch initial balance
      await fetchBalance(userAddress, browserProvider);

      setIsConnecting(false);
      return true;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      setIsConnecting(false);
      return false;
    }
  }, [isMetaMaskAvailable, switchToPulseChain, fetchBalance]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setPls369Balance('0');
    setIsConnected(false);
    setChainId(null);
    setIsCorrectChain(false);
    setError(null);
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (address && provider) {
      await fetchBalance(address, provider);
    }
  }, [address, provider, fetchBalance]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!isMetaMaskAvailable) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== address) {
        setAddress(accounts[0]);
        if (provider) {
          fetchBalance(accounts[0], provider);
        }
      }
    };

    const handleChainChanged = (newChainId) => {
      const chainIdNum = parseInt(newChainId, 16);
      setChainId(chainIdNum);
      setIsCorrectChain(chainIdNum === PULSECHAIN_CONFIG.chainId);
      
      if (chainIdNum !== PULSECHAIN_CONFIG.chainId) {
        setError('Please switch to PulseChain');
      } else {
        setError(null);
        if (address && provider) {
          fetchBalance(address, provider);
        }
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [isMetaMaskAvailable, address, provider, disconnect, fetchBalance]);

  // Check if already connected on mount
  useEffect(() => {
    if (!isMetaMaskAvailable) return;

    const checkConnection = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
          const chainIdNum = parseInt(currentChainId, 16);
          
          if (chainIdNum === PULSECHAIN_CONFIG.chainId) {
            const browserProvider = new BrowserProvider(window.ethereum);
            const userSigner = await browserProvider.getSigner();
            const userAddress = await userSigner.getAddress();

            setProvider(browserProvider);
            setSigner(userSigner);
            setAddress(userAddress);
            setChainId(chainIdNum);
            setIsCorrectChain(true);
            setIsConnected(true);
            
            await fetchBalance(userAddress, browserProvider);
          }
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    };

    checkConnection();
  }, [isMetaMaskAvailable, fetchBalance]);

  // Format address for display (0x1234...5678)
  const formattedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return {
    // State
    provider,
    signer,
    address,
    formattedAddress,
    pls369Balance,
    isConnecting,
    isConnected,
    isCorrectChain,
    chainId,
    error,
    isMetaMaskAvailable,
    // Actions
    connect,
    disconnect,
    switchToPulseChain,
    refreshBalance,
  };
};

export default useWallet;
