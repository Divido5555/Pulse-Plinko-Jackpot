// Smart Contract Configuration for PulseChain Mainnet

// Contract Addresses (PulseChain Mainnet - Chain ID: 369)
export const CONTRACTS = {
  PLS369_TOKEN: '0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC',
  PLINKO_GAME: '0xFBF81bFA463252e25C8883ac0E3EBae99617A52c',
};

// PLS369 Token ABI (ERC20 essentials)
export const PLS369_TOKEN_ABI = [
  // View functions
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  // State-changing functions
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "spender", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "Approval",
    "type": "event"
  }
];

// PlinkoGame369 ABI
export const PLINKO_GAME_ABI = [
  // View functions
  {
    "inputs": [],
    "name": "getGameState",
    "outputs": [
      {"internalType": "uint256", "name": "_mainJackpot", "type": "uint256"},
      {"internalType": "uint256", "name": "_miniJackpot", "type": "uint256"},
      {"internalType": "uint256", "name": "_playCount", "type": "uint256"},
      {"internalType": "uint256", "name": "_daoAccrued", "type": "uint256"},
      {"internalType": "uint256", "name": "_devAccrued", "type": "uint256"},
      {"internalType": "uint256", "name": "_entryPrice", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ENTRY_PRICE",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mainJackpot",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "miniJackpot",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "playCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // State-changing functions
  {
    "inputs": [],
    "name": "play",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "playId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "slot", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256"},
      {"indexed": false, "internalType": "bool", "name": "mainJackpotHit", "type": "bool"},
      {"indexed": false, "internalType": "bool", "name": "miniJackpotHit", "type": "bool"}
    ],
    "name": "Play",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "MainJackpotWon",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "MiniJackpotWon",
    "type": "event"
  }
];

// PulseChain Network Configuration
export const PULSECHAIN_CONFIG = {
  chainId: '0x171', // 369 in hex
  chainName: 'PulseChain',
  nativeCurrency: {
    name: 'Pulse',
    symbol: 'PLS',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.pulsechain.com'],
  blockExplorerUrls: ['https://scan.pulsechain.com'],
};

// Entry price constant (10 PLS369 tokens)
export const ENTRY_PRICE_TOKENS = 10;
