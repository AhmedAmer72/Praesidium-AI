// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleInsurance {
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
    
    mapping(uint256 => Policy) public _policies;
    mapping(address => uint256[]) public holderPolicies;
    
    event PolicyCreated(uint256 indexed policyId, address indexed holder, uint256 premium, uint256 coverage);
    
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
        
        _policies[policyId] = Policy({
            id: policyId,
            holder: holder,
            premium: premium,
            coverage: coverage,
            expiry: block.timestamp + duration,
            active: true,
            protocol: protocol
        });
        
        holderPolicies[holder].push(policyId);
        
        emit PolicyCreated(policyId, holder, premium, coverage);
        return policyId;
    }
    
    function getPolicyCount() external view returns (uint256) {
        return _policyIds;
    }
    
    function getHolderPolicies(address holder) external view returns (uint256[] memory) {
        return holderPolicies[holder];
    }

    function getPolicy(uint256 policyId) external view returns (
        uint256 id,
        address holder,
        uint256 premium,
        uint256 coverage,
        uint256 expiry,
        bool active,
        string memory protocol
    ) {
        Policy memory policy = _policies[policyId];
        return (
            policy.id,
            policy.holder,
            policy.premium,
            policy.coverage,
            policy.expiry,
            policy.active,
            policy.protocol
        );
    }
}