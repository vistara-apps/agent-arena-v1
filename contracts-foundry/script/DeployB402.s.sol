// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/B402Relayer.sol";

contract DeployB402 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy B402 Relayer
        B402Relayer relayer = new B402Relayer();

        console.log("B402Relayer deployed at:", address(relayer));
        console.log("Network: BNB Chain");
        console.log("Ready to accept USDT meta-transactions");

        vm.stopBroadcast();
    }
}
