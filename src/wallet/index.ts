/**
 * Tessera Wallet - High-level API for managing accounts and transactions
 */

import { TesseraClient } from '../client/index.js';
import { KeyPair } from '../crypto/keys.js';
import {
  generateMnemonicPhrase,
  mnemonicToKeyPair,
  isValidMnemonic,
  MnemonicLength,
} from '../crypto/mnemonic.js';
import {
  TransactionBuilder,
  transactionToJson,
} from '../transaction/index.js';
import {
  Account,
  TransactionReceipt,
  VoteOption,
  TesseraError,
  ErrorCode,
} from '../types/index.js';
import { parseAmount, formatAmount } from '../utils/format.js';

/**
 * Options for creating a wallet
 */
export interface WalletOptions {
  /** RPC client or endpoint URL */
  client?: TesseraClient | string;
  /** Default chain ID for transactions */
  chainId?: string;
}

/**
 * Options for transfer transactions
 */
export interface TransferParams {
  /** Recipient address */
  to: string;
  /** Amount to send (human-readable, e.g., "100.5") */
  amount: string | bigint;
  /** Optional payload/memo */
  payload?: string;
}

/**
 * Options for staking transactions
 */
export interface StakeParams {
  /** Amount to stake (human-readable, e.g., "10000") */
  amount: string | bigint;
}

/**
 * Options for unstaking transactions
 */
export interface UnstakeParams {
  /** Amount to unstake (human-readable, e.g., "5000") */
  amount: string | bigint;
}

/**
 * Options for submitting a governance proposal
 */
export interface ProposalParams {
  /** Proposal title */
  title: string;
  /** Proposal description */
  description: string;
  /** Parameter changes */
  changes: { param: string; value: number | string }[];
  /** Deposit amount (human-readable, e.g., "10000") */
  deposit: string | bigint;
}

/**
 * Options for voting on a proposal
 */
export interface VoteParams {
  /** Proposal ID */
  proposalId: bigint | number;
  /** Vote option */
  option: VoteOption | 'yes' | 'no' | 'abstain' | 'no_with_veto';
}

/**
 * Pending transaction that can be waited on
 */
export interface PendingTransaction {
  /** Transaction hash */
  hash: string;
  /** Wait for transaction to be confirmed */
  wait(timeoutMs?: number): Promise<TransactionReceipt>;
}

/**
 * High-level wallet for interacting with Tessera
 */
export class Wallet {
  private readonly keyPair: KeyPair;
  private readonly txBuilder: TransactionBuilder;
  private client: TesseraClient | null;
  private readonly chainId: string;

