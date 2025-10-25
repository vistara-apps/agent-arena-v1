// b402 Test Example - Complete Flow
// Run: npx tsx b402-test-example.ts

import { Wallet, Contract, parseUnits } from 'ethers';
import { processPayment, DefaultFacilitatorClient, USDT_BSC_TESTNET } from './packages/b402-sdk/src';

// Configuration
const CREATOR_KEY = process.env.CREATOR_PRIVATE_KEY!;
const AGENT_KEY = process.env.AGENT_PRIVATE_KEY!;
const B402_RELAYER = process.env.B402_RELAYER_ADDRESS!;
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'http://localhost:3402';

const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];

async function main() {
  console.log('🔥 b402 Test - BNB Chain Gasless Payments\n');

  // Setup wallets
  const creator = new Wallet(CREATOR_KEY);
  const agent = new Wallet(AGENT_KEY);

  console.log('👤 Creator:', creator.address);
  console.log('🤖 Agent:', agent.address);
  console.log('📝 B402 Relayer:', B402_RELAYER);
  console.log('');

  // Step 1: Check USDT approval
  console.log('1️⃣ Checking USDT approval...');
  const usdt = new Contract(USDT_BSC_TESTNET, USDT_ABI, creator);
  const allowance = await usdt.allowance(creator.address, B402_RELAYER);

  if (allowance === 0n) {
    console.log('⚠️  No approval found. Approving USDT...');
    const approveTx = await usdt.approve(B402_RELAYER, parseUnits('1000000', 18));
    await approveTx.wait();
    console.log('✅ Approved!');
  } else {
    console.log(`✅ Already approved: ${allowance.toString()}`);
  }
  console.log('');

  // Step 2: Create payment requirements
  console.log('2️⃣ Creating payment requirements...');
  const paymentAmount = parseUnits('100', 18); // 100 USDT

  const requirements = {
    scheme: "exact" as const,
    network: "bsc-testnet" as const,
    asset: USDT_BSC_TESTNET,
    payTo: agent.address,
    maxAmountRequired: paymentAmount.toString(),
    maxTimeoutSeconds: 600,
    relayerContract: B402_RELAYER,
  };

  console.log('💰 Amount: 100 USDT');
  console.log('→ To:', agent.address);
  console.log('');

  // Step 3: Creator signs authorization (0 gas!)
  console.log('3️⃣ Creator signing authorization (0 gas)...');
  const payload = await processPayment(requirements, creator);
  console.log('✅ Signed! Signature:', payload.payload.signature.slice(0, 20) + '...');
  console.log('📋 Nonce:', payload.payload.authorization.nonce);
  console.log('');

  // Step 4: Verify with facilitator
  console.log('4️⃣ Verifying with facilitator...');
  const facilitator = new DefaultFacilitatorClient({ url: FACILITATOR_URL });

  const verifyResult = await facilitator.verify(payload, requirements);
  if (!verifyResult.isValid) {
    console.error('❌ Verification failed:', verifyResult.invalidReason);
    process.exit(1);
  }
  console.log('✅ Verified! Payer:', verifyResult.payer);
  console.log('');

  // Step 5: Settle payment (agent/facilitator pays gas)
  console.log('5️⃣ Settling payment on-chain...');
  console.log('⏳ Waiting for transaction...');

  const settleResult = await facilitator.settle(payload, requirements);
  if (!settleResult.success) {
    console.error('❌ Settlement failed:', settleResult.errorReason);
    process.exit(1);
  }

  console.log('✅ Payment settled!');
  console.log('📦 Transaction:', settleResult.transaction);
  console.log('🔗 View on BSCScan:');
  console.log(`   https://testnet.bscscan.com/tx/${settleResult.transaction}`);
  console.log('');

  // Step 6: Check balances
  console.log('6️⃣ Checking balances...');
  const agentBalance = await usdt.balanceOf(agent.address);
  console.log('🤖 Agent balance:', agentBalance.toString(), 'USDT');
  console.log('');

  console.log('🎉 Test completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log('✅ Creator signed (0 gas)');
  console.log('✅ Facilitator verified signature');
  console.log('✅ Payment settled on BNB Chain');
  console.log('✅ Agent received 100 USDT');
}

main().catch(console.error);
