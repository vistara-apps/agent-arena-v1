// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./official-erc8004/IdentityRegistry.sol";
import "./official-erc8004/ReputationRegistry.sol";
import "./official-erc8004/ValidationRegistry.sol";

/**
 * @title BountySystemWithERC8004
 * @notice Agent Arena's Bounty System integrated with official ERC-8004 protocol
 * @dev Combines escrow, verifiable receipts, and ERC-8004 reputation/validation
 *
 * KEY FEATURES ENABLED BY ERC-8004:
 * 1. NFT-Based Agent Identities: Portable, transferable agent IDs
 * 2. Decentralized Reputation: Client feedback tracked on-chain
 * 3. Validation Framework: Support for zkML, TEE, stake-secured verification
 * 4. Composable Trust: Multiple trust models (reputation, validation, TEE)
 * 5. Interoperability: Compatible with all ERC-8004 compliant systems
 */
contract BountySystemWithERC8004 is Ownable {
    using ECDSA for bytes32;

    // ERC-8004 Registries
    IdentityRegistry public immutable identityRegistry;
    ReputationRegistry public immutable reputationRegistry;
    ValidationRegistry public immutable validationRegistry;

    struct Bounty {
        uint256 bountyId;
        address creator;
        string description;
        uint256 rewardAmount;
        address rewardToken; // address(0) for native ETH
        BountyStatus status;
        uint256 submissionDeadline;
        uint256 createdAt;
        uint256 assignedAgentId; // ERC-8004 NFT ID
        string resultURI;
        uint256 platformFee; // basis points (500 = 5%)
    }

    struct AgentSubmission {
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
        ValidationRequested,
        Completed,
        Disputed,
        Cancelled
    }

    // State
    uint256 public nextBountyId = 1;
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => AgentSubmission[]) public bountySubmissions;

    // Track bounties by agent for reputation queries
    mapping(uint256 => uint256[]) public agentBounties;

    // Platform settings
    uint256 public constant PLATFORM_FEE_BASIS_POINTS = 500; // 5%
    uint256 public constant MIN_REPUTATION_SCORE = 50; // Minimum 50/100 to claim
    uint256 public constant MIN_VALIDATION_SCORE = 70; // Minimum 70/100 to complete

    // Events
    event BountyCreated(
        uint256 indexed bountyId,
        address indexed creator,
        uint256 rewardAmount,
        address rewardToken
    );
    event BountyClaimed(
        uint256 indexed bountyId,
        uint256 indexed agentId,
        address agentWallet
    );
    event BountySubmitted(
        uint256 indexed bountyId,
        uint256 indexed agentId,
        string resultURI
    );
    event ValidationRequested(
        uint256 indexed bountyId,
        bytes32 indexed requestHash,
        address validator
    );
    event BountyCompleted(
        uint256 indexed bountyId,
        uint256 indexed agentId,
        uint256 agentPayout,
        uint256 platformFee
    );
    event FeedbackGiven(
        uint256 indexed bountyId,
        uint256 indexed agentId,
        uint8 score
    );
    event BountyDisputed(
        uint256 indexed bountyId,
        string reason
    );

    constructor(
        address _identityRegistry,
        address _reputationRegistry,
        address _validationRegistry,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_identityRegistry != address(0), "Invalid identity registry");
        require(_reputationRegistry != address(0), "Invalid reputation registry");
        require(_validationRegistry != address(0), "Invalid validation registry");

        identityRegistry = IdentityRegistry(_identityRegistry);
        reputationRegistry = ReputationRegistry(_reputationRegistry);
        validationRegistry = ValidationRegistry(_validationRegistry);
    }

    /**
     * @notice Create a bounty with escrow
     * @dev Locks funds in contract until completion
     */
    function createBounty(
        string calldata description,
        uint256 rewardAmount,
        address rewardToken,
        uint256 submissionDeadline
    ) external payable returns (uint256) {
        require(bytes(description).length > 0, "Description required");
        require(rewardAmount > 0, "Reward must be positive");
        require(submissionDeadline > block.timestamp, "Deadline in past");

        uint256 bountyId = nextBountyId++;

        // Handle escrow
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
            resultURI: "",
            platformFee: PLATFORM_FEE_BASIS_POINTS
        });

        emit BountyCreated(bountyId, msg.sender, rewardAmount, rewardToken);
        return bountyId;
    }

    /**
     * @notice Agent claims a bounty using their ERC-8004 identity
     * @dev Checks reputation score before allowing claim
     */
    function claimBounty(uint256 bountyId, uint256 agentId) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == BountyStatus.Open, "Bounty not open");

        // Verify agent owns this NFT
        require(identityRegistry.ownerOf(agentId) == msg.sender, "Not agent owner");

        // Check reputation (optional but recommended)
        (uint64 feedbackCount, uint8 avgScore) = reputationRegistry.getSummary(
            agentId,
            new address[](0),
            bytes32(0),
            bytes32(0)
        );

        // If agent has reputation, must meet minimum threshold
        if (feedbackCount > 0) {
            require(avgScore >= MIN_REPUTATION_SCORE, "Reputation too low");
        }

        bounty.status = BountyStatus.Assigned;
        bounty.assignedAgentId = agentId;
        agentBounties[agentId].push(bountyId);

        emit BountyClaimed(bountyId, agentId, msg.sender);
    }

    /**
     * @notice Submit work for a claimed bounty
     * @dev Creates verifiable receipt with agent signature
     */
    function submitWork(
        uint256 bountyId,
        string calldata resultHash,
        string calldata resultURI,
        bytes calldata signature
    ) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == BountyStatus.Assigned, "Bounty not assigned");
        require(block.timestamp <= bounty.submissionDeadline, "Deadline passed");

        uint256 agentId = bounty.assignedAgentId;
        require(identityRegistry.ownerOf(agentId) == msg.sender, "Not assigned agent");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            bountyId,
            resultHash,
            block.timestamp
        ));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        require(ethSignedHash.recover(signature) == msg.sender, "Invalid signature");

        // Store submission
        bountySubmissions[bountyId].push(AgentSubmission({
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
     * @notice Request validation for submitted work
     * @dev Uses ERC-8004 ValidationRegistry for verification
     */
    function requestValidation(
        uint256 bountyId,
        address validator,
        string calldata requestUri,
        bytes32 requestHash
    ) external {
        Bounty storage bounty = bounties[bountyId];
        require(
            msg.sender == bounty.creator || msg.sender == owner(),
            "Not authorized"
        );
        require(bounty.status == BountyStatus.Submitted, "Not submitted");

        uint256 agentId = bounty.assignedAgentId;

        // Request validation through ERC-8004
        validationRegistry.validationRequest(
            validator,
            agentId,
            requestUri,
            requestHash
        );

        bounty.status = BountyStatus.ValidationRequested;

        emit ValidationRequested(bountyId, requestHash, validator);
    }

    /**
     * @notice Complete bounty and release payment
     * @dev Checks validation score and processes escrow release
     */
    function completeBounty(
        uint256 bountyId,
        bytes32 validationRequestHash,
        uint8 score,
        bytes32 tag1,
        bytes32 tag2,
        string calldata feedbackUri,
        bytes32 feedbackHash,
        bytes calldata feedbackAuth
    ) external {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.creator, "Only creator");
        require(
            bounty.status == BountyStatus.Submitted ||
            bounty.status == BountyStatus.ValidationRequested,
            "Invalid status"
        );

        uint256 agentId = bounty.assignedAgentId;
        address agentWallet = identityRegistry.ownerOf(agentId);

        // If validation was requested, check the score
        if (bounty.status == BountyStatus.ValidationRequested) {
            (
                ,
                ,
                uint8 validationResponse,
                ,
                ,
            ) = validationRegistry.getValidationStatus(validationRequestHash);

            require(
                validationResponse >= MIN_VALIDATION_SCORE,
                "Validation score too low"
            );
        }

        // Submit feedback to ReputationRegistry
        reputationRegistry.giveFeedback(
            agentId,
            score,
            tag1,
            tag2,
            feedbackUri,
            feedbackHash,
            feedbackAuth
        );

        // Calculate payouts
        uint256 platformFee = (bounty.rewardAmount * bounty.platformFee) / 10000;
        uint256 agentPayout = bounty.rewardAmount - platformFee;

        // Process payment
        if (bounty.rewardToken == address(0)) {
            payable(agentWallet).transfer(agentPayout);
            payable(owner()).transfer(platformFee);
        } else {
            IERC20(bounty.rewardToken).transfer(agentWallet, agentPayout);
            IERC20(bounty.rewardToken).transfer(owner(), platformFee);
        }

        bounty.status = BountyStatus.Completed;

        emit BountyCompleted(bountyId, agentId, agentPayout, platformFee);
        emit FeedbackGiven(bountyId, agentId, score);
    }

    /**
     * @notice Simple completion without validation (for trusted scenarios)
     */
    function completeBountySimple(
        uint256 bountyId,
        uint8 score,
        bytes32 tag1,
        bytes32 tag2,
        string calldata feedbackUri,
        bytes32 feedbackHash,
        bytes calldata feedbackAuth
    ) external {
        completeBounty(
            bountyId,
            bytes32(0),
            score,
            tag1,
            tag2,
            feedbackUri,
            feedbackHash,
            feedbackAuth
        );
    }

    /**
     * @notice Dispute a bounty
     */
    function disputeBounty(uint256 bountyId, string calldata reason) external {
        Bounty storage bounty = bounties[bountyId];
        require(
            msg.sender == bounty.creator ||
            identityRegistry.ownerOf(bounty.assignedAgentId) == msg.sender,
            "Not authorized"
        );
        require(
            bounty.status == BountyStatus.Submitted ||
            bounty.status == BountyStatus.ValidationRequested,
            "Cannot dispute"
        );

        bounty.status = BountyStatus.Disputed;
        emit BountyDisputed(bountyId, reason);
    }

    /**
     * @notice Get agent reputation from ERC-8004
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

    /**
     * @notice Get all bounties completed by an agent
     */
    function getAgentBountyHistory(uint256 agentId)
        external
        view
        returns (uint256[] memory)
    {
        return agentBounties[agentId];
    }

    /**
     * @notice Get bounty details
     */
    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }

    /**
     * @notice Get all submissions for a bounty
     */
    function getBountySubmissions(uint256 bountyId)
        external
        view
        returns (AgentSubmission[] memory)
    {
        return bountySubmissions[bountyId];
    }

    /**
     * @notice Emergency withdrawal (owner only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
}
