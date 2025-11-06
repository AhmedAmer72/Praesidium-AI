// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PraesidiumInsurance is ERC721, Ownable {
    uint256 private _policyIds;

    struct Policy {
        uint256 id;
        address holder;
        uint256 premium;
        uint256 coverage;
        uint256 expiry;
        bool active;
        string protocol;
    }

    mapping(uint256 => Policy) public policies;
    mapping(address => uint256[]) public holderPolicies;
    
    uint256 public totalPremiums;
    uint256 public totalCoverage;

    event PolicyCreated(uint256 indexed policyId, address indexed holder, uint256 premium, uint256 coverage);
    event PolicyClaimed(uint256 indexed policyId, uint256 amount);

    constructor() ERC721("Praesidium Policy", "PPOL") Ownable(msg.sender) {}

    function createPolicy(
        address holder,
        uint256 premium,
        uint256 coverage,
        uint256 duration,
        string memory protocol
    ) external payable returns (uint256) {
        require(msg.value >= premium, "Insufficient premium payment");
        
        _policyIds++;
        uint256 policyId = _policyIds;
        
        policies[policyId] = Policy({
            id: policyId,
            holder: holder,
            premium: premium,
            coverage: coverage,
            expiry: block.timestamp + duration,
            active: true,
            protocol: protocol
        });

        holderPolicies[holder].push(policyId);
        totalPremiums += premium;
        totalCoverage += coverage;

        _mint(holder, policyId);
        
        emit PolicyCreated(policyId, holder, premium, coverage);
        return policyId;
    }

    function claimPolicy(uint256 policyId) external {
        Policy storage policy = policies[policyId];
        require(ownerOf(policyId) == msg.sender, "Not policy owner");
        require(policy.active, "Policy not active");
        require(block.timestamp <= policy.expiry, "Policy expired");

        policy.active = false;
        totalCoverage -= policy.coverage;

        payable(msg.sender).transfer(policy.coverage);
        
        emit PolicyClaimed(policyId, policy.coverage);
    }

    function getPolicyCount() external view returns (uint256) {
        return _policyIds;
    }

    function getHolderPolicies(address holder) external view returns (uint256[] memory) {
        return holderPolicies[holder];
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}