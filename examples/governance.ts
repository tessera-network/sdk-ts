/**
 * Governance Example
 *
 * This example shows how to:
 * - View chain parameters
 * - List proposals
 * - Submit a proposal
 * - Vote on a proposal
 */

import {
  Wallet,
  TesseraClient,
  formatAmountWithSymbol,
  formatBlockDuration,
  VoteOption,
} from '../src/index.js';

async function main() {
  // ==========================================================================
  // Setup
  // ==========================================================================
  console.log('=== Governance Example ===\n');

  const client = new TesseraClient('http://localhost:8545');

  // Wallet for voting (must be a validator)
  const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const wallet = Wallet.fromMnemonic(mnemonic);
  wallet.connect('http://localhost:8545');

  console.log('Validator address:', wallet.address);
  console.log('');

  // ==========================================================================
  // View chain parameters
  // ==========================================================================
  console.log('=== Chain Parameters ===\n');

  try {
    const params = await client.getChainParams();

    console.log('Max validators:', params.maxValidators);
    console.log('Min validator stake:', formatAmountWithSymbol(params.minValidatorStake));
    console.log('Base fee:', formatAmountWithSymbol(params.baseFee));
    console.log('Voting period:', formatBlockDuration(params.votingPeriod));
    console.log('Quorum:', (params.quorum / 100).toFixed(2) + '%');
    console.log('Threshold:', (params.threshold / 100).toFixed(2) + '%');
    console.log('Veto threshold:', (params.vetoThreshold / 100).toFixed(2) + '%');
  } catch (error) {
    console.log('Error:', (error as Error).message);
  }
  console.log('');

  // ==========================================================================
  // List proposals
  // ==========================================================================
  console.log('=== Active Proposals ===\n');

  try {
    const proposals = await client.getProposals();

    if (proposals.length === 0) {
      console.log('No active proposals');
    } else {
      for (const proposal of proposals) {
        console.log(`Proposal #${proposal.id}:`);
        console.log('  Title:', proposal.title);
        console.log('  Status:', proposal.status);
        console.log('  Proposer:', proposal.proposer.slice(0, 16) + '...');
        console.log('  Deposit:', formatAmountWithSymbol(proposal.deposit));
        console.log('  Votes - Yes:', proposal.votesYes.toString(),
          'No:', proposal.votesNo.toString(),
          'Abstain:', proposal.votesAbstain.toString(),
          'Veto:', proposal.votesVeto.toString());
        console.log('');
      }
    }
  } catch (error) {
    console.log('Error:', (error as Error).message);
  }
  console.log('');

  // ==========================================================================
  // Submit a proposal
  // ==========================================================================
  console.log('=== Submitting Proposal ===\n');

  try {
    const pendingTx = await wallet.submitProposal({
      title: 'Increase max validators',
      description: 'This proposal increases the maximum number of validators from 100 to 150 to improve decentralization.',
      changes: [
        { param: 'max_validators', value: 150 },
      ],
      deposit: '10000', // 10,000 TESS minimum
    });

    console.log('Proposal submitted!');
    console.log('Hash:', pendingTx.hash);

    const receipt = await pendingTx.wait();
    console.log('Confirmed! Status:', receipt.status);
  } catch (error) {
    console.log('Submit proposal failed:', (error as Error).message);
  }
  console.log('');

  // ==========================================================================
  // Vote on a proposal
  // ==========================================================================
  console.log('=== Voting ===\n');

  try {
    // Vote "Yes" on proposal #1
    const pendingTx = await wallet.vote({
      proposalId: 1,
      option: VoteOption.Yes, // or 'yes', 'no', 'abstain', 'no_with_veto'
    });

    console.log('Vote submitted!');
    console.log('Hash:', pendingTx.hash);

    const receipt = await pendingTx.wait();
    console.log('Confirmed! Status:', receipt.status);
  } catch (error) {
    console.log('Voting failed:', (error as Error).message);
  }
}

main().catch(console.error);
