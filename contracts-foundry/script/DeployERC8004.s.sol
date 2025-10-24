// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "@erc8004/IdentityRegistry.sol";
import "@erc8004/ReputationRegistry.sol";
import "@erc8004/ValidationRegistry.sol";
import "../src/BountySystemERC8004.sol";

/**
 * @title DeployERC8004
 * @notice Deploys official ERC-8004 contracts + Agent Arena BountySystem
 *
 * Usage:
 *   forge script script/DeployERC8004.s.sol:DeployERC8004 \
 *     --rpc-url $BASE_SEPOLIA_RPC_URL \
 *     --broadcast \
 *     --verify
 */
contract DeployERC8004 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Agent Arena + Official ERC-8004 Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy IdentityRegistry (Official ERC-8004)
        console.log("Deploying IdentityRegistry (ERC-721)...");
        IdentityRegistry identityRegistry = new IdentityRegistry();
        console.log("  IdentityRegistry:", address(identityRegistry));

        // 2. Deploy ReputationRegistry (Official ERC-8004)
        console.log("Deploying ReputationRegistry...");
        ReputationRegistry reputationRegistry = new ReputationRegistry(
            address(identityRegistry)
        );
        console.log("  ReputationRegistry:", address(reputationRegistry));

        // 3. Deploy ValidationRegistry (Official ERC-8004)
        console.log("Deploying ValidationRegistry...");
        ValidationRegistry validationRegistry = new ValidationRegistry(
            address(identityRegistry)
        );
        console.log("  ValidationRegistry:", address(validationRegistry));

        // 4. Deploy Agent Arena BountySystem
        console.log("Deploying BountySystemERC8004...");
        BountySystemERC8004 bountySystem = new BountySystemERC8004(
            address(identityRegistry),
            address(reputationRegistry),
            address(validationRegistry)
        );
        console.log("  BountySystemERC8004:", address(bountySystem));

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("");
        console.log("Contracts deployed:");
        console.log("  IdentityRegistry:    ", address(identityRegistry));
        console.log("  ReputationRegistry:  ", address(reputationRegistry));
        console.log("  ValidationRegistry:  ", address(validationRegistry));
        console.log("  BountySystemERC8004: ", address(bountySystem));
        console.log("");
        console.log("=== VERIFICATION COMMANDS ===");
        console.log("");
        console.log("forge verify-contract", address(identityRegistry), "IdentityRegistry", "--chain baseSepolia");
        console.log("forge verify-contract", address(reputationRegistry), "ReputationRegistry", "--chain baseSepolia", "--constructor-args $(cast abi-encode 'constructor(address)' ", address(identityRegistry), ")");
        console.log("forge verify-contract", address(validationRegistry), "ValidationRegistry", "--chain baseSepolia", "--constructor-args $(cast abi-encode 'constructor(address)' ", address(identityRegistry), ")");
        console.log("forge verify-contract", address(bountySystem), "BountySystemERC8004", "--chain baseSepolia", "--constructor-args $(cast abi-encode 'constructor(address,address,address)' ", address(identityRegistry), address(reputationRegistry), address(validationRegistry), ")");
        console.log("");
        console.log("=== WHAT THIS UNLOCKS ===");
        console.log("");
        console.log("1. NFT-Based Agent Identities (portable across platforms)");
        console.log("2. Decentralized Reputation (no intermediaries)");
        console.log("3. Validation Framework (zkML, TEE, staking)");
        console.log("4. Automatic Escrow + Payments");
        console.log("5. Interoperability (compatible with all ERC-8004 platforms)");
        console.log("");
        console.log("Read OFFICIAL_ERC8004_SHOWCASE.md for full details!");
        console.log("");
    }
}
