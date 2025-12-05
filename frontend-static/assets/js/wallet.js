// wallet.js - WalletManager for MetaMask/Web3 wallet connection
import { CONFIG } from '../../config.js';
import { showNotification, shortenAddress, isSupportedNetwork, getNetworkInfo } from './utils.js';

/**
 * WalletManager handles all wallet-related functionality
 * - MetaMask connection
 * - Network switching
 * - Account change handling
 * - Token balance fetching
 */
export class WalletManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.isConnected = false;
        
        // Event callbacks
        this.onConnect = null;
        this.onDisconnect = null;
        this.onAccountChange = null;
        this.onChainChange = null;
        
        // Bind methods
        this.handleAccountsChanged = this.handleAccountsChanged.bind(this);
        this.handleChainChanged = this.handleChainChanged.bind(this);
        this.handleDisconnect = this.handleDisconnect.bind(this);
    }
    
    /**
     * Initialize wallet manager and check for existing connection
     */
    async init() {
        if (typeof window.ethereum === 'undefined') {
            console.log('MetaMask not installed');
            return false;
        }
        
        // Set up event listeners
        window.ethereum.on('accountsChanged', this.handleAccountsChanged);
        window.ethereum.on('chainChanged', this.handleChainChanged);
        window.ethereum.on('disconnect', this.handleDisconnect);
        
        // Check if already connected
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await this.connect(true);
            }
        } catch (err) {
            console.error('Error checking existing connection:', err);
        }
        
        return true;
    }
    
    /**
     * Connect to wallet
     * @param {boolean} silent - If true, don't show connection prompts
     * @returns {Promise<boolean>} Connection success
     */
    async connect(silent = false) {
        if (typeof window.ethereum === 'undefined') {
            if (!silent) {
                showNotification('Please install MetaMask to play!', 'error');
            }
            return false;
        }
        
        try {
            // Request accounts
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length === 0) {
                if (!silent) {
                    showNotification('No accounts found', 'error');
                }
                return false;
            }
            
            this.address = accounts[0];
            
            // Get chain ID
            const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
            this.chainId = parseInt(chainIdHex, 16);
            
            // Check if on supported network
            if (!isSupportedNetwork(this.chainId)) {
                if (!silent) {
                    showNotification('Please switch to PulseChain network', 'warning');
                }
                await this.switchNetwork(369);
            }
            
            this.isConnected = true;
            
            if (!silent) {
                showNotification(`Connected: ${shortenAddress(this.address)}`, 'success');
            }
            
            // Trigger callback
            if (this.onConnect) {
                this.onConnect(this.address, this.chainId);
            }
            
            return true;
            
        } catch (err) {
            console.error('Connection error:', err);
            if (!silent && err.code !== 4001) { // 4001 = user rejected
                showNotification('Failed to connect wallet', 'error');
            }
            return false;
        }
    }
    
    /**
     * Disconnect wallet (clear local state)
     */
    disconnect() {
        this.address = null;
        this.chainId = null;
        this.isConnected = false;
        
        showNotification('Wallet disconnected', 'info');
        
        if (this.onDisconnect) {
            this.onDisconnect();
        }
    }
    
    /**
     * Switch to a specific network
     * @param {number} chainId - Target chain ID
     * @returns {Promise<boolean>} Switch success
     */
    async switchNetwork(chainId) {
        const network = getNetworkInfo(chainId);
        if (!network) {
            showNotification('Unsupported network', 'error');
            return false;
        }
        
        const chainIdHex = '0x' + chainId.toString(16);
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }]
            });
            return true;
            
        } catch (switchError) {
            // Chain not added to wallet
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: chainIdHex,
                            chainName: network.name,
                            nativeCurrency: {
                                name: network.symbol,
                                symbol: network.symbol,
                                decimals: network.decimals
                            },
                            rpcUrls: [network.rpc],
                            blockExplorerUrls: [network.explorer]
                        }]
                    });
                    return true;
                } catch (addError) {
                    console.error('Error adding network:', addError);
                    showNotification('Failed to add network', 'error');
                    return false;
                }
            }
            
            console.error('Error switching network:', switchError);
            showNotification('Failed to switch network', 'error');
            return false;
        }
    }
    
    /**
     * Get PLS369 token balance for current address
     * @returns {Promise<string>} Balance in wei
     */
    async getTokenBalance() {
        if (!this.isConnected) return '0';
        
        try {
            // ERC20 balanceOf ABI
            const data = '0x70a08231000000000000000000000000' + 
                         this.address.slice(2).toLowerCase();
            
            const result = await window.ethereum.request({
                method: 'eth_call',
                params: [{
                    to: CONFIG.TOKEN_ADDRESS,
                    data: data
                }, 'latest']
            });
            
            return BigInt(result).toString();
            
        } catch (err) {
            console.error('Error fetching token balance:', err);
            return '0';
        }
    }
    
    /**
     * Get PLS (native) balance for current address
     * @returns {Promise<string>} Balance in wei
     */
    async getNativeBalance() {
        if (!this.isConnected) return '0';
        
        try {
            const result = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [this.address, 'latest']
            });
            
            return BigInt(result).toString();
            
        } catch (err) {
            console.error('Error fetching native balance:', err);
            return '0';
        }
    }
    
    /**
     * Get token allowance for the game contract
     * @returns {Promise<string>} Allowance in wei
     */
    async getTokenAllowance() {
        if (!this.isConnected) return '0';
        
        try {
            // ERC20 allowance ABI
            const ownerPadded = this.address.slice(2).toLowerCase().padStart(64, '0');
            const spenderPadded = CONFIG.CONTRACT_ADDRESS.slice(2).toLowerCase().padStart(64, '0');
            const data = '0xdd62ed3e' + ownerPadded + spenderPadded;
            
            const result = await window.ethereum.request({
                method: 'eth_call',
                params: [{
                    to: CONFIG.TOKEN_ADDRESS,
                    data: data
                }, 'latest']
            });
            
            return BigInt(result).toString();
            
        } catch (err) {
            console.error('Error fetching allowance:', err);
            return '0';
        }
    }
    
    /**
     * Approve token spending for the game contract
     * @param {string} amount - Amount to approve in wei (default: entry price * 100 for convenience)
     * @returns {Promise<string|null>} Transaction hash or null on failure
     */
    async approveTokens(amount = null) {
        if (!this.isConnected) {
            showNotification('Please connect wallet first', 'error');
            return null;
        }
        
        // Default to 100x entry price for convenience (enough for 100 plays)
        // This is safer than unlimited approval while still being convenient
        const approvalAmount = amount || (BigInt(CONFIG.GAME.ENTRY_PRICE) * BigInt(100)).toString();
        
        try {
            // ERC20 approve ABI
            const spenderPadded = CONFIG.CONTRACT_ADDRESS.slice(2).toLowerCase().padStart(64, '0');
            const amountHex = typeof approvalAmount === 'string' && approvalAmount.startsWith('0x') 
                ? approvalAmount.slice(2).padStart(64, '0')
                : BigInt(approvalAmount).toString(16).padStart(64, '0');
            const data = '0x095ea7b3' + spenderPadded + amountHex;
            
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: this.address,
                    to: CONFIG.TOKEN_ADDRESS,
                    data: data
                }]
            });
            
            showNotification('Approval submitted!', 'success');
            return txHash;
            
        } catch (err) {
            console.error('Approval error:', err);
            if (err.code !== 4001) {
                showNotification('Approval failed', 'error');
            }
            return null;
        }
    }
    
    /**
     * Handle accounts changed event
     * @param {string[]} accounts - New accounts array
     */
    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.disconnect();
        } else if (accounts[0] !== this.address) {
            this.address = accounts[0];
            showNotification(`Account changed: ${shortenAddress(this.address)}`, 'info');
            
            if (this.onAccountChange) {
                this.onAccountChange(this.address);
            }
        }
    }
    
    /**
     * Handle chain changed event
     * @param {string} chainIdHex - New chain ID in hex
     */
    handleChainChanged(chainIdHex) {
        const newChainId = parseInt(chainIdHex, 16);
        this.chainId = newChainId;
        
        const network = getNetworkInfo(newChainId);
        if (network) {
            showNotification(`Switched to ${network.name}`, 'info');
        } else {
            showNotification('Please switch to PulseChain network', 'warning');
        }
        
        if (this.onChainChange) {
            this.onChainChange(newChainId);
        }
    }
    
    /**
     * Handle disconnect event
     * @param {Error} error - Disconnect error
     */
    handleDisconnect(error) {
        console.log('Wallet disconnected:', error);
        this.disconnect();
    }
    
    /**
     * Clean up event listeners
     */
    destroy() {
        if (window.ethereum) {
            window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', this.handleChainChanged);
            window.ethereum.removeListener('disconnect', this.handleDisconnect);
        }
    }
}

// Export singleton instance
export const walletManager = new WalletManager();
export default walletManager;
