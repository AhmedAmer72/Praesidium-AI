import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { useContract } from '../hooks/useContract';
import Button from './ui/Button';

const ContractTest = () => {
  const { isConnected, address } = useAccount();
  const { getInsuranceContract, getInsuranceContractReadOnly, getLiquidityContract, getOracleContract, connectWallet } = useContract();
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testContract = async () => {
    setLoading(true);
    setResult('Testing contract...');
    
    try {
      await connectWallet();
      
      const contract = getInsuranceContractReadOnly();
      if (!contract) {
        setResult('❌ Contract not available');
        return;
      }
      
      // Test basic contract call
      const policyCount = await contract.getPolicyCount();
      setResult(`✅ Contract connected! Total policies: ${policyCount.toString()}`);
      
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testPurchase = async () => {
    setLoading(true);
    setResult('Testing purchase...');
    
    try {
      await connectWallet();
      
      const contract = getInsuranceContract();
      if (!contract) {
        setResult('❌ Contract not available');
        return;
      }
      
      const premiumWei = ethers.parseUnits("0.001", "ether");
      const coverageWei = ethers.parseUnits("0.02", "ether"); // $50 worth
      const duration = 365 * 24 * 60 * 60;
      
      const tx = await contract.createPolicy(
        address,
        premiumWei,
        coverageWei,
        duration,
        "Test Protocol",
        { value: premiumWei, gasLimit: 500000 }
      );
      
      setResult(`⏳ Transaction sent: ${tx.hash}`);
      await tx.wait();
      setResult(`✅ Policy created! TX: ${tx.hash}`);
      
    } catch (error) {
      setResult(`❌ Purchase failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLiquidity = async () => {
    setLoading(true);
    setResult('Testing liquidity pool...');
    
    try {
      await connectWallet();
      
      const contract = getLiquidityContract();
      if (!contract) {
        setResult('❌ Liquidity contract not available');
        return;
      }
      
      // Test contract connection first
      const poolBalance = await contract.getPoolBalance();
      setResult(`✅ Liquidity contract connected! Pool balance: ${ethers.formatEther(poolBalance)} MATIC`);
      
    } catch (error) {
      setResult(`❌ Liquidity test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testOracle = async () => {
    setLoading(true);
    setResult('Testing Risk Oracle...');
    
    try {
      const contract = getOracleContract();
      if (!contract) {
        setResult('❌ Oracle contract not available');
        return;
      }
      
      // Test oracle with Aave
      const aaveScore = await contract.getRiskScore('Aave');
      const aaveRate = await contract.getPremiumRate('Aave');
      
      setResult(`✅ Oracle connected! Aave: Score ${aaveScore}, Rate ${aaveRate} basis points`);
      
    } catch (error) {
      setResult(`❌ Oracle test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return <div className="p-4 bg-gray-800 rounded">Connect wallet to test contracts</div>;
  }

  return (
    <div className="p-4 bg-gray-800 rounded space-y-4">
      <h3 className="text-lg font-bold">Contract Integration Test</h3>
      <div className="space-x-2 flex flex-wrap gap-2">
        <Button onClick={testContract} disabled={loading}>
          Test Contract
        </Button>
        <Button onClick={testPurchase} disabled={loading}>
          Test Purchase
        </Button>
        <Button onClick={testLiquidity} disabled={loading}>
          Test Liquidity
        </Button>
        <Button onClick={testOracle} disabled={loading}>
          Test Oracle
        </Button>
      </div>
      {result && (
        <div className="p-3 bg-gray-900 rounded text-sm font-mono">
          {result}
        </div>
      )}
    </div>
  );
};

export default ContractTest;