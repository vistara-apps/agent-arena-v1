// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BountySystem.sol";

interface IERC8004Identity {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getMetadata(uint256 agentId, string memory key) external view returns (bytes memory);
}

interface IERC8004Reputation {
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
 * @title BountySystemV2Integration
 * @dev Extension to integrate existing BountySystem with external ERC-8004 contracts
 * This allows using already-deployed ERC-8004 registries without redeploying everything
 */
contract BountySystemV2Integration is BountySystem {
    IERC8004Identity public erc8004Identity;
    IERC8004Reputation public erc8004Reputation;
    
    // Track which agents are using ERC-8004
    mapping(address => uint256) public addressToAgentId;
    mapping(uint256 => address) public agentIdToAddress;
    
    event ERC8004RegistriesSet(address identity, address reputation);
    event AgentLinked(address agent, uint256 agentId);
    
    constructor(
        address _identityRegistry,
        address _erc8004Identity,
        address _erc8004Reputation,
        address initialOwner
    ) BountySystem(_identityRegistry, initialOwner) {
        erc8004Identity = IERC8004Identity(_erc8004Identity);
        erc8004Reputation = IERC8004Reputation(_erc8004Reputation);
    }
    
    /**
     * @dev Link an existing agent address to their ERC-8004 NFT ID
     */
    function linkAgentToERC8004(address agent, uint256 agentId) external onlyOwner {
        require(erc8004Identity.ownerOf(agentId) == agent, "Agent doesn't own NFT");
        addressToAgentId[agent] = agentId;
        agentIdToAddress[agentId] = agent;
        emit AgentLinked(agent, agentId);
    }
    
    /**
     * @dev Submit receipt and automatically link to ERC-8004 if agent owns an NFT
     */
    function submitReceiptWithERC8004(
        uint256 bountyId,
        string[] calldata taskInputRefs,
        string calldata resultHash,
        bytes calldata signature,
        string calldata resultURI
    ) external {
        // Check if sender has an ERC-8004 agent ID
        uint256 agentId = addressToAgentId[msg.sender];
        
        // If not linked, try to find their NFT
        if (agentId == 0) {
            // This would need to be implemented based on how agents are tracked
            // For now, just use the regular submission
        }
        
        // Call parent submitReceipt
        super.submitReceipt(bountyId, taskInputRefs, resultHash, signature, resultURI);
    }
    
    /**
     * @dev Approve bounty and give ERC-8004 feedback
     */
    function approveBountyWithERC8004Feedback(
        uint256 bountyId,
        uint8 feedbackScore,
        string calldata feedbackUri,
        bytes32 feedbackHash,
        bytes calldata feedbackAuth
    ) external {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.creator, "Only creator can approve");
        
        // First approve the bounty normally
        approveBounty(bountyId);
        
        // Then give ERC-8004 feedback if agent is linked
        uint256 agentId = addressToAgentId[bounty.assignedAgent];
        if (agentId != 0 && address(erc8004Reputation) != address(0)) {
            erc8004Reputation.giveFeedback(
                agentId,
                feedbackScore,
                bytes32("bounty"),
                bytes32(bountyId),
                feedbackUri,
                feedbackHash,
                feedbackAuth
            );
        }
    }
    
    /**
     * @dev Get agent's ERC-8004 reputation
     */
    function getAgentERC8004Reputation(address agent) 
        external 
        view 
        returns (uint64 count, uint8 averageScore) 
    {
        uint256 agentId = addressToAgentId[agent];
        if (agentId == 0 || address(erc8004Reputation) == address(0)) {
            return (0, 0);
        }
        
        return erc8004Reputation.getSummary(
            agentId,
            new address[](0),
            bytes32("bounty"),
            bytes32(0)
        );
    }
    
    /**
     * @dev Update ERC-8004 registry addresses
     */
    function updateERC8004Registries(
        address _identity,
        address _reputation
    ) external onlyOwner {
        erc8004Identity = IERC8004Identity(_identity);
        erc8004Reputation = IERC8004Reputation(_reputation);
        emit ERC8004RegistriesSet(_identity, _reputation);
    }
}