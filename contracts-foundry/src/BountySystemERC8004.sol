// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IdentityRegistry} from "../lib/erc-8004-contracts/contracts/IdentityRegistry.sol";
import {ReputationRegistry} from "../lib/erc-8004-contracts/contracts/ReputationRegistry.sol";
import {ValidationRegistry} from "../lib/erc-8004-contracts/contracts/ValidationRegistry.sol";

/**
 * @title BountySystemERC8004
 * @notice Agent Arena's Bounty System integrated with OFFICIAL ERC-8004 protocol
 * @dev Uses official ERC-8004 contracts from github.com/erc-8004/erc-8004-contracts
 *
 * WHAT THIS UNLOCKS:
 * 1. NFT-Based Agent Identities (ERC-721)
 * 2. Portable Reputation Across Platforms
 * 3. Decentralized Trust (no intermediaries)
 * 4. Validation Framework (zkML, TEE, staking)
 * 5. Automatic Escrow & Payments
 */
contract BountySystemERC8004 is Ownable {
    using ECDSA for bytes32;

    // Official ERC-8004 Registries
    IdentityRegistry public immutable identityRegistry;
    ReputationRegistry public immutable reputationRegistry;
    ValidationRegistry public immutable validationRegistry;

    struct Bounty {
        uint256 bountyId;
        address creator;
        string description;
        uint256 rewardAmount;
        address rewardToken; // address(0) for ETH
        BountyStatus status;
        uint256 submissionDeadline;
        uint256 createdAt;
        uint256 assignedAgentId; // ERC-8004 NFT token ID
        string resultURI;
    }

    struct Submission {
        uint256 agentId;
        address agentWallet;
        string resultHash;
        string resultURI;
        uint256 timestamp;
        bytes signature;
    }

    enum BountyStatus {
        Open,
        Assigned,
        Submitted,
        Validated,
        Completed,
        Disputed
    }

    // State
    uint256 public nextBountyId = 1;
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Submission[]) public submissions;
    mapping(uint256 => uint256[]) public agentBounties; // agentId => bountyIds

    uint256 public constant PLATFORM_FEE_BPS = 500; // 5%

    // Events
    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 amount);
    event BountyClaimed(uint256 indexed bountyId, uint256 indexed agentId);
    event BountySubmitted(uint256 indexed bountyId, uint256 indexed agentId, string resultURI);
    event BountyCompleted(uint256 indexed bountyId, uint256 indexed agentId, uint256 payout);
    event FeedbackGiven(uint256 indexed bountyId, uint256 indexed agentId, uint8 score);

    constructor(
        address _identityRegistry,
        address _reputationRegistry,
        address _validationRegistry
    ) Ownable(msg.sender) {
        require(_identityRegistry != address(0), "Invalid identity registry");
        require(_reputationRegistry != address(0), "Invalid reputation registry");
        require(_validationRegistry != address(0), "Invalid validation registry");

        identityRegistry = IdentityRegistry(_identityRegistry);
        reputationRegistry = ReputationRegistry(_reputationRegistry);
        validationRegistry = ValidationRegistry(_validationRegistry);
    }

    /**
     * @notice Create bounty with escrow
     */
    function createBounty(
        string calldata description,
        uint256 rewardAmount,
        address rewardToken,
        uint256 submissionDeadline
    ) external payable returns (uint256) {
        require(bytes(description).length > 0, "Description required");
        require(rewardAmount > 0, "Reward must be positive");
        require(submissionDeadline > block.timestamp, "Invalid deadline");

        uint256 bountyId = nextBountyId++;

        // Escrow funds
        if (rewardToken == address(0)) {
            require(msg.value >= rewardAmount, "Insufficient ETH");
        } else {
            IERC20(rewardToken).transferFrom(msg.sender, address(this), rewardAmount);
        }

        bounties[bountyId] = Bounty({
            bountyId: bountyId,
            creator: msg.sender,
            description: description,
            rewardAmount: rewardAmount,
            rewardToken: rewardToken,
            status: BountyStatus.Open,
            submissionDeadline: submissionDeadline,
            createdAt: block.timestamp,
            assignedAgentId: 0,
            resultURI: ""
        });

        emit BountyCreated(bountyId, msg.sender, rewardAmount);
        return bountyId;
    }

    /**
     * @notice Agent claims bounty using ERC-8004 identity
     */
    function claimBounty(uint256 bountyId, uint256 agentId) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == BountyStatus.Open, "Not open");
        require(identityRegistry.ownerOf(agentId) == msg.sender, "Not agent owner");

        bounty.status = BountyStatus.Assigned;
        bounty.assignedAgentId = agentId;
        agentBounties[agentId].push(bountyId);

        emit BountyClaimed(bountyId, agentId);
    }

    /**
     * @notice Submit work with verifiable receipt
     */
    function submitWork(
        uint256 bountyId,
        string calldata resultHash,
        string calldata resultURI,
        bytes calldata signature
    ) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == BountyStatus.Assigned, "Not assigned");
        require(block.timestamp <= bounty.submissionDeadline, "Deadline passed");

        uint256 agentId = bounty.assignedAgentId;
        require(identityRegistry.ownerOf(agentId) == msg.sender, "Not assigned agent");

        // Store submission
        submissions[bountyId].push(Submission({
            agentId: agentId,
            agentWallet: msg.sender,
            resultHash: resultHash,
            resultURI: resultURI,
            timestamp: block.timestamp,
            signature: signature
        }));

        bounty.status = BountyStatus.Submitted;
        bounty.resultURI = resultURI;

        emit BountySubmitted(bountyId, agentId, resultURI);
    }

    /**
     * @notice Complete bounty and give feedback via ERC-8004
     */
    function completeBounty(
        uint256 bountyId,
        uint8 score,
        bytes32 tag1,
        bytes32 tag2,
        string calldata feedbackUri,
        bytes32 feedbackHash,
        bytes calldata feedbackAuth
    ) external {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.creator, "Only creator");
        require(bounty.status == BountyStatus.Submitted, "Not submitted");

        uint256 agentId = bounty.assignedAgentId;
        address agentWallet = identityRegistry.ownerOf(agentId);

        // Give feedback via official ERC-8004 ReputationRegistry
        reputationRegistry.giveFeedback(
            agentId,
            score,
            tag1,
            tag2,
            feedbackUri,
            feedbackHash,
            feedbackAuth
        );

        // Calculate payout
        uint256 fee = (bounty.rewardAmount * PLATFORM_FEE_BPS) / 10000;
        uint256 payout = bounty.rewardAmount - fee;

        // Release escrow
        if (bounty.rewardToken == address(0)) {
            payable(agentWallet).transfer(payout);
            payable(owner()).transfer(fee);
        } else {
            IERC20(bounty.rewardToken).transfer(agentWallet, payout);
            IERC20(bounty.rewardToken).transfer(owner(), fee);
        }

        bounty.status = BountyStatus.Completed;

        emit BountyCompleted(bountyId, agentId, payout);
        emit FeedbackGiven(bountyId, agentId, score);
    }

    /**
     * @notice Get agent reputation from official ERC-8004
     */
    function getAgentReputation(uint256 agentId)
        external
        view
        returns (uint64 count, uint8 avgScore)
    {
        return reputationRegistry.getSummary(
            agentId,
            new address[](0),
            bytes32(0),
            bytes32(0)
        );
    }

    /**
     * @notice Get agent validation summary
     */
    function getAgentValidations(uint256 agentId)
        external
        view
        returns (uint64 count, uint8 avgResponse)
    {
        return validationRegistry.getSummary(
            agentId,
            new address[](0),
            bytes32(0)
        );
    }

    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }

    function getSubmissions(uint256 bountyId) external view returns (Submission[] memory) {
        return submissions[bountyId];
    }

    function getAgentBounties(uint256 agentId) external view returns (uint256[] memory) {
        return agentBounties[agentId];
    }
}
