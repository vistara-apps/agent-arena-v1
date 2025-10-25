import { ethers } from "hardhat";

/**
 * Deployment script for official ERC-8004 integration with Agent Arena
 *
 * This deploys:
 * 1. IdentityRegistry (ERC-721 based agent IDs)
 * 2. ReputationRegistry (feedback system)
 * 3. ValidationRegistry (verification system)
 * 4. BountySystemWithERC8004 (integrated bounty + escrow)
 */

async function main() {
  console.log("🚀 Deploying Official ERC-8004 Integration for Agent Arena\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. Deploy IdentityRegistry
  console.log("📝 Deploying IdentityRegistry (ERC-721)...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  const identityAddress = await identityRegistry.getAddress();
  console.log("✅ IdentityRegistry deployed to:", identityAddress);

  // 2. Deploy ReputationRegistry
  console.log("\n⭐ Deploying ReputationRegistry...");
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
  const reputationRegistry = await ReputationRegistry.deploy(identityAddress);
  await reputationRegistry.waitForDeployment();
  const reputationAddress = await reputationRegistry.getAddress();
  console.log("✅ ReputationRegistry deployed to:", reputationAddress);

  // 3. Deploy ValidationRegistry
  console.log("\n✓ Deploying ValidationRegistry...");
  const ValidationRegistry = await ethers.getContractFactory("ValidationRegistry");
  const validationRegistry = await ValidationRegistry.deploy(identityAddress);
  await validationRegistry.waitForDeployment();
  const validationAddress = await validationRegistry.getAddress();
  console.log("✅ ValidationRegistry deployed to:", validationAddress);

  // 4. Deploy BountySystemWithERC8004
  console.log("\n💰 Deploying BountySystemWithERC8004...");
  const BountySystem = await ethers.getContractFactory("BountySystemWithERC8004");
  const bountySystem = await BountySystem.deploy(
    identityAddress,
    reputationAddress,
    validationAddress,
    deployer.address
  );
  await bountySystem.waitForDeployment();
  const bountyAddress = await bountySystem.getAddress();
  console.log("✅ BountySystemWithERC8004 deployed to:", bountyAddress);

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 DEPLOYMENT SUMMARY - Agent Arena + Official ERC-8004");
  console.log("=".repeat(70));
  console.log("\nCore ERC-8004 Contracts:");
  console.log("  IdentityRegistry:    ", identityAddress);
  console.log("  ReputationRegistry:  ", reputationAddress);
  console.log("  ValidationRegistry:  ", validationAddress);
  console.log("\nAgent Arena:");
  console.log("  BountySystem:        ", bountyAddress);
  console.log("\nDeployer:", deployer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      identityRegistry: identityAddress,
      reputationRegistry: reputationAddress,
      validationRegistry: validationAddress,
      bountySystem: bountyAddress,
    },
  };

  console.log("\n📄 Deployment Info (JSON):");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verification commands
  console.log("\n" + "=".repeat(70));
  console.log("🔍 VERIFICATION COMMANDS");
  console.log("=".repeat(70));
  console.log("\nRun these to verify on BaseScan:");
  console.log(`\nnpx hardhat verify --network baseSepolia ${identityAddress}`);
  console.log(`npx hardhat verify --network baseSepolia ${reputationAddress} "${identityAddress}"`);
  console.log(`npx hardhat verify --network baseSepolia ${validationAddress} "${identityAddress}"`);
  console.log(`npx hardhat verify --network baseSepolia ${bountyAddress} "${identityAddress}" "${reputationAddress}" "${validationAddress}" "${deployer.address}"`);

  // Next steps
  console.log("\n" + "=".repeat(70));
  console.log("📋 NEXT STEPS");
  console.log("=".repeat(70));
  console.log("\n1. Verify contracts on BaseScan (see commands above)");
  console.log("2. Update frontend with new contract addresses");
  console.log("3. Update SDK packages with new ABIs");
  console.log("4. Test agent registration flow");
  console.log("5. Test bounty creation → claim → submit → feedback flow");
  console.log("6. Test validation request flow");
  console.log("\n✅ Deployment complete!\n");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
