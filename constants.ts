
import { Protocol, Policy, Claim, RiskLevel } from './types';

// Contract Addresses
export const CONTRACT_ADDRESSES = {
  amoy: {
    PraesidiumInsurance: import.meta.env.VITE_PRAESIDIUM_INSURANCE_ADDRESS || '0xBE94Ea21e057c948DfDdF25347A0527f8f8819c0',
    PraesidiumInsuranceV2: import.meta.env.VITE_PRAESIDIUM_INSURANCE_V2_ADDRESS || '0x4299404F58B5e8cDCB13Fc38499F0ab85b885c53',
    LiquidityPool: import.meta.env.VITE_LIQUIDITY_POOL_ADDRESS || '0xe7146db1566EA71690D5eeC15AB754E005C72dAF',
    RiskOracle: import.meta.env.VITE_RISK_ORACLE_ADDRESS || '0x513CEae41D376d9eA0Dc305B0c382841FF80eD53'
  },
  polygon: {
    PraesidiumInsurance: '', // Not deployed on mainnet
    PraesidiumInsuranceV2: import.meta.env.VITE_MAINNET_PRAESIDIUM_INSURANCE_V2_ADDRESS || '0x657A362d009fFbCD90A94e08aa852aa8a0c5205f',
    LiquidityPool: import.meta.env.VITE_MAINNET_LIQUIDITY_POOL_ADDRESS || '0x7dE62D0fD7Eb664FF2a2514230fdB349f465db87',
    RiskOracle: import.meta.env.VITE_MAINNET_RISK_ORACLE_ADDRESS || '0x41E41d1aEcb893616e8c24f32998F7c850670ABF'
  }
};

// Current active network - change to 'polygon' for mainnet, 'amoy' for testnet
export const ACTIVE_NETWORK: 'amoy' | 'polygon' = 'polygon';

// Network Configuration
export const NETWORKS = {
  amoy: {
    chainId: '0x13882',
    chainName: 'Polygon Amoy Testnet',
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    blockExplorerUrls: ['https://amoy.polygonscan.com']
  },
  polygon: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com']
  }
};

function generateTVLHistory() {
  const data = [];
  let value = Math.random() * 50 + 50; // start between 50M and 100M
  for (let i = 30; i > 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    value += (Math.random() - 0.5) * 5;
    if (value < 10) value = 10;
    data.push({ date: date.toISOString().split('T')[0], value: parseFloat(value.toFixed(2)) });
  }
  return data;
}

export const mockProtocols: Protocol[] = [
  {
    id: 'aave',
    name: 'Aave',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNCNkZGRkYiLz48dGV4dCB4PSIyMCIgeT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QTwvdGV4dD48L3N2Zz4=',
    tvl: 12500000000,
    tvlHistory: generateTVLHistory(),
    riskScore: 88,
    riskLevel: RiskLevel.Low,
    premiumRate: 1.2,
    coverageLimit: 1000000,
    triggerConditions: ['Smart contract exploit', 'Oracle failure'],
    incidentHistory: [{ date: '2023-04-15', description: 'Minor oracle manipulation attempt.' }],
  },
  {
    id: 'compound',
    name: 'Compound',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMwMEQ0QUEiLz48dGV4dCB4PSIyMCIgeT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QzwvdGV4dD48L3N2Zz4=',
    tvl: 8900000000,
    tvlHistory: generateTVLHistory(),
    riskScore: 85,
    riskLevel: RiskLevel.Low,
    premiumRate: 1.5,
    coverageLimit: 800000,
    triggerConditions: ['Governance attack', 'Liquidation engine failure'],
    incidentHistory: [],
  },
  {
    id: 'curve',
    name: 'Curve Finance',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGRkQ5MDAiLz48dGV4dCB4PSIyMCIgeT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QzwvdGV4dD48L3N2Zz4=',
    tvl: 4300000000,
    tvlHistory: generateTVLHistory(),
    riskScore: 72,
    riskLevel: RiskLevel.Medium,
    premiumRate: 2.8,
    coverageLimit: 500000,
    triggerConditions: ['Re-entrancy exploit', 'Stablecoin de-peg event > 5%'],
    incidentHistory: [{ date: '2023-07-30', description: 'Vyper compiler re-entrancy vulnerability.' }],
  },
   {
    id: 'uniswap',
    name: 'Uniswap',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGRjAwN0EiLz48dGV4dCB4PSIyMCIgeT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VTwvdGV4dD48L3N2Zz4=',
    tvl: 6200000000,
    tvlHistory: generateTVLHistory(),
    riskScore: 92,
    riskLevel: RiskLevel.Low,
    premiumRate: 1.1,
    coverageLimit: 1500000,
    triggerConditions: ['Flash loan attack', 'Protocol upgrade failure'],
    incidentHistory: [],
  },
  {
    id: 'sushiswap',
    name: 'SushiSwap',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMwM0Q5RkYiLz48dGV4dCB4PSIyMCIgeT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UzwvdGV4dD48L3N2Zz4=',
    tvl: 1100000000,
    tvlHistory: generateTVLHistory(),
    riskScore: 65,
    riskLevel: RiskLevel.Medium,
    premiumRate: 3.5,
    coverageLimit: 300000,
    triggerConditions: ['Rug pull by core team member', 'DNS hijacking'],
    incidentHistory: [{ date: '2023-04-09', description: 'RouteProcessor2 contract approval bug.' }],
  },
  {
    id: 'balancerv2',
    name: 'Balancer V2',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMxRTFFMUUiLz48dGV4dCB4PSIyMCIgeT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QjwvdGV4dD48L3N2Zz4=',
    tvl: 1800000000,
    tvlHistory: generateTVLHistory(),
    riskScore: 78,
    riskLevel: RiskLevel.Medium,
    premiumRate: 2.2,
    coverageLimit: 600000,
    triggerConditions: ['Pool manipulation', 'Flash loan vulnerability'],
    incidentHistory: [{ date: '2023-08-22', description: 'Vulnerability affecting boosted pools.' }],
  },
];

