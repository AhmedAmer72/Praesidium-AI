import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../constants';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Fallback RPC URLs for Polygon Amoy (in case MetaMask RPC is rate limited)
const AMOY_RPC_URLS = [
  'https://polygon-amoy-bor-rpc.publicnode.com',
  'https://polygon-amoy.drpc.org',
  'https://rpc-amoy.polygon.technology'
];

// Create a fallback JSON-RPC provider
const getFallbackProvider = () => {
  return new ethers.JsonRpcProvider(AMOY_RPC_URLS[0]);
};

// Request MetaMask to add/switch to Polygon Amoy with better RPC
export const switchToAmoyWithGoodRPC = async () => {
  if (!window.ethereum) return false;
  
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x13882', // 80002 in hex
        chainName: 'Polygon Amoy Testnet',
        nativeCurrency: {
          name: 'POL',
          symbol: 'POL',
          decimals: 18
        },
        rpcUrls: ['https://polygon-amoy-bor-rpc.publicnode.com'],
        blockExplorerUrls: ['https://amoy.polygonscan.com']
      }]
    });
    return true;
  } catch (error) {
    console.error('Failed to switch network:', error);
    return false;
  }
};

// Contract ABIs (minimal for now)
const INSURANCE_ABI = [
  "function createPolicy(address holder, uint256 premium, uint256 coverage, uint256 duration, string memory protocol) external payable returns (uint256)",
  "function claimPolicy(uint256 policyId) external",
  "function getPolicyCount() external view returns (uint256)",
  "function policies(uint256 policyId) external view returns (uint256 id, address holder, uint256 premium, uint256 coverage, uint256 expiry, bool active, string memory protocol)",
  "function getHolderPolicies(address holder) external view returns (uint256[])"
];

// V2 Insurance ABI with claims system
const INSURANCE_V2_ABI = [
  "function createPolicy(address holder, uint256 premium, uint256 coverage, uint256 duration, string memory protocol) external payable returns (uint256)",
  "function submitClaim(uint256 policyId, uint8 triggerType, string memory evidence) external returns (uint256)",
  "function approveClaim(uint256 claimId) external",
  "function rejectClaim(uint256 claimId, string memory reason) external",
  "function processClaimAutomatically(uint256 claimId) external",
  "function activateTrigger(string memory protocol, uint8 triggerType, uint256 severity) external",
  "function deactivateTrigger(string memory protocol) external",
  "function isTriggerActive(string memory protocol) external view returns (bool, uint8, uint256)",
  "function getPolicyCount() external view returns (uint256)",
  "function getClaimCount() external view returns (uint256)",
  "function getPolicy(uint256 policyId) external view returns (uint256, address, uint256, uint256, uint256, bool, string, bool)",
  "function getClaim(uint256 claimId) external view returns (uint256, uint256, address, uint256, uint8, uint256, uint8)",
  "function getHolderPolicies(address holder) external view returns (uint256[])",
  "function getHolderClaims(address holder) external view returns (uint256[])",
  "function policies(uint256 policyId) external view returns (uint256 id, address holder, uint256 premium, uint256 coverage, uint256 expiry, bool active, string memory protocol, bool claimed)",
  "function totalClaimsPaid() external view returns (uint256)",
  "function getContractBalance() external view returns (uint256)"
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
    // Use fallback provider to avoid MetaMask rate limiting
    const fallbackProvider = getFallbackProvider();
    const address = CONTRACT_ADDRESSES[network].PraesidiumInsurance;
    if (!address) return null;
    return new ethers.Contract(address, INSURANCE_ABI, fallbackProvider);
  };

  const getInsuranceV2Contract = () => {
    if (!signer) {
      console.log('getInsuranceV2Contract: No signer available');
      return null;
    }
    const address = CONTRACT_ADDRESSES[network].PraesidiumInsuranceV2;
    console.log('getInsuranceV2Contract: Using address', address);
    if (!address) {
      console.log('V2 contract address not found, using V1');
      return null;
    }
    return new ethers.Contract(address, INSURANCE_V2_ABI, signer);
  };

  const getInsuranceV2ContractReadOnly = () => {
    // Use fallback provider to avoid MetaMask rate limiting
    const fallbackProvider = getFallbackProvider();
    const address = CONTRACT_ADDRESSES[network].PraesidiumInsuranceV2;
    if (!address) return null;
    return new ethers.Contract(address, INSURANCE_V2_ABI, fallbackProvider);
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
    // Use fallback provider to avoid MetaMask rate limiting
    const fallbackProvider = getFallbackProvider();
    const address = CONTRACT_ADDRESSES[network].RiskOracle;
    if (!address) return null;
    return new ethers.Contract(address, ORACLE_ABI, fallbackProvider);
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
    getInsuranceV2Contract,
    getInsuranceV2ContractReadOnly,
    getLiquidityContract,
    getOracleContract,
    getOracleContractWithSigner
  };
};