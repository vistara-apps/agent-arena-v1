// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC8004Identity {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getMetadata(uint256 agentId, string memory key) external view returns (bytes memory);
}

interface IERC8004Reputation {
    struct FeedbackAuth {
        uint256 agentId;
        address clientAddress;
        uint64 indexLimit;
        uint256 expiry;
        uint256 chainId;
        address identityRegistry;
        address signerAddress;
    }
    
    function giveFeedback(
        uint256 agentId,
        uint8 score,
        bytes32 tag1,
        bytes32 tag2,
        string calldata feedbackUri,
        bytes32 feedbackHash,
        bytes calldata feedbackAuth
    ) external;
    
    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        bytes32 tag1,
        bytes32 tag2
    ) external view returns (uint64 count, uint8 averageScore);
}

/**
 * @title BountySystemERC8004
 * @dev Native ERC-8004 bounty system - agents MUST have NFTs
 */
contract BountySystemERC8004 is Ownable {
    using ECDSA for bytes32;

    IERC8004Identity public immutable identityRegistry;
    IERC8004Reputation public immutable reputationRegistry;

    struct Bounty {
        uint256 bountyId;
        address creator;
        string description;
        uint256 rewardAmount;
        address rewardToken;
        BountyStatus status;
        uint256 submissionDeadline;
        string verificationMethod;
        uint256 createdAt;
        uint256 assignedAgentId;
        string resultURI;
        uint256 platformFee;
    }

    enum BountyStatus {
        Open,
        Processing,
        Completed,
        Disputed,
        Cancelled
    }

    struct Submission {
        uint256 agentId;
        uint256 bountyId;
        string[] taskInputRefs;
        string resultHash;
        uint256 timestamp;
        bytes signature;
        string resultURI;
    }

    uint256 public nextBountyId = 1;
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Submission[]) public bountySubmissions;
    
    // Track which bounties an agent has worked on
    mapping(uint256 => uint256[]) public agentBounties;
    
    uint256 public constant PLATFORM_FEE_BASIS_POINTS = 500; // 5%

    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 rewardAmount);
    event SubmissionReceived(uint256 indexed bountyId, uint256 indexed agentId);
    event BountyAssigned(uint256 indexed bountyId, uint256 indexed agentId);
    event BountyCompleted(uint256 indexed bountyId, uint256 indexed agentId, uint256 payoutAmount);
    event FeedbackRecorded(uint256 indexed bountyId, uint256 indexed agentId, uint8 score);

    constructor(
        address _identityRegistry,
        address _reputationRegistry
    ) Ownable(msg.sender) {
        identityRegistry = IERC8004Identity(_identityRegistry);
        reputationRegistry = IERC8004Reputation(_reputationRegistry);
    }

    /**
     * @dev Create a bounty - anyone can create
     */
    function createBounty(
        string calldata description,
        uint256 rewardAmount,
        address rewardToken,
        uint256 submissionDeadline,
        string calldata verificationMethod
    ) external payable returns (uint256) {
        require(bytes(description).length > 0, "Description required");
        require(rewardAmount > 0, "Reward must be positive");
        require(submissionDeadline > block.timestamp, "Deadline must be future");

        uint256 bountyId = nextBountyId++;

        // Lock funds
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
            verificationMethod: verificationMethod,
            createdAt: block.timestamp,
            assignedAgentId: 0,
            resultURI: "",
            platformFee: PLATFORM_FEE_BASIS_POINTS
        });

        emit BountyCreated(bountyId, msg.sender, rewardAmount);
        return bountyId;
    }

    /**
     * @dev Agent submits work - MUST own an NFT
     */
    function submitWork(
        uint256 agentId,
        uint256 bountyId,
        string[] calldata taskInputRefs,
        string calldata resultHash,
        bytes calldata signature,
        string calldata resultURI
    ) external {
        // Verify agent owns the NFT
        require(identityRegistry.ownerOf(agentId) == msg.sender, "Not NFT owner");
        
        Bounty storage bounty = bounties[bountyId];
        require(bounty.bountyId != 0, "Bounty doesn't exist");
        require(bounty.status == BountyStatus.Open, "Bounty not open");
        require(block.timestamp <= bounty.submissionDeadline, "Deadline passed");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(agentId, bountyId, resultHash));
        require(messageHash.toEthSignedMessageHash().recover(signature) == msg.sender, "Invalid signature");

        // Record submission
        bountySubmissions[bountyId].push(Submission({
            agentId: agentId,
            bountyId: bountyId,
            taskInputRefs: taskInputRefs,
            resultHash: resultHash,
            timestamp: block.timestamp,
            signature: signature,
            resultURI: resultURI
        }));

        // Auto-assign to first submitter (or implement selection logic)
        if (bounty.assignedAgentId == 0) {
            bounty.assignedAgentId = agentId;
            bounty.status = BountyStatus.Processing;
            bounty.resultURI = resultURI;
            
            agentBounties[agentId].push(bountyId);
            
            emit BountyAssigned(bountyId, agentId);
        }

        emit SubmissionReceived(bountyId, agentId);
    }

    /**
     * @dev Creator approves and triggers payment + feedback
     */
    function approveAndPay(
        uint256 bountyId,
        uint8 satisfactionScore,
        string calldata feedbackNotes
    ) external {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.creator, "Only creator");
        require(bounty.status == BountyStatus.Processing, "Not processing");
        require(bounty.assignedAgentId != 0, "No agent assigned");

        bounty.status = BountyStatus.Completed;

        // Get agent's wallet address
        address agentWallet = identityRegistry.ownerOf(bounty.assignedAgentId);
        
        // Calculate payments
        uint256 platformFee = (bounty.rewardAmount * bounty.platformFee) / 10000;
        uint256 agentPayout = bounty.rewardAmount - platformFee;

        // Pay out
        if (bounty.rewardToken == address(0)) {
            payable(agentWallet).transfer(agentPayout);
            payable(owner()).transfer(platformFee);
        } else {
            IERC20(bounty.rewardToken).transfer(agentWallet, agentPayout);
            IERC20(bounty.rewardToken).transfer(owner(), platformFee);
        }

        // Record feedback in ERC-8004
        _giveFeedback(bounty.assignedAgentId, bountyId, satisfactionScore, feedbackNotes);

        emit BountyCompleted(bountyId, bounty.assignedAgentId, agentPayout);
        emit FeedbackRecorded(bountyId, bounty.assignedAgentId, satisfactionScore);
    }

    /**
     * @dev Internal: Give feedback through ERC-8004
     */
    function _giveFeedback(
        uint256 agentId,
        uint256 bountyId,
        uint8 score,
        string calldata notes
    ) internal {
        // Create feedback auth (pre-signed by agent when they registered)
        // In production, this would be passed in or stored
        bytes memory feedbackAuth = _createFeedbackAuth(agentId);
        
        reputationRegistry.giveFeedback(
            agentId,
            score,
            bytes32("bounty"),
            bytes32(bountyId),
            notes,
            keccak256(bytes(notes)),
            feedbackAuth
        );
    }

    /**
     * @dev Create feedback auth struct (simplified for demo)
     */
    function _createFeedbackAuth(uint256 agentId) internal view returns (bytes memory) {
        // In production: Agent pre-signs this when registering
        // For now, return empty auth that contract would validate
        return abi.encode(
            agentId,
            msg.sender,
            uint64(100), // indexLimit
            block.timestamp + 30 days,
            block.chainid,
            address(identityRegistry),
            address(this)
        );
    }

    /**
     * @dev Get agent's reputation from ERC-8004
     */
    function getAgentStats(uint256 agentId) external view returns (
        uint64 totalJobs,
        uint8 avgScore,
        uint256[] memory recentBounties
    ) {
        (totalJobs, avgScore) = reputationRegistry.getSummary(
            agentId,
            new address[](0),
            bytes32("bounty"),
            bytes32(0)
        );
        
        recentBounties = agentBounties[agentId];
    }

    /**
     * @dev Find top agents by reputation
     */
    function getTopAgents(uint256 limit) external view returns (
        uint256[] memory agentIds,
        uint8[] memory scores
    ) {
        // This would query reputation registry
        // Simplified for example
    }

    /**
     * @dev Cancel bounty and refund
     */
    function cancelBounty(uint256 bountyId) external {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.creator, "Only creator");
        require(bounty.status == BountyStatus.Open, "Can only cancel open bounties");
        
        bounty.status = BountyStatus.Cancelled;
        
        // Refund
        if (bounty.rewardToken == address(0)) {
            payable(bounty.creator).transfer(bounty.rewardAmount);
        } else {
            IERC20(bounty.rewardToken).transfer(bounty.creator, bounty.rewardAmount);
        }
    }
}