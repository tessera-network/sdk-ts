/**
 * Core types for Tessera SDK
 */

// ============================================================================
// Transaction Types
// ============================================================================

/**
 * Transaction type enum matching Rust TxType
 */
export enum TxType {
  Transfer = 0,
  Stake = 1,
  Unstake = 2,
  SubmitProposal = 3,
  Vote = 4,
}

/**
 * Raw transaction structure (matches Rust Transaction)
 */
export interface Transaction {
  txType: TxType;
  chainId: string;
  from: Uint8Array;
  to: Uint8Array;
  amount: bigint;
  payload: Uint8Array | null;
  nonce: bigint;
  timestamp: bigint;
  signature: Uint8Array;
}

/**
 * Transaction in JSON format (for RPC communication)
 */
export interface TransactionJson {
  tx_type: string;
  chain_id: string;
  from: string;
  to: string;
  amount: string;
  payload: string | null;
  nonce: string;
  timestamp: string;
  signature: string;
  hash?: string;
  fee?: string;
}

/**
 * Transaction receipt returned after submission
 */
export interface TransactionReceipt {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockHeight?: bigint;
  blockHash?: string;
  fee: bigint;
}

// ============================================================================
// Account Types
// ============================================================================

/**
 * Account information
 */
export interface Account {
  address: string;
  balance: bigint;
  nonce: bigint;
  exists: boolean;
}

// ============================================================================
// Block Types
// ============================================================================

/**
 * Block header information
 */
export interface BlockHeader {
  height: bigint;
  timestamp: bigint;
  previousHash: string;
  transactionsRoot: string;
  stateRoot: string;
  proposer: string;
}

/**
 * Full block with transactions
 */
export interface Block {
  header: BlockHeader;
  transactions: TransactionJson[];
  hash: string;
}

// ============================================================================
// Validator Types
// ============================================================================

/**
 * Validator information
 */
export interface Validator {
  address: string;
  stake: bigint;
  isActive: boolean;
  commission: number;
}

// ============================================================================
// Governance Types
// ============================================================================

/**
 * Vote option for governance proposals
 */
export enum VoteOption {
  Yes = 'yes',
  No = 'no',
  Abstain = 'abstain',
  NoWithVeto = 'no_with_veto',
}

/**
 * Proposal status
 */
export enum ProposalStatus {
  Voting = 'voting',
  Passed = 'passed',
  Rejected = 'rejected',
  Vetoed = 'vetoed',
}

/**
 * Parameter change in a proposal
 */
export interface ParamChange {
  param: string;
  value: number | string;
}

/**
 * Governance proposal
 */
export interface Proposal {
  id: bigint;
  proposer: string;
  title: string;
  description: string;
  changes: ParamChange[];
  status: ProposalStatus;
  submitHeight: bigint;
  votingEndHeight: bigint;
  deposit: bigint;
  votesYes: bigint;
  votesNo: bigint;
  votesAbstain: bigint;
  votesVeto: bigint;
}

/**
 * Proposal payload for creating new proposals
 */
export interface ProposalPayload {
  title: string;
  description: string;
  changes: ParamChange[];
}

/**
 * Vote payload
 */
export interface VotePayload {
  proposalId: bigint;
  option: VoteOption;
}

// ============================================================================
// Network Types
// ============================================================================

/**
 * Network status information
 */
export interface NetworkStatus {
  chainId: string;
  blockHeight: bigint;
  blockTime: bigint;
  peerCount: number;
  isSyncing: boolean;
}

/**
 * Chain parameters (governance-controlled)
 */
export interface ChainParams {
  maxValidators: number;
  minValidatorStake: bigint;
  maxTxsPerBlock: number;
  maxBlockSize: number;
  baseFee: bigint;
  stakingFee: bigint;
  votingPeriod: bigint;
  quorum: number;
  threshold: number;
  vetoThreshold: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * SDK error codes
 */
export enum ErrorCode {
  // Network errors
  NetworkError = 'NETWORK_ERROR',
  RpcError = 'RPC_ERROR',
  Timeout = 'TIMEOUT',

  // Validation errors
  InvalidAddress = 'INVALID_ADDRESS',
  InvalidSignature = 'INVALID_SIGNATURE',
  InvalidTransaction = 'INVALID_TRANSACTION',
  InvalidMnemonic = 'INVALID_MNEMONIC',

  // State errors
  InsufficientBalance = 'INSUFFICIENT_BALANCE',
  InvalidNonce = 'INVALID_NONCE',
  AccountNotFound = 'ACCOUNT_NOT_FOUND',

  // Crypto errors
  SigningError = 'SIGNING_ERROR',
  KeyGenerationError = 'KEY_GENERATION_ERROR',
}

/**
 * SDK error class
 */
export class TesseraError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'TesseraError';
  }
}
