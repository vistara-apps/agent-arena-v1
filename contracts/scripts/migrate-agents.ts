import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("Starting agent migration from old to new registry...");

  const [deployer] = await ethers.getSigners();
  console.log("Migration account:", deployer.address);

  // Load deployment addresses
  const fs = require("fs");
  const path = require("path");
  
  // You'll need to update these addresses based on your deployment
  const OLD_IDENTITY_REGISTRY = process.env.OLD_IDENTITY_REGISTRY || "";
  const NEW_IDENTITY_REGISTRY = process.env.NEW_IDENTITY_REGISTRY || "";
  
  if (!OLD_IDENTITY_REGISTRY || !NEW_IDENTITY_REGISTRY) {
    throw new Error("Please set OLD_IDENTITY_REGISTRY and NEW_IDENTITY_REGISTRY environment variables");
  }

  // Get contract instances
  const OldIdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const oldRegistry = OldIdentityRegistry.attach(OLD_IDENTITY_REGISTRY);

  const NewIdentityRegistry = await ethers.getContractFactory("IdentityRegistryUpgradeable");
  const newRegistry = NewIdentityRegistry.attach(NEW_IDENTITY_REGISTRY);

  console.log("Old registry:", OLD_IDENTITY_REGISTRY);
  console.log("New registry:", NEW_IDENTITY_REGISTRY);

  // Get all AgentRegistered events from old registry
  const filter = oldRegistry.filters.AgentRegistered();
  const events = await oldRegistry.queryFilter(filter);
  
  console.log(`\nFound ${events.length} agents to migrate`);

  const migrationResults = [];

  for (const event of events) {
    const agentAddress = event.args[0];
    const cardURI = event.args[1];
    
    console.log(`\nMigrating agent: ${agentAddress}`);
    console.log(`Card URI: ${cardURI}`);

    try {
      // Check if agent is still active
      const isActive = await oldRegistry.isAgentActive(agentAddress);
      if (!isActive) {
        console.log("⏭️  Skipping inactive agent");
        migrationResults.push({
          agent: agentAddress,
          status: "skipped",
          reason: "inactive"
        });
        continue;
      }

      // Register in new system (mint NFT)
      const tx = await newRegistry.register(
        cardURI,
        [
          {
            key: "agentWallet",
            value: ethers.encodeBytes32String(agentAddress)
          },
          {
            key: "migratedFrom",
            value: ethers.encodeBytes32String("v1")
          },
          {
            key: "migrationDate",
            value: ethers.encodeBytes32String(new Date().toISOString())
          }
        ]
      );

      const receipt = await tx.wait();
      
      // Get the minted token ID from the Transfer event
      const transferEvent = receipt.logs.find(
        (log: any) => log.topics[0] === ethers.id("Transfer(address,address,uint256)")
      );
      
      const agentId = ethers.toBigInt(transferEvent.topics[3]);
      
      console.log(`✅ Successfully migrated to agent ID: ${agentId}`);
      
      migrationResults.push({
        agent: agentAddress,
        status: "success",
        agentId: agentId.toString(),
        txHash: receipt.hash
      });

    } catch (error) {
      console.error(`❌ Failed to migrate agent ${agentAddress}:`, error);
      migrationResults.push({
        agent: agentAddress,
        status: "failed",
        error: error.message
      });
    }
  }

  // Save migration results
  const resultsFile = path.join(__dirname, `../deployments/migration-${Date.now()}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    oldRegistry: OLD_IDENTITY_REGISTRY,
    newRegistry: NEW_IDENTITY_REGISTRY,
    totalAgents: events.length,
    results: migrationResults
  }, null, 2));

  console.log("\n📊 Migration Summary:");
  const successful = migrationResults.filter(r => r.status === "success").length;
  const failed = migrationResults.filter(r => r.status === "failed").length;
  const skipped = migrationResults.filter(r => r.status === "skipped").length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`\nResults saved to: ${resultsFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});