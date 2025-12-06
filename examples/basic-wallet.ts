/**
 * Basic Wallet Example
 *
 * This example shows how to:
 * - Generate a new wallet
 * - Restore wallet from mnemonic
 * - Check balance
 * - Send transfers
 */

import {
  Wallet,
  TesseraClient,
  formatAmountWithSymbol,
} from '../src/index.js';

async function main() {
  // ==========================================================================
  // 1. Generate a new wallet
  // ==========================================================================
  console.log('=== Generating New Wallet ===\n');

  const { wallet, mnemonic } = Wallet.generate();

  console.log('New wallet created!');
  console.log('Address:', wallet.address);
  console.log('Mnemonic (SAVE THIS!):', mnemonic);
  console.log('');

  // ==========================================================================
  // 2. Restore wallet from mnemonic
  // ==========================================================================
  console.log('=== Restoring Wallet ===\n');

  const restoredWallet = Wallet.fromMnemonic(mnemonic);
  console.log('Restored address:', restoredWallet.address);
  console.log('Matches original:', restoredWallet.address === wallet.address);
  console.log('');

  // ==========================================================================
  // 3. Connect to a node
  // ==========================================================================
  console.log('=== Connecting to Node ===\n');

  // Connect to local node
  wallet.connect('http://localhost:8545');
  console.log('Connected:', wallet.isConnected);
  console.log('');

  // ==========================================================================
  // 4. Check balance
  // ==========================================================================
  console.log('=== Checking Balance ===\n');

  try {
    const balance = await wallet.getBalance();
    console.log('Balance:', formatAmountWithSymbol(balance));

    const account = await wallet.getAccount();
    console.log('Nonce:', account.nonce.toString());
    console.log('Account exists:', account.exists);
  } catch (error) {
    console.log('Could not check balance (node may not be running)');
    console.log('Error:', (error as Error).message);
  }
  console.log('');

  // ==========================================================================
  // 5. Sign a transfer (offline)
  // ==========================================================================
  console.log('=== Signing Transfer (Offline) ===\n');

  const recipientAddress = '0'.repeat(64); // Example address

  const signedTx = await wallet.signTransfer({
    to: recipientAddress,
    amount: '100.5', // Human-readable amount
    payload: 'Payment for services',
    nonce: 1n, // Specify nonce for offline signing
  });

  console.log('Signed transaction:');
  console.log('  Type:', signedTx.tx_type);
  console.log('  From:', signedTx.from.slice(0, 16) + '...');
  console.log('  To:', signedTx.to.slice(0, 16) + '...');
  console.log('  Amount:', signedTx.amount);
  console.log('  Fee:', signedTx.fee);
  console.log('  Hash:', signedTx.hash);
  console.log('');

  // ==========================================================================
  // 6. Send transfer (requires funded account)
  // ==========================================================================
  console.log('=== Sending Transfer ===\n');

  try {
    const pendingTx = await wallet.transfer({
      to: recipientAddress,
      amount: '1.5',
    });

    console.log('Transaction submitted!');
    console.log('Hash:', pendingTx.hash);
    console.log('Waiting for confirmation...');

    const receipt = await pendingTx.wait(30000); // 30 second timeout
    console.log('Confirmed!');
    console.log('Status:', receipt.status);
  } catch (error) {
    console.log('Transfer failed (likely insufficient balance or node not running)');
    console.log('Error:', (error as Error).message);
  }
}

main().catch(console.error);
