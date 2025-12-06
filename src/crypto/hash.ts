/**
 * Hashing functions for Tessera SDK
 * Uses SHA3-256 (Keccak) to match Rust implementation
 */

import { sha3_256 } from '@noble/hashes/sha3';
import { bytesToHex } from '../utils/format.js';

/**
 * Hash data using SHA3-256
 * @param data - Data to hash (string or Uint8Array)
 * @returns 32-byte hash as Uint8Array
 */
export function hash(data: string | Uint8Array): Uint8Array {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return sha3_256(bytes);
}

/**
 * Hash data and return as hex string
 * @param data - Data to hash
 * @returns Hash as hex string
 */
export function hashHex(data: string | Uint8Array): string {
  return bytesToHex(hash(data));
}

/**
 * Double hash (hash of hash) - used in some protocols
 * @param data - Data to hash
 * @returns 32-byte double hash
 */
export function doubleHash(data: string | Uint8Array): Uint8Array {
  return hash(hash(data));
}

/**
 * Compute Merkle root from list of hashes
 * @param hashes - List of 32-byte hashes
 * @returns 32-byte Merkle root
 */
export function merkleRoot(hashes: Uint8Array[]): Uint8Array {
  if (hashes.length === 0) {
    return hash(new Uint8Array(0));
  }

  if (hashes.length === 1) {
    return hashes[0];
  }

  // Build tree bottom-up
  let currentLevel = [...hashes];

  while (currentLevel.length > 1) {
    const nextLevel: Uint8Array[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left; // Duplicate last if odd

      // Concatenate and hash
      const combined = new Uint8Array(left.length + right.length);
      combined.set(left, 0);
      combined.set(right, left.length);

      nextLevel.push(hash(combined));
    }

    currentLevel = nextLevel;
  }

  return currentLevel[0];
}
