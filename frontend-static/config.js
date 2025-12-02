// config.js - Configuration for Pulse369 Plinko
export const CONFIG = {
    // Contract Addresses (PulseChain Mainnet)
    CONTRACT_ADDRESS: '0xFBF81bFA463252e25C8883ac0E3EBae99617A52c',
    TOKEN_ADDRESS: '0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC',
    
    // Network Configuration
    NETWORKS: {
        369: {
            name: 'PulseChain',
            symbol: 'PLS',
            decimals: 18,
            rpc: 'https://rpc.pulsechain.com',
            explorer: 'https://scan.pulsechain.com'
        },
        943: {
            name: 'PulseChain Testnet',
            symbol: 'tPLS',
            decimals: 18,
            rpc: 'https://rpc.v4.testnet.pulsechain.com',
            explorer: 'https://scan.v4.testnet.pulsechain.com'
        }
    },
    
    // Game Configuration
    GAME: {
        ENTRY_PRICE: '10000000000000000000', // 10 PLS369 (in wei)
        SLOTS: 20,
        MULTIPLIERS: {
            0: 0, 1: 0, 2: 0, 3: 300, 4: 0,
            5: 0, 6: 0, 7: 200, 8: 0, 9: 0,
            10: 0, 11: 500, 12: 0, 13: 0, 14: 0,
            15: 200, 16: 0, 17: 0, 18: 200, 19: 0
        },
        JACKPOT_SLOTS: {
            MAIN: [10],
            MINI: [2, 16]
        },
        ODDS: {
            MAIN: 33333,
            MINI: 4762
        }
    },
    
    // UI Configuration
    UI: {
        REFRESH_INTERVAL: 30000, // 30 seconds
        NOTIFICATION_DURATION: 5000
    }
};

export default CONFIG;
