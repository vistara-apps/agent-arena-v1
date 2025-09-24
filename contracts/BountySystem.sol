// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IdentityRegistry.sol";

/**
 * @title BountySystem
 * @dev Smart contract for managing bounties in ClipperVerse
 * Handles bounty creation, submissions, verification, and payouts
 */
contract BountySystem is Ownable {
    using ECDSA for bytes32;

    IdentityRegistry public immutable identityRegistry;

    struct Bounty {
        uint256 bountyId;
        address creator;
        string description;
        uint256 rewardAmount;
        address rewardToken; // ETH: address(0), USDC: token address
        string status; // "open", "processing", "completed", "disputed"
        uint256 submissionDeadline;
        string verificationMethod;
        uint256 createdAt;
        address assignedAgent;
        string resultURI;
        uint256 platformFee; // 5% = 500, 10% = 1000 (basis points)
    }

    struct Receipt {
        address agentAddress;
        uint256 bountyId;
        string[] taskInputRefs;
        string resultHash;
        uint256 timestamp;
        bytes signature;
        string resultURI;
    }

    // State variables
    uint256 public nextBountyId = 1;
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Receipt[]) public bountyReceipts;
    mapping(uint256 => address[]) public bountyReferees;

    uint256 public constant PLATFORM_FEE_BASIS_POINTS = 500; // 5%
    uint256 public constant MAX_FEE_BASIS_POINTS = 1000; // 10%

    // Events
    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 rewardAmount);
    event BountyAssigned(uint256 indexed bountyId, address indexed agent);
    event ReceiptSubmitted(uint256 indexed bountyId, address indexed agent, string resultURI);
    event BountyCompleted(uint256 indexed bountyId, address indexed agent, uint256 payoutAmount);
    event BountyDisputed(uint256 indexed bountyId, string reason);
    event PayoutProcessed(uint256 indexed bountyId, address indexed agent, uint256 amount);

    constructor(address _identityRegistry) {
        identityRegistry = IdentityRegistry(_identityRegistry);
    }

    /**
     * @dev Create a new bounty
     * @param description Bounty description
     * @param rewardAmount Reward amount in wei or token units
     * @param rewardToken Token address (address(0) for ETH)
     * @param submissionDeadline Unix timestamp for deadline
     * @param verificationMethod Method for verification
     */
    function createBounty(
        string calldata description,
        uint256 rewardAmount,
        address rewardToken,
        uint256 submissionDeadline,
        string calldata verificationMethod
    ) external payable returns (uint256) {
        require(bytes(description).length > 0, "Description required");
        require(rewardAmount > 0, "Reward amount must be positive");
        require(submissionDeadline > block.timestamp, "Deadline must be in future");

        uint256 bountyId = nextBountyId++;

        // Handle payment
        if (rewardToken == address(0)) {
            require(msg.value >= rewardAmount, "Insufficient ETH sent");
        } else {
            IERC20(rewardToken).transferFrom(msg.sender, address(this), rewardAmount);
        }

        bounties[bountyId] = Bounty({
            bountyId: bountyId,
            creator: msg.sender,
            description: description,
            rewardAmount: rewardAmount,
            rewardToken: rewardToken,
            status: "open",
            submissionDeadline: submissionDeadline,
            verificationMethod: verificationMethod,
            createdAt: block.timestamp,
            assignedAgent: address(0),
            resultURI: "",
            platformFee: PLATFORM_FEE_BASIS_POINTS
        });

        emit BountyCreated(bountyId, msg.sender, rewardAmount);
        return bountyId;
    }

    /**
     * @dev Submit a receipt for a bounty
     * @param bountyId ID of the bounty
     * @param taskInputRefs References to task inputs
     * @param resultHash Hash of the result
     * @param signature Agent's signature
     * @param resultURI URI to the result data
     */
    function submitReceipt(
        uint256 bountyId,
        string[] calldata taskInputRefs,
        string calldata resultHash,
        bytes calldata signature,
        string calldata resultURI
    ) external {
        Bounty storage bounty = bounties[bountyId];
        require(bytes(bounty.status).length > 0, "Bounty does not exist");
        require(keccak256(abi.encodePacked(bounty.status)) == keccak256(abi.encodePacked("open")), "Bounty not open");
        require(block.timestamp <= bounty.submissionDeadline, "Submission deadline passed");
        require(identityRegistry.isAgentActive(msg.sender), "Agent not registered or inactive");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            bountyId,
            taskInputRefs,
            resultHash,
            block.timestamp
        ));
        require(
            identityRegistry.verifyAgentSignature(msg.sender, messageHash, signature),
            "Invalid signature"
        );

        Receipt memory receipt = Receipt({
            agentAddress: msg.sender,
            bountyId: bountyId,
            taskInputRefs: taskInputRefs,
            resultHash: resultHash,
            timestamp: block.timestamp,
            signature: signature,
            resultURI: resultURI
        });

        bountyReceipts[bountyId].push(receipt);
        bounty.status = "processing";
        bounty.assignedAgent = msg.sender;
        bounty.resultURI = resultURI;

        emit ReceiptSubmitted(bountyId, msg.sender, resultURI);
    }

    /**
     * @dev Approve and process bounty completion
     * @param bountyId ID of the bounty
     */
    function approveBounty(uint256 bountyId) external {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.creator, "Only creator can approve");
        require(keccak256(abi.encodePacked(bounty.status)) == keccak256(abi.encodePacked("processing")), "Bounty not processing");
        require(bounty.assignedAgent != address(0), "No agent assigned");

        bounty.status = "completed";

        // Calculate platform fee and agent payout
        uint256 platformFee = (bounty.rewardAmount * bounty.platformFee) / 10000;
        uint256 agentPayout = bounty.rewardAmount - platformFee;

        // Process payout
        if (bounty.rewardToken == address(0)) {
            payable(bounty.assignedAgent).transfer(agentPayout);
            payable(owner()).transfer(platformFee);
        } else {
            IERC20(bounty.rewardToken).transfer(bounty.assignedAgent, agentPayout);
            IERC20(bounty.rewardToken).transfer(owner(), platformFee);
        }

        emit BountyCompleted(bountyId, bounty.assignedAgent, agentPayout);
        emit PayoutProcessed(bountyId, bounty.assignedAgent, agentPayout);
    }

    /**
     * @dev Dispute a bounty result
     * @param bountyId ID of the bounty
     * @param reason Reason for dispute
     */
    function disputeBounty(uint256 bountyId, string calldata reason) external {
        Bounty storage bounty = bounties[bountyId];
        require(
            msg.sender == bounty.creator || msg.sender == bounty.assignedAgent,
            "Only creator or assigned agent can dispute"
        );
        require(keccak256(abi.encodePacked(bounty.status)) == keccak256(abi.encodePacked("processing")), "Bounty not processing");

        bounty.status = "disputed";
        emit BountyDisputed(bountyId, reason);
    }

    /**
     * @dev Get bounty details
     * @param bountyId ID of the bounty
     */
    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }

    /**
     * @dev Get receipts for a bounty
     * @param bountyId ID of the bounty
     */
    function getBountyReceipts(uint256 bountyId) external view returns (Receipt[] memory) {
        return bountyReceipts[bountyId];
    }

    /**
     * @dev Emergency withdrawal for owner
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
}

