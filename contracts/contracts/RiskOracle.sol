// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RiskOracle {
    mapping(string => uint256) public riskScores;
    mapping(string => uint256) public premiumRates; // in basis points (100 = 1%)
    address public owner;
    
    event RiskScoreUpdated(string protocol, uint256 score);
    event PremiumRateUpdated(string protocol, uint256 rate);
    
    constructor() {
        owner = msg.sender;
        
        // Initialize with default values
        riskScores["Aave"] = 88;
        riskScores["Compound"] = 85;
        riskScores["Curve Finance"] = 72;
        riskScores["Uniswap"] = 92;
        riskScores["SushiSwap"] = 65;
        riskScores["Balancer V2"] = 78;
        
        premiumRates["Aave"] = 120; // 1.2%
        premiumRates["Compound"] = 150; // 1.5%
        premiumRates["Curve Finance"] = 280; // 2.8%
        premiumRates["Uniswap"] = 110; // 1.1%
        premiumRates["SushiSwap"] = 350; // 3.5%
        premiumRates["Balancer V2"] = 220; // 2.2%
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    function getRiskScore(string memory protocol) external view returns (uint256) {
        return riskScores[protocol];
    }
    
    function getPremiumRate(string memory protocol) external view returns (uint256) {
        return premiumRates[protocol];
    }
    
    function calculatePremium(uint256 coverage, string memory protocol) external view returns (uint256) {
        uint256 rate = premiumRates[protocol];
        return (coverage * rate) / 10000; // Convert basis points to percentage
    }
    
    function updateRiskScore(string memory protocol, uint256 score) external onlyOwner {
        require(score <= 100, "Score must be <= 100");
        riskScores[protocol] = score;
        
        // Auto-adjust premium based on risk score
        uint256 newRate;
        if (score >= 90) newRate = 100; // 1.0%
        else if (score >= 80) newRate = 150; // 1.5%
        else if (score >= 70) newRate = 250; // 2.5%
        else if (score >= 60) newRate = 350; // 3.5%
        else newRate = 500; // 5.0%
        
        premiumRates[protocol] = newRate;
        
        emit RiskScoreUpdated(protocol, score);
        emit PremiumRateUpdated(protocol, newRate);
    }
}