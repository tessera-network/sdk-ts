/**
 * Staking Example
 *
 * This example shows how to:
 * - Stake tokens to become a validator
 * - Unstake tokens
 * - Check validator status
 */

import {
  Wallet,
  TesseraClient,
  formatAmountWithSymbol,
} from '../src/index.js';

async function main() {
  // ==========================================================================
  // Setup
  // ==========================================================================
  console.log('=== Staking Example ===\n');

  // Create wallet from mnemonic (in production, load from secure storage)
  const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const wallet = Wallet.fromMnemonic(mnemonic);
  wallet.connect('http://localhost:8545');

  const client = new TesseraClient('http://localhost:8545');

  console.log('Wallet address:', wallet.address);
  console.log('');

  // ==========================================================================
  // Check current balance and validators
  // ==========================================================================
  console.log('=== Current Status ===\n');

  try {
    const balance = await wallet.getBalance();
    console.log('Balance:', formatAmountWithSymbol(balance));

    const validators = await client.getValidators();
    console.log('Active validators:', validators.length);

    const isValidator = validators.some((v) => v.address === wallet.address);
    console.log('Is validator:', isValidator);
  } catch (error) {
    console.log('Error:', (error as Error).message);
  }
  console.log('');

  // ==========================================================================
  // Stake tokens
  // ==========================================================================
  console.log('=== Staking ===\n');

  try {
    // Stake 100,000 TESS (minimum requirement)
    const pendingTx = await wallet.stake({
      amount: '100000', // Human-readable
    });

    console.log('Stake transaction submitted!');
    console.log('Hash:', pendingTx.hash);

    const receipt = await pendingTx.wait();
    console.log('Confirmed! Status:', receipt.status);
  } catch (error) {
    console.log('Staking failed:', (error as Error).message);
  }
  console.log('');

  // ==========================================================================
  // Unstake tokens
  // ==========================================================================
  console.log('=== Unstaking ===\n');

  try {
    // Unstake 50,000 TESS
    const pendingTx = await wallet.unstake({
      amount: '50000',
    });

    console.log('Unstake transaction submitted!');
    console.log('Hash:', pendingTx.hash);
    console.log('Note: Tokens will be available after unbonding period (~7 days)');

    const receipt = await pendingTx.wait();
    console.log('Confirmed! Status:', receipt.status);
  } catch (error) {
    console.log('Unstaking failed:', (error as Error).message);
  }
}

main().catch(console.error);
