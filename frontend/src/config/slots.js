// Slot configuration for Plinko game - 20 total slots
// Matches the deployed PlinkoGame369 contract multipliers
import { TOKEN_IMAGES } from './tokenAssets';

export const SLOTS = [
  { index: 0,  kind: "lose" },
  { index: 1,  kind: "lose" },
  { index: 2,  kind: "mini-jackpot" },  // Mini jackpot slot
  { index: 3,  kind: "win", multiplier: 3 },  // 3x
  { index: 4,  kind: "lose" },
  { index: 5,  kind: "lose" },
  { index: 6,  kind: "lose" },
  { index: 7,  kind: "win", multiplier: 2 },  // 2x
  { index: 8,  kind: "lose" },
  { index: 9,  kind: "lose" },
  { index: 10, kind: "main-jackpot" },  // Main jackpot slot
  { index: 11, kind: "win", multiplier: 5 },  // 5x
  { index: 12, kind: "lose" },
  { index: 13, kind: "lose" },
  { index: 14, kind: "lose" },
  { index: 15, kind: "win", multiplier: 2 },  // 2x
  { index: 16, kind: "mini-jackpot" },  // Mini jackpot slot
  { index: 17, kind: "lose" },
  { index: 18, kind: "win", multiplier: 2 },  // 2x
  { index: 19, kind: "lose" },
];

// Total slot count
export const TOTAL_SLOTS = 20;

// Mini jackpot slots (indices)
export const MINI_JACKPOT_INDICES = [2, 16];

// Main jackpot slot (index)
export const MAIN_JACKPOT_INDEX = 10;

// Win slots with their multipliers
export const WIN_SLOTS = {
  3: 3,   // 3x
  7: 2,   // 2x
  11: 5,  // 5x
  15: 2,  // 2x
  18: 2,  // 2x
};

// Export token images for use in components
export const TOKEN_LOGOS = TOKEN_IMAGES;

// Floating balls - use actual token images
export const FLOATING_BALLS = [
  TOKEN_IMAGES.PLS,
  TOKEN_IMAGES.PLSX,
  TOKEN_IMAGES.HEX,
  TOKEN_IMAGES.INC,
  TOKEN_IMAGES.PROVEX
];