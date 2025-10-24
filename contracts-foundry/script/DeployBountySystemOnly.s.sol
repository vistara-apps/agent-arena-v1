// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {BountySystemERC8004} from "../src/BountySystemERC8004.sol";

/**
 * @title DeployBountySystemOnly
 * @notice Deploys ONLY BountySystem - uses existing ERC-8004 singletons
 *
 * IMPORTANT: ERC-8004 singletons are already deployed!
 * We DO NOT deploy our own - we use the official ones.
 *
 * Base Sepolia (Official Singletons):
 *   Identity:    0x8004AA63c570c570eBF15376c0dB199918BFe9Fb
 *   Reputation:  0x8004bd8daB57f14Ed299135749a5CB5c42d341BF
 *   Validation:  0x8004C269D0A5647E51E121FeB226200ECE932d55
 *
 * Base Mainnet: (Coming by end of October 2025)
 *   TBA
 *
 * Usage:
 *   forge script script/DeployBountySystemOnly.s.sol:DeployBountySystemOnly \
 *     --rpc-url $BASE_SEPOLIA_RPC_URL \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 */
contract DeployBountySystemOnly is Script {
    // Official ERC-8004 Singletons on Base Sepolia
    address constant IDENTITY_REGISTRY = 0x8004AA63c570c570eBF15376c0dB199918BFe9Fb;
    address constant REPUTATION_REGISTRY = 0x8004bd8daB57f14Ed299135749a5CB5c42d341BF;
    address constant VALIDATION_REGISTRY = 0x8004C269D0A5647E51E121FeB226200ECE932d55;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("==========================================================");
        console.log("  Agent Arena BountySystem + Official ERC-8004");
        console.log("==========================================================");
        console.log("");
        console.log("Using OFFICIAL ERC-8004 Singletons (already deployed):");
        console.log("  Identity Registry:   ", IDENTITY_REGISTRY);
        console.log("  Reputation Registry: ", REPUTATION_REGISTRY);
        console.log("  Validation Registry: ", VALIDATION_REGISTRY);
        console.log("");
        console.log("Deploying BountySystem with:");
        console.log("  Deployer:", deployer);
        console.log("  Balance: ", deployer.balance / 1e18, "ETH");
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ONLY our BountySystem
        console.log("Deploying BountySystemERC8004...");
        BountySystemERC8004 bountySystem = new BountySystemERC8004(
            IDENTITY_REGISTRY,
            REPUTATION_REGISTRY,
            VALIDATION_REGISTRY
        );
        console.log("  BountySystem deployed at:", address(bountySystem));

        vm.stopBroadcast();

        console.log("");
        console.log("==========================================================");
        console.log("  DEPLOYMENT COMPLETE!");
        console.log("==========================================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("-------------------");
        console.log("Official ERC-8004 Singletons (shared by all apps):");
        console.log("  IdentityRegistry:    ", IDENTITY_REGISTRY);
        console.log("  ReputationRegistry:  ", REPUTATION_REGISTRY);
        console.log("  ValidationRegistry:  ", VALIDATION_REGISTRY);
        console.log("");
        console.log("Your Deployment:");
        console.log("  BountySystemERC8004: ", address(bountySystem));
        console.log("");
        console.log("Explorer Links:");
        console.log("  Identity:   https://sepolia.basescan.org/address/", IDENTITY_REGISTRY);
        console.log("  Reputation: https://sepolia.basescan.org/address/", REPUTATION_REGISTRY);
        console.log("  Validation: https://sepolia.basescan.org/address/", VALIDATION_REGISTRY);
        console.log("  BountySystem: https://sepolia.basescan.org/address/", address(bountySystem));
        console.log("");
        console.log("Save this address:");
        console.log("-------------------");
        console.log("BOUNTY_SYSTEM=", address(bountySystem));
        console.log("");
        console.log("WHY THIS MATTERS:");
        console.log("- You're using the OFFICIAL ERC-8004 singletons");
        console.log("- Agents registered here work on ALL platforms");
        console.log("- Reputation is portable across the ecosystem");
        console.log("- No isolated ecosystem - full interoperability!");
        console.log("");
    }
}
