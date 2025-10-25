// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title B402Relayer
 * @notice Meta-transaction relayer for b402.ai (x402 for BNB Chain)
 * @dev Mimics EIP-3009 transferWithAuthorization for tokens that don't support it
 *
 * Works with USDT on BSC (0x55d398326f99059ff775485246999027b3197955)
 * Requires user to approve this contract first: USDT.approve(relayer, amount)
 */
contract B402Relayer is EIP712 {
    using ECDSA for bytes32;

    // EIP-712 TypeHash - matches x402 structure
    bytes32 public constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH = keccak256(
        "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
    );

    // Track used nonces (same as EIP-3009)
    mapping(address => mapping(bytes32 => bool)) public authorizationState;

    // Events (match EIP-3009)
    event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);
    event AuthorizationCanceled(address indexed authorizer, bytes32 indexed nonce);

    constructor() EIP712("B402", "1") {}

    /**
     * @notice Execute transfer with authorization (EIP-3009 compatible)
     * @param from Payer address
     * @param to Recipient address
     * @param value Amount to transfer
     * @param validAfter Timestamp after which authorization is valid
     * @param validBefore Timestamp before which authorization is valid
     * @param nonce Unique nonce
     * @param v Signature v
     * @param r Signature r
     * @param s Signature s
     */
    function transferWithAuthorization(
        address token,
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(block.timestamp > validAfter, "Authorization not yet valid");
        require(block.timestamp < validBefore, "Authorization expired");
        require(!authorizationState[from][nonce], "Authorization already used");

        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
                from,
                to,
                value,
                validAfter,
                validBefore,
                nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, v, r, s);
        require(signer == from, "Invalid signature");

        // Mark nonce as used
        authorizationState[from][nonce] = true;

        // Execute transfer (requires prior approval)
        require(
            IERC20(token).transferFrom(from, to, value),
            "Transfer failed"
        );

        emit AuthorizationUsed(from, nonce);
    }

    /**
     * @notice Cancel authorization (same as EIP-3009)
     */
    function cancelAuthorization(
        address authorizer,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(!authorizationState[authorizer][nonce], "Authorization used");

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                _domainSeparatorV4(),
                keccak256(abi.encode(authorizer, nonce))
            )
        );

        address signer = ECDSA.recover(digest, v, r, s);
        require(signer == authorizer, "Invalid signature");

        authorizationState[authorizer][nonce] = true;
        emit AuthorizationCanceled(authorizer, nonce);
    }
}
