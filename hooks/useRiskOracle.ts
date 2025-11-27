import { useState, useEffect } from 'react';
import { useContract } from './useContract';

// Fallback data for when contract is not available
const FALLBACK_RISK_SCORES: Record<string, number> = {
  'Aave': 88,
  'Compound': 85,
  'Curve Finance': 72,
  'Uniswap': 92,
  'SushiSwap': 65,
  'Balancer V2': 78
};

const FALLBACK_PREMIUM_RATES: Record<string, number> = {
  'Aave': 1.2,
  'Compound': 1.5,
  'Curve Finance': 2.8,
  'Uniswap': 1.1,
  'SushiSwap': 3.5,
  'Balancer V2': 2.2
};

export const useRiskOracle = () => {
  const { getOracleContract, provider } = useContract();
  const [riskScores, setRiskScores] = useState<Record<string, number>>(FALLBACK_RISK_SCORES);
  const [premiumRates, setPremiumRates] = useState<Record<string, number>>(FALLBACK_PREMIUM_RATES);
  const [loading, setLoading] = useState(true);

  const fetchRiskData = async () => {
    setLoading(true);
    try {
      // Wait for provider to be available
      if (!provider) {
        console.log('Provider not available, using fallback data');
        setRiskScores(FALLBACK_RISK_SCORES);
        setPremiumRates(FALLBACK_PREMIUM_RATES);
        setLoading(false);
        return;
      }
      
      const contract = getOracleContract();
      if (!contract) {
        console.log('Oracle contract not available, using fallback data');
        setRiskScores(FALLBACK_RISK_SCORES);
        setPremiumRates(FALLBACK_PREMIUM_RATES);
        setLoading(false);
        return;
      }

      const protocols = ['Aave', 'Compound', 'Curve Finance', 'Uniswap', 'SushiSwap', 'Balancer V2'];
      const scores: Record<string, number> = {};
      const rates: Record<string, number> = {};

      for (const protocol of protocols) {
        try {
          const score = await contract.getRiskScore(protocol);
          const rate = await contract.getPremiumRate(protocol);
          
          scores[protocol] = parseInt(score.toString());
          rates[protocol] = parseInt(rate.toString()) / 100; // Convert basis points to percentage
        } catch (error) {
          // Use fallback values for this protocol
          scores[protocol] = FALLBACK_RISK_SCORES[protocol] || 75;
          rates[protocol] = FALLBACK_PREMIUM_RATES[protocol] || 2.0;
          console.log(`Using fallback data for ${protocol}`);
        }
      }

      setRiskScores(scores);
      setPremiumRates(rates);
      console.log('Risk Oracle data loaded:', { scores, rates });
      
    } catch (error) {
      console.error('Error fetching risk data, using fallback:', error);
      // Use fallback data
      setRiskScores(FALLBACK_RISK_SCORES);
      setPremiumRates(FALLBACK_PREMIUM_RATES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load with fallback data
    fetchRiskData();
  }, []);

  useEffect(() => {
    // Re-fetch when provider becomes available
    if (provider) {
      fetchRiskData();
    }
  }, [provider]);

  return {
    riskScores,
    premiumRates,
    loading,
    refetch: fetchRiskData
  };
};