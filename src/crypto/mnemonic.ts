/**
 * BIP39 mnemonic support for Tessera SDK
 */

import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { TesseraError, ErrorCode } from '../types/index.js';
import { KeyPair } from './keys.js';
import { hash } from './hash.js';

/**
 * Supported mnemonic lengths
 */
export type MnemonicLength = 12 | 15 | 18 | 21 | 24;

/**
 * Generate a new random mnemonic phrase
 * @param length - Number of words (12, 15, 18, 21, or 24)
 * @returns Mnemonic phrase as space-separated words
 */
export function generateMnemonicPhrase(length: MnemonicLength = 24): string {
  const strengthMap: Record<MnemonicLength, number> = {
    12: 128,
    15: 160,
    18: 192,
    21: 224,
    24: 256,
  };

  return generateMnemonic(wordlist, strengthMap[length]);
}

/**
 * Validate a mnemonic phrase
 * @param mnemonic - Mnemonic phrase to validate
 * @returns true if valid
 */
export function isValidMnemonic(mnemonic: string): boolean {
  return validateMnemonic(mnemonic, wordlist);
}

/**
 * Derive a KeyPair from a mnemonic phrase
 * @param mnemonic - BIP39 mnemonic phrase
 * @param passphrase - Optional passphrase for additional security
 * @param accountIndex - Account index for HD derivation (default: 0)
 * @returns KeyPair derived from the mnemonic
 */
export function mnemonicToKeyPair(
  mnemonic: string,
  passphrase = '',
  accountIndex = 0
): KeyPair {
  if (!isValidMnemonic(mnemonic)) {
    throw new TesseraError(ErrorCode.InvalidMnemonic, 'Invalid mnemonic phrase');
  }

  // Generate seed from mnemonic
  const seed = mnemonicToSeedSync(mnemonic, passphrase);

  // Derive account-specific key using simple path
  // We use a simple derivation: hash(seed || accountIndex)
  // This is simpler than full BIP32/BIP44 but sufficient for Tessera
  const accountBytes = new Uint8Array(4);
  new DataView(accountBytes.buffer).setUint32(0, accountIndex, false);

  const combined = new Uint8Array(seed.length + accountBytes.length);
  combined.set(seed, 0);
  combined.set(accountBytes, seed.length);

  // Hash to get 32-byte private key
  const privateKey = hash(combined);

  return KeyPair.fromSeed(privateKey);
}

/**
 * Derive multiple KeyPairs from a mnemonic
 * @param mnemonic - BIP39 mnemonic phrase
 * @param count - Number of accounts to derive
 * @param passphrase - Optional passphrase
 * @returns Array of KeyPairs
 */
export function mnemonicToKeyPairs(
  mnemonic: string,
  count: number,
  passphrase = ''
): KeyPair[] {
  const keyPairs: KeyPair[] = [];

  for (let i = 0; i < count; i++) {
    keyPairs.push(mnemonicToKeyPair(mnemonic, passphrase, i));
  }

  return keyPairs;
}

/**
 * Get the seed bytes from a mnemonic (for advanced use)
 * @param mnemonic - BIP39 mnemonic phrase
 * @param passphrase - Optional passphrase
 * @returns 64-byte seed
 */
export function mnemonicToSeed(mnemonic: string, passphrase = ''): Uint8Array {
  if (!isValidMnemonic(mnemonic)) {
    throw new TesseraError(ErrorCode.InvalidMnemonic, 'Invalid mnemonic phrase');
  }

  return mnemonicToSeedSync(mnemonic, passphrase);
}
