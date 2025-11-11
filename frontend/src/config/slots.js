// Slot configuration for Plinko game
export const SLOTS = [
  { index: 0,  kind: "lose" },
  { index: 1,  kind: "win", token: "PLS",    multiplier: 1.1 },
  { index: 2,  kind: "lose" },
  { index: 3,  kind: "lose" },
  { index: 4,  kind: "lose" },

  { index: 5,  kind: "win", token: "PLSX",   multiplier: 1.5 },
  { index: 6,  kind: "lose" },
  { index: 7,  kind: "lose" },
  { index: 8,  kind: "lose" },

  { index: 9,  kind: "win", token: "HEX",    multiplier: 2.0 },
  { index: 10, kind: "lose" },
  { index: 11, kind: "lose" },
  { index: 12, kind: "lose" },

  { index: 13, kind: "win", token: "INC",    multiplier: 3.0 },
  { index: 14, kind: "lose" },
  { index: 15, kind: "lose" },
  { index: 16, kind: "lose" },

  { index: 17, kind: "win", token: "PROVEX", multiplier: 5.0 },
  { index: 18, kind: "lose" },
  { index: 19, kind: "lose" },
];

// Mini jackpot can visually hop to any of these indices
export const MINI_CANDIDATE_INDICES = [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15, 16, 18, 19];

export const TOKEN_LOGOS = {
  PLS: '💎',
  PLSX: '⚡',
  HEX: '🔷',
  INC: '🎁',
  PROVEX: '🚀'
};

export const FLOATING_BALLS = ['💎', '⚡', '🔷', '🎁', '🚀'];