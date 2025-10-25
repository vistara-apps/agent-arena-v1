// b402 BSC Testnet - Complete End-to-End Test
import { Wallet, Contract, parseUnits, JsonRpcProvider } from 'ethers';
import { processPayment, DefaultFacilitatorClient } from './packages/b402-sdk/src';

// BSC Testnet Configuration
const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545";
const USDT_TESTNET = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
const B402_RELAYER = "0xd67eF16fa445101Ef1e1c6A9FB9F3014f1d60DE6";
const DEPLOYER_KEY = process.env.PRIVATE_KEY || ""; // Set via: export PRIVATE_KEY=0x...

const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

async function main() {
  console.log('\n🔥 b402.ai - BSC Testnet End-to-End Test\n');
  console.log('=========================================\n');

  const provider = new JsonRpcProvider(BSC_TESTNET_RPC);
  const wallet = new Wallet(DEPLOYER_KEY, provider);

  console.log('📋 Configuration:');
  console.log('  Wallet:', wallet.address);
  console.log('  B402 Relayer:', B402_RELAYER);
  console.log('  USDT Testnet:', USDT_TESTNET);
  console.log('  Network: BSC Testnet (97)');
  console.log('');

  // Check BNB balance
  const bnbBalance = await provider.getBalance(wallet.address);
  console.log('💰 BNB Balance:', (Number(bnbBalance) / 1e18).toFixed(4), 'BNB');

  // Check USDT balance
  const usdt = new Contract(USDT_TESTNET, USDT_ABI, wallet);
  const decimals = await usdt.decimals();
  const usdtBalance = await usdt.balanceOf(wallet.address);
  console.log('💵 USDT Balance:', (Number(usdtBalance) / 10**decimals).toFixed(2), 'USDT');
  console.log('');

  if (usdtBalance === 0n) {
    console.log('⚠️  No USDT found!');
    console.log('');
    console.log('Get testnet USDT:');
    console.log('  1. Go to: https://testnet.binance.vision/faucet-smart');
    console.log('  2. Paste address:', wallet.address);
    console.log('  3. Request USDT');
    console.log('');
    console.log('Or use PancakeSwap testnet to swap BNB → USDT');
    console.log('');
    return;
  }

  // Step 1: Check/Approve USDT
  console.log('1️⃣ Checking USDT approval...');
  const allowance = await usdt.allowance(wallet.address, B402_RELAYER);
  const requiredAllowance = parseUnits('1000', decimals);

  if (allowance < requiredAllowance) {
    console.log('   Current allowance:', (Number(allowance) / 10**decimals).toFixed(2), 'USDT');
    console.log('   Approving 1000 USDT...');

    const approveTx = await usdt.approve(B402_RELAYER, requiredAllowance);
    console.log('   Tx:', approveTx.hash);
    console.log('   Waiting for confirmation...');

    await approveTx.wait();
    console.log('   ✅ Approved!');
  } else {
    console.log('   ✅ Already approved:', (Number(allowance) / 10**decimals).toFixed(2), 'USDT');
  }
  console.log('');

  // Step 2: Create payment authorization
  console.log('2️⃣ Creating payment authorization...');
  const paymentAmount = parseUnits('1', decimals); // 1 USDT

  const requirements = {
    scheme: "exact" as const,
    network: "bsc-testnet" as const,
    asset: USDT_TESTNET,
    payTo: wallet.address, // Send to self for testing
    maxAmountRequired: paymentAmount.toString(),
    maxTimeoutSeconds: 600,
    relayerContract: B402_RELAYER,
  };

  console.log('   Amount: 1 USDT');
  console.log('   From:', wallet.address);
  console.log('   To:', wallet.address, '(self)');
  console.log('');

  // Step 3: Sign authorization (0 gas!)
  console.log('3️⃣ Signing authorization (0 gas)...');
  const payload = await processPayment(requirements, wallet);
  console.log('   ✅ Signed!');
  console.log('   Nonce:', payload.payload.authorization.nonce);
  console.log('   Signature:', payload.payload.signature.slice(0, 40) + '...');
  console.log('   Valid until:', new Date(payload.payload.authorization.validBefore * 1000).toISOString());
  console.log('');

  // Step 4: Verify with facilitator
  console.log('4️⃣ Verifying signature with facilitator...');
  const facilitator = new DefaultFacilitatorClient({ url: 'http://localhost:3402' });

  try {
    const verifyResult = await facilitator.verify(payload, requirements);

    if (!verifyResult.isValid) {
      console.error('   ❌ Verification failed:', verifyResult.invalidReason);
      return;
    }

    console.log('   ✅ Signature verified!');
    console.log('   Payer:', verifyResult.payer);
  } catch (error: any) {
    console.error('   ❌ Facilitator error:', error.message);
    console.log('');
    console.log('   Make sure facilitator is running:');
    console.log('   cd b402-facilitator && npm start');
    return;
  }
  console.log('');

  // Step 5: Settle payment on-chain
  console.log('5️⃣ Settling payment on BSC testnet...');
  console.log('   ⏳ Submitting transaction...');

  try {
    const settleResult = await facilitator.settle(payload, requirements);

    if (!settleResult.success) {
      console.error('   ❌ Settlement failed:', settleResult.errorReason);
      return;
    }

    console.log('   ✅ Payment settled!');
    console.log('   Transaction:', settleResult.transaction);
    if (settleResult.blockNumber) {
      console.log('   Block:', settleResult.blockNumber);
    }
    console.log('');
    console.log('   🔗 View on BSCScan:');
    console.log('   https://testnet.bscscan.com/tx/' + settleResult.transaction);
  } catch (error: any) {
    console.error('   ❌ Settlement error:', error.message);
    return;
  }
  console.log('');

  // Step 6: Verify balance changed
  console.log('6️⃣ Checking final balance...');
  const finalBalance = await usdt.balanceOf(wallet.address);
  console.log('   USDT Balance:', (Number(finalBalance) / 10**decimals).toFixed(2), 'USDT');
  console.log('');

  console.log('========================================');
  console.log('✅ TEST COMPLETED SUCCESSFULLY!');
  console.log('========================================');
  console.log('');
  console.log('Summary:');
  console.log('  ✅ Approved USDT to B402Relayer');
  console.log('  ✅ Signed payment authorization (0 gas)');
  console.log('  ✅ Verified signature with facilitator');
  console.log('  ✅ Settled payment on BSC testnet');
  console.log('  ✅ Transaction confirmed on-chain');
  console.log('');
  console.log('🔥 b402.ai is LIVE and working! 🔥');
  console.log('');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
