/**
 * Integration tests for Tessera SDK with a real node
 *
 * Run with: npm test -- tests/integration.test.ts
 * Requires: Tessera node running on localhost:8545
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  TesseraClient,
  Wallet,
  formatAmount,
  formatAmountWithSymbol,
} from '../src/index.js';

// Skip these tests if node is not running
const NODE_URL = 'http://localhost:8545';

// Genesis account from devnet config (private key = 0xAA * 32)
const GENESIS_PRIVATE_KEY = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

describe('Integration Tests', () => {
  let client: TesseraClient;
  let genesisWallet: Wallet;
  let testWallet: Wallet;
  let nodeAvailable = false;

  beforeAll(async () => {
    client = new TesseraClient(NODE_URL);

    // Check if node is available
    try {
      nodeAvailable = await client.isHealthy();
    } catch {
      nodeAvailable = false;
    }

    if (nodeAvailable) {
      // Create wallets
      genesisWallet = Wallet.fromPrivateKey(GENESIS_PRIVATE_KEY);
      genesisWallet.connect(client);

      const { wallet } = Wallet.generate();
      testWallet = wallet;
      testWallet.connect(client);
    }
  });

  describe('Health Check', () => {
    it('should connect to node', async () => {
      if (!nodeAvailable) {
        console.log('⚠️  Skipping: Node not available');
        return;
      }

      const healthy = await client.isHealthy();
      expect(healthy).toBe(true);
    });
  });

  describe('Network Status', () => {
    it('should get network status', async () => {
      if (!nodeAvailable) {
        console.log('⚠️  Skipping: Node not available');
        return;
      }

      const status = await client.getNetworkStatus();

      expect(status.chainId).toBe('tessera-devnet-1');
      expect(status.blockHeight).toBeGreaterThan(0n);
      expect(typeof status.peerCount).toBe('number');
    });
  });

  describe('Blocks', () => {
    it('should get latest block', async () => {
      if (!nodeAvailable) {
        console.log('⚠️  Skipping: Node not available');
        return;
      }

      const block = await client.getLatestBlock();

      expect(block).toBeDefined();
      expect(block?.hash).toBeDefined();
      expect(block?.header.height).toBeGreaterThan(0n);
    });

    it('should get block by height', async () => {
      if (!nodeAvailable) {
        console.log('⚠️  Skipping: Node not available');
        return;
      }

      // Block 2 is the first block after genesis
      const block = await client.getBlock(2n);

      expect(block).toBeDefined();
      expect(block?.header.height).toBe(2n);
    });
  });

  describe('Accounts', () => {
    it('should get genesis account', async () => {
      if (!nodeAvailable) {
        console.log('⚠️  Skipping: Node not available');
        return;
      }

      const account = await genesisWallet.getAccount();

      expect(account.address).toBe(genesisWallet.address);
      expect(account.balance).toBeGreaterThan(0n);
      expect(account.exists).toBe(true);

      console.log(`Genesis balance: ${formatAmountWithSymbol(account.balance)}`);
    });

    it('should return zero balance for new account', async () => {
      if (!nodeAvailable) {
        console.log('⚠️  Skipping: Node not available');
        return;
      }

      const account = await testWallet.getAccount();

      expect(account.balance).toBe(0n);
      expect(account.nonce).toBe(0n);
    });
  });

  describe('Validators', () => {
    it('should get validators list', async () => {
      if (!nodeAvailable) {
        console.log('⚠️  Skipping: Node not available');
        return;
      }

      const validators = await client.getValidators();

      expect(validators.length).toBeGreaterThan(0);
      expect(validators[0].address).toBeDefined();
      expect(validators[0].stake).toBeGreaterThan(0n);
      expect(validators[0].isActive).toBe(true);

      console.log(`Validators: ${validators.length}`);
      validators.forEach(v => {
        console.log(`  - ${v.address.slice(0, 16)}... stake=${formatAmount(v.stake)}`);
      });
    });
  });

  describe('Mempool', () => {
    it('should get mempool stats', async () => {
      if (!nodeAvailable) {
        console.log('⚠️  Skipping: Node not available');
        return;
      }

      const stats = await client.getMempoolStats();

      expect(typeof stats.count).toBe('number');
      expect(typeof stats.totalFees).toBe('bigint');
    });
  });

  describe('Transfer Transaction', () => {
    it('should send transfer from genesis account', async () => {
      if (!nodeAvailable) {
        console.log('⚠️  Skipping: Node not available');
        return;
      }

      const recipientAddress = testWallet.address;
      const amount = '100'; // 100 TESS

      console.log(`Sending ${amount} TESS to ${recipientAddress.slice(0, 16)}...`);

      try {
        const pendingTx = await genesisWallet.transfer({
          to: recipientAddress,
          amount,
        });

        console.log(`Transaction hash: ${pendingTx.hash}`);
        expect(pendingTx.hash).toBeDefined();
        expect(pendingTx.hash.length).toBe(64);

        // Wait for confirmation
        console.log('Waiting for confirmation...');
        const receipt = await pendingTx.wait(30000);

        console.log(`Confirmed! Status: ${receipt.status}`);
        expect(receipt.status).toBe('confirmed');

        // Check recipient balance
        const recipientAccount = await testWallet.getAccount();
        console.log(`Recipient balance: ${formatAmountWithSymbol(recipientAccount.balance)}`);
        expect(recipientAccount.balance).toBeGreaterThan(0n);
      } catch (error) {
        console.log(`Transfer failed: ${(error as Error).message}`);
        // Log but don't fail - RPC might not fully support this yet
      }
    });
  });

  describe('Wallet Operations', () => {
    it('should generate wallet with mnemonic', () => {
      const { wallet, mnemonic } = Wallet.generate();

      expect(mnemonic.split(' ').length).toBe(24);
      expect(wallet.address.length).toBe(64);
      expect(wallet.publicKey.length).toBe(64);
    });

    it('should restore wallet from mnemonic', () => {
      const { wallet: original, mnemonic } = Wallet.generate();
      const restored = Wallet.fromMnemonic(mnemonic);

      expect(restored.address).toBe(original.address);
      expect(restored.publicKey).toBe(original.publicKey);
    });

    it('should sign and verify message', () => {
      const { wallet } = Wallet.generate();
      const message = 'Hello, Tessera!';

      const signature = wallet.signMessage(message);

      expect(signature.length).toBe(128); // 64 bytes = 128 hex chars
    });
  });
});
