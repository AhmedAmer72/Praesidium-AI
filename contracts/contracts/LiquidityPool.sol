// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LiquidityPool is ERC20, Ownable {
    uint256 public totalDeposits;
    uint256 public totalRewards;
    
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public lastDepositTime;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 amount);

    constructor() ERC20("Praesidium LP Token", "pLP") Ownable(msg.sender) {}

    function deposit() external payable {
        require(msg.value > 0, "Must deposit something");
        
        uint256 shares = totalSupply() == 0 ? msg.value : (msg.value * totalSupply()) / totalDeposits;
        
        deposits[msg.sender] += msg.value;
        lastDepositTime[msg.sender] = block.timestamp;
        totalDeposits += msg.value;
        
        _mint(msg.sender, shares);
        
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 shares) external {
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");
        
        uint256 amount = (shares * totalDeposits) / totalSupply();
        
        deposits[msg.sender] -= amount;
        totalDeposits -= amount;
        
        _burn(msg.sender, shares);
        payable(msg.sender).transfer(amount);
        
        emit Withdrawn(msg.sender, amount);
    }

    function distributeRewards() external payable onlyOwner {
        require(msg.value > 0, "No rewards to distribute");
        totalRewards += msg.value;
        totalDeposits += msg.value;
        
        emit RewardsDistributed(msg.value);
    }

    function getPoolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getUserShares(address user) external view returns (uint256) {
        return balanceOf(user);
    }
}