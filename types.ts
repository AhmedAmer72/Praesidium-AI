
export enum RiskLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
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

export interface Policy {
  id: string;
  protocol: Protocol;
  coverageAmount: number;
  premiumPaid: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Claimed';
}

export interface Claim {
  id: string;
  policyId: string;
  protocolName: string;
  claimDate: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}
