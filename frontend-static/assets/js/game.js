// game.js - GameManager for contract interactions
import { CONFIG } from '../../config.js';
import { showNotification, formatTokenAmount, getSlotDescription, delay } from './utils.js';
import { walletManager } from './wallet.js';

/**
 * GameManager handles all game-related contract interactions
 * - Playing the game
 * - Fetching game state
 * - Jackpot tracking
 * - Result handling
 */
export class GameManager {
    constructor() {
        this.gameState = null;
        this.isPlaying = false;
        this.lastPlayResult = null;
        
        // Event callbacks
        this.onGameStateUpdate = null;
        this.onPlayResult = null;
        this.onJackpotWin = null;
        
        // Refresh interval
        this.refreshInterval = null;
    }
    
    /**
     * Initialize game manager
     */
    async init() {
        // Start periodic refresh
        await this.refreshGameState();
        this.startAutoRefresh();
    }
    
    /**
     * Start automatic game state refresh
     */
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            this.refreshGameState();
        }, CONFIG.UI.REFRESH_INTERVAL);
    }
    
    /**
     * Stop automatic refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    /**
     * Fetch current game state from contract
     * @returns {Promise<object>} Game state
     */
    async refreshGameState() {
        try {
            // Call getGameState() on contract
            // Returns: mainJackpot, miniJackpot, playCount, daoAccrued, devAccrued, entryPrice
            const data = '0x1865c57d'; // getGameState() selector
            
            const result = await window.ethereum.request({
                method: 'eth_call',
                params: [{
                    to: CONFIG.CONTRACT_ADDRESS,
                    data: data
                }, 'latest']
            });
            
            // Decode result (6 uint256 values)
            const values = this.decodeUint256Array(result, 6);
            
            this.gameState = {
                mainJackpot: values[0].toString(),
                miniJackpot: values[1].toString(),
                playCount: values[2].toString(),
                daoAccrued: values[3].toString(),
                devAccrued: values[4].toString(),
                entryPrice: values[5].toString()
            };
            
            if (this.onGameStateUpdate) {
                this.onGameStateUpdate(this.gameState);
            }
            
            return this.gameState;
            
        } catch (err) {
            console.error('Error fetching game state:', err);
            return null;
        }
    }
    
    /**
     * Get randomness pool status
     * @returns {Promise<object>} Pool size and index
     */
    async getRandomPoolStatus() {
        try {
            // Call getRandomPoolSize() on contract
            const data = '0x4a6f5d5a'; // getRandomPoolSize() selector
            
            const result = await window.ethereum.request({
                method: 'eth_call',
                params: [{
                    to: CONFIG.CONTRACT_ADDRESS,
                    data: data
                }, 'latest']
            });
            
            const values = this.decodeUint256Array(result, 2);
            
            return {
                size: values[0].toString(),
                index: values[1].toString(),
                remaining: (values[0] - values[1]).toString()
            };
            
        } catch (err) {
            console.error('Error fetching random pool status:', err);
            return null;
        }
    }
    
    /**
     * Check if player has enough allowance to play
     * @returns {Promise<boolean>}
     */
    async hasEnoughAllowance() {
        const allowance = await walletManager.getTokenAllowance();
        const entryPrice = BigInt(CONFIG.GAME.ENTRY_PRICE);
        return BigInt(allowance) >= entryPrice;
    }
    
    /**
     * Check if player has enough balance to play
     * @returns {Promise<boolean>}
     */
    async hasEnoughBalance() {
        const balance = await walletManager.getTokenBalance();
        const entryPrice = BigInt(CONFIG.GAME.ENTRY_PRICE);
        return BigInt(balance) >= entryPrice;
    }
    
    /**
     * Play the game
     * @returns {Promise<object|null>} Play result or null on failure
     */
    async play() {
        if (!walletManager.isConnected) {
            showNotification('Please connect your wallet first', 'error');
            return null;
        }
        
        if (this.isPlaying) {
            showNotification('Game in progress...', 'warning');
            return null;
        }
        
        // Check balance
        if (!await this.hasEnoughBalance()) {
            showNotification('Insufficient PLS369 balance', 'error');
            return null;
        }
        
        // Check allowance
        if (!await this.hasEnoughAllowance()) {
            showNotification('Approving tokens...', 'info');
            const txHash = await walletManager.approveTokens();
            if (!txHash) return null;
            
            // Wait for approval confirmation
            showNotification('Waiting for approval confirmation...', 'info');
            await this.waitForTransaction(txHash);
        }
        
        this.isPlaying = true;
        
        try {
            // Call play() on contract
            const data = '0x93e84cd9'; // play() selector
            
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: walletManager.address,
                    to: CONFIG.CONTRACT_ADDRESS,
                    data: data
                }]
            });
            
            showNotification('Game submitted! Waiting for result...', 'info');
            
            // Wait for transaction and get result
            const receipt = await this.waitForTransaction(txHash);
            
            if (receipt && receipt.status === '0x1') {
                // Parse Play event from logs
                const result = this.parsePlayEvent(receipt.logs);
                
                this.lastPlayResult = result;
                
                if (this.onPlayResult) {
                    this.onPlayResult(result);
                }
                
                // Handle jackpot wins
                if (result.mainJackpotHit) {
                    showNotification('🎉 MAIN JACKPOT WIN! 🎉', 'success');
                    if (this.onJackpotWin) {
                        this.onJackpotWin('main', result.payout);
                    }
                } else if (result.miniJackpotHit) {
                    showNotification('🎊 MINI JACKPOT WIN! 🎊', 'success');
                    if (this.onJackpotWin) {
                        this.onJackpotWin('mini', result.payout);
                    }
                } else if (BigInt(result.payout) > 0) {
                    showNotification(`You won ${formatTokenAmount(result.payout)} PLS369!`, 'success');
                } else {
                    showNotification(`Landed on slot ${result.slot} - ${getSlotDescription(result.slot)}`, 'info');
                }
                
                // Refresh game state
                await this.refreshGameState();
                
                return result;
                
            } else {
                showNotification('Game transaction failed', 'error');
                return null;
            }
            
        } catch (err) {
            console.error('Play error:', err);
            if (err.code !== 4001) {
                showNotification('Failed to play game', 'error');
            }
            return null;
            
        } finally {
            this.isPlaying = false;
        }
    }
    
    /**
     * Wait for a transaction to be mined
     * @param {string} txHash - Transaction hash
     * @param {number} timeout - Timeout in ms (default 60s)
     * @returns {Promise<object|null>} Transaction receipt or null
     */
    async waitForTransaction(txHash, timeout = 60000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const receipt = await window.ethereum.request({
                    method: 'eth_getTransactionReceipt',
                    params: [txHash]
                });
                
                if (receipt) {
                    return receipt;
                }
                
            } catch (err) {
                console.error('Error checking transaction:', err);
            }
            
            await delay(2000);
        }
        
        console.error('Transaction timeout');
        return null;
    }
    
    /**
     * Parse Play event from transaction logs
     * @param {Array} logs - Transaction logs
     * @returns {object} Parsed play result
     */
    parsePlayEvent(logs) {
        // Play event signature: Play(address indexed player, uint256 indexed playId, uint256 slot, uint256 payout, bool mainJackpotHit, bool miniJackpotHit)
        // Keccak256 hash of the event signature
        const playEventSignature = '0xa1ed10cff95c4195cbd0a8cfb5c159119288042aca768731b027c8b3ca20f74b';
        
        for (const log of logs) {
            if (log.topics && log.topics[0] === playEventSignature) {
                // Decode non-indexed parameters from data
                // slot (uint256), payout (uint256), mainJackpotHit (bool), miniJackpotHit (bool)
                const data = log.data;
                
                const slot = parseInt(data.slice(2, 66), 16);
                const payout = BigInt('0x' + data.slice(66, 130)).toString();
                const mainJackpotHit = parseInt(data.slice(130, 194), 16) !== 0;
                const miniJackpotHit = parseInt(data.slice(194, 258), 16) !== 0;
                
                // Player address from topics[1]
                const player = '0x' + log.topics[1].slice(26);
                
                // Play ID from topics[2]
                const playId = BigInt(log.topics[2]).toString();
                
                return {
                    player,
                    playId,
                    slot,
                    payout,
                    mainJackpotHit,
                    miniJackpotHit,
                    txHash: log.transactionHash
                };
            }
        }
        
        // Fallback if event parsing fails
        return {
            player: walletManager.address,
            playId: '0',
            slot: 0,
            payout: '0',
            mainJackpotHit: false,
            miniJackpotHit: false,
            txHash: null
        };
    }
    
    /**
     * Decode an array of uint256 values from hex data
     * @param {string} data - Hex data
     * @param {number} count - Number of values to decode
     * @returns {bigint[]} Decoded values
     */
    decodeUint256Array(data, count) {
        const values = [];
        const hex = data.startsWith('0x') ? data.slice(2) : data;
        
        for (let i = 0; i < count; i++) {
            const start = i * 64;
            const chunk = hex.slice(start, start + 64);
            values.push(BigInt('0x' + (chunk || '0')));
        }
        
        return values;
    }
    
    /**
     * Get formatted jackpot amounts
     * @returns {object} Formatted jackpot amounts
     */
    getFormattedJackpots() {
        if (!this.gameState) return { main: '0', mini: '0' };
        
        return {
            main: formatTokenAmount(this.gameState.mainJackpot),
            mini: formatTokenAmount(this.gameState.miniJackpot)
        };
    }
    
    /**
     * Get entry price in human-readable format
     * @returns {string} Formatted entry price
     */
    getFormattedEntryPrice() {
        return formatTokenAmount(CONFIG.GAME.ENTRY_PRICE);
    }
    
    /**
     * Clean up
     */
    destroy() {
        this.stopAutoRefresh();
    }
}

// Export singleton instance
export const gameManager = new GameManager();
export default gameManager;
