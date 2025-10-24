// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";

// Import contracts directly without the interface conflicts
import {IdentityRegistry} from "../lib/erc-8004-contracts/contracts/IdentityRegistry.sol";
import {ReputationRegistry} from "../lib/erc-8004-contracts/contracts/ReputationRegistry.sol";
import {ValidationRegistry} from "../lib/erc-8004-contracts/contracts/ValidationRegistry.sol";
import {BountySystemERC8004} from "../src/BountySystemERC8004.sol";

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

        console.log("==========================================================");
        console.log("  Agent Arena + Official ERC-8004 Deployment");
        console.log("==========================================================");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e18, "ETH");
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy IdentityRegistry (Official ERC-8004)
        console.log("1/4 Deploying IdentityRegistry (ERC-721)...");
        IdentityRegistry identityRegistry = new IdentityRegistry();
        console.log("    Deployed at:", address(identityRegistry));

        // 2. Deploy ReputationRegistry (Official ERC-8004)
        console.log("2/4 Deploying ReputationRegistry...");
        ReputationRegistry reputationRegistry = new ReputationRegistry(
            address(identityRegistry)
        );
        console.log("    Deployed at:", address(reputationRegistry));

        // 3. Deploy ValidationRegistry (Official ERC-8004)
        console.log("3/4 Deploying ValidationRegistry...");
        ValidationRegistry validationRegistry = new ValidationRegistry(
            address(identityRegistry)
        );
        console.log("    Deployed at:", address(validationRegistry));

        // 4. Deploy Agent Arena BountySystem
        console.log("4/4 Deploying BountySystemERC8004...");
        BountySystemERC8004 bountySystem = new BountySystemERC8004(
            address(identityRegistry),
            address(reputationRegistry),
            address(validationRegistry)
        );
        console.log("    Deployed at:", address(bountySystem));

        vm.stopBroadcast();

        console.log("");
        console.log("==========================================================");
        console.log("  DEPLOYMENT COMPLETE!");
        console.log("==========================================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("-------------------");
        console.log("IdentityRegistry:    ", address(identityRegistry));
        console.log("ReputationRegistry:  ", address(reputationRegistry));
        console.log("ValidationRegistry:  ", address(validationRegistry));
        console.log("BountySystemERC8004: ", address(bountySystem));
        console.log("");
        console.log("Save these addresses for your .env file:");
        console.log("-------------------");
        console.log("IDENTITY_REGISTRY=", address(identityRegistry));
        console.log("REPUTATION_REGISTRY=", address(reputationRegistry));
        console.log("VALIDATION_REGISTRY=", address(validationRegistry));
        console.log("BOUNTY_SYSTEM=", address(bountySystem));
        console.log("");
    }
}
