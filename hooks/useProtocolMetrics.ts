import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, ACTIVE_NETWORK } from '../constants';

const POLYGON_RPC = 'https://polygon-bor-rpc.publicnode.com';
const AMOY_RPC = 'https://polygon-amoy-bor-rpc.publicnode.com';

const getRpcUrl = () => ACTIVE_NETWORK === 'polygon' ? POLYGON_RPC : AMOY_RPC;

const INSURANCE_V2_ABI = [
  "function totalPremiums() external view returns (uint256)",
  "function totalCoverage() external view returns (uint256)",
  "function totalClaimsPaid() external view returns (uint256)",
  "function getPolicyCount() external view returns (uint256)",
  "function getClaimCount() external view returns (uint256)",
  "function getContractBalance() external view returns (uint256)",
];

const LIQUIDITY_ABI = [
  "function totalDeposits() external view returns (uint256)",
  "function totalRewards() external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function getPoolBalance() external view returns (uint256)",
];

export interface ProtocolMetrics {
  // Insurance metrics
  totalPremiums: number;
  totalCoverage: number;
  totalClaimsPaid: number;
  activePolicies: number;
  totalClaims: number;
  claimsRatio: number;
  insuranceBalance: number;
  
  // Liquidity metrics
  tvl: number;
  totalLPDeposits: number;
  totalRewardsDistributed: number;
  poolBalance: number;
  
  // Calculated metrics
  capitalEfficiency: number;
  lossRatio: number;
  premiumToTVLRatio: number;
}

export const useProtocolMetrics = () => {
  const [metrics, setMetrics] = useState<ProtocolMetrics>({
    totalPremiums: 0,
    totalCoverage: 0,
    totalClaimsPaid: 0,
    activePolicies: 0,
    totalClaims: 0,
    claimsRatio: 0,
    insuranceBalance: 0,
    tvl: 0,
    totalLPDeposits: 0,
    totalRewardsDistributed: 0,
    poolBalance: 0,
    capitalEfficiency: 0,
    lossRatio: 0,
    premiumToTVLRatio: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getProvider = useCallback(() => {
    return new ethers.JsonRpcProvider(getRpcUrl());
  }, []);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = getProvider();

      // Fetch Insurance V2 metrics
      const insuranceAddress = CONTRACT_ADDRESSES[ACTIVE_NETWORK].PraesidiumInsuranceV2;
      let insuranceMetrics = {
        totalPremiums: 0,
        totalCoverage: 0,
        totalClaimsPaid: 0,
        activePolicies: 0,
        totalClaims: 0,
        insuranceBalance: 0,
      };

      if (insuranceAddress) {
        const insuranceContract = new ethers.Contract(insuranceAddress, INSURANCE_V2_ABI, provider);

        try {
          const [
            totalPremiums,
            totalCoverage,
            totalClaimsPaid,
            policyCount,
            claimCount,
            contractBalance,
          ] = await Promise.all([
            insuranceContract.totalPremiums().catch(() => BigInt(0)),
            insuranceContract.totalCoverage().catch(() => BigInt(0)),
            insuranceContract.totalClaimsPaid().catch(() => BigInt(0)),
            insuranceContract.getPolicyCount().catch(() => BigInt(0)),
            insuranceContract.getClaimCount().catch(() => BigInt(0)),
            insuranceContract.getContractBalance().catch(() => BigInt(0)),
          ]);

          insuranceMetrics = {
            totalPremiums: parseFloat(ethers.formatEther(totalPremiums)),
            totalCoverage: parseFloat(ethers.formatEther(totalCoverage)),
            totalClaimsPaid: parseFloat(ethers.formatEther(totalClaimsPaid)),
            activePolicies: Number(policyCount),
            totalClaims: Number(claimCount),
            insuranceBalance: parseFloat(ethers.formatEther(contractBalance)),
          };
        } catch (err) {
          console.log('Error fetching insurance metrics:', err);
        }
      }

      // Fetch Liquidity Pool metrics
      const liquidityAddress = CONTRACT_ADDRESSES[ACTIVE_NETWORK].LiquidityPool;
      let liquidityMetrics = {
        totalLPDeposits: 0,
        totalRewardsDistributed: 0,
        poolBalance: 0,
      };

      if (liquidityAddress) {
        const liquidityContract = new ethers.Contract(liquidityAddress, LIQUIDITY_ABI, provider);

        try {
          let totalDeposits = BigInt(0);
          let totalRewards = BigInt(0);
          let poolBalance = BigInt(0);

          // Try getPoolBalance first, fallback to address balance
          try {
            poolBalance = await liquidityContract.getPoolBalance();
          } catch {
            try {
              poolBalance = await provider.getBalance(liquidityAddress);
            } catch {
              poolBalance = BigInt(0);
            }
          }

          try {
            totalDeposits = await liquidityContract.totalDeposits();
          } catch {
            totalDeposits = poolBalance;
          }

          try {
            totalRewards = await liquidityContract.totalRewards();
          } catch {
            totalRewards = BigInt(0);
          }

          liquidityMetrics = {
            totalLPDeposits: parseFloat(ethers.formatEther(totalDeposits)),
            totalRewardsDistributed: parseFloat(ethers.formatEther(totalRewards)),
            poolBalance: parseFloat(ethers.formatEther(poolBalance)),
          };
        } catch (err) {
          console.log('Error fetching liquidity metrics:', err);
          try {
            const balance = await provider.getBalance(liquidityAddress);
            liquidityMetrics.poolBalance = parseFloat(ethers.formatEther(balance));
            liquidityMetrics.totalLPDeposits = liquidityMetrics.poolBalance;
          } catch {
            // Keep zeros
          }
        }
      }

      // Calculate derived metrics
      const tvl = liquidityMetrics.poolBalance + insuranceMetrics.insuranceBalance;
      
      const claimsRatio = insuranceMetrics.activePolicies > 0
        ? (insuranceMetrics.totalClaims / insuranceMetrics.activePolicies) * 100
        : 0;

      const lossRatio = insuranceMetrics.totalPremiums > 0
        ? (insuranceMetrics.totalClaimsPaid / insuranceMetrics.totalPremiums) * 100
        : 0;

      const capitalEfficiency = tvl > 0
        ? (insuranceMetrics.totalCoverage / tvl) * 100
        : 0;

      const premiumToTVLRatio = tvl > 0
        ? (insuranceMetrics.totalPremiums / tvl) * 100
        : 0;

      setMetrics({
        ...insuranceMetrics,
        ...liquidityMetrics,
        tvl,
        claimsRatio,
        lossRatio,
        capitalEfficiency,
        premiumToTVLRatio,
      });

    } catch (err) {
      console.error('Error fetching protocol metrics:', err);
      setError('Failed to fetch protocol metrics');
    } finally {
      setLoading(false);
    }
  }, [getProvider]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
};
