import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../constants';

// Fallback RPC for read-only operations
const AMOY_RPC = 'https://polygon-amoy-bor-rpc.publicnode.com';

// Default ETH/USD price (fallback if oracle unavailable)
const DEFAULT_ETH_USD = 2500;

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface PriceCache {
  ethUsd: number;
  premiumRates: Record<string, number>;
  riskScores: Record<string, number>;
  lastUpdated: number;
}

let priceCache: PriceCache | null = null;

const ORACLE_ABI = [
  "function getRiskScore(string memory protocol) external view returns (uint256)",
  "function getPremiumRate(string memory protocol) external view returns (uint256)",
  "function calculatePremium(uint256 coverage, string memory protocol) external view returns (uint256)"
];

export const usePriceOracle = () => {
  const [ethUsdPrice, setEthUsdPrice] = useState<number>(DEFAULT_ETH_USD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProvider = useCallback(() => {
    return new ethers.JsonRpcProvider(AMOY_RPC);
  }, []);

  const getOracleContract = useCallback(() => {
    const provider = getProvider();
    const address = CONTRACT_ADDRESSES.amoy.RiskOracle;
    if (!address) return null;
    return new ethers.Contract(address, ORACLE_ABI, provider);
  }, [getProvider]);

  // Fetch ETH/USD price from external API (CoinGecko)
  const fetchEthPrice = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        { signal: AbortSignal.timeout(5000) }
      );
      if (response.ok) {
        const data = await response.json();
        return data.ethereum?.usd || DEFAULT_ETH_USD;
      }
    } catch {
      // Fallback to default if API fails
    }
    return DEFAULT_ETH_USD;
  }, []);

  // Get premium rate from oracle for a protocol
  const getPremiumRate = useCallback(async (protocol: string): Promise<number> => {
    // Check cache first
    if (priceCache && Date.now() - priceCache.lastUpdated < CACHE_DURATION) {
      if (priceCache.premiumRates[protocol] !== undefined) {
        return priceCache.premiumRates[protocol];
      }
    }

    try {
      const contract = getOracleContract();
      if (!contract) return 150; // Default 1.5%

      const rate = await contract.getPremiumRate(protocol);
      const ratePercent = Number(rate) / 100; // Convert basis points to percentage

      // Update cache
      if (!priceCache) {
        priceCache = { ethUsd: DEFAULT_ETH_USD, premiumRates: {}, riskScores: {}, lastUpdated: Date.now() };
      }
      priceCache.premiumRates[protocol] = ratePercent;
      priceCache.lastUpdated = Date.now();

      return ratePercent;
    } catch {
      return 1.5; // Default fallback
    }
  }, [getOracleContract]);

  // Get risk score from oracle for a protocol
  const getRiskScore = useCallback(async (protocol: string): Promise<number> => {
    // Check cache first
    if (priceCache && Date.now() - priceCache.lastUpdated < CACHE_DURATION) {
      if (priceCache.riskScores[protocol] !== undefined) {
        return priceCache.riskScores[protocol];
      }
    }

    try {
      const contract = getOracleContract();
      if (!contract) return 75; // Default score

      const score = await contract.getRiskScore(protocol);
      const scoreNum = Number(score);

      // Update cache
      if (!priceCache) {
        priceCache = { ethUsd: DEFAULT_ETH_USD, premiumRates: {}, riskScores: {}, lastUpdated: Date.now() };
      }
      priceCache.riskScores[protocol] = scoreNum;
      priceCache.lastUpdated = Date.now();

      return scoreNum;
    } catch {
      return 75; // Default fallback
    }
  }, [getOracleContract]);

  // Calculate premium using oracle
  const calculatePremium = useCallback(async (coverageUsd: number, protocol: string): Promise<number> => {
    try {
      const contract = getOracleContract();
      if (!contract) {
        // Fallback calculation
        const rate = await getPremiumRate(protocol);
        return coverageUsd * (rate / 100);
      }

      // Convert USD to ETH
      const coverageEth = coverageUsd / ethUsdPrice;
      const coverageWei = ethers.parseEther(coverageEth.toString());

      const premiumWei = await contract.calculatePremium(coverageWei, protocol);
      const premiumEth = parseFloat(ethers.formatEther(premiumWei));
      
      return premiumEth * ethUsdPrice; // Return in USD
    } catch {
      // Fallback calculation
      const rate = await getPremiumRate(protocol);
      return coverageUsd * (rate / 100);
    }
  }, [getOracleContract, ethUsdPrice, getPremiumRate]);

  // Convert ETH to USD
  const ethToUsd = useCallback((ethAmount: number): number => {
    return ethAmount * ethUsdPrice;
  }, [ethUsdPrice]);

  // Convert USD to ETH
  const usdToEth = useCallback((usdAmount: number): number => {
    return usdAmount / ethUsdPrice;
  }, [ethUsdPrice]);

  // Initialize price on mount
  useEffect(() => {
    const initPrice = async () => {
      setLoading(true);
      try {
        const price = await fetchEthPrice();
        setEthUsdPrice(price);
        
        if (!priceCache) {
          priceCache = { ethUsd: price, premiumRates: {}, riskScores: {}, lastUpdated: Date.now() };
        } else {
          priceCache.ethUsd = price;
          priceCache.lastUpdated = Date.now();
        }
      } catch (err) {
        setError('Failed to fetch price');
      } finally {
        setLoading(false);
      }
    };

    initPrice();

    // Refresh price every 5 minutes
    const interval = setInterval(initPrice, CACHE_DURATION);
    return () => clearInterval(interval);
  }, [fetchEthPrice]);

  return {
    ethUsdPrice,
    loading,
    error,
    getPremiumRate,
    getRiskScore,
    calculatePremium,
    ethToUsd,
    usdToEth,
    refreshPrice: fetchEthPrice,
  };
};

// Export default price for components that don't need the hook
export const DEFAULT_ETH_PRICE = DEFAULT_ETH_USD;
