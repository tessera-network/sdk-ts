/**
 * Formatting utilities for Tessera SDK
 */

import { TOKEN_DECIMALS, TOKEN_SYMBOL, ADDRESS_LENGTH } from './constants.js';
import { TesseraError, ErrorCode } from '../types/index.js';

// ============================================================================
// Hex Encoding/Decoding
// ============================================================================

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

  if (cleanHex.length % 2 !== 0) {
    throw new TesseraError(ErrorCode.InvalidAddress, 'Hex string must have even length');
  }

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    const byte = parseInt(cleanHex.substring(i, i + 2), 16);
    if (isNaN(byte)) {
      throw new TesseraError(ErrorCode.InvalidAddress, `Invalid hex character at position ${i}`);
    }
    bytes[i / 2] = byte;
  }

  return bytes;
}

/**
 * Check if a string is valid hex
 */
export function isValidHex(hex: string): boolean {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  return /^[0-9a-fA-F]*$/.test(cleanHex) && cleanHex.length % 2 === 0;
}

// ============================================================================
// Address Formatting
// ============================================================================

/**
 * Validate an address string
 */
export function isValidAddress(address: string): boolean {
  if (!isValidHex(address)) {
    return false;
  }

  const cleanHex = address.startsWith('0x') ? address.slice(2) : address;
  return cleanHex.length === ADDRESS_LENGTH * 2;
}

/**
 * Parse address string to bytes
 */
export function parseAddress(address: string): Uint8Array {
  if (!isValidAddress(address)) {
    throw new TesseraError(
      ErrorCode.InvalidAddress,
      `Invalid address: ${address}. Expected ${ADDRESS_LENGTH * 2} hex characters.`
    );
  }

  return hexToBytes(address);
}

/**
 * Format address bytes to string
 */
export function formatAddress(address: Uint8Array): string {
  if (address.length !== ADDRESS_LENGTH) {
    throw new TesseraError(
      ErrorCode.InvalidAddress,
      `Invalid address length: ${address.length}. Expected ${ADDRESS_LENGTH}.`
    );
  }

  return bytesToHex(address);
}

/**
 * Shorten address for display (e.g., "abc123...def456")
 */
export function shortenAddress(address: string, chars = 6): string {
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  if (cleanAddress.length <= chars * 2) {
    return cleanAddress;
  }
  return `${cleanAddress.slice(0, chars)}...${cleanAddress.slice(-chars)}`;
}

// ============================================================================
// Amount Formatting
// ============================================================================

/**
 * Parse human-readable amount to base units (bigint)
 * e.g., "100.5" TESS -> 100500000n base units
 */
export function parseAmount(amount: string | number): bigint {
  const str = typeof amount === 'number' ? amount.toString() : amount;

  // Split by decimal point
  const parts = str.split('.');
  if (parts.length > 2) {
    throw new TesseraError(ErrorCode.InvalidTransaction, `Invalid amount format: ${amount}`);
  }

  const integerPart = parts[0] || '0';
  let decimalPart = parts[1] || '';

  // Pad or truncate decimal part to TOKEN_DECIMALS
  if (decimalPart.length > TOKEN_DECIMALS) {
    decimalPart = decimalPart.slice(0, TOKEN_DECIMALS);
  } else {
    decimalPart = decimalPart.padEnd(TOKEN_DECIMALS, '0');
  }

  // Combine and parse
  const combined = integerPart + decimalPart;
  const result = BigInt(combined);

  if (result < 0n) {
    throw new TesseraError(ErrorCode.InvalidTransaction, 'Amount cannot be negative');
  }

  return result;
}

/**
 * Format base units to human-readable amount
 * e.g., 100500000n base units -> "100.5" TESS
 */
export function formatAmount(baseUnits: bigint, decimals = TOKEN_DECIMALS): string {
  const str = baseUnits.toString().padStart(decimals + 1, '0');
  const integerPart = str.slice(0, -decimals) || '0';
  const decimalPart = str.slice(-decimals);

  // Remove trailing zeros from decimal part
  const trimmedDecimal = decimalPart.replace(/0+$/, '');

  if (trimmedDecimal.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${trimmedDecimal}`;
}

/**
 * Format amount with token symbol
 */
export function formatAmountWithSymbol(baseUnits: bigint): string {
  return `${formatAmount(baseUnits)} ${TOKEN_SYMBOL}`;
}

// ============================================================================
// Time Formatting
// ============================================================================

/**
 * Get current Unix timestamp in seconds
 */
export function getCurrentTimestamp(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

/**
 * Format Unix timestamp to ISO string
 */
export function formatTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toISOString();
}

/**
 * Format duration in blocks to human-readable string
 * Assumes ~3 second blocks
 */
export function formatBlockDuration(blocks: bigint, blockTimeSeconds = 3): string {
  const totalSeconds = Number(blocks) * blockTimeSeconds;

  if (totalSeconds < 60) {
    return `${totalSeconds} seconds`;
  }

  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  if (totalSeconds < 86400) {
    const hours = Math.floor(totalSeconds / 3600);
    return `~${hours} hour${hours > 1 ? 's' : ''}`;
  }

  const days = Math.floor(totalSeconds / 86400);
  return `~${days} day${days > 1 ? 's' : ''}`;
}
