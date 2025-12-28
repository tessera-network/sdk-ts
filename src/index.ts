/**
 * Tessera SDK - Official TypeScript SDK for Tessera Network
 *
 * @packageDocumentation
 */

// Main classes
export { TesseraClient, type ClientOptions } from './client/index.js';
export { Wallet, type WalletOptions, type PendingTransaction } from './wallet/index.js';
export {
  TransactionBuilder,
  transactionToJson,
  jsonToTransaction,
  calculateFee,
  calculateHash,
  serializeForSigning,
  type TransferOptions,
  type StakeOptions,
  type UnstakeOptions,
  type SubmitProposalOptions,
  type VoteOptions,
} from './transaction/index.js';

// Crypto
export { KeyPair, verifySignature } from './crypto/keys.js';
export { hash, hashHex, merkleRoot } from './crypto/hash.js';
export {
  generateMnemonicPhrase,
  isValidMnemonic,
  mnemonicToKeyPair,
  mnemonicToKeyPairs,
  type MnemonicLength,
} from './crypto/mnemonic.js';

// Types
export {
  // Transaction types
  TxType,
  type Transaction,
  type TransactionJson,
  type TransactionReceipt,

  // Account types
  type Account,

  // Block types
  type Block,
  type BlockHeader,

  // Validator types
  type Validator,

  // Governance types
  VoteOption,
  ProposalStatus,
  type Proposal,
  type ProposalPayload,
  type VotePayload,
  type ParamChange,

  // Network types
  type NetworkStatus,
  type ChainParams,

  // Error types
  ErrorCode,
  TesseraError,
} from './types/index.js';

// Utils
export {
  // Constants
  TOKEN_DECIMALS,
  TOKEN_MULTIPLIER,
  TOKEN_SYMBOL,
  BASE_FEE,
  FEE_PER_KB_PAYLOAD,
  STAKING_FEE,
  MAX_PAYLOAD_SIZE,
  ADDRESS_LENGTH,
  ChainIds,
  RpcEndpoints,

  // Formatting
  bytesToHex,
  hexToBytes,
  isValidHex,
  isValidAddress,
  parseAddress,
  formatAddress,
  shortenAddress,
  parseAmount,
  formatAmount,
  formatAmountWithSymbol,
  getCurrentTimestamp,
  formatTimestamp,
  formatBlockDuration,
} from './utils/index.js';
