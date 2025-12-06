import { describe, it, expect } from 'vitest';
import { Wallet, KeyPair, isValidMnemonic } from '../src/index.js';

describe('Wallet', () => {
  describe('Generation', () => {
    it('should generate a new wallet with mnemonic', () => {
      const { wallet, mnemonic } = Wallet.generate();

      expect(wallet.address).toHaveLength(64);
      expect(isValidMnemonic(mnemonic)).toBe(true);
    });

    it('should generate 12-word mnemonic when specified', () => {
      const { mnemonic } = Wallet.generate({ mnemonicLength: 12 });
      const words = mnemonic.split(' ');

      expect(words).toHaveLength(12);
    });

    it('should generate 24-word mnemonic by default', () => {
      const { mnemonic } = Wallet.generate();
      const words = mnemonic.split(' ');

      expect(words).toHaveLength(24);
    });
  });

  describe('Restoration', () => {
    it('should restore wallet from mnemonic', () => {
      const { wallet: original, mnemonic } = Wallet.generate();
      const restored = Wallet.fromMnemonic(mnemonic);

      expect(restored.address).toBe(original.address);
    });

    it('should restore different accounts from same mnemonic', () => {
      const { mnemonic } = Wallet.generate();

      const wallet0 = Wallet.fromMnemonic(mnemonic, { accountIndex: 0 });
      const wallet1 = Wallet.fromMnemonic(mnemonic, { accountIndex: 1 });

      expect(wallet0.address).not.toBe(wallet1.address);
    });

    it('should restore wallet from private key', () => {
      const { wallet: original } = Wallet.generate();
      const privateKey = original.exportPrivateKey();

      const restored = Wallet.fromPrivateKey(privateKey);

      expect(restored.address).toBe(original.address);
    });

    it('should restore wallet from KeyPair', () => {
      const keyPair = KeyPair.generate();
      const wallet = Wallet.fromKeyPair(keyPair);

      expect(wallet.address).toBe(keyPair.address);
    });

    it('should throw on invalid mnemonic', () => {
      expect(() => Wallet.fromMnemonic('invalid mnemonic')).toThrow();
    });
  });

  describe('Properties', () => {
    it('should have address and publicKey', () => {
      const { wallet } = Wallet.generate();

      expect(wallet.address).toHaveLength(64);
      expect(wallet.publicKey).toHaveLength(64);
      expect(wallet.address).toBe(wallet.publicKey);
    });

    it('should not be connected by default', () => {
      const { wallet } = Wallet.generate();

      expect(wallet.isConnected).toBe(false);
    });
  });

  describe('Signing', () => {
    it('should sign messages', () => {
      const { wallet } = Wallet.generate();
      const message = 'Hello, Tessera!';

      const signature = wallet.signMessage(message);

      expect(signature).toHaveLength(128); // 64 bytes = 128 hex chars
    });

    it('should sign transactions offline', async () => {
      const { wallet } = Wallet.generate();
      const recipient = '0'.repeat(64);

      const signedTx = await wallet.signTransfer({
        to: recipient,
        amount: '100',
        nonce: 1n,
      });

      expect(signedTx.tx_type).toBe('transfer');
      expect(signedTx.signature).toHaveLength(128);
      expect(signedTx.hash).toHaveLength(64);
    });
  });

  describe('Export', () => {
    it('should export private key', () => {
      const { wallet } = Wallet.generate();
      const privateKey = wallet.exportPrivateKey();

      expect(privateKey).toHaveLength(64);
    });

    it('should export to JSON', () => {
      const { wallet } = Wallet.generate();
      const json = wallet.toJSON();

      expect(json.address).toBe(wallet.address);
      expect(json.privateKey).toHaveLength(64);
    });

    it('should restore from exported JSON', () => {
      const { wallet: original } = Wallet.generate();
      const json = original.toJSON();

      const restored = Wallet.fromPrivateKey(json.privateKey);

      expect(restored.address).toBe(original.address);
    });
  });

  describe('Connection', () => {
    it('should connect to endpoint string', () => {
      const { wallet } = Wallet.generate();

      wallet.connect('http://localhost:8545');

      expect(wallet.isConnected).toBe(true);
    });
  });
});
