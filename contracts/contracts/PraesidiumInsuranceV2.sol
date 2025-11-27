// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PraesidiumInsuranceV2
 * @dev Enhanced insurance contract with parametric claims system
 */
contract PraesidiumInsuranceV2 is Ownable, ReentrancyGuard {
    uint256 private _policyIds;
    uint256 private _claimIds;

    // Trigger types for parametric insurance
    enum TriggerType {
        TVL_DROP,
        SMART_CONTRACT_EXPLOIT,
        ORACLE_FAILURE,
        GOVERNANCE_ATTACK,
        DEPEG_EVENT
    }

    struct Policy {
        uint256 id;
        address holder;
        uint256 premium;
        uint256 coverage;
        uint256 expiry;
        bool active;
        string protocol;
        bool claimed;
    }

    struct Claim {
        uint256 id;
        uint256 policyId;
        address claimant;
        uint256 amount;
        TriggerType triggerType;
        uint256 timestamp;
        ClaimStatus status;
        string evidence;
    }

    enum ClaimStatus {
        PENDING,
        APPROVED,
        REJECTED,
        PAID
    }

    // Active parametric triggers (set by oracle/admin)
    struct ActiveTrigger {
        bool isActive;
        TriggerType triggerType;
        string protocol;
        uint256 timestamp;
        uint256 severity; // 1-100
    }

    mapping(uint256 => Policy) public policies;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public holderPolicies;
    mapping(address => uint256[]) public holderClaims;
    mapping(string => ActiveTrigger) public activeTriggers; // protocol => trigger
    
    uint256 public totalPremiums;
    uint256 public totalCoverage;
    uint256 public totalClaimsPaid;
    uint256 public claimProcessingTime = 1 hours; // Minimum time before auto-approval

    // Events
    event PolicyCreated(uint256 indexed policyId, address indexed holder, uint256 premium, uint256 coverage, string protocol);
    event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, address indexed claimant, uint256 amount, TriggerType triggerType);
    event ClaimApproved(uint256 indexed claimId, uint256 amount);
    event ClaimRejected(uint256 indexed claimId, string reason);
    event ClaimPaid(uint256 indexed claimId, address indexed recipient, uint256 amount);
    event TriggerActivated(string protocol, TriggerType triggerType, uint256 severity);
    event TriggerDeactivated(string protocol);

    constructor() Ownable(msg.sender) {}

    // ============ Policy Functions ============

    function createPolicy(
        address holder,
        uint256 premium,
        uint256 coverage,
        uint256 duration,
        string memory protocol
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= premium, "Insufficient premium payment");
        require(duration >= 1 days, "Duration too short");
        require(coverage > 0, "Coverage must be positive");
        
        _policyIds++;
        uint256 policyId = _policyIds;
        
        policies[policyId] = Policy({
            id: policyId,
            holder: holder,
            premium: premium,
            coverage: coverage,
            expiry: block.timestamp + duration,
            active: true,
            protocol: protocol,
            claimed: false
        });

        holderPolicies[holder].push(policyId);
        totalPremiums += premium;
        totalCoverage += coverage;

        emit PolicyCreated(policyId, holder, premium, coverage, protocol);
        return policyId;
    }

    function getPolicy(uint256 policyId) external view returns (
        uint256 id,
        address holder,
        uint256 premium,
        uint256 coverage,
        uint256 expiry,
        bool active,
        string memory protocol,
        bool claimed
    ) {
        Policy storage policy = policies[policyId];
        return (
            policy.id,
            policy.holder,
            policy.premium,
            policy.coverage,
            policy.expiry,
            policy.active,
            policy.protocol,
            policy.claimed
        );
    }

    // ============ Claims Functions ============

    /**
     * @dev Submit a claim for a policy
     */
    function submitClaim(
        uint256 policyId,
        TriggerType triggerType,
        string memory evidence
    ) external nonReentrant returns (uint256) {
        Policy storage policy = policies[policyId];
        
        require(policy.holder == msg.sender, "Not policy holder");
        require(policy.active, "Policy not active");
        require(!policy.claimed, "Already claimed");
        require(block.timestamp <= policy.expiry, "Policy expired");
        
        // Check if there's an active trigger for this protocol
        ActiveTrigger storage trigger = activeTriggers[policy.protocol];
        require(trigger.isActive, "No active trigger for this protocol");
        require(trigger.triggerType == triggerType, "Trigger type mismatch");
        
        _claimIds++;
        uint256 claimId = _claimIds;
        
        claims[claimId] = Claim({
            id: claimId,
            policyId: policyId,
            claimant: msg.sender,
            amount: policy.coverage,
            triggerType: triggerType,
            timestamp: block.timestamp,
            status: ClaimStatus.PENDING,
            evidence: evidence
        });
        
        holderClaims[msg.sender].push(claimId);
        
        // Mark policy as claimed (prevents double claims)
        policy.claimed = true;
        
        emit ClaimSubmitted(claimId, policyId, msg.sender, policy.coverage, triggerType);
        return claimId;
    }

    /**
     * @dev Admin approves a claim
     */
    function approveClaim(uint256 claimId) external onlyOwner nonReentrant {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.PENDING, "Claim not pending");
        
        claim.status = ClaimStatus.APPROVED;
        emit ClaimApproved(claimId, claim.amount);
        
        // Auto-pay approved claim
        _payClaim(claimId);
    }

    /**
     * @dev Admin rejects a claim
     */
    function rejectClaim(uint256 claimId, string memory reason) external onlyOwner {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.PENDING, "Claim not pending");
        
        claim.status = ClaimStatus.REJECTED;
        
        // Reactivate the policy since claim was rejected
        Policy storage policy = policies[claim.policyId];
        policy.claimed = false;
        
        emit ClaimRejected(claimId, reason);
    }

    /**
     * @dev Internal function to pay out a claim
     */
    function _payClaim(uint256 claimId) internal {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.APPROVED, "Claim not approved");
        require(address(this).balance >= claim.amount, "Insufficient contract balance");
        
        claim.status = ClaimStatus.PAID;
        
        // Deactivate the policy
        Policy storage policy = policies[claim.policyId];
        policy.active = false;
        totalCoverage -= policy.coverage;
        totalClaimsPaid += claim.amount;
        
        // Transfer funds to claimant
        (bool success, ) = payable(claim.claimant).call{value: claim.amount}("");
        require(success, "Transfer failed");
        
        emit ClaimPaid(claimId, claim.claimant, claim.amount);
    }

    /**
     * @dev Auto-process claim if trigger conditions are met (can be called by anyone)
     */
    function processClaimAutomatically(uint256 claimId) external nonReentrant {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.PENDING, "Claim not pending");
        
        Policy storage policy = policies[claim.policyId];
        ActiveTrigger storage trigger = activeTriggers[policy.protocol];
        
        // Verify trigger is still active and matches
        require(trigger.isActive, "Trigger no longer active");
        require(trigger.triggerType == claim.triggerType, "Trigger type mismatch");
        
        // Check if enough time has passed for auto-approval
        require(block.timestamp >= claim.timestamp + claimProcessingTime, "Processing time not elapsed");
        
        // Auto-approve and pay
        claim.status = ClaimStatus.APPROVED;
        emit ClaimApproved(claimId, claim.amount);
        _payClaim(claimId);
    }

    // ============ Trigger Functions (Oracle/Admin) ============

    /**
     * @dev Activate a parametric trigger for a protocol
     */
    function activateTrigger(
        string memory protocol,
        TriggerType triggerType,
        uint256 severity
    ) external onlyOwner {
        require(severity >= 1 && severity <= 100, "Severity must be 1-100");
        
        activeTriggers[protocol] = ActiveTrigger({
            isActive: true,
            triggerType: triggerType,
            protocol: protocol,
            timestamp: block.timestamp,
            severity: severity
        });
        
        emit TriggerActivated(protocol, triggerType, severity);
    }

    /**
     * @dev Deactivate a trigger
     */
    function deactivateTrigger(string memory protocol) external onlyOwner {
        delete activeTriggers[protocol];
        emit TriggerDeactivated(protocol);
    }

    /**
     * @dev Check if a trigger is active for a protocol
     */
    function isTriggerActive(string memory protocol) external view returns (bool, TriggerType, uint256) {
        ActiveTrigger storage trigger = activeTriggers[protocol];
        return (trigger.isActive, trigger.triggerType, trigger.severity);
    }

    // ============ View Functions ============

    function getClaim(uint256 claimId) external view returns (
        uint256 id,
        uint256 policyId,
        address claimant,
        uint256 amount,
        TriggerType triggerType,
        uint256 timestamp,
        ClaimStatus status
    ) {
        Claim storage claim = claims[claimId];
        return (
            claim.id,
            claim.policyId,
            claim.claimant,
            claim.amount,
            claim.triggerType,
            claim.timestamp,
            claim.status
        );
    }

    function getPolicyCount() external view returns (uint256) {
        return _policyIds;
    }

    function getClaimCount() external view returns (uint256) {
        return _claimIds;
    }

    function getHolderPolicies(address holder) external view returns (uint256[] memory) {
        return holderPolicies[holder];
    }

    function getHolderClaims(address holder) external view returns (uint256[] memory) {
        return holderClaims[holder];
    }

    // ============ Admin Functions ============

    function setClaimProcessingTime(uint256 newTime) external onlyOwner {
        claimProcessingTime = newTime;
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
