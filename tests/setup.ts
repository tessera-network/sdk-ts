import { webcrypto } from 'node:crypto';

// Polyfill for @noble/ed25519 which requires crypto.getRandomValues
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto as Crypto;
}
