
export enum RiskLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export enum TriggerType {
  TVL_DROP = 0,
  SMART_CONTRACT_EXPLOIT = 1,
  ORACLE_FAILURE = 2,
  GOVERNANCE_ATTACK = 3,
  DEPEG_EVENT = 4,
}

export enum ClaimStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

export interface Protocol {
  id: string;
  name: string;
  logo: string;
  tvl: number;
  tvlHistory: { date: string; value: number }[];
  riskScore: number;
  riskLevel: RiskLevel;
  premiumRate: number; // as a percentage
  coverageLimit: number;
  triggerConditions: string[];
  incidentHistory: { date: string; description: string }[];
}

// On-chain policy structure (matches PraesidiumInsuranceV2.sol)
export interface OnChainPolicy {
  id: string;
  holder: string;
  premium: number; // in ETH/POL
  coverage: number; // in ETH/POL
  expiry: number; // Unix timestamp
  active: boolean;
  protocol: string;
  claimed: boolean;
}

// Frontend display policy (with USD values)
export interface Policy {
  id: string;
  protocol: Protocol;
  coverageAmount: number;
  premiumPaid: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Claimed';
}

// On-chain claim structure (matches PraesidiumInsuranceV2.sol)
export interface OnChainClaim {
  id: string;
  policyId: string;
  claimant: string;
  amount: number;
  triggerType: TriggerType;
  timestamp: number;
  status: ClaimStatus;
  evidence?: string;
  txHash?: string;
}

// Frontend display claim
export interface Claim {
  id: string;
  policyId: string;
  protocolName: string;
  claimDate: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

// Active trigger from oracle/admin
export interface ActiveTrigger {
  isActive: boolean;
  triggerType: TriggerType;
  protocol: string;
  timestamp: number;
  severity: number; // 1-100
}

// Liquidity pool stats
export interface PoolStats {
  totalDeposits: number;
  totalShares: number;
  userShares: number;
  userBalance: number;
  apy: number;
}

// Price feed
export interface PriceFeed {
  ethUsd: number;
  lastUpdated: number;
}
