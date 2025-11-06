// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LiquidityDeposit {
    mapping(address => uint256) public deposits;
    uint256 public totalDeposits;
    
    event Deposited(address indexed user, uint256 amount);
    
    function deposit() external payable {
        require(msg.value > 0, "Must deposit something");
        
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Deposited(msg.sender, msg.value);
    }
    
    function getDeposit(address user) external view returns (uint256) {
        return deposits[user];
    }
    
    function getTotalDeposits() external view returns (uint256) {
        return totalDeposits;
    }
}