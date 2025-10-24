// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @notice Mock ERC-1271 smart contract wallet for testing
/// @dev This simulates a smart contract wallet that validates signatures from its owner
contract MockERC1271Wallet is IERC1271 {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    /// @notice ERC-1271 signature validation
    /// @dev Returns magic value if signature is valid, otherwise returns 0xffffffff
    function isValidSignature(bytes32 hash, bytes memory signature)
        external
        view
        override
        returns (bytes4 magicValue)
    {
        // Recover the signer from the signature
        address recovered = hash.recover(signature);

        // Check if the recovered address is the owner
        if (recovered == owner) {
            return IERC1271.isValidSignature.selector; // 0x1626ba7e
        } else {
            return 0xffffffff;
        }
    }
}
