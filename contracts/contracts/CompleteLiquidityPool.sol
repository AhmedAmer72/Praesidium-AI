// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CompleteLiquidityPool {
    mapping(address => uint256) public userShares;
    uint256 public totalShares;
    uint256 public totalBalance;
    
    event Deposit(address indexed user, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, uint256 shares, uint256 amount);
    
    function deposit() external payable {
        require(msg.value > 0, "Must deposit something");
        
        uint256 shares;
        if (totalShares == 0) {
            shares = msg.value;
        } else {
            shares = (msg.value * totalShares) / totalBalance;
        }
        
        userShares[msg.sender] += shares;
        totalShares += shares;
        totalBalance += msg.value;
        
        emit Deposit(msg.sender, msg.value, shares);
    }
    
    function withdraw(uint256 shares) external {
        require(shares > 0, "Must withdraw something");
        require(userShares[msg.sender] >= shares, "Insufficient shares");
        
        uint256 amount = (shares * totalBalance) / totalShares;
        
        userShares[msg.sender] -= shares;
        totalShares -= shares;
        totalBalance -= amount;
        
        payable(msg.sender).transfer(amount);
        
        emit Withdraw(msg.sender, shares, amount);
    }
    
    function getPoolBalance() external view returns (uint256) {
        return totalBalance;
    }
    
    function getUserShares(address user) external view returns (uint256) {
        return userShares[user];
    }
    
    function getUserBalance(address user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (userShares[user] * totalBalance) / totalShares;
    }
}