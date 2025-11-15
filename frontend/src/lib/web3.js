/**
 * Web3 Provider and Contract Helper
 * 
 * Provides utilities for connecting to MetaMask and interacting with PlinkoGameVRF
 */

import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import { PLINKO_VRF_ADDRESS, PLINKO_VRF_ABI } from '../config/contracts';

/**
 * Get Web3 provider from MetaMask
 * @returns {Promise<BrowserProvider>}
 */
export async function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  
  const provider = new BrowserProvider(window.ethereum);
  return provider;
}

/**
 * Get signer (connected wallet)
 * @returns {Promise<Signer>}
 */
export async function getSigner() {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  return signer;
}

/**
 * Get PlinkoGameVRF contract instance with signer
 * @returns {Promise<Contract>}
 */
export async function getPlinkoVRFContract() {
  if (!PLINKO_VRF_ADDRESS) {
    throw new Error("Contract address not configured");
  }
  
  const signer = await getSigner();
  const contract = new Contract(PLINKO_VRF_ADDRESS, PLINKO_VRF_ABI, signer);
  return contract;
}

/**
 * Get PlinkoGameVRF contract instance (read-only, no signer)
 * @returns {Promise<Contract>}
 */
export async function getPlinkoVRFContractReadOnly() {
  if (!PLINKO_VRF_ADDRESS) {
    throw new Error("Contract address not configured");
  }
  
  const provider = await getProvider();
  const contract = new Contract(PLINKO_VRF_ADDRESS, PLINKO_VRF_ABI, provider);
  return contract;
}

/**
 * Request wallet connection
 * @returns {Promise<string>} Connected address
 */
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  
  const provider = await getProvider();
  const accounts = await provider.send("eth_requestAccounts", []);
  return accounts[0];
}

/**
 * Get current connected address
 * @returns {Promise<string|null>}
 */
export async function getCurrentAddress() {
  try {
    const signer = await getSigner();
    return await signer.getAddress();
  } catch (error) {
    return null;
  }
}

/**
 * Get PLS balance of address
 * @param {string} address 
 * @returns {Promise<string>} Balance in PLS
 */
export async function getBalance(address) {
  const provider = await getProvider();
  const balance = await provider.getBalance(address);
  return formatEther(balance);
}

/**
 * Switch to PulseChain network
 * @param {boolean} testnet - If true, switch to testnet
 */
export async function switchToPulseChain(testnet = false) {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  
  const chainId = testnet ? '0x3af' : '0x171'; // 943 (testnet) or 369 (mainnet)
  const chainName = testnet ? 'PulseChain Testnet' : 'PulseChain';
  const rpcUrl = testnet 
    ? 'https://rpc.v4.testnet.pulsechain.com'
    : 'https://rpc.pulsechain.com';
  const blockExplorer = testnet
    ? 'https://scan.v4.testnet.pulsechain.com'
    : 'https://scan.pulsechain.com';
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (switchError) {
    // Chain not added, try adding it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId,
          chainName,
          nativeCurrency: {
            name: 'Pulse',
            symbol: 'PLS',
            decimals: 18,
          },
          rpcUrls: [rpcUrl],
          blockExplorerUrls: [blockExplorer],
        }],
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Format PLS amount for display
 * @param {string|BigNumber} amount 
 * @returns {string}
 */
export function formatPLS(amount) {
  try {
    return parseFloat(formatEther(amount)).toLocaleString(undefined, {
      maximumFractionDigits: 4,
    });
  } catch {
    return '0';
  }
}

/**
 * Parse PLS amount from string
 * @param {string} amount 
 * @returns {BigNumber}
 */
export function parsePLS(amount) {
  return parseEther(amount);
}
