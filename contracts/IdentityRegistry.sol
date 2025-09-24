// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title IdentityRegistry
 * @dev ERC-8004 compliant identity registry for ClipperVerse agents
 * Manages agent registrations and provides verification mechanisms
 */
contract IdentityRegistry is Ownable {
    using ECDSA for bytes32;

    struct AgentCard {
        string name;
        string domain;
        string[] skills;
        string[] endpoints;
        uint256 reputationScore;
        uint256 registeredAt;
        bool isActive;
    }

    // Mapping from agent address to AgentCard URI
    mapping(address => string) public agentCardURIs;

    // Mapping from agent address to AgentCard data (for on-chain verification)
    mapping(address => AgentCard) public agentCards;

    // Events
    event AgentRegistered(address indexed agent, string cardURI);
    event AgentUpdated(address indexed agent, string newCardURI);
    event AgentDeactivated(address indexed agent);

    /**
     * @dev Register or update an agent with their AgentCard URI
     * @param cardURI IPFS/GitHub URI pointing to the AgentCard JSON
     */
    function registerAgent(string calldata cardURI) external {
        require(bytes(cardURI).length > 0, "CardURI cannot be empty");

        agentCardURIs[msg.sender] = cardURI;

        // Initialize basic AgentCard data
        agentCards[msg.sender] = AgentCard({
            name: "",
            domain: "",
            skills: new string[](0),
            endpoints: new string[](0),
            reputationScore: 0,
            registeredAt: block.timestamp,
            isActive: true
        });

        emit AgentRegistered(msg.sender, cardURI);
    }

    /**
     * @dev Update agent card URI
     * @param newCardURI New IPFS/GitHub URI
     */
    function updateAgentCard(string calldata newCardURI) external {
        require(bytes(newCardURI).length > 0, "CardURI cannot be empty");
        require(bytes(agentCardURIs[msg.sender]).length > 0, "Agent not registered");

        agentCardURIs[msg.sender] = newCardURI;
        emit AgentUpdated(msg.sender, newCardURI);
    }

    /**
     * @dev Deactivate an agent
     */
    function deactivateAgent() external {
        require(bytes(agentCardURIs[msg.sender]).length > 0, "Agent not registered");

        agentCards[msg.sender].isActive = false;
        emit AgentDeactivated(msg.sender);
    }

    /**
     * @dev Update agent reputation score (only owner can call)
     * @param agent Agent address
     * @param newScore New reputation score
     */
    function updateReputationScore(address agent, uint256 newScore) external onlyOwner {
        require(bytes(agentCardURIs[agent]).length > 0, "Agent not registered");
        agentCards[agent].reputationScore = newScore;
    }

    /**
     * @dev Verify agent signature for a message
     * @param agent Agent address
     * @param message Message that was signed
     * @param signature Signature to verify
     * @return bool True if signature is valid
     */
    function verifyAgentSignature(
        address agent,
        bytes32 message,
        bytes calldata signature
    ) external view returns (bool) {
        require(agentCards[agent].isActive, "Agent not active");
        return message.recover(signature) == agent;
    }

    /**
     * @dev Check if agent is registered and active
     * @param agent Agent address
     * @return bool True if agent is registered and active
     */
    function isAgentActive(address agent) external view returns (bool) {
        return agentCards[agent].isActive && bytes(agentCardURIs[agent]).length > 0;
    }

    /**
     * @dev Get agent card URI
     * @param agent Agent address
     * @return string AgentCard URI
     */
    function getAgentCardURI(address agent) external view returns (string memory) {
        return agentCardURIs[agent];
    }
}