  private constructor(keyPair: KeyPair, options: WalletOptions = {}) {
    this.keyPair = keyPair;
    this.chainId = options.chainId ?? '';
    this.txBuilder = new TransactionBuilder(keyPair, this.chainId);

    if (options.client) {
      this.client =
        typeof options.client === 'string'
          ? new TesseraClient(options.client)
          : options.client;
    } else {
      this.client = null;
    }
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Generate a new wallet with a random mnemonic
   * @returns Object with wallet and mnemonic phrase
   */
  static generate(
    options: WalletOptions & { mnemonicLength?: MnemonicLength } = {}
  ): { wallet: Wallet; mnemonic: string } {
    const mnemonic = generateMnemonicPhrase(options.mnemonicLength ?? 24);
    const keyPair = mnemonicToKeyPair(mnemonic);
    const wallet = new Wallet(keyPair, options);

    return { wallet, mnemonic };
  }

  /**
   * Create wallet from mnemonic phrase
   */
  static fromMnemonic(
    mnemonic: string,
    options: WalletOptions & { passphrase?: string; accountIndex?: number } = {}
  ): Wallet {
    if (!isValidMnemonic(mnemonic)) {
      throw new TesseraError(ErrorCode.InvalidMnemonic, 'Invalid mnemonic phrase');
    }

    const keyPair = mnemonicToKeyPair(
      mnemonic,
      options.passphrase ?? '',
      options.accountIndex ?? 0
    );

    return new Wallet(keyPair, options);
  }

  /**
   * Create wallet from private key
   */
  static fromPrivateKey(privateKeyHex: string, options: WalletOptions = {}): Wallet {
    const keyPair = KeyPair.fromPrivateKeyHex(privateKeyHex);
    return new Wallet(keyPair, options);
  }

  /**
   * Create wallet from KeyPair
   */
  static fromKeyPair(keyPair: KeyPair, options: WalletOptions = {}): Wallet {
    return new Wallet(keyPair, options);
  }

  // ============================================================================
  // Properties
  // ============================================================================

  /**
   * Get wallet address
   */
  get address(): string {
    return this.keyPair.address;
  }

  /**
   * Get public key as hex
   */
  get publicKey(): string {
    return this.keyPair.publicKeyHex;
  }

  /**
   * Check if wallet is connected to a client
   */
  get isConnected(): boolean {
    return this.client !== null;
  }

  // ============================================================================
  // Connection
  // ============================================================================

  /**
   * Connect wallet to an RPC client
   */
  connect(client: TesseraClient | string): this {
    this.client = typeof client === 'string' ? new TesseraClient(client) : client;
    return this;
  }

  /**
   * Get the connected client (throws if not connected)
   */
  private getClient(): TesseraClient {
    if (!this.client) {
      throw new TesseraError(
        ErrorCode.NetworkError,
        'Wallet not connected to any RPC client. Call wallet.connect() first.'
      );
    }
    return this.client;
  }

  // ============================================================================
  // Account Information
  // ============================================================================

  /**
   * Get account information
   */
  async getAccount(): Promise<Account> {
    return this.getClient().getAccount(this.address);
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<bigint> {
    const account = await this.getAccount();
    return account.balance;
  }

  /**
   * Get wallet balance as human-readable string
   */
  async getBalanceFormatted(): Promise<string> {
    const balance = await this.getBalance();
    return formatAmount(balance);
  }

  /**
   * Get current nonce
   */
  async getNonce(): Promise<bigint> {
    const account = await this.getAccount();
    return account.nonce;
  }

  // ============================================================================
  // Transactions
  // ============================================================================

  /**
   * Send a transfer transaction
   */
  async transfer(params: TransferParams): Promise<PendingTransaction> {
    const client = this.getClient();
    const nonce = (await this.getNonce()) + 1n;

    const amount = typeof params.amount === 'string'
      ? parseAmount(params.amount)
      : params.amount;

    const tx = this.txBuilder.signTransfer({
      to: params.to,
      amount,
      payload: params.payload,
      nonce,
      chainId: this.chainId, // Always use wallet's chainId
    });

    const receipt = await client.submitTransaction(transactionToJson(tx));

    return this.createPendingTransaction(receipt.hash, client);
  }

  /**
   * Stake tokens
   */
  async stake(params: StakeParams): Promise<PendingTransaction> {
    const client = this.getClient();
    const nonce = (await this.getNonce()) + 1n;

    const amount = typeof params.amount === 'string'
      ? parseAmount(params.amount)
      : params.amount;

    const tx = this.txBuilder.signStake({
      amount,
      nonce,
      chainId: this.chainId,
    });

    const receipt = await client.submitTransaction(transactionToJson(tx));

    return this.createPendingTransaction(receipt.hash, client);
  }

  /**
   * Unstake tokens
   */
  async unstake(params: UnstakeParams): Promise<PendingTransaction> {
    const client = this.getClient();
    const nonce = (await this.getNonce()) + 1n;

    const amount = typeof params.amount === 'string'
      ? parseAmount(params.amount)
      : params.amount;

    const tx = this.txBuilder.signUnstake({
      amount,
      nonce,
      chainId: this.chainId,
    });

    const receipt = await client.submitTransaction(transactionToJson(tx));

    return this.createPendingTransaction(receipt.hash, client);
  }

  /**
   * Submit a governance proposal
   */
  async submitProposal(params: ProposalParams): Promise<PendingTransaction> {
    const client = this.getClient();
    const nonce = (await this.getNonce()) + 1n;

    const deposit = typeof params.deposit === 'string'
      ? parseAmount(params.deposit)
      : params.deposit;

    const tx = this.txBuilder.signSubmitProposal({
      title: params.title,
      description: params.description,
      changes: params.changes,
      deposit,
      nonce,
      chainId: this.chainId,
    });

    const receipt = await client.submitTransaction(transactionToJson(tx));

    return this.createPendingTransaction(receipt.hash, client);
  }

  /**
   * Vote on a governance proposal
   */
  async vote(params: VoteParams): Promise<PendingTransaction> {
    const client = this.getClient();
    const nonce = (await this.getNonce()) + 1n;

    // Normalize vote option
    const optionMap: Record<string, VoteOption> = {
      yes: VoteOption.Yes,
      no: VoteOption.No,
      abstain: VoteOption.Abstain,
      no_with_veto: VoteOption.NoWithVeto,
    };

    const option = typeof params.option === 'string'
      ? optionMap[params.option]
      : params.option;

    const proposalId = typeof params.proposalId === 'number'
      ? BigInt(params.proposalId)
      : params.proposalId;

    const tx = this.txBuilder.signVote({
      proposalId,
      option,
      nonce,
      chainId: this.chainId,
    });

    const receipt = await client.submitTransaction(transactionToJson(tx));

    return this.createPendingTransaction(receipt.hash, client);
  }

  // ============================================================================
  // Signing (without submitting)
  // ============================================================================

  /**
   * Sign a transfer transaction without submitting
   */
  async signTransfer(params: TransferParams & { nonce?: bigint; chainId?: string }) {
    const nonce = params.nonce ?? (await this.getNonce()) + 1n;

    const amount = typeof params.amount === 'string'
      ? parseAmount(params.amount)
      : params.amount;

    const tx = this.txBuilder.signTransfer({
      to: params.to,
      amount,
      payload: params.payload,
      nonce,
      chainId: params.chainId ?? this.chainId, // Use explicit chainId or wallet's default
    });

    return transactionToJson(tx);
  }

  /**
   * Sign arbitrary message
   */
  signMessage(message: string | Uint8Array): string {
    const bytes = typeof message === 'string'
      ? new TextEncoder().encode(message)
      : message;
    return this.keyPair.signHex(bytes);
  }

  // ============================================================================
  // Export
  // ============================================================================

  /**
   * Export private key (use with caution!)
   */
  exportPrivateKey(): string {
    return this.keyPair.privateKeyHex;
  }

  /**
   * Export wallet to JSON (for storage)
   */
  toJSON(): { address: string; privateKey: string } {
    return {
      address: this.address,
      privateKey: this.keyPair.privateKeyHex,
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Create a pending transaction object
   */
  private createPendingTransaction(
    hash: string,
    client: TesseraClient
  ): PendingTransaction {
    return {
      hash,
      wait: async (timeoutMs = 60000): Promise<TransactionReceipt> => {
        const startTime = Date.now();
        const pollInterval = 1000;

        while (Date.now() - startTime < timeoutMs) {
          const tx = await client.getTransaction(hash);

          if (tx && tx.hash) {
            // Transaction found in a block
            return {
              hash: tx.hash,
              status: 'confirmed',
              fee: BigInt(tx.fee ?? 0),
            };
          }

          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }

        throw new TesseraError(
          ErrorCode.Timeout,
          `Transaction ${hash} not confirmed within ${timeoutMs}ms`
        );
      },
    };
  }
}

export default Wallet;
