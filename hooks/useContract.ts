import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../constants';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Contract ABIs (minimal for now)
const INSURANCE_ABI = [
  "function createPolicy(address holder, uint256 premium, uint256 coverage, uint256 duration, string memory protocol) external payable returns (uint256)",
  "function getPolicyCount() external view returns (uint256)",
  "function getPolicy(uint256 policyId) external view returns (uint256, address, uint256, uint256, uint256, bool, string)",
  "function getHolderPolicies(address holder) external view returns (uint256[])"
];

const LIQUIDITY_ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 shares) external",
  "function getPoolBalance() external view returns (uint256)",
  "function getUserShares(address user) external view returns (uint256)",
  "function getUserBalance(address user) external view returns (uint256)",
  "function totalShares() external view returns (uint256)"
];

const ORACLE_ABI = [
  "function getRiskScore(string memory protocol) external view returns (uint256)",
  "function getPremiumRate(string memory protocol) external view returns (uint256)",
  "function calculatePremium(uint256 coverage, string memory protocol) external view returns (uint256)"
];

export const useContract = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [network, setNetwork] = useState<'amoy' | 'polygon'>('amoy');

  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);
        
        // Auto-connect if already connected
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const signer = await web3Provider.getSigner();
            setSigner(signer);
          }
        } catch (error) {
          console.log('Auto-connect failed:', error);
        }
      }
    };
    
    initProvider();
  }, []);

  const connectWallet = async () => {
    if (!provider) {
      console.log('No provider available');
      return null;
    }
    
    try {
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      console.log('Wallet connected, signer:', !!signer);
      setSigner(signer);
      return signer;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return null;
    }
  };

  const getInsuranceContract = () => {
    if (!signer) return null;
    const address = CONTRACT_ADDRESSES[network].PraesidiumInsurance;
    if (!address) return null;
    return new ethers.Contract(address, INSURANCE_ABI, signer);
  };

  const getInsuranceContractReadOnly = () => {
    if (!provider) return null;
    const address = CONTRACT_ADDRESSES[network].PraesidiumInsurance;
    if (!address) return null;
    return new ethers.Contract(address, INSURANCE_ABI, provider);
  };

  const getLiquidityContract = () => {
    console.log('getLiquidityContract called:', {
      signer: !!signer,
      network,
      address: CONTRACT_ADDRESSES[network].LiquidityPool,
      allAddresses: CONTRACT_ADDRESSES
    });
    
    if (!signer) return null;
    const address = CONTRACT_ADDRESSES[network].LiquidityPool;
    if (!address) return null;
    return new ethers.Contract(address, LIQUIDITY_ABI, signer);
  };

  const getOracleContract = () => {
    if (!provider) return null;
    const address = CONTRACT_ADDRESSES[network].RiskOracle;
    if (!address) return null;
    return new ethers.Contract(address, ORACLE_ABI, provider);
  };

  const getOracleContractWithSigner = () => {
    if (!signer) return null;
    const address = CONTRACT_ADDRESSES[network].RiskOracle;
    if (!address) return null;
    return new ethers.Contract(address, ORACLE_ABI, signer);
  };

  return {
    provider,
    signer,
    network,
    setNetwork,
    connectWallet,
    getInsuranceContract,
    getInsuranceContractReadOnly,
    getLiquidityContract,
    getOracleContract,
    getOracleContractWithSigner
  };
};