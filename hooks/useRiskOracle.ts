import { useState, useEffect } from 'react';
import { useContract } from './useContract';

export const useRiskOracle = () => {
  const { getOracleContract, provider } = useContract();
  const [riskScores, setRiskScores] = useState<Record<string, number>>({});
  const [premiumRates, setPremiumRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchRiskData = async () => {
    setLoading(true);
    try {
      // Wait for provider to be available
      if (!provider) {
        console.log('Provider not available, using fallback data');
        // Use fallback data
        setRiskScores({
          'Aave': 88,
          'Compound': 85,
          'Curve Finance': 72,
          'Uniswap': 92,
          'SushiSwap': 65,
          'Balancer V2': 78
        });
        setPremiumRates({
          'Aave': 1.2,
          'Compound': 1.5,
          'Curve Finance': 2.8,
          'Uniswap': 1.1,
          'SushiSwap': 3.5,
          'Balancer V2': 2.2
        });
        return;
      }
      
      const contract = getOracleContract();
      if (!contract) {
        console.log('Oracle contract not available, using fallback data');
        // Use fallback data
        setRiskScores({
          'Aave': 88,
          'Compound': 85,
          'Curve Finance': 72,
          'Uniswap': 92,
          'SushiSwap': 65,
          'Balancer V2': 78
        });
        setPremiumRates({
          'Aave': 1.2,
          'Compound': 1.5,
          'Curve Finance': 2.8,
          'Uniswap': 1.1,
          'SushiSwap': 3.5,
          'Balancer V2': 2.2
        });
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
          console.error(`Error fetching data for ${protocol}:`, error);
          // Use fallback values
          scores[protocol] = protocol === 'Aave' ? 88 : 75;
          rates[protocol] = protocol === 'Aave' ? 1.2 : 2.0;
        }
      }

      setRiskScores(scores);
      setPremiumRates(rates);
      console.log('Risk Oracle data loaded:', { scores, rates });
      
    } catch (error) {
      console.error('Error fetching risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when provider is available
    if (provider) {
      fetchRiskData();
    }
  }, [provider]);
  
  // Initial load with fallback data
  useEffect(() => {
    if (!provider) {
      fetchRiskData();
    }
  }, []);

  return {
    riskScores,
    premiumRates,
    loading,
    refetch: fetchRiskData
  };
};