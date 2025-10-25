import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("Upgrading contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Upgrading with account:", deployer.address);

  // Contract addresses - these should be loaded from your deployment files
  const IDENTITY_PROXY = process.env.IDENTITY_PROXY || "";
  const REPUTATION_PROXY = process.env.REPUTATION_PROXY || "";
  const VALIDATION_PROXY = process.env.VALIDATION_PROXY || "";
  const BOUNTY_PROXY = process.env.BOUNTY_PROXY || "";

  if (!IDENTITY_PROXY || !REPUTATION_PROXY || !VALIDATION_PROXY || !BOUNTY_PROXY) {
    throw new Error("Please set all PROXY environment variables");
  }

  // Upgrade IdentityRegistry if needed
  if (process.env.UPGRADE_IDENTITY === "true") {
    console.log("\nUpgrading IdentityRegistry...");
    const IdentityRegistryV2 = await ethers.getContractFactory("IdentityRegistryUpgradeable");
    const upgraded = await upgrades.upgradeProxy(IDENTITY_PROXY, IdentityRegistryV2);
    await upgraded.waitForDeployment();
    console.log("IdentityRegistry upgraded");
  }

  // Upgrade ReputationRegistry if needed
  if (process.env.UPGRADE_REPUTATION === "true") {
    console.log("\nUpgrading ReputationRegistry...");
    const ReputationRegistryV2 = await ethers.getContractFactory("ReputationRegistryUpgradeable");
    const upgraded = await upgrades.upgradeProxy(REPUTATION_PROXY, ReputationRegistryV2);
    await upgraded.waitForDeployment();
    console.log("ReputationRegistry upgraded");
  }

  // Upgrade ValidationRegistry if needed
  if (process.env.UPGRADE_VALIDATION === "true") {
    console.log("\nUpgrading ValidationRegistry...");
    const ValidationRegistryV2 = await ethers.getContractFactory("ValidationRegistryUpgradeable");
    const upgraded = await upgrades.upgradeProxy(VALIDATION_PROXY, ValidationRegistryV2);
    await upgraded.waitForDeployment();
    console.log("ValidationRegistry upgraded");
  }

  // Upgrade BountySystem if needed
  if (process.env.UPGRADE_BOUNTY === "true") {
    console.log("\nUpgrading BountySystem...");
    const BountySystemV2 = await ethers.getContractFactory("BountySystemV2");
    const upgraded = await upgrades.upgradeProxy(BOUNTY_PROXY, BountySystemV2);
    await upgraded.waitForDeployment();
    console.log("BountySystem upgraded");
  }

  console.log("\n✅ Upgrades complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});