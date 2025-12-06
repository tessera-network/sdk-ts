/**
 * Transaction building and signing for Tessera SDK
 */

import {
  TxType,
  Transaction,
  TransactionJson,
  ProposalPayload,
  VoteOption,
  TesseraError,
  ErrorCode,
} from '../types/index.js';
import { KeyPair } from '../crypto/keys.js';
import { hash } from '../crypto/hash.js';
import {
  bytesToHex,
  hexToBytes,
  parseAddress,
  getCurrentTimestamp,
} from '../utils/format.js';
import {
  BASE_FEE,
  FEE_PER_KB_PAYLOAD,
  STAKING_FEE,
  MAX_PAYLOAD_SIZE,
} from '../utils/constants.js';

/**
 * Options for building a transfer transaction
 */
export interface TransferOptions {
  to: string;
  amount: bigint;
  payload?: Uint8Array | string;
  nonce: bigint;
  chainId?: string;
  timestamp?: bigint;
}

/**
 * Options for building a stake transaction
 */
export interface StakeOptions {
  amount: bigint;
  nonce: bigint;
  chainId?: string;
  timestamp?: bigint;
}

/**
 * Options for building an unstake transaction
 */
export interface UnstakeOptions {
  amount: bigint;
  nonce: bigint;
  chainId?: string;
  timestamp?: bigint;
}

/**
 * Options for submitting a governance proposal
 */
export interface SubmitProposalOptions {
  title: string;
  description: string;
  changes: { param: string; value: number | string }[];
  deposit: bigint;
  nonce: bigint;
  chainId?: string;
  timestamp?: bigint;
}

/**
 * Options for voting on a proposal
 */
export interface VoteOptions {
  proposalId: bigint;
  option: VoteOption;
  nonce: bigint;
  chainId?: string;
  timestamp?: bigint;
}

/**
 * Transaction builder for creating and signing Tessera transactions
 */
export class TransactionBuilder {
  private readonly keyPair: KeyPair;
  private readonly defaultChainId: string;

  constructor(keyPair: KeyPair, defaultChainId = '') {
    this.keyPair = keyPair;
    this.defaultChainId = defaultChainId;
  }

  /**
   * Get the address (public key) of this builder
   */
  get address(): string {
    return this.keyPair.address;
  }

  /**
   * Build a transfer transaction
   */
  buildTransfer(options: TransferOptions): Transaction {
    const payload = this.normalizePayload(options.payload);
    this.validatePayload(payload);

    return {
      txType: TxType.Transfer,
      chainId: options.chainId ?? this.defaultChainId,
      from: this.keyPair.publicKey,
      to: parseAddress(options.to),
      amount: options.amount,
      payload,
      nonce: options.nonce,
      timestamp: options.timestamp ?? getCurrentTimestamp(),
      signature: new Uint8Array(64),
    };
  }

  /**
   * Build a stake transaction
   */
  buildStake(options: StakeOptions): Transaction {
    return {
      txType: TxType.Stake,
      chainId: options.chainId ?? this.defaultChainId,
      from: this.keyPair.publicKey,
      to: this.keyPair.publicKey, // to = from for staking
      amount: options.amount,
      payload: null,
      nonce: options.nonce,
      timestamp: options.timestamp ?? getCurrentTimestamp(),
      signature: new Uint8Array(64),
    };
  }

  /**
   * Build an unstake transaction
   */
  buildUnstake(options: UnstakeOptions): Transaction {
    return {
      txType: TxType.Unstake,
      chainId: options.chainId ?? this.defaultChainId,
      from: this.keyPair.publicKey,
      to: this.keyPair.publicKey, // to = from for unstaking
      amount: options.amount,
      payload: null,
      nonce: options.nonce,
      timestamp: options.timestamp ?? getCurrentTimestamp(),
      signature: new Uint8Array(64),
    };
  }

  /**
   * Build a submit proposal transaction
   */
  buildSubmitProposal(options: SubmitProposalOptions): Transaction {
    const proposalPayload: ProposalPayload = {
      title: options.title,
      description: options.description,
      changes: options.changes,
    };

    const payloadBytes = new TextEncoder().encode(JSON.stringify(proposalPayload));
    this.validatePayload(payloadBytes);

    return {
      txType: TxType.SubmitProposal,
      chainId: options.chainId ?? this.defaultChainId,
      from: this.keyPair.publicKey,
      to: this.keyPair.publicKey,
      amount: options.deposit,
      payload: payloadBytes,
      nonce: options.nonce,
      timestamp: options.timestamp ?? getCurrentTimestamp(),
      signature: new Uint8Array(64),
    };
  }

  /**
   * Build a vote transaction
   */
  buildVote(options: VoteOptions): Transaction {
    const votePayload = {
      proposal_id: Number(options.proposalId),
      option: options.option,
    };

    const payloadBytes = new TextEncoder().encode(JSON.stringify(votePayload));

    return {
      txType: TxType.Vote,
      chainId: options.chainId ?? this.defaultChainId,
      from: this.keyPair.publicKey,
      to: this.keyPair.publicKey,
      amount: 0n,
      payload: payloadBytes,
      nonce: options.nonce,
      timestamp: options.timestamp ?? getCurrentTimestamp(),
      signature: new Uint8Array(64),
    };
  }

  /**
   * Sign a transaction
   */
  sign(tx: Transaction): Transaction {
    const bytesToSign = serializeForSigning(tx);
    const signature = this.keyPair.sign(bytesToSign);

    return {
      ...tx,
      signature,
    };
  }

  /**
   * Build and sign a transfer transaction
   */
  signTransfer(options: TransferOptions): Transaction {
    return this.sign(this.buildTransfer(options));
  }

  /**
   * Build and sign a stake transaction
   */
  signStake(options: StakeOptions): Transaction {
    return this.sign(this.buildStake(options));
  }

  /**
   * Build and sign an unstake transaction
   */
  signUnstake(options: UnstakeOptions): Transaction {
    return this.sign(this.buildUnstake(options));
  }

  /**
   * Build and sign a submit proposal transaction
   */
  signSubmitProposal(options: SubmitProposalOptions): Transaction {
    return this.sign(this.buildSubmitProposal(options));
  }

  /**
   * Build and sign a vote transaction
   */
  signVote(options: VoteOptions): Transaction {
    return this.sign(this.buildVote(options));
  }

  /**
   * Normalize payload to Uint8Array or null
   */
  private normalizePayload(payload?: Uint8Array | string): Uint8Array | null {
    if (!payload) return null;
    if (typeof payload === 'string') {
      return new TextEncoder().encode(payload);
    }
    return payload;
  }

  /**
   * Validate payload size
   */
  private validatePayload(payload: Uint8Array | null): void {
    if (payload && payload.length > MAX_PAYLOAD_SIZE) {
      throw new TesseraError(
        ErrorCode.InvalidTransaction,
        `Payload too large: ${payload.length} bytes (max: ${MAX_PAYLOAD_SIZE})`
      );
    }
  }
}

// ============================================================================
// Serialization (must match Rust bincode format)
// ============================================================================

/**
 * Serialize a transaction for signing
 * This must match the Rust bincode serialization format
 */
export function serializeForSigning(tx: Transaction): Uint8Array {
  const parts: Uint8Array[] = [];

  // tx_type (1 byte)
  parts.push(new Uint8Array([tx.txType]));

  // chain_id (length-prefixed string)
  const chainIdBytes = new TextEncoder().encode(tx.chainId);
  parts.push(encodeU64(BigInt(chainIdBytes.length)));
  parts.push(chainIdBytes);

  // from (32 bytes)
  parts.push(tx.from);

  // to (32 bytes)
  parts.push(tx.to);

  // amount (u64)
  parts.push(encodeU64(tx.amount));

  // payload (Option<Vec<u8>>)
  if (tx.payload === null) {
    parts.push(new Uint8Array([0])); // None
  } else {
    parts.push(new Uint8Array([1])); // Some
    parts.push(encodeU64(BigInt(tx.payload.length)));
    parts.push(tx.payload);
  }

  // nonce (u64)
  parts.push(encodeU64(tx.nonce));

  // timestamp (u64)
  parts.push(encodeU64(tx.timestamp));

  // signature (64 bytes of zeros for signing)
  parts.push(new Uint8Array(64));

  // Concatenate all parts
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}

