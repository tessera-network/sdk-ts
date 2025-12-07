# @tessera-network/sdk-ts

Official TypeScript SDK for Tessera Network - a Proof-of-Stake blockchain with Tendermint BFT consensus.

## Installation

```bash
npm install @tessera-network/sdk-ts
```

## Quick Start

### Connect to Network

```typescript
import { TesseraClient } from '@tessera-network/sdk-ts';

const client = new TesseraClient('https://rpc.devnet.tessera-network.org');

// Check connection
const status = await client.getNetworkStatus();
console.log('Network height:', status.latestBlockHeight);
```

### Create and Use Wallet

```typescript
import { Wallet } from '@tessera-network/sdk-ts';

// Create new wallet with mnemonic
const wallet = Wallet.create();
console.log('Address:', wallet.getAddress());
console.log('Mnemonic:', wallet.getMnemonic());

// Or restore from mnemonic
const restored = Wallet.fromMnemonic('your twelve word mnemonic phrase here ...');

// Or from private key
const fromKey = Wallet.fromPrivateKey('0x...');
```

### Send Transfer

```typescript
import { TesseraClient, Wallet } from '@tessera-network/sdk-ts';

const client = new TesseraClient('https://rpc.devnet.tessera-network.org');
const wallet = Wallet.fromPrivateKey('your-private-key');

// Connect wallet to client
wallet.connect(client);

// Send transfer (amount in smallest units)
const tx = await wallet.transfer({
  to: '0x1234567890abcdef...',
  amount: 1000000000n, // 1 TSRA (9 decimals)
});

console.log('Transaction hash:', tx.hash);
```

### Query Blockchain

```typescript
// Get account balance
const account = await client.getAccount('0x...');
console.log('Balance:', account.balance);

// Get latest block
const block = await client.getLatestBlock();
console.log('Block height:', block.header.height);

// Get block by height
const block100 = await client.getBlockByHeight(100);

// Get transaction by hash
const tx = await client.getTransaction('0x...');
```

### Staking

```typescript
// Stake tokens
const stakeTx = await wallet.stake({
  amount: 100000000000n, // 100 TSRA
});

// Unstake tokens
const unstakeTx = await wallet.unstake({
  amount: 50000000000n, // 50 TSRA
});
```

### Governance

```typescript
import { VoteOption } from '@tessera-network/sdk-ts';

// Submit proposal
const proposalTx = await wallet.submitProposal({
  title: 'Increase block size',
  description: 'Proposal to increase max block size to 2MB',
  changes: [
    { param: 'max_block_size', value: '2097152' }
  ],
});

// Vote on proposal
const voteTx = await wallet.vote({
  proposalId: 1,
  option: VoteOption.Yes,
});
```

## API Reference

### TesseraClient

Main client for interacting with Tessera RPC.

| Method | Description |
|--------|-------------|
| `getNetworkStatus()` | Get network status and chain info |
| `getAccount(address)` | Get account balance and nonce |
| `getLatestBlock()` | Get the latest block |
| `getBlockByHeight(height)` | Get block by height |
| `getBlockByHash(hash)` | Get block by hash |
| `getTransaction(hash)` | Get transaction by hash |
| `getValidators()` | Get list of validators |
| `getMempoolStats()` | Get mempool statistics |
| `sendTransaction(tx)` | Submit signed transaction |

### Wallet

High-level wallet for managing keys and signing transactions.

| Method | Description |
|--------|-------------|
| `Wallet.create()` | Create new wallet with random mnemonic |
| `Wallet.fromMnemonic(phrase)` | Restore from mnemonic phrase |
| `Wallet.fromPrivateKey(key)` | Create from private key |
| `connect(client)` | Connect wallet to client |
| `getAddress()` | Get wallet address |
| `getBalance()` | Get current balance |
| `transfer(options)` | Send transfer transaction |
| `stake(options)` | Stake tokens |
| `unstake(options)` | Unstake tokens |
| `submitProposal(options)` | Submit governance proposal |
| `vote(options)` | Vote on proposal |

### Utilities

```typescript
import {
  // Amount formatting (9 decimals)
  parseAmount,      // '1.5' -> 1500000000n
  formatAmount,     // 1500000000n -> '1.5'

  // Address formatting
  isValidAddress,   // Validate address format
  shortenAddress,   // '0x1234...5678'

  // Hex utilities
  bytesToHex,
  hexToBytes,
} from '@tessera-network/sdk-ts';
```

## Constants

```typescript
import {
  TOKEN_DECIMALS,    // 9
  TOKEN_SYMBOL,      // 'TSRA'
  BASE_FEE,          // 1000n
  ChainIds,          // { DEVNET: 1, TESTNET: 2, MAINNET: 3 }
  RpcEndpoints,      // { DEVNET: 'https://rpc.devnet.tessera-network.org' }
} from '@tessera-network/sdk-ts';
```

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0 (for TypeScript users)

## License

MIT
