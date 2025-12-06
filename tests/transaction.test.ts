import { describe, it, expect } from 'vitest';
import {
  KeyPair,
  TransactionBuilder,
  TxType,
  VoteOption,
  transactionToJson,
  jsonToTransaction,
  calculateFee,
  calculateHash,
  BASE_FEE,
  STAKING_FEE,
} from '../src/index.js';

describe('TransactionBuilder', () => {
  const keyPair = KeyPair.generate();
  const builder = new TransactionBuilder(keyPair, 'tessera-testnet-1');
  const recipientAddress = '0'.repeat(64);

  describe('Transfer', () => {
    it('should build a transfer transaction', () => {
      const tx = builder.buildTransfer({
        to: recipientAddress,
        amount: 1_000_000n,
        nonce: 1n,
      });

      expect(tx.txType).toBe(TxType.Transfer);
      expect(tx.chainId).toBe('tessera-testnet-1');
      expect(tx.amount).toBe(1_000_000n);
      expect(tx.nonce).toBe(1n);
    });

    it('should sign a transfer transaction', () => {
      const tx = builder.signTransfer({
        to: recipientAddress,
        amount: 1_000_000n,
        nonce: 1n,
      });

      expect(tx.signature).toHaveLength(64);
      expect(tx.signature.some((b) => b !== 0)).toBe(true);
    });

    it('should include payload in transfer', () => {
      const tx = builder.buildTransfer({
        to: recipientAddress,
        amount: 1_000_000n,
        payload: 'Hello, Tessera!',
        nonce: 1n,
      });

      expect(tx.payload).not.toBeNull();
      expect(new TextDecoder().decode(tx.payload!)).toBe('Hello, Tessera!');
    });
  });

  describe('Stake', () => {
    it('should build a stake transaction', () => {
      const tx = builder.buildStake({
        amount: 100_000_000_000n,
        nonce: 1n,
      });

      expect(tx.txType).toBe(TxType.Stake);
      expect(tx.amount).toBe(100_000_000_000n);
      // to should equal from for staking
      expect(tx.to).toEqual(tx.from);
    });

    it('should sign a stake transaction', () => {
      const tx = builder.signStake({
        amount: 100_000_000_000n,
        nonce: 1n,
      });

      expect(tx.signature.some((b) => b !== 0)).toBe(true);
    });
  });

  describe('Unstake', () => {
    it('should build an unstake transaction', () => {
      const tx = builder.buildUnstake({
        amount: 50_000_000_000n,
        nonce: 2n,
      });

      expect(tx.txType).toBe(TxType.Unstake);
      expect(tx.amount).toBe(50_000_000_000n);
    });
  });

  describe('Governance', () => {
    it('should build a submit proposal transaction', () => {
      const tx = builder.buildSubmitProposal({
        title: 'Test Proposal',
        description: 'This is a test',
        changes: [{ param: 'max_validators', value: 150 }],
        deposit: 10_000_000_000_000n,
        nonce: 1n,
      });

      expect(tx.txType).toBe(TxType.SubmitProposal);
      expect(tx.amount).toBe(10_000_000_000_000n);
      expect(tx.payload).not.toBeNull();
    });

    it('should build a vote transaction', () => {
      const tx = builder.buildVote({
        proposalId: 1n,
        option: VoteOption.Yes,
        nonce: 2n,
      });

      expect(tx.txType).toBe(TxType.Vote);
      expect(tx.amount).toBe(0n);
      expect(tx.payload).not.toBeNull();

      const payload = JSON.parse(new TextDecoder().decode(tx.payload!));
      expect(payload.proposal_id).toBe(1);
      expect(payload.option).toBe('yes');
    });
  });
});

describe('Transaction Utilities', () => {
  const keyPair = KeyPair.generate();
  const builder = new TransactionBuilder(keyPair);
  const recipientAddress = '0'.repeat(64);

  describe('calculateFee', () => {
    it('should calculate base fee for simple transfer', () => {
      const tx = builder.buildTransfer({
        to: recipientAddress,
        amount: 1_000_000n,
        nonce: 1n,
      });

      expect(calculateFee(tx)).toBe(BASE_FEE);
    });

    it('should add payload fee', () => {
      const payload = new Uint8Array(1024); // 1 KB
      const tx = builder.buildTransfer({
        to: recipientAddress,
        amount: 1_000_000n,
        payload,
        nonce: 1n,
      });

      expect(calculateFee(tx)).toBe(BASE_FEE + 100n); // BASE_FEE + 1 KB * 100
    });

    it('should use staking fee for stake transactions', () => {
      const tx = builder.buildStake({
        amount: 100_000_000_000n,
        nonce: 1n,
      });

      expect(calculateFee(tx)).toBe(STAKING_FEE);
    });

    it('should use staking fee for unstake transactions', () => {
      const tx = builder.buildUnstake({
        amount: 50_000_000_000n,
        nonce: 1n,
      });

      expect(calculateFee(tx)).toBe(STAKING_FEE);
    });
  });

  describe('JSON conversion', () => {
    it('should convert transaction to JSON', () => {
      const tx = builder.signTransfer({
        to: recipientAddress,
        amount: 1_000_000n,
        nonce: 1n,
      });

      const json = transactionToJson(tx);

      expect(json.tx_type).toBe('transfer');
      expect(json.amount).toBe('1000000');
      expect(json.nonce).toBe('1');
      expect(json.hash).toHaveLength(64);
    });

    it('should convert JSON back to transaction', () => {
      const original = builder.signTransfer({
        to: recipientAddress,
        amount: 1_000_000n,
        nonce: 1n,
      });

      const json = transactionToJson(original);
      const restored = jsonToTransaction(json);

      expect(restored.txType).toBe(original.txType);
      expect(restored.amount).toBe(original.amount);
      expect(restored.nonce).toBe(original.nonce);
    });
  });

  describe('calculateHash', () => {
    it('should produce consistent hashes', () => {
      const tx = builder.signTransfer({
        to: recipientAddress,
        amount: 1_000_000n,
        nonce: 1n,
        timestamp: 1699876543n,
      });

      const hash1 = calculateHash(tx);
      const hash2 = calculateHash(tx);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('should produce different hashes for different transactions', () => {
      const tx1 = builder.signTransfer({
        to: recipientAddress,
        amount: 1_000_000n,
        nonce: 1n,
      });

      const tx2 = builder.signTransfer({
        to: recipientAddress,
        amount: 2_000_000n,
        nonce: 2n,
      });

      expect(calculateHash(tx1)).not.toBe(calculateHash(tx2));
    });
  });
});
