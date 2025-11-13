// Slot configuration for Plinko game - 24 total slots
import { TOKEN_IMAGES } from './tokenAssets';

export const SLOTS = [
  { index: 0,  kind: "lose" },
  { index: 1,  kind: "win", token: "PLS",    multiplier: 1.1 },
  { index: 2,  kind: "lose" },
  { index: 3,  kind: "lose" },
  { index: 4,  kind: "lose" },
  { index: 5,  kind: "lose" },

  { index: 6,  kind: "win", token: "PLSX",   multiplier: 1.5 },
  { index: 7,  kind: "lose" },
  { index: 8,  kind: "lose" },
  { index: 9,  kind: "lose" },
  { index: 10, kind: "lose" },

  { index: 11, kind: "win", token: "HEX",    multiplier: 2.0 },
  { index: 12, kind: "lose" },
  { index: 13, kind: "lose" },
  { index: 14, kind: "lose" },

  { index: 15, kind: "win", token: "INC",    multiplier: 3.0 },
  { index: 16, kind: "lose" },
  { index: 17, kind: "lose" },
  { index: 18, kind: "lose" },

  { index: 19, kind: "win", token: "PROVEX", multiplier: 5.0 },
  { index: 20, kind: "lose" },
  { index: 21, kind: "lose" },
  { index: 22, kind: "lose" },
  { index: 23, kind: "lose" },
];

// Mini jackpot can visually hop to any losing slot
export const MINI_CANDIDATE_INDICES = [0, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14, 16, 17, 18, 20, 21, 22, 23];

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