// utils.js - Helper functions for Pulse369 Plinko
import { CONFIG } from '../../config.js';

/**
 * Format a token amount from wei to human-readable format
 * @param {string|bigint} amount - Amount in wei
 * @param {number} decimals - Token decimals (default 18)
 * @param {number} displayDecimals - Number of decimals to display (default 2)
 * @returns {string} Formatted amount
 */
export function formatTokenAmount(amount, decimals = 18, displayDecimals = 2) {
    if (!amount) return '0';
    
    const value = typeof amount === 'string' ? BigInt(amount) : amount;
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const remainder = value % divisor;
    
    // Format remainder with padding
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const displayRemainder = remainderStr.slice(0, displayDecimals);
    
    return `${whole.toLocaleString()}.${displayRemainder}`;
}

/**
 * Parse a human-readable token amount to wei
 * @param {string} amount - Human-readable amount
 * @param {number} decimals - Token decimals (default 18)
 * @returns {bigint} Amount in wei
 */
export function parseTokenAmount(amount, decimals = 18) {
    if (!amount) return BigInt(0);
    
    const [whole, fraction = ''] = amount.toString().split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    
    return BigInt(whole + paddedFraction);
}

/**
 * Shorten an Ethereum address for display
 * @param {string} address - Full Ethereum address
 * @param {number} chars - Number of characters to show on each end (default 4)
 * @returns {string} Shortened address
 */
export function shortenAddress(address, chars = 4) {
    if (!address) return '';
    if (address.length <= chars * 2 + 2) return address;
    
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Show a notification to the user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {number} duration - Duration in ms (default from config)
 */
export function showNotification(message, type = 'info', duration = CONFIG.UI.NOTIFICATION_DURATION) {
    const container = document.getElementById('notifications') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, duration);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
        notification.remove();
    });
    
    return notification;
}

/**
 * Create notification container if it doesn't exist
 * @returns {HTMLElement} Notification container
 */
function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notifications';
    container.className = 'notifications';
    document.body.appendChild(container);
    return container;
}

/**
 * Get the multiplier description for a slot
 * @param {number} slot - Slot index (0-19)
 * @returns {string} Description of the slot
 */
export function getSlotDescription(slot) {
    const multiplier = CONFIG.GAME.MULTIPLIERS[slot];
    
    if (CONFIG.GAME.JACKPOT_SLOTS.MAIN.includes(slot)) {
        return 'MAIN JACKPOT';
    }
    
    if (CONFIG.GAME.JACKPOT_SLOTS.MINI.includes(slot)) {
        return 'MINI JACKPOT';
    }
    
    if (multiplier > 0) {
        return `${multiplier / 100}x`;
    }
    
    return 'LOSE';
}

/**
 * Get CSS class for slot based on its type
 * @param {number} slot - Slot index (0-19)
 * @returns {string} CSS class name
 */
export function getSlotClass(slot) {
    if (CONFIG.GAME.JACKPOT_SLOTS.MAIN.includes(slot)) {
        return 'jackpot-main';
    }
    
    if (CONFIG.GAME.JACKPOT_SLOTS.MINI.includes(slot)) {
        return 'jackpot-mini';
    }
    
    const multiplier = CONFIG.GAME.MULTIPLIERS[slot];
    if (multiplier > 0) {
        return 'winner';
    }
    
    return 'loser';
}

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the delay
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if we're on the correct network
 * @param {number} chainId - Current chain ID
 * @returns {boolean} True if on a supported network
 */
export function isSupportedNetwork(chainId) {
    return Object.keys(CONFIG.NETWORKS).includes(chainId.toString());
}

/**
 * Get network info by chain ID
 * @param {number} chainId - Chain ID
 * @returns {object|null} Network info or null if not supported
 */
export function getNetworkInfo(chainId) {
    return CONFIG.NETWORKS[chainId] || null;
}

/**
 * Get explorer URL for a transaction
 * @param {string} txHash - Transaction hash
 * @param {number} chainId - Chain ID
 * @returns {string} Explorer URL
 */
export function getExplorerTxUrl(txHash, chainId = 369) {
    const network = getNetworkInfo(chainId);
    if (!network) return '';
    return `${network.explorer}/tx/${txHash}`;
}

/**
 * Get explorer URL for an address
 * @param {string} address - Ethereum address
 * @param {number} chainId - Chain ID
 * @returns {string} Explorer URL
 */
export function getExplorerAddressUrl(address, chainId = 369) {
    const network = getNetworkInfo(chainId);
    if (!network) return '';
    return `${network.explorer}/address/${address}`;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard!', 'success');
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy', 'error');
        return false;
    }
}

/**
 * Local storage helpers with error handling
 */
export const storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (err) {
            console.error('Storage get error:', err);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (err) {
            console.error('Storage set error:', err);
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (err) {
            console.error('Storage remove error:', err);
            return false;
        }
    }
};
