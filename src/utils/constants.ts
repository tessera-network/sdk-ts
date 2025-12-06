/**
 * Tessera SDK constants
 */

// ============================================================================
// Token Constants
// ============================================================================

/**
 * Number of decimal places for TESS token
 */
export const TOKEN_DECIMALS = 6;

/**
 * Multiplier to convert TESS to base units (microTESS)
 */
export const TOKEN_MULTIPLIER = BigInt(10 ** TOKEN_DECIMALS);

/**
 * Token symbol
 */
export const TOKEN_SYMBOL = 'TESS';

// ============================================================================
// Fee Constants
// ============================================================================

/**
 * Base fee for simple transfers (in base units)
 */
export const BASE_FEE = BigInt(1_000);

/**
 * Fee per KB of payload (in base units)
 */
export const FEE_PER_KB_PAYLOAD = BigInt(100);

/**
 * Fixed fee for staking operations (in base units)
 */
export const STAKING_FEE = BigInt(10_000);

// ============================================================================
// Size Limits
// ============================================================================

/**
 * Maximum payload size in bytes (10 KB)
 */
export const MAX_PAYLOAD_SIZE = 10 * 1024;

/**
 * Address length in bytes
 */
export const ADDRESS_LENGTH = 32;

/**
 * Signature length in bytes
 */
export const SIGNATURE_LENGTH = 64;

/**
 * Hash length in bytes
 */
export const HASH_LENGTH = 32;

// ============================================================================
// Default Chain IDs
// ============================================================================

/**
 * Default chain IDs for different networks
 */
export const ChainIds = {
  MAINNET: 'tessera-mainnet-1',
  TESTNET: 'tessera-testnet-1',
  DEVNET: 'tessera-devnet-1',
  LOCAL: 'tessera-local',
} as const;

// ============================================================================
// Default RPC Endpoints
// ============================================================================

/**
 * Default RPC endpoints for different networks
 */
export const RpcEndpoints = {
  MAINNET: 'https://rpc.tessera.net',
  TESTNET: 'https://testnet-rpc.tessera.net',
  LOCAL: 'http://localhost:8545',
} as const;

// ============================================================================
// Governance Constants
// ============================================================================

/**
 * Minimum deposit for governance proposals (in base units)
 */
export const MIN_PROPOSAL_DEPOSIT = BigInt(10_000_000_000_000); // 10,000 TESS

/**
 * Default voting period in blocks
 */
export const DEFAULT_VOTING_PERIOD = BigInt(50_400); // ~7 days at 3s blocks

/**
 * Quorum percentage (in basis points, 3340 = 33.40%)
 */
export const QUORUM_BPS = 3340;

/**
 * Threshold percentage for passing (in basis points, 6670 = 66.70%)
 */
export const THRESHOLD_BPS = 6670;

/**
 * Veto threshold percentage (in basis points, 3340 = 33.40%)
 */
export const VETO_THRESHOLD_BPS = 3340;