/**
 * Encode a u64 as little-endian bytes
 */
function encodeU64(value: bigint): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, value, true); // little-endian
  return new Uint8Array(buffer);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate transaction fee
 */
export function calculateFee(tx: Transaction): bigint {
  if (tx.txType === TxType.Stake || tx.txType === TxType.Unstake) {
    return STAKING_FEE;
  }

  if (tx.txType === TxType.SubmitProposal) {
    return STAKING_FEE; // Same as staking fee
  }

  let fee = BASE_FEE;

  if (tx.payload) {
    const payloadKb = Math.ceil(tx.payload.length / 1024);
    fee += BigInt(payloadKb) * FEE_PER_KB_PAYLOAD;
  }

  return fee;
}

/**
 * Calculate transaction hash
 */
export function calculateHash(tx: Transaction): string {
  const serialized = serializeTransaction(tx);
  return bytesToHex(hash(serialized));
}

/**
 * Serialize full transaction (including signature)
 */
export function serializeTransaction(tx: Transaction): Uint8Array {
  const parts: Uint8Array[] = [];

  // Same as serializeForSigning but with actual signature
  parts.push(new Uint8Array([tx.txType]));

  const chainIdBytes = new TextEncoder().encode(tx.chainId);
  parts.push(encodeU64(BigInt(chainIdBytes.length)));
  parts.push(chainIdBytes);

  parts.push(tx.from);
  parts.push(tx.to);
  parts.push(encodeU64(tx.amount));

  if (tx.payload === null) {
    parts.push(new Uint8Array([0]));
  } else {
    parts.push(new Uint8Array([1]));
    parts.push(encodeU64(BigInt(tx.payload.length)));
    parts.push(tx.payload);
  }

  parts.push(encodeU64(tx.nonce));
  parts.push(encodeU64(tx.timestamp));
  parts.push(tx.signature); // Actual signature

  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}

/**
 * Convert Transaction to JSON format for RPC
 */
export function transactionToJson(tx: Transaction): TransactionJson {
  const txTypeMap: Record<TxType, string> = {
    [TxType.Transfer]: 'transfer',
    [TxType.Stake]: 'stake',
    [TxType.Unstake]: 'unstake',
    [TxType.SubmitProposal]: 'submit_proposal',
    [TxType.Vote]: 'vote',
  };

  return {
    tx_type: txTypeMap[tx.txType],
    chain_id: tx.chainId,
    from: bytesToHex(tx.from),
    to: bytesToHex(tx.to),
    amount: tx.amount.toString(),
    payload: tx.payload ? bytesToHex(tx.payload) : null,
    nonce: tx.nonce.toString(),
    timestamp: tx.timestamp.toString(),
    signature: bytesToHex(tx.signature),
    hash: calculateHash(tx),
    fee: calculateFee(tx).toString(),
  };
}

/**
 * Convert JSON format to Transaction
 */
export function jsonToTransaction(json: TransactionJson): Transaction {
  const txTypeMap: Record<string, TxType> = {
    transfer: TxType.Transfer,
    stake: TxType.Stake,
    unstake: TxType.Unstake,
    submit_proposal: TxType.SubmitProposal,
    vote: TxType.Vote,
  };

  return {
    txType: txTypeMap[json.tx_type] ?? TxType.Transfer,
    chainId: json.chain_id,
    from: hexToBytes(json.from),
    to: hexToBytes(json.to),
    amount: BigInt(json.amount),
    payload: json.payload ? hexToBytes(json.payload) : null,
    nonce: BigInt(json.nonce),
    timestamp: BigInt(json.timestamp),
    signature: hexToBytes(json.signature),
  };
}
