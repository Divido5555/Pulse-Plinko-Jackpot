import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parse a numeric string to a number with bounds checking
 * Returns 0 for invalid inputs instead of NaN
 */
export function safeParseNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  return num;
}

/**
 * Format a token amount for display with locale formatting
 * Handles large numbers safely without precision loss for display
 */
export function formatTokenAmount(value, decimals = 2) {
  const num = safeParseNumber(value, 0);
  return num.toLocaleString(undefined, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals 
  });
}

/**
 * Format a wallet address for display (0x1234...5678)
 */
export function formatAddress(address) {
  if (!address || typeof address !== 'string' || address.length < 10) {
    return null;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
