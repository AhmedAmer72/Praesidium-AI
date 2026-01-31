import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, ACTIVE_NETWORK } from '../constants';

const POLYGON_RPC = 'https://polygon-bor-rpc.publicnode.com';
const AMOY_RPC = 'https://polygon-amoy-bor-rpc.publicnode.com';

const getRpcUrl = () => ACTIVE_NETWORK === 'polygon' ? POLYGON_RPC : AMOY_RPC;

const INSURANCE_ABI = [
  "function totalCoverage() external view returns (uint256)",
  "function totalClaimsPaid() external view returns (uint256)",
  "function getPolicyCount() external view returns (uint256)",
];

const LIQUIDITY_ABI = [
  "function getPoolBalance() external view returns (uint256)",
  "function totalDeposits() external view returns (uint256)",
];

export interface CoverageCapacity {
  // Raw values (in ETH/MATIC)
  poolBalance: number;
  totalActiveCoverage: number;
  totalClaimsPaid: number;
  
  // Calculated metrics
  utilizationRatio: number; // Coverage sold / Pool balance (as percentage)
  availableCapacity: number; // How much more coverage can be sold
  capacityStatus: 'healthy' | 'moderate' | 'critical' | 'exceeded';
  collateralizationRatio: number; // Pool / Coverage (inverse of utilization)
  maxSingleClaim: number; // Largest claim that can be paid right now
  
  // Policy limits
  remainingCapacity: number; // Pool - (Coverage * reserve ratio)
  reserveRatio: number; // Target reserve (e.g., 1.5x coverage)
}

// Target: Pool should hold at least 150% of outstanding coverage for safety
const TARGET_RESERVE_RATIO = 1.5;
const MAX_UTILIZATION = 0.8; // Don't let coverage exceed 80% of pool

export const useCoverageCapacity = () => {
  const [capacity, setCapacity] = useState<CoverageCapacity>({
    poolBalance: 0,
    totalActiveCoverage: 0,
    totalClaimsPaid: 0,
    utilizationRatio: 0,
    availableCapacity: 0,
    capacityStatus: 'healthy',
    collateralizationRatio: 0,
    maxSingleClaim: 0,
    remainingCapacity: 0,
    reserveRatio: TARGET_RESERVE_RATIO,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getProvider = useCallback(() => {
    return new ethers.JsonRpcProvider(getRpcUrl());
  }, []);

  const fetchCapacity = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = getProvider();

      // Get liquidity pool balance
      const liquidityAddress = CONTRACT_ADDRESSES[ACTIVE_NETWORK].LiquidityPool;
      let poolBalance = 0;
      
      if (liquidityAddress && liquidityAddress !== '0x0000000000000000000000000000000000000000') {
        try {
          const liquidityContract = new ethers.Contract(liquidityAddress, LIQUIDITY_ABI, provider);
          const poolBalanceWei = await liquidityContract.getPoolBalance();
          poolBalance = parseFloat(ethers.formatEther(poolBalanceWei));
        } catch (e) {
          // Try getting raw balance if contract method fails
          const balance = await provider.getBalance(liquidityAddress);
          poolBalance = parseFloat(ethers.formatEther(balance));
        }
      }

      // Get insurance coverage data
      const insuranceAddress = CONTRACT_ADDRESSES[ACTIVE_NETWORK].PraesidiumInsuranceV2;
      let totalCoverage = 0;
      let totalClaimsPaid = 0;

      if (insuranceAddress && insuranceAddress !== '0x0000000000000000000000000000000000000000') {
        try {
          const insuranceContract = new ethers.Contract(insuranceAddress, INSURANCE_ABI, provider);
          
          const [coverageWei, claimsPaidWei] = await Promise.all([
            insuranceContract.totalCoverage().catch(() => 0n),
            insuranceContract.totalClaimsPaid().catch(() => 0n),
          ]);
          
          totalCoverage = parseFloat(ethers.formatEther(coverageWei || 0n));
          totalClaimsPaid = parseFloat(ethers.formatEther(claimsPaidWei || 0n));
        } catch (e) {
          console.warn('Could not fetch insurance metrics:', e);
        }
      }

      // Calculate derived metrics
      const utilizationRatio = poolBalance > 0 
        ? (totalCoverage / poolBalance) * 100 
        : 0;
      
      const collateralizationRatio = totalCoverage > 0 
        ? poolBalance / totalCoverage 
        : Infinity;
      
      // Available capacity = what can still be covered while maintaining reserve ratio
      const maxCoverageAtReserve = poolBalance / TARGET_RESERVE_RATIO;
      const availableCapacity = Math.max(0, maxCoverageAtReserve - totalCoverage);
      
      // Remaining capacity before hitting max utilization
      const maxCoverageAtUtilization = poolBalance * MAX_UTILIZATION;
      const remainingCapacity = Math.max(0, maxCoverageAtUtilization - totalCoverage);
      
      // Max single claim is limited by pool balance
      const maxSingleClaim = poolBalance * 0.9; // Leave 10% buffer
      
      // Determine status
      let capacityStatus: CoverageCapacity['capacityStatus'] = 'healthy';
      if (utilizationRatio > 100) {
        capacityStatus = 'exceeded';
      } else if (utilizationRatio > 80) {
        capacityStatus = 'critical';
      } else if (utilizationRatio > 60) {
        capacityStatus = 'moderate';
      }

      setCapacity({
        poolBalance,
        totalActiveCoverage: totalCoverage,
        totalClaimsPaid,
        utilizationRatio,
        availableCapacity,
        capacityStatus,
        collateralizationRatio,
        maxSingleClaim,
        remainingCapacity,
        reserveRatio: TARGET_RESERVE_RATIO,
      });

    } catch (err) {
      console.error('Error fetching coverage capacity:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch capacity');
    } finally {
      setLoading(false);
    }
  }, [getProvider]);

  useEffect(() => {
    fetchCapacity();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCapacity, 30000);
    return () => clearInterval(interval);
  }, [fetchCapacity]);

  return {
    ...capacity,
    loading,
    error,
    refetch: fetchCapacity,
    TARGET_RESERVE_RATIO,
    MAX_UTILIZATION,
  };
};
