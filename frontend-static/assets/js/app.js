// app.js - Main application entry point for Pulse369 Plinko
import { CONFIG } from '../../config.js';
import { walletManager } from './wallet.js';
import { gameManager } from './game.js';
import { 
    formatTokenAmount, 
    shortenAddress, 
    getSlotClass, 
    getSlotDescription,
    showNotification,
    delay
} from './utils.js';

/**
 * Main Application Controller
 * Handles UI updates, user interactions, and coordination between wallet and game managers
 */
class App {
    constructor() {
        // DOM elements
        this.elements = {
            // Header
            connectBtn: null,
            walletAddress: null,
            balanceDisplay: null,
            
            // Game
            playBtn: null,
            entryPrice: null,
            slotsContainer: null,
            resultDisplay: null,
            
            // Jackpots
            mainJackpot: null,
            miniJackpot: null,
            
            // Stats
            playCount: null,
            randomPool: null
        };
        
        // State
        this.isAnimating = false;
    }
    
    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Pulse369 Plinko...');
        
        // Cache DOM elements
        this.cacheElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up manager callbacks
        this.setupCallbacks();
        
        // Initialize wallet manager
        await walletManager.init();
        
        // Initialize game manager
        await gameManager.init();
        
        // Render initial UI
        this.renderSlots();
        this.updateUI();
        
