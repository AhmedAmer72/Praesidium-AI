import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { ACTIVE_NETWORK, CONTRACT_ADDRESSES } from '../constants';

const POLYGON_RPC = 'https://polygon-bor-rpc.publicnode.com';
const AMOY_RPC = 'https://polygon-amoy-bor-rpc.publicnode.com';
const getRpcUrl = () => ACTIVE_NETWORK === 'polygon' ? POLYGON_RPC : AMOY_RPC;

const INSURANCE_V2_ABI = [
  'function getClaimCount() external view returns (uint256)',
  'function getClaim(uint256 claimId) external view returns (uint256, uint256, address, uint256, uint8, uint256, uint8)',
  'function getPolicy(uint256 policyId) external view returns (uint256, address, uint256, uint256, uint256, bool, string, bool)',
];

const triggerLabels: Record<number, string> = {
  0: 'TVL Drop',
  1: 'Smart Contract Exploit',
  2: 'Oracle Failure',
  3: 'Governance Attack',
  4: 'Depeg Event',
};

const statusLabels: Record<number, 'pending' | 'approved' | 'rejected' | 'paid'> = {
  0: 'pending',
  1: 'approved',
  2: 'rejected',
  3: 'paid',
};

export interface GlobalClaim {
  id: string;
  policyId: string;
  claimant: string;
  claimantShort: string;
  amountEth: number;
  triggerType: number;
  triggerLabel: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  protocol?: string;
}

const MAX_CLAIMS_TO_FETCH = 20;

export const useGlobalClaims = () => {
  const [claims, setClaims] = useState<GlobalClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalClaims, setTotalClaims] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new ethers.JsonRpcProvider(getRpcUrl());
      const address = CONTRACT_ADDRESSES[ACTIVE_NETWORK].PraesidiumInsuranceV2;
      if (!address) {
        setError('Contract address not configured');
        setLoading(false);
        return;
      }

      const contract = new ethers.Contract(address, INSURANCE_V2_ABI, provider);
      const claimCount = Number(await contract.getClaimCount());
      setTotalClaims(claimCount);

      if (claimCount === 0) {
        setClaims([]);
        setLoading(false);
        return;
      }

      const results: GlobalClaim[] = [];
      const startId = Math.max(1, claimCount - MAX_CLAIMS_TO_FETCH + 1);

      for (let i = claimCount; i >= startId; i--) {
        try {
          const claimData = await contract.getClaim(i);
          const policyId = claimData[1].toString();

          let protocol = 'Unknown';
          try {
            const policyData = await contract.getPolicy(policyId);
            protocol = policyData[6] || 'Unknown';
          } catch {
            // leave as Unknown
          }

          const claimant: string = claimData[2];
          results.push({
            id: claimData[0].toString(),
            policyId,
            claimant,
            claimantShort: `${claimant.slice(0, 6)}...${claimant.slice(-4)}`,
            amountEth: parseFloat(ethers.formatEther(claimData[3])),
            triggerType: Number(claimData[4]),
            triggerLabel: triggerLabels[Number(claimData[4])] || 'Unknown',
            timestamp: Number(claimData[5]) * 1000,
            status: statusLabels[Number(claimData[6])] || 'pending',
            protocol,
          });

          await new Promise(r => setTimeout(r, 100));
        } catch {
          // skip invalid IDs silently
        }
      }

      setClaims(results);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  return { claims, loading, totalClaims, error, refetch: fetchClaims };
};
