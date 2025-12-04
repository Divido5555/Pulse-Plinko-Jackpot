// Slot configuration for Plinko game - 20 total slots (matching smart contract)
import { TOKEN_IMAGES } from './tokenAssets';

// 20-slot configuration matching PlinkoGame369.sol multipliers array
// Prize slots: 3 (3x), 7 (2x), 11 (5x), 15 (2x), 18 (2x)
// Main jackpot trigger: slot 10
// Mini jackpot triggers: slots 2 and 16
export const SLOTS = [
  { index: 0,  kind: "lose" },
  { index: 1,  kind: "lose" },
  { index: 2,  kind: "lose" }, // Mini jackpot trigger slot
  { index: 3,  kind: "win", token: "PLS",    multiplier: 3.0 },
  { index: 4,  kind: "lose" },
  { index: 5,  kind: "lose" },
  { index: 6,  kind: "lose" },
  { index: 7,  kind: "win", token: "PLSX",   multiplier: 2.0 },
  { index: 8,  kind: "lose" },
  { index: 9,  kind: "lose" },
  { index: 10, kind: "lose" }, // Main jackpot trigger slot
  { index: 11, kind: "win", token: "HEX",    multiplier: 5.0 },
  { index: 12, kind: "lose" },
  { index: 13, kind: "lose" },
  { index: 14, kind: "lose" },
  { index: 15, kind: "win", token: "INC",    multiplier: 2.0 },
  { index: 16, kind: "lose" }, // Mini jackpot trigger slot
  { index: 17, kind: "lose" },
  { index: 18, kind: "win", token: "PROVEX", multiplier: 2.0 },
  { index: 19, kind: "lose" },
];

// Mini jackpot can appear on losing slots (excluding prize slots and main jackpot slot)
// Main jackpot appears on slot 10, Mini on slots 2 or 16
export const MINI_CANDIDATE_INDICES = [0, 1, 2, 4, 5, 6, 8, 9, 12, 13, 14, 16, 17, 19];

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
