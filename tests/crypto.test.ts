import { describe, it, expect } from 'vitest';
import {
  KeyPair,
  hash,
  hashHex,
  generateMnemonicPhrase,
  isValidMnemonic,
  mnemonicToKeyPair,
  mnemonicToKeyPairs,
} from '../src/index.js';

describe('KeyPair', () => {
  it('should generate a random key pair', () => {
    const keyPair = KeyPair.generate();

    expect(keyPair.publicKey).toHaveLength(32);
    expect(keyPair.publicKeyHex).toHaveLength(64);
    expect(keyPair.address).toHaveLength(64);
  });

  it('should create key pair from private key', () => {
    const original = KeyPair.generate();
    const restored = KeyPair.fromPrivateKeyHex(original.privateKeyHex);

    expect(restored.publicKeyHex).toBe(original.publicKeyHex);
    expect(restored.address).toBe(original.address);
  });

  it('should sign and verify messages', () => {
    const keyPair = KeyPair.generate();
    const message = new TextEncoder().encode('Hello, Tessera!');

    const signature = keyPair.sign(message);

    expect(signature).toHaveLength(64);
    expect(keyPair.verify(message, signature)).toBe(true);
  });

  it('should fail verification with wrong message', () => {
    const keyPair = KeyPair.generate();
    const message = new TextEncoder().encode('Hello, Tessera!');
    const wrongMessage = new TextEncoder().encode('Wrong message');

    const signature = keyPair.sign(message);

    expect(keyPair.verify(wrongMessage, signature)).toBe(false);
  });

  it('should fail verification with wrong key', () => {
    const keyPair1 = KeyPair.generate();
    const keyPair2 = KeyPair.generate();
    const message = new TextEncoder().encode('Hello, Tessera!');

    const signature = keyPair1.sign(message);

    expect(keyPair2.verify(message, signature)).toBe(false);
  });

  it('should export and import from JSON', () => {
    const original = KeyPair.generate();
    const json = original.toJSON();
    const restored = KeyPair.fromJSON(json);

    expect(restored.publicKeyHex).toBe(original.publicKeyHex);
  });
});

describe('Hash', () => {
  it('should hash strings consistently', () => {
    const hash1 = hashHex('Hello, Tessera!');
    const hash2 = hashHex('Hello, Tessera!');

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('should produce different hashes for different inputs', () => {
    const hash1 = hashHex('Input 1');
    const hash2 = hashHex('Input 2');

    expect(hash1).not.toBe(hash2);
  });

  it('should hash Uint8Array', () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const result = hash(bytes);

    expect(result).toHaveLength(32);
  });
});

describe('Mnemonic', () => {
  it('should generate valid 12-word mnemonic', () => {
    const mnemonic = generateMnemonicPhrase(12);
    const words = mnemonic.split(' ');

    expect(words).toHaveLength(12);
    expect(isValidMnemonic(mnemonic)).toBe(true);
  });

  it('should generate valid 24-word mnemonic', () => {
    const mnemonic = generateMnemonicPhrase(24);
    const words = mnemonic.split(' ');

    expect(words).toHaveLength(24);
    expect(isValidMnemonic(mnemonic)).toBe(true);
  });

  it('should reject invalid mnemonic', () => {
    expect(isValidMnemonic('invalid mnemonic phrase')).toBe(false);
    expect(isValidMnemonic('')).toBe(false);
  });

  it('should derive consistent key pair from mnemonic', () => {
    const mnemonic = generateMnemonicPhrase(24);

    const keyPair1 = mnemonicToKeyPair(mnemonic);
    const keyPair2 = mnemonicToKeyPair(mnemonic);

    expect(keyPair1.address).toBe(keyPair2.address);
  });

  it('should derive different keys with different account indices', () => {
    const mnemonic = generateMnemonicPhrase(24);

    const keyPair0 = mnemonicToKeyPair(mnemonic, '', 0);
    const keyPair1 = mnemonicToKeyPair(mnemonic, '', 1);

    expect(keyPair0.address).not.toBe(keyPair1.address);
  });

  it('should derive different keys with passphrase', () => {
    const mnemonic = generateMnemonicPhrase(24);

    const keyPair1 = mnemonicToKeyPair(mnemonic, '');
    const keyPair2 = mnemonicToKeyPair(mnemonic, 'my-passphrase');

    expect(keyPair1.address).not.toBe(keyPair2.address);
  });

  it('should derive multiple key pairs', () => {
    const mnemonic = generateMnemonicPhrase(24);
    const keyPairs = mnemonicToKeyPairs(mnemonic, 5);

    expect(keyPairs).toHaveLength(5);

    // All addresses should be unique
    const addresses = keyPairs.map((kp) => kp.address);
    const uniqueAddresses = new Set(addresses);
    expect(uniqueAddresses.size).toBe(5);
  });
});
