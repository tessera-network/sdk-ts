/**
 * Query Chain Example
 *
 * This example shows how to:
 * - Check network status
 * - Query blocks
 * - Query transactions
 * - View validators
 */

import {
  TesseraClient,
  formatAmountWithSymbol,
  formatTimestamp,
} from '../src/index.js';

async function main() {
  // ==========================================================================
  // Setup
  // ==========================================================================
  console.log('=== Query Chain Example ===\n');

  const client = new TesseraClient('http://localhost:8545');

  // ==========================================================================
  // Health check
  // ==========================================================================
  console.log('=== Health Check ===\n');

  const isHealthy = await client.isHealthy();
  console.log('Node healthy:', isHealthy);

  if (!isHealthy) {
    console.log('Node is not responding. Make sure it is running.');
    return;
  }
  console.log('');

  // ==========================================================================
  // Network status
  // ==========================================================================
  console.log('=== Network Status ===\n');

  try {
    const status = await client.getNetworkStatus();

    console.log('Chain ID:', status.chainId);
    console.log('Block height:', status.blockHeight.toString());
    console.log('Block time:', formatTimestamp(status.blockTime));
    console.log('Peer count:', status.peerCount);
    console.log('Syncing:', status.isSyncing);
  } catch (error) {
    console.log('Error:', (error as Error).message);
  }
  console.log('');

  // ==========================================================================
  // Get latest block
  // ==========================================================================
  console.log('=== Latest Block ===\n');

  try {
    const block = await client.getLatestBlock();

    if (block) {
      console.log('Height:', block.header.height.toString());
      console.log('Hash:', block.hash);
      console.log('Timestamp:', formatTimestamp(block.header.timestamp));
      console.log('Proposer:', block.header.proposer.slice(0, 16) + '...');
      console.log('Transactions:', block.transactions.length);
    } else {
      console.log('No blocks yet');
    }
  } catch (error) {
    console.log('Error:', (error as Error).message);
  }
  console.log('');

  // ==========================================================================
  // Get account info
  // ==========================================================================
  console.log('=== Account Info ===\n');

  try {
    // Query a known address (genesis account in dev mode)
    const address = '7d9f65b5a67a3a1a4a2a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7';
    const account = await client.getAccount(address);

    console.log('Address:', account.address.slice(0, 16) + '...');
    console.log('Balance:', formatAmountWithSymbol(account.balance));
    console.log('Nonce:', account.nonce.toString());
    console.log('Exists:', account.exists);
  } catch (error) {
    console.log('Error:', (error as Error).message);
  }
  console.log('');

  // ==========================================================================
  // Get validators
  // ==========================================================================
  console.log('=== Validators ===\n');

  try {
    const validators = await client.getValidators();

    console.log('Total validators:', validators.length);
    console.log('');

    for (const validator of validators.slice(0, 5)) {
      console.log('Validator:', validator.address.slice(0, 16) + '...');
      console.log('  Stake:', formatAmountWithSymbol(validator.stake));
      console.log('  Active:', validator.isActive);
      console.log('');
    }

    if (validators.length > 5) {
      console.log(`... and ${validators.length - 5} more`);
    }
  } catch (error) {
    console.log('Error:', (error as Error).message);
  }
  console.log('');

  // ==========================================================================
  // Get mempool
  // ==========================================================================
  console.log('=== Mempool ===\n');

  try {
    const pending = await client.getPendingTransactions();
    const stats = await client.getMempoolStats();

    console.log('Pending transactions:', stats.count);
    console.log('Total fees:', formatAmountWithSymbol(stats.totalFees));

    if (pending.length > 0) {
      console.log('\nRecent pending:');
      for (const tx of pending.slice(0, 3)) {
        console.log('  -', tx.hash?.slice(0, 16) + '...',
          '|', tx.tx_type,
          '|', tx.amount, 'units');
      }
    }
  } catch (error) {
    console.log('Error:', (error as Error).message);
  }
}

main().catch(console.error);
