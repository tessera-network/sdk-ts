/**
 * Tessera RPC Client
 */

import {
  Account,
  Block,
  NetworkStatus,
  TransactionJson,
  TransactionReceipt,
  Validator,
  Proposal,
  ChainParams,
  TesseraError,
  ErrorCode,
} from '../types/index.js';
import { RpcEndpoints } from '../utils/constants.js';

/**
 * Client configuration options
 */
export interface ClientOptions {
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom headers to include in requests */
  headers?: Record<string, string>;
}

/**
 * RPC response wrapper
 */
interface RpcResponse<T> {
  jsonrpc: string;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
  id: number;
}

/**
 * Tessera RPC Client for interacting with Tessera nodes
 */
export class TesseraClient {
  private readonly endpoint: string;
  private readonly timeout: number;
  private readonly headers: Record<string, string>;
  private requestId = 0;

  /**
   * Create a new TesseraClient
   * @param endpoint - RPC endpoint URL (default: localhost:8545)
   * @param options - Client options
   */
  constructor(endpoint: string = RpcEndpoints.LOCAL, options: ClientOptions = {}) {
    this.endpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    this.timeout = options.timeout ?? 30000;
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  // ============================================================================
  // HTTP Methods
  // ============================================================================

  /**
   * Make a GET request
   */
  private async get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.endpoint}${path}`, {
        method: 'GET',
        headers: this.headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new TesseraError(
          ErrorCode.RpcError,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof TesseraError) throw error;
      if ((error as Error).name === 'AbortError') {
        throw new TesseraError(ErrorCode.Timeout, 'Request timed out');
      }
      throw new TesseraError(ErrorCode.NetworkError, (error as Error).message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Make a POST request
   */
  private async post<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.endpoint}${path}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new TesseraError(
          ErrorCode.RpcError,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof TesseraError) throw error;
      if ((error as Error).name === 'AbortError') {
        throw new TesseraError(ErrorCode.Timeout, 'Request timed out');
      }
      throw new TesseraError(ErrorCode.NetworkError, (error as Error).message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Make a JSON-RPC request
   */
  private async rpc<T>(method: string, params?: unknown): Promise<T> {
    const body = {
      jsonrpc: '2.0',
      method,
      params: params ?? {},
      id: ++this.requestId,
    };

    const response = await this.post<RpcResponse<T>>('/rpc', body);

    if (response.error) {
      throw new TesseraError(ErrorCode.RpcError, response.error.message, response.error);
    }

    return response.result as T;
  }

  // ============================================================================
  // Health & Status
  // ============================================================================

  /**
   * Check if the node is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.get<{ status: string }>('/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    const response = await this.get<{
      current_height: number;
      mempool_size: number;
      total_transactions: number;
      state_root: string;
    }>('/network_status');

    return {
      chainId: 'tessera-devnet-1', // TODO: get from chain_params
      blockHeight: BigInt(response.current_height),
      blockTime: BigInt(Math.floor(Date.now() / 1000)), // Not provided by API
      peerCount: 0, // Not provided by this endpoint
      isSyncing: false, // Not provided by this endpoint
    };
  }

  /**
   * Get chain parameters
   */
  async getChainParams(): Promise<ChainParams> {
    const response = await this.get<{
      max_validators: number;
      min_validator_stake: string;
      max_txs_per_block: number;
      max_block_size: number;
      base_fee: string;
      staking_fee: string;
      voting_period: string;
      quorum: number;
      threshold: number;
      veto_threshold: number;
    }>('/chain_params');

    return {
      maxValidators: response.max_validators,
      minValidatorStake: BigInt(response.min_validator_stake),
      maxTxsPerBlock: response.max_txs_per_block,
      maxBlockSize: response.max_block_size,
      baseFee: BigInt(response.base_fee),
      stakingFee: BigInt(response.staking_fee),
      votingPeriod: BigInt(response.voting_period),
      quorum: response.quorum,
      threshold: response.threshold,
      vetoThreshold: response.veto_threshold,
    };
  }

  // ============================================================================
  // Accounts
  // ============================================================================

  /**
   * Get account information
   */
  async getAccount(address: string): Promise<Account> {
    const response = await this.post<{
      address: string;
      balance: number;
      nonce: number;
      exists: boolean;
    }>('/get_account', { address });

    return {
      address: response.address,
      balance: BigInt(response.balance),
      nonce: BigInt(response.nonce),
      exists: response.exists,
    };
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<bigint> {
    const account = await this.getAccount(address);
    return account.balance;
  }

  /**
   * Get account nonce (for transaction creation)
   */
  async getNonce(address: string): Promise<bigint> {
    const account = await this.getAccount(address);
    return account.nonce;
  }

  // ============================================================================
  // Transactions
  // ============================================================================

  /**
   * Submit a signed transaction
   */
  async submitTransaction(tx: TransactionJson): Promise<TransactionReceipt> {
    const response = await this.rpc<{
      hash: string;
      status: string;
    }>('tx_submit', tx);

    return {
      hash: response.hash,
      status: response.status as 'pending' | 'confirmed' | 'failed',
      fee: BigInt(tx.fee ?? 0),
    };
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<TransactionJson | null> {
    try {
      const response = await this.post<{
        transaction: TransactionJson;
        in_mempool: boolean;
      }>('/get_transaction', { tx_hash: hash });
      return response.transaction;
    } catch (error) {
      if (error instanceof TesseraError && error.code === ErrorCode.RpcError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get transactions for an address
   */
  async getTransactions(
    address: string,
    options?: { limit?: number; offset?: number }
  ): Promise<TransactionJson[]> {
    const response = await this.post<{ transactions: TransactionJson[] }>('/transactions', {
      address,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    });

    return response.transactions;
  }

  // ============================================================================
  // Blocks
  // ============================================================================

  /**
   * Get block by height
   */
  async getBlock(height: bigint): Promise<Block | null> {
    try {
      const response = await this.post<{
        block: {
          height: number;
          timestamp: number;
          prev_hash: string;
          merkle_root: string;
          proposer: string;
          transactions: TransactionJson[];
          hash: string;
          signature?: string;
        };
      }>('/get_block', { height: Number(height) });

      return {
        header: {
          height: BigInt(response.block.height),
          timestamp: BigInt(response.block.timestamp),
          previousHash: response.block.prev_hash,
          transactionsRoot: response.block.merkle_root,
          stateRoot: '', // Not provided by API
          proposer: response.block.proposer,
        },
        transactions: response.block.transactions,
        hash: response.block.hash,
      };
    } catch (error) {
      if (error instanceof TesseraError && error.code === ErrorCode.RpcError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get latest block
   */
  async getLatestBlock(): Promise<Block | null> {
    const status = await this.getNetworkStatus();
    return this.getBlock(status.blockHeight);
  }

  // ============================================================================
  // Validators
  // ============================================================================

  /**
   * Get all validators
   */
  async getValidators(): Promise<Validator[]> {
    const response = await this.get<{
      validators: {
        address: string;
        stake: string;
        is_active: boolean;
        commission: number;
      }[];
    }>('/validators');

    return response.validators.map((v) => ({
      address: v.address,
      stake: BigInt(v.stake),
      isActive: v.is_active,
      commission: v.commission,
    }));
  }

  /**
   * Get validator by address
   */
  async getValidator(address: string): Promise<Validator | null> {
    const validators = await this.getValidators();
    return validators.find((v) => v.address === address) ?? null;
  }

  // ============================================================================
  // Governance
  // ============================================================================

  /**
   * Get all proposals
   */
  async getProposals(): Promise<Proposal[]> {
    const response = await this.get<{
      proposals: {
        id: string;
        proposer: string;
        title: string;
        description: string;
        changes: { param: string; value: number | string }[];
        status: string;
        submit_height: string;
        voting_end_height: string;
        deposit: string;
        votes_yes: string;
        votes_no: string;
        votes_abstain: string;
        votes_veto: string;
      }[];
    }>('/proposals');

    return response.proposals.map((p) => ({
      id: BigInt(p.id),
      proposer: p.proposer,
      title: p.title,
      description: p.description,
      changes: p.changes,
      status: p.status as Proposal['status'],
      submitHeight: BigInt(p.submit_height),
      votingEndHeight: BigInt(p.voting_end_height),
      deposit: BigInt(p.deposit),
      votesYes: BigInt(p.votes_yes),
      votesNo: BigInt(p.votes_no),
      votesAbstain: BigInt(p.votes_abstain),
      votesVeto: BigInt(p.votes_veto),
    }));
  }

  /**
   * Get proposal by ID
   */
  async getProposal(id: bigint): Promise<Proposal | null> {
    try {
      const response = await this.post<{
        id: string;
        proposer: string;
        title: string;
        description: string;
        changes: { param: string; value: number | string }[];
        status: string;
        submit_height: string;
        voting_end_height: string;
        deposit: string;
        votes_yes: string;
        votes_no: string;
        votes_abstain: string;
        votes_veto: string;
      }>('/get_proposal', { proposal_id: Number(id) });

      return {
        id: BigInt(response.id),
        proposer: response.proposer,
        title: response.title,
        description: response.description,
        changes: response.changes,
        status: response.status as Proposal['status'],
        submitHeight: BigInt(response.submit_height),
        votingEndHeight: BigInt(response.voting_end_height),
        deposit: BigInt(response.deposit),
        votesYes: BigInt(response.votes_yes),
        votesNo: BigInt(response.votes_no),
        votesAbstain: BigInt(response.votes_abstain),
        votesVeto: BigInt(response.votes_veto),
      };
    } catch (error) {
      if (error instanceof TesseraError && error.code === ErrorCode.RpcError) {
        return null;
      }
      throw error;
    }
  }

  // ============================================================================
  // Mempool
  // ============================================================================

  /**
   * Get pending transactions in mempool
   */
  async getPendingTransactions(): Promise<TransactionJson[]> {
    // /mempool returns an array of transactions directly
    return await this.get<TransactionJson[]>('/mempool');
  }

  /**
   * Get mempool statistics
   */
  async getMempoolStats(): Promise<{ count: number; totalFees: bigint }> {
    const transactions = await this.getPendingTransactions();
    const totalFees = transactions.reduce((sum, tx) => sum + BigInt(tx.fee ?? 0), 0n);

    return {
      count: transactions.length,
      totalFees,
    };
  }
}

export default TesseraClient;
