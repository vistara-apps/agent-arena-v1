import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("Deploying ERC-8004 upgradeable contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy IdentityRegistry
  console.log("\n1. Deploying IdentityRegistryUpgradeable...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistryUpgradeable");
  const identityProxy = await upgrades.deployProxy(IdentityRegistry, [], {
    initializer: "initialize",
    kind: "uups"
  });
  await identityProxy.waitForDeployment();
  const identityAddress = await identityProxy.getAddress();
  console.log("IdentityRegistry deployed to:", identityAddress);

  // Deploy ReputationRegistry
  console.log("\n2. Deploying ReputationRegistryUpgradeable...");
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistryUpgradeable");
  const reputationProxy = await upgrades.deployProxy(
    ReputationRegistry,
    [identityAddress],
    {
      initializer: "initialize",
      kind: "uups"
    }
  );
  await reputationProxy.waitForDeployment();
  const reputationAddress = await reputationProxy.getAddress();
  console.log("ReputationRegistry deployed to:", reputationAddress);

  // Deploy ValidationRegistry
  console.log("\n3. Deploying ValidationRegistryUpgradeable...");
  const ValidationRegistry = await ethers.getContractFactory("ValidationRegistryUpgradeable");
  const validationProxy = await upgrades.deployProxy(
    ValidationRegistry,
    [identityAddress],
    {
      initializer: "initialize",
      kind: "uups"
    }
  );
  await validationProxy.waitForDeployment();
  const validationAddress = await validationProxy.getAddress();
  console.log("ValidationRegistry deployed to:", validationAddress);

  // Deploy BountySystemV2
  console.log("\n4. Deploying BountySystemV2...");
  const BountySystemV2 = await ethers.getContractFactory("BountySystemV2");
  const bountyProxy = await upgrades.deployProxy(
    BountySystemV2,
    [identityAddress, reputationAddress],
    {
      initializer: "initialize",
      kind: "uups"
    }
  );
  await bountyProxy.waitForDeployment();
  const bountyAddress = await bountyProxy.getAddress();
  console.log("BountySystemV2 deployed to:", bountyAddress);

  // Save deployment addresses
  const deployment = {
    network: network.name,
    contracts: {
      IdentityRegistry: identityAddress,
      ReputationRegistry: reputationAddress,
      ValidationRegistry: validationAddress,
      BountySystemV2: bountyAddress
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = path.join(deploymentsDir, `${network.name}-${Date.now()}.json`);
  fs.writeFileSync(filename, JSON.stringify(deployment, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("Deployment info saved to:", filename);
  console.log("\nContract addresses:");
  console.log("- IdentityRegistry:", identityAddress);
  console.log("- ReputationRegistry:", reputationAddress);
  console.log("- ValidationRegistry:", validationAddress);
  console.log("- BountySystemV2:", bountyAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});