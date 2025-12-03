// Contract configuration for PulseChain mainnet deployment

// Chain configuration
export const PULSECHAIN_CONFIG = {
  chainId: 369,
  chainIdHex: '0x171',
  name: 'PulseChain',
  rpcUrl: 'https://rpc.pulsechain.com',
  blockExplorer: 'https://scan.pulsechain.com',
  nativeCurrency: {
    name: 'Pulse',
    symbol: 'PLS',
    decimals: 18,
  },
};

// Contract addresses
export const CONTRACT_ADDRESSES = {
  gameContract: '0xFBF81bFA463252e25C8883ac0E3EBae99617A52c',
  tokenContract: '0x55aC731aAa3442CE4D8bd8486eE4521B1D6Af5EC',
};

// PLS369 Token ABI (minimal ERC20 interface)
export const PLS369_TOKEN_ABI = [
  // Read functions
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  // Write functions
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// PlinkoGame369 ABI (game contract interface)
export const PLINKO_GAME_ABI = [
  // Read functions
  'function ENTRY_PRICE() view returns (uint256)',
  'function mainJackpot() view returns (uint256)',
  'function miniJackpot() view returns (uint256)',
  'function playCount() view returns (uint256)',
  'function daoAccrued() view returns (uint256)',
  'function devAccrued() view returns (uint256)',
  'function pls369() view returns (address)',
  'function owner() view returns (address)',
  'function daoTreasury() view returns (address)',
  'function devWallet() view returns (address)',
  'function getGameState() view returns (uint256 _mainJackpot, uint256 _miniJackpot, uint256 _playCount, uint256 _daoAccrued, uint256 _devAccrued, uint256 _entryPrice)',
  'function getRandomPoolSize() view returns (uint256 size, uint256 index)',
  'function multipliers(uint256) view returns (uint256)',
  // Write functions
  'function play() returns ()',
  // Events
  'event Play(address indexed player, uint256 indexed playId, uint256 slot, uint256 payout, bool mainJackpotHit, bool miniJackpotHit)',
  'event MainJackpotWon(address indexed player, uint256 amount)',
  'event MiniJackpotWon(address indexed player, uint256 amount)',
  'event RandomnessToppedUp(uint256 added, uint256 newPoolSize)',
];

// Entry price in PLS369 tokens (10 tokens with 18 decimals)
export const ENTRY_PRICE = 10n * 10n ** 18n;
export const ENTRY_PRICE_DISPLAY = '10 PLS369';
