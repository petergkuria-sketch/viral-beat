// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ViralBeatToken (VBT)
 * @dev ERC-20 token for The Viral Beat platform
 * 
 * Features:
 * - Max supply: 100,000,000 VBT
 * - Burnable: Users can burn their tokens
 * - Pausable: Owner can pause transfers in emergency
 * - Mintable: Owner can mint tokens for verified migrations
 * - 18 decimals (standard ERC-20)
 */
contract ViralBeatToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    // Maximum supply: 100 million VBT
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    
    // Track total minted for migration tracking
    uint256 public totalMinted;
    
    // Migration tracking
    mapping(address => uint256) public migratedAmount;
    mapping(bytes32 => bool) public processedMigrations;
    
    // Events
    event TokensMigrated(address indexed user, uint256 amount, bytes32 migrationId);
    event EmergencyPause(address indexed by, string reason);
    event EmergencyUnpause(address indexed by);
    
    constructor() ERC20("Viral Beat Token", "VBT") Ownable(msg.sender) {
        // Mint initial supply for liquidity pools and treasury
        // 10M VBT initial mint (10% of max supply)
        uint256 initialMint = 10_000_000 * 10**18;
        _mint(msg.sender, initialMint);
        totalMinted = initialMint;
    }
    
    /**
     * @dev Mint tokens for verified user migrations from internal system
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * @param migrationId Unique migration ID to prevent double-minting
     */
    function mintForMigration(
        address to,
        uint256 amount,
        bytes32 migrationId
    ) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(!processedMigrations[migrationId], "Migration already processed");
        require(totalMinted + amount <= MAX_SUPPLY, "Would exceed max supply");
        
        processedMigrations[migrationId] = true;
        migratedAmount[to] += amount;
        totalMinted += amount;
        
        _mint(to, amount);
        emit TokensMigrated(to, amount, migrationId);
    }
    
    /**
     * @dev Pause token transfers in case of emergency
     * @param reason Reason for pausing
     */
    function pause(string memory reason) external onlyOwner {
        _pause();
        emit EmergencyPause(msg.sender, reason);
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpause(msg.sender);
    }
    
    /**
     * @dev Get remaining mintable supply
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }
    
    /**
     * @dev Check if a migration has been processed
     */
    function isMigrationProcessed(bytes32 migrationId) external view returns (bool) {
        return processedMigrations[migrationId];
    }
    
    // Required override for Pausable + ERC20
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