export const mockPolicies: Policy[] = [
  {
    id: 'pol-001',
    protocol: mockProtocols[0],
    coverageAmount: 50000,
    premiumPaid: 600,
    startDate: '2024-01-15',
    endDate: '2025-01-15',
    status: 'Active',
  },
  {
    id: 'pol-002',
    protocol: mockProtocols[2],
    coverageAmount: 25000,
    premiumPaid: 700,
    startDate: '2023-06-01',
    endDate: '2024-06-01',
    status: 'Expired',
  },
  {
    id: 'pol-003',
    protocol: mockProtocols[4],
    coverageAmount: 10000,
    premiumPaid: 350,
    startDate: '2024-03-10',
    endDate: '2025-03-10',
    status: 'Active',
  },
];

export const mockClaims: Claim[] = [
  {
    id: 'clm-001',
    policyId: 'pol-002-expired',
    protocolName: 'Curve Finance',
    claimDate: '2023-08-01',
    amount: 15000,
    status: 'Approved',
  },
  {
    id: 'clm-002',
    policyId: 'pol-005-active',
    protocolName: 'SushiSwap',
    claimDate: '2023-04-10',
    amount: 5000,
    status: 'Approved',
  },
  {
    id: 'clm-003',
    policyId: 'pol-001-active',
    protocolName: 'Aave',
    claimDate: '2024-05-20',
    amount: 20000,
    status: 'Pending',
  },
];

export const DOC_CONTENT = `Step 1: Connect Your Wallet
First, connect your wallet to the Praesidium AI platform.
Navigate to the homepage of the website.
Click the "Connect Wallet" button, usually located in the top-right corner.
Select your wallet provider from the list that appears.
Approve the connection request within your wallet extension or mobile app. Ensure you are connected to the Polygon network.

Step 2: Explore the Insurance Marketplace
Once connected, you can browse the available insurance options.
Go to the "Marketplace" or "Dashboard" section.
You will see a list of major DeFi protocols on Polygon that are available for coverage, such as Aave, Quickswap, and Polymarket. 
Next to each protocol, you will see its "Praesidium Score." This is a real-time risk rating from 1 to 100, generated by our AI engine. A higher score indicates lower perceived risk, which results in a lower premium.

Step 3: Configure Your Insurance Policy
Select the protocol you wish to protect and define the terms of your coverage.
Click on the protocol you want to insure (e.g., Aave).
On the policy configuration page, enter two details:
Coverage Amount: The total value (in USD) you wish to protect.
Coverage Period: The length of time you want the policy to be active (e.g., 30, 90, or 180 days).
As you enter these details, the interface will instantly calculate and display the Premium, which is the total cost of your insurance policy.

Step 4: Purchase Your Policy
Once you are satisfied with the terms, you can purchase the policy.
Click the "Purchase Cover" button.
Your wallet will pop up and ask you to approve two separate transactions:
Approve: This first transaction gives the Praesidium smart contract permission to use the required amount of your stablecoins for the premium.
Confirm Purchase: This second transaction finalizes the purchase and mints your policy.
Confirm both transactions in your wallet. Once the second transaction is confirmed on the Polygon blockchain, your assets are officially protected.`;