        console.log('Pulse369 Plinko initialized!');
    }
    
    /**
     * Cache DOM element references
     */
    cacheElements() {
        this.elements = {
            // Header
            connectBtn: document.getElementById('connect-btn'),
            walletAddress: document.getElementById('wallet-address'),
            balanceDisplay: document.getElementById('balance-display'),
            balanceAmount: document.getElementById('balance-amount'),
            
            // Game
            playBtn: document.getElementById('play-btn'),
            entryPrice: document.getElementById('entry-price'),
            slotsContainer: document.getElementById('slots-container'),
            resultDisplay: document.getElementById('result-display'),
            resultTitle: document.getElementById('result-title'),
            resultAmount: document.getElementById('result-amount'),
            
            // Jackpots
            mainJackpot: document.getElementById('main-jackpot'),
            miniJackpot: document.getElementById('mini-jackpot'),
            
            // Stats
            playCount: document.getElementById('play-count'),
            randomPool: document.getElementById('random-pool')
        };
        
        // Set entry price display
        if (this.elements.entryPrice) {
            this.elements.entryPrice.textContent = gameManager.getFormattedEntryPrice() + ' PLS369';
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Connect button
        if (this.elements.connectBtn) {
            this.elements.connectBtn.addEventListener('click', () => this.handleConnectClick());
        }
        
        // Play button
        if (this.elements.playBtn) {
            this.elements.playBtn.addEventListener('click', () => this.handlePlayClick());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.repeat && walletManager.isConnected) {
                this.handlePlayClick();
            }
        });
    }
    
    /**
     * Set up manager callbacks
     */
    setupCallbacks() {
        // Wallet callbacks
        walletManager.onConnect = (address, chainId) => {
            this.updateWalletUI();
            this.updateBalanceUI();
        };
        
        walletManager.onDisconnect = () => {
            this.updateWalletUI();
            this.updateBalanceUI();
        };
        
        walletManager.onAccountChange = (address) => {
            this.updateWalletUI();
            this.updateBalanceUI();
        };
        
        walletManager.onChainChange = (chainId) => {
            this.updateWalletUI();
            gameManager.refreshGameState();
        };
        
        // Game callbacks
        gameManager.onGameStateUpdate = (state) => {
            this.updateGameStateUI(state);
        };
        
        gameManager.onPlayResult = (result) => {
            this.handlePlayResult(result);
        };
        
        gameManager.onJackpotWin = (type, amount) => {
            this.handleJackpotWin(type, amount);
        };
    }
    
    /**
     * Handle connect button click
     */
    async handleConnectClick() {
        if (walletManager.isConnected) {
            walletManager.disconnect();
        } else {
            await walletManager.connect();
        }
    }
    
    /**
     * Handle play button click
     */
    async handlePlayClick() {
        if (!walletManager.isConnected) {
            showNotification('Please connect your wallet first', 'warning');
            return;
        }
        
        if (gameManager.isPlaying || this.isAnimating) {
            return;
        }
        
        // Disable button during play
        if (this.elements.playBtn) {
            this.elements.playBtn.disabled = true;
        }
        
        // Hide previous result
        this.hideResult();
        
        // Play the game
        const result = await gameManager.play();
        
        // Re-enable button
        if (this.elements.playBtn) {
            this.elements.playBtn.disabled = false;
        }
        
        // Update balance after play
        this.updateBalanceUI();
    }
    
    /**
     * Handle play result
     * @param {object} result - Play result
     */
    async handlePlayResult(result) {
        if (!result) return;
        
        this.isAnimating = true;
        
        // Animate slot selection
        await this.animateSlotSelection(result.slot);
        
        // Show result
        this.showResult(result);
        
        this.isAnimating = false;
    }
    
    /**
     * Animate slot selection
     * @param {number} targetSlot - Target slot index
     */
    async animateSlotSelection(targetSlot) {
        const slots = this.elements.slotsContainer?.querySelectorAll('.slot');
        if (!slots || slots.length === 0) return;
        
        // Spinning animation
        const spins = 20 + Math.floor(Math.random() * 10);
        let currentSlot = 0;
        
        for (let i = 0; i < spins; i++) {
            // Remove previous highlight
            slots[currentSlot]?.classList.remove('active');
            
            // Move to next slot (slow down towards end)
            if (i < spins - 5) {
                currentSlot = (currentSlot + 1) % CONFIG.GAME.SLOTS;
            } else {
                // Final approach to target
                currentSlot = targetSlot;
            }
            
            // Add highlight
            slots[currentSlot]?.classList.add('active');
            
            // Variable delay (slower at end)
            const delayTime = i < spins - 10 ? 50 : 100 + (i - (spins - 10)) * 50;
            await delay(delayTime);
        }
        
        // Ensure target slot is highlighted
        slots.forEach(s => s.classList.remove('active'));
        slots[targetSlot]?.classList.add('active');
        
        await delay(500);
    }
    
    /**
     * Handle jackpot win
     * @param {string} type - 'main' or 'mini'
     * @param {string} amount - Win amount
     */
    handleJackpotWin(type, amount) {
        // Add celebration effects
        this.celebrateJackpot(type);
    }
    
    /**
     * Celebrate jackpot win with effects
     * @param {string} type - 'main' or 'mini'
     */
    celebrateJackpot(type) {
        // Create confetti or other celebration effects
        const colors = type === 'main' 
            ? ['gold', 'orange', 'yellow'] 
            : ['silver', 'gray', 'white'];
        
        // Simple confetti simulation
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createConfetti(colors[Math.floor(Math.random() * colors.length)]);
            }, i * 50);
        }
    }
    
    /**
     * Create a confetti particle
     * @param {string} color - Confetti color
     */
    createConfetti(color) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${color};
            left: ${Math.random() * 100}vw;
            top: -10px;
            pointer-events: none;
            z-index: 9999;
            animation: confettiFall 3s linear forwards;
        `;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
    
    /**
     * Render slot grid
     */
    renderSlots() {
        if (!this.elements.slotsContainer) return;
        
        this.elements.slotsContainer.innerHTML = '';
        
        for (let i = 0; i < CONFIG.GAME.SLOTS; i++) {
            const slot = document.createElement('div');
            slot.className = `slot ${getSlotClass(i)}`;
            slot.dataset.slot = i;
            slot.innerHTML = `
                <span class="slot-label">${getSlotDescription(i)}</span>
                <span class="slot-index">${i}</span>
            `;
            
            this.elements.slotsContainer.appendChild(slot);
        }
    }
    
    /**
     * Show play result
     * @param {object} result - Play result
     */
    showResult(result) {
        if (!this.elements.resultDisplay) return;
        
        const payout = BigInt(result.payout);
        let resultClass = 'lose';
        let title = 'No Win';
        let amount = '';
        
        if (result.mainJackpotHit) {
            resultClass = 'jackpot';
            title = '🎉 MAIN JACKPOT! 🎉';
            amount = formatTokenAmount(result.payout) + ' PLS369';
        } else if (result.miniJackpotHit) {
            resultClass = 'jackpot';
            title = '🎊 MINI JACKPOT! 🎊';
            amount = formatTokenAmount(result.payout) + ' PLS369';
        } else if (payout > 0) {
            resultClass = 'win';
            title = 'You Won!';
            amount = formatTokenAmount(result.payout) + ' PLS369';
        }
        
        this.elements.resultDisplay.className = `result-display show ${resultClass}`;
        
        if (this.elements.resultTitle) {
            this.elements.resultTitle.textContent = title;
        }
        
        if (this.elements.resultAmount) {
            this.elements.resultAmount.textContent = amount;
        }
    }
    
    /**
     * Hide result display
     */
    hideResult() {
        if (this.elements.resultDisplay) {
            this.elements.resultDisplay.className = 'result-display';
        }
        
        // Clear active slot highlights
        const slots = this.elements.slotsContainer?.querySelectorAll('.slot');
        slots?.forEach(s => s.classList.remove('active'));
    }
    
    /**
     * Update all UI components
     */
    updateUI() {
        this.updateWalletUI();
        this.updateBalanceUI();
        this.updateGameStateUI(gameManager.gameState);
    }
    
    /**
     * Update wallet-related UI
     */
    updateWalletUI() {
        if (this.elements.connectBtn) {
            if (walletManager.isConnected) {
                this.elements.connectBtn.classList.add('connected');
                this.elements.connectBtn.innerHTML = `
                    <span class="wallet-address">${shortenAddress(walletManager.address)}</span>
                    <span>Disconnect</span>
                `;
            } else {
                this.elements.connectBtn.classList.remove('connected');
                this.elements.connectBtn.innerHTML = `
                    <span>🦊</span>
                    <span>Connect Wallet</span>
                `;
            }
        }
        
        // Show/hide balance display
        if (this.elements.balanceDisplay) {
            this.elements.balanceDisplay.style.display = walletManager.isConnected ? 'flex' : 'none';
        }
        
        // Enable/disable play button
        if (this.elements.playBtn) {
            this.elements.playBtn.disabled = !walletManager.isConnected;
        }
    }
    
    /**
     * Update balance display
     */
    async updateBalanceUI() {
        if (!walletManager.isConnected) return;
        
        const balance = await walletManager.getTokenBalance();
        
        if (this.elements.balanceAmount) {
            this.elements.balanceAmount.textContent = formatTokenAmount(balance) + ' PLS369';
        }
    }
    
    /**
     * Update game state UI
     * @param {object} state - Game state
     */
    updateGameStateUI(state) {
        if (!state) return;
        
        // Update jackpots
        if (this.elements.mainJackpot) {
            this.elements.mainJackpot.textContent = formatTokenAmount(state.mainJackpot) + ' PLS369';
        }
        
        if (this.elements.miniJackpot) {
            this.elements.miniJackpot.textContent = formatTokenAmount(state.miniJackpot) + ' PLS369';
        }
        
        // Update play count
        if (this.elements.playCount) {
            this.elements.playCount.textContent = parseInt(state.playCount).toLocaleString();
        }
    }
    
    /**
     * Update random pool status
     */
    async updateRandomPoolUI() {
        const status = await gameManager.getRandomPoolStatus();
        
        if (status && this.elements.randomPool) {
            this.elements.randomPool.textContent = `${status.remaining} / ${status.size}`;
        }
    }
}

// Add confetti animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes confettiFall {
        to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
let app;

function initApp() {
    app = new App();
    app.init().catch(console.error);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for debugging
window.pulse369App = {
    app: () => app,
    wallet: walletManager,
    game: gameManager,
    config: CONFIG
};

export { App };
export default App;
