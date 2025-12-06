/**
 * Ed25519 key management for Tessera SDK
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2';
import { TesseraError, ErrorCode } from '../types/index.js';
import { bytesToHex, hexToBytes } from '../utils/format.js';

// Configure ed25519 to use sha512 (required for sync operations)
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

/**
 * Ed25519 key pair for signing transactions
 */
export class KeyPair {
  private readonly privateKey: Uint8Array;
  private readonly _publicKey: Uint8Array;

  private constructor(privateKey: Uint8Array, publicKey: Uint8Array) {
    this.privateKey = privateKey;
    this._publicKey = publicKey;
  }

  /**
   * Generate a new random key pair
   */
  static generate(): KeyPair {
    const privateKey = ed.utils.randomPrivateKey();
    const publicKey = ed.getPublicKey(privateKey);
    return new KeyPair(privateKey, publicKey);
  }

  /**
   * Create key pair from private key bytes
   */
  static fromPrivateKey(privateKey: Uint8Array): KeyPair {
    if (privateKey.length !== 32) {
      throw new TesseraError(
        ErrorCode.KeyGenerationError,
        `Invalid private key length: ${privateKey.length}. Expected 32 bytes.`
      );
    }

    const publicKey = ed.getPublicKey(privateKey);
    return new KeyPair(privateKey, publicKey);
  }

  /**
   * Create key pair from hex-encoded private key
   */
  static fromPrivateKeyHex(privateKeyHex: string): KeyPair {
    const privateKey = hexToBytes(privateKeyHex);
    return KeyPair.fromPrivateKey(privateKey);
  }

  /**
   * Create key pair from seed bytes (for deterministic key generation)
   */
  static fromSeed(seed: Uint8Array): KeyPair {
    if (seed.length !== 32) {
      throw new TesseraError(
        ErrorCode.KeyGenerationError,
        `Invalid seed length: ${seed.length}. Expected 32 bytes.`
      );
    }

    // Use seed as private key directly (this matches Rust ed25519-dalek behavior)
    return KeyPair.fromPrivateKey(seed);
  }

  /**
   * Get the public key as bytes
   */
  get publicKey(): Uint8Array {
    return this._publicKey;
  }

  /**
   * Get the public key as hex string
   */
  get publicKeyHex(): string {
    return bytesToHex(this._publicKey);
  }

  /**
   * Get the address (same as public key in Tessera)
   */
  get address(): string {
    return this.publicKeyHex;
  }

  /**
   * Get the private key as hex (use with caution!)
   */
  get privateKeyHex(): string {
    return bytesToHex(this.privateKey);
  }

  /**
   * Sign a message
   * @param message - Message to sign
   * @returns 64-byte signature
   */
  sign(message: Uint8Array): Uint8Array {
    return ed.sign(message, this.privateKey);
  }

  /**
   * Sign a message and return hex signature
   */
  signHex(message: Uint8Array): string {
    return bytesToHex(this.sign(message));
  }

  /**
   * Verify a signature (static method for verification without private key)
   * @param publicKey - Public key bytes
   * @param message - Original message
   * @param signature - Signature to verify
   * @returns true if valid
   */
  static verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean {
    try {
      return ed.verify(signature, message, publicKey);
    } catch {
      return false;
    }
  }

  /**
   * Verify a signature using this key pair's public key
   */
  verify(message: Uint8Array, signature: Uint8Array): boolean {
    return KeyPair.verify(this._publicKey, message, signature);
  }

  /**
   * Export key pair to JSON (encrypted private key would be better in production)
   */
  toJSON(): { publicKey: string; privateKey: string } {
    return {
      publicKey: this.publicKeyHex,
      privateKey: this.privateKeyHex,
    };
  }

  /**
   * Create key pair from JSON
   */
  static fromJSON(json: { privateKey: string }): KeyPair {
    return KeyPair.fromPrivateKeyHex(json.privateKey);
  }
}

/**
 * Verify a signature given public key, message, and signature as hex strings
 */
export function verifySignature(
  publicKeyHex: string,
  messageHex: string,
  signatureHex: string
): boolean {
  try {
    const publicKey = hexToBytes(publicKeyHex);
    const message = hexToBytes(messageHex);
    const signature = hexToBytes(signatureHex);
    return KeyPair.verify(publicKey, message, signature);
  } catch {
    return false;
  }
}
