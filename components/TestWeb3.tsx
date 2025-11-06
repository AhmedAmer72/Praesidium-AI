import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Provider';
import { useContract } from '../hooks/useContract';
import Button from './ui/Button';
import Card from './ui/Card';

const TestWeb3: React.FC = () => {
  const { isConnected, account, connectWallet, switchToAmoy } = useWeb3();
  const { getInsuranceContract, getOracleContract } = useContract();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testContractConnection = async () => {
    try {
      addResult('Testing contract connections...');
      
      const insuranceContract = getInsuranceContract();
      const oracleContract = getOracleContract();
      
      if (!insuranceContract) {
        addResult('❌ Insurance contract not available');
        return;
      }
      
      if (!oracleContract) {
        addResult('❌ Oracle contract not available');
        return;
      }
      
      addResult('✅ Contract instances created successfully');
      
      // Test oracle read function
      try {
        const riskScore = await oracleContract.getRiskScore('Uniswap');
        addResult(`✅ Oracle read test: Uniswap risk score = ${riskScore}`);
      } catch (error) {
        addResult(`❌ Oracle read failed: ${error.message}`);
      }
      
      // Test insurance read function
      try {
        const policyCount = await insuranceContract.getPolicyCount();
        addResult(`✅ Insurance read test: Policy count = ${policyCount}`);
      } catch (error) {
        addResult(`❌ Insurance read failed: ${error.message}`);
      }
      
    } catch (error) {
      addResult(`❌ Contract test failed: ${error.message}`);
    }
  };

  const testPolicyCreation = async () => {
    try {
      addResult('Testing policy creation...');
      const contract = getInsuranceContract();
      if (!contract || !account) return;
      
      const premium = '0.01'; // 0.01 MATIC
      const coverage = '1000'; // 1000 MATIC
      const duration = 365 * 24 * 60 * 60; // 1 year
      
      const tx = await contract.createPolicy(
        account,
        ethers.parseEther(premium),
        ethers.parseEther(coverage),
        duration,
        'Uniswap',
        { value: ethers.parseEther(premium) }
      );
      
      addResult(`✅ Policy creation transaction sent: ${tx.hash}`);
      await tx.wait();
      addResult('✅ Policy created successfully!');
      
    } catch (error) {
      addResult(`❌ Policy creation failed: ${error.message}`);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <div className="p-6">
        <h2 className="text-2xl font-orbitron mb-4">Web3 Integration Test</h2>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span>Wallet Status:</span>
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? '✅ Connected' : '❌ Not Connected'}
            </span>
          </div>
          
          {isConnected && (
            <div className="flex items-center justify-between">
              <span>Account:</span>
              <span className="text-sm font-mono">{account?.slice(0, 6)}...{account?.slice(-4)}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {!isConnected && (
            <Button onClick={connectWallet}>Connect Wallet</Button>
          )}
          
          {isConnected && (
            <>
              <Button onClick={switchToAmoy} variant="secondary">Switch to Amoy</Button>
              <Button onClick={testContractConnection}>Test Contracts</Button>
              <Button onClick={testPolicyCreation}>Test Policy Creation</Button>
            </>
          )}
        </div>
        
        {testResults.length > 0 && (
          <div className="bg-dark-bg/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono text-gray-300">
                  {result}
                </div>
              ))}
            </div>
            <Button 
              onClick={() => setTestResults([])} 
              variant="secondary" 
              className="mt-2 text-xs"
            >
              Clear Results
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TestWeb3;