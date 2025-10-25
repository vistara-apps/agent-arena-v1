// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IIdentityRegistry {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getMetadata(uint256 agentId, string memory key) external view returns (bytes memory);
}

interface IReputationRegistry {
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
 * @title BountySystemV2
 * @dev Upgraded bounty system compatible with ERC-8004
 * Supports both legacy address-based agents and new NFT-based agents
 */
contract BountySystemV2 is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using ECDSA for bytes32;

    IIdentityRegistry public identityRegistry;
    IReputationRegistry public reputationRegistry;

    struct Bounty {
        uint256 bountyId;
        address creator;
        string description;
        uint256 rewardAmount;
        address rewardToken;
        string status;
        uint256 submissionDeadline;
        string verificationMethod;
        uint256 createdAt;
        uint256 assignedAgentId;  // Changed from address to agentId
        address assignedAgentAddress; // Keep for backward compatibility
        string resultURI;
        uint256 platformFee;
    }

    struct Receipt {
        uint256 agentId;      // New: NFT-based identity
        address agentAddress;
        uint256 bountyId;
        string[] taskInputRefs;
        string resultHash;
        uint256 timestamp;
        bytes signature;
        string resultURI;
    }

    uint256 public nextBountyId;
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Receipt[]) public bountyReceipts;
    mapping(uint256 => address[]) public bountyReferees;
    
    // New: Track agents by both address and agentId
    mapping(address => uint256) public addressToAgentId;
    mapping(uint256 => address) public agentIdToAddress;

    uint256 public constant PLATFORM_FEE_BASIS_POINTS = 500;
    uint256 public constant MAX_FEE_BASIS_POINTS = 1000;

    // Events
    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 rewardAmount);
    event BountyAssigned(uint256 indexed bountyId, uint256 indexed agentId, address agentAddress);
    event ReceiptSubmitted(uint256 indexed bountyId, uint256 indexed agentId, string resultURI);
    event BountyCompleted(uint256 indexed bountyId, uint256 indexed agentId, uint256 payoutAmount);
    event BountyDisputed(uint256 indexed bountyId, string reason);
    event PayoutProcessed(uint256 indexed bountyId, address indexed agent, uint256 amount);
    event FeedbackGiven(uint256 indexed bountyId, uint256 indexed agentId, uint8 score);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _identityRegistry,
        address _reputationRegistry
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        
        identityRegistry = IIdentityRegistry(_identityRegistry);
        reputationRegistry = IReputationRegistry(_reputationRegistry);
        nextBountyId = 1;
    }

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
            assignedAgentId: 0,
            assignedAgentAddress: address(0),
            resultURI: "",
            platformFee: PLATFORM_FEE_BASIS_POINTS
        });

        emit BountyCreated(bountyId, msg.sender, rewardAmount);
        return bountyId;
    }

    /**
     * @dev Submit a receipt for a bounty with agentId
     * @param agentId The NFT token ID of the agent
     * @param bountyId ID of the bounty
     */
    function submitReceiptWithAgentId(
        uint256 agentId,
        uint256 bountyId,
        string[] calldata taskInputRefs,
        string calldata resultHash,
        bytes calldata signature,
        string calldata resultURI
    ) external {
        require(identityRegistry.ownerOf(agentId) == msg.sender, "Not agent owner");
        
        Bounty storage bounty = bounties[bountyId];
        require(bytes(bounty.status).length > 0, "Bounty does not exist");
        require(keccak256(abi.encodePacked(bounty.status)) == keccak256(abi.encodePacked("open")), "Bounty not open");
        require(block.timestamp <= bounty.submissionDeadline, "Submission deadline passed");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(bountyId, resultHash));
        require(messageHash.toEthSignedMessageHash().recover(signature) == msg.sender, "Invalid signature");

        Receipt memory receipt = Receipt({
            agentId: agentId,
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
        bounty.assignedAgentId = agentId;
        bounty.assignedAgentAddress = msg.sender;
        bounty.resultURI = resultURI;

        // Update mappings
        addressToAgentId[msg.sender] = agentId;
        agentIdToAddress[agentId] = msg.sender;

        emit BountyAssigned(bountyId, agentId, msg.sender);
        emit ReceiptSubmitted(bountyId, agentId, resultURI);
    }

    /**
     * @dev Legacy support: Submit receipt with just address (creates temporary mapping)
     */
    function submitReceipt(
        uint256 bountyId,
        string[] calldata taskInputRefs,
        string calldata resultHash,
        bytes calldata signature,
        string calldata resultURI
    ) external {
        // Check if sender has an agentId
        uint256 agentId = addressToAgentId[msg.sender];
        if (agentId == 0) {
            // Temporary assignment for legacy agents
            agentId = uint256(uint160(msg.sender));
            addressToAgentId[msg.sender] = agentId;
            agentIdToAddress[agentId] = msg.sender;
        }
        
        submitReceiptWithAgentId(agentId, bountyId, taskInputRefs, resultHash, signature, resultURI);
    }

    function approveBountyWithFeedback(
        uint256 bountyId,
        uint8 feedbackScore,
        string calldata feedbackUri,
        bytes32 feedbackHash,
        bytes calldata feedbackAuth
    ) external {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.creator, "Only creator can approve");
        require(keccak256(abi.encodePacked(bounty.status)) == keccak256(abi.encodePacked("processing")), "Bounty not processing");
        require(bounty.assignedAgentId != 0, "No agent assigned");

        bounty.status = "completed";

        // Give feedback if reputation registry is set
        if (address(reputationRegistry) != address(0)) {
            reputationRegistry.giveFeedback(
                bounty.assignedAgentId,
                feedbackScore,
                bytes32("bounty"),
                bytes32(bountyId),
                feedbackUri,
                feedbackHash,
                feedbackAuth
            );
            emit FeedbackGiven(bountyId, bounty.assignedAgentId, feedbackScore);
        }

        // Calculate platform fee and agent payout
        uint256 platformFee = (bounty.rewardAmount * bounty.platformFee) / 10000;
        uint256 agentPayout = bounty.rewardAmount - platformFee;

        // Process payout
        if (bounty.rewardToken == address(0)) {
            payable(bounty.assignedAgentAddress).transfer(agentPayout);
            payable(owner()).transfer(platformFee);
        } else {
            IERC20(bounty.rewardToken).transfer(bounty.assignedAgentAddress, agentPayout);
            IERC20(bounty.rewardToken).transfer(owner(), platformFee);
        }

        emit BountyCompleted(bountyId, bounty.assignedAgentId, agentPayout);
        emit PayoutProcessed(bountyId, bounty.assignedAgentAddress, agentPayout);
    }

    /**
     * @dev Legacy approve without feedback
     */
    function approveBounty(uint256 bountyId) external {
        // Call with default feedback score
        approveBountyWithFeedback(
            bountyId,
            80, // Default good score
            "",
            bytes32(0),
            new bytes(0)
        );
    }

    /**
     * @dev Get agent reputation summary
     */
    function getAgentReputation(uint256 agentId) external view returns (uint64 count, uint8 averageScore) {
        if (address(reputationRegistry) != address(0)) {
            return reputationRegistry.getSummary(
                agentId,
                new address[](0), // All clients
                bytes32("bounty"),
                bytes32(0) // All tags
            );
        }
        return (0, 0);
    }

    /**
     * @dev Check if an address has an associated agentId
     */
    function hasAgentId(address agent) external view returns (bool, uint256) {
        uint256 agentId = addressToAgentId[agent];
        return (agentId != 0, agentId);
    }

    function disputeBounty(uint256 bountyId, string calldata reason) external {
        Bounty storage bounty = bounties[bountyId];
        require(
            msg.sender == bounty.creator || msg.sender == bounty.assignedAgentAddress,
            "Only creator or assigned agent can dispute"
        );
        require(
            keccak256(abi.encodePacked(bounty.status)) == keccak256(abi.encodePacked("processing")) ||
            keccak256(abi.encodePacked(bounty.status)) == keccak256(abi.encodePacked("open")),
            "Cannot dispute completed bounty"
        );

        bounty.status = "disputed";
        emit BountyDisputed(bountyId, reason);
    }

    function updateRegistries(
        address _identityRegistry,
        address _reputationRegistry
    ) external onlyOwner {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        reputationRegistry = IReputationRegistry(_reputationRegistry);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function getVersion() external pure returns (string memory) {
        return "2.0.0";
    }
}