import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES, ACTIVE_NETWORK } from '../constants';

// Fallback RPC for read-only operations
const POLYGON_RPC = 'https://polygon-bor-rpc.publicnode.com';
const AMOY_RPC = 'https://polygon-amoy-bor-rpc.publicnode.com';

const getRpcUrl = () => ACTIVE_NETWORK === 'polygon' ? POLYGON_RPC : AMOY_RPC;
const getExplorerUrl = () => ACTIVE_NETWORK === 'polygon' ? 'https://polygonscan.com' : 'https://amoy.polygonscan.com';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'policy_purchase' | 'claim_submitted' | 'claim_paid' | 'premium_paid';
  amount: number;
  amountUsd?: number;
  timestamp: number;
  txHash: string;
  status: 'confirmed' | 'pending' | 'failed';
  protocol?: string;
  policyId?: string;
  description: string;
}

const INSURANCE_V2_ABI = [
  "event PolicyCreated(uint256 indexed policyId, address indexed holder, uint256 premium, uint256 coverage, string protocol)",
  "event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, address indexed claimant, uint256 amount, uint8 triggerType)",
  "event ClaimPaid(uint256 indexed claimId, address indexed recipient, uint256 amount)",
];

const LIQUIDITY_ABI = [
  "event Deposited(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",
];

export const useTransactionHistory = () => {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProvider = useCallback(() => {
    return new ethers.JsonRpcProvider(getRpcUrl());
  }, []);

  // Helper to query events in chunks to avoid block range limits
  const queryEventsInChunks = async (
    contract: ethers.Contract,
    filter: ethers.ContractEventName,
    fromBlock: number,
    toBlock: number,
    chunkSize: number = 10000
  ): Promise<ethers.EventLog[]> => {
    const allEvents: ethers.EventLog[] = [];
    
    for (let start = fromBlock; start <= toBlock; start += chunkSize) {
      const end = Math.min(start + chunkSize - 1, toBlock);
      try {
        const events = await contract.queryFilter(filter, start, end);
        allEvents.push(...(events as ethers.EventLog[]));
      } catch (err) {
        console.log(`Skipping blocks ${start}-${end} due to error`);
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return allEvents;
  };

  const fetchTransactionHistory = useCallback(async () => {
    if (!address || !isConnected) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = getProvider();
      const currentBlock = await provider.getBlockNumber();
      // Look back ~7 days of blocks (43200 blocks/day on Polygon)
      const blocksToLookBack = 43200 * 7;
      const fromBlock = Math.max(0, currentBlock - blocksToLookBack);

      const allTransactions: Transaction[] = [];

      // Fetch Liquidity Pool events
      const liquidityAddress = CONTRACT_ADDRESSES[ACTIVE_NETWORK].LiquidityPool;
      if (liquidityAddress) {
        const liquidityContract = new ethers.Contract(liquidityAddress, LIQUIDITY_ABI, provider);
        
        try {
          // Get Deposit events
          const depositFilter = liquidityContract.filters.Deposited(address);
          const depositEvents = await queryEventsInChunks(liquidityContract, depositFilter, fromBlock, currentBlock);
          
          for (const event of depositEvents) {
            try {
              const block = await event.getBlock();
              allTransactions.push({
                id: `deposit-${event.transactionHash}-${event.index}`,
                type: 'deposit',
                amount: parseFloat(ethers.formatEther(event.args[1])),
                timestamp: block.timestamp * 1000,
                txHash: event.transactionHash,
                status: 'confirmed',
                description: 'Deposited to Liquidity Pool',
              });
            } catch {
              // Skip events we can't parse
            }
          }

          // Get Withdraw events
          const withdrawFilter = liquidityContract.filters.Withdrawn(address);
          const withdrawEvents = await queryEventsInChunks(liquidityContract, withdrawFilter, fromBlock, currentBlock);
          
          for (const event of withdrawEvents) {
            try {
              const block = await event.getBlock();
              allTransactions.push({
                id: `withdraw-${event.transactionHash}-${event.index}`,
                type: 'withdraw',
                amount: parseFloat(ethers.formatEther(event.args[1])),
                timestamp: block.timestamp * 1000,
                txHash: event.transactionHash,
                status: 'confirmed',
                description: 'Withdrawn from Liquidity Pool',
              });
            } catch {
              // Skip events we can't parse
            }
          }
        } catch (err) {
          console.log('Error fetching liquidity events:', err);
        }
      }

      // Fetch Insurance V2 events
      const insuranceAddress = CONTRACT_ADDRESSES[ACTIVE_NETWORK].PraesidiumInsuranceV2;
      if (insuranceAddress) {
        const insuranceContract = new ethers.Contract(insuranceAddress, INSURANCE_V2_ABI, provider);
        
        try {
          // Get PolicyCreated events
          const policyFilter = insuranceContract.filters.PolicyCreated(null, address);
          const policyEvents = await queryEventsInChunks(insuranceContract, policyFilter, fromBlock, currentBlock);
          
          for (const event of policyEvents) {
            try {
              const block = await event.getBlock();
              allTransactions.push({
                id: `policy-${event.transactionHash}-${event.index}`,
                type: 'policy_purchase',
                amount: parseFloat(ethers.formatEther(event.args[2])),
                timestamp: block.timestamp * 1000,
                txHash: event.transactionHash,
                status: 'confirmed',
                protocol: event.args[4],
                policyId: event.args[0].toString(),
                description: `Purchased ${event.args[4]} Insurance Policy`,
              });
            } catch {
              // Skip events we can't parse
            }
          }

          // Get ClaimSubmitted events
          const claimFilter = insuranceContract.filters.ClaimSubmitted(null, null, address);
          const claimEvents = await queryEventsInChunks(insuranceContract, claimFilter, fromBlock, currentBlock);
          
          for (const event of claimEvents) {
            try {
              const block = await event.getBlock();
              allTransactions.push({
                id: `claim-${event.transactionHash}-${event.index}`,
                type: 'claim_submitted',
                amount: parseFloat(ethers.formatEther(event.args[3])),
                timestamp: block.timestamp * 1000,
                txHash: event.transactionHash,
                status: 'confirmed',
                policyId: event.args[1].toString(),
                description: 'Submitted Insurance Claim',
              });
            } catch {
              // Skip events we can't parse
            }
          }

          // Get ClaimPaid events
          const paidFilter = insuranceContract.filters.ClaimPaid(null, address);
          const paidEvents = await queryEventsInChunks(insuranceContract, paidFilter, fromBlock, currentBlock);
          
          for (const event of paidEvents) {
            try {
              const block = await event.getBlock();
              allTransactions.push({
                id: `paid-${event.transactionHash}-${event.index}`,
                type: 'claim_paid',
                amount: parseFloat(ethers.formatEther(event.args[2])),
                timestamp: block.timestamp * 1000,
                txHash: event.transactionHash,
                status: 'confirmed',
                description: 'Received Claim Payout',
              });
            } catch {
              // Skip events we can't parse
            }
          }
        } catch (err) {
          console.log('Error fetching insurance events:', err);
        }
      }

      // Sort by timestamp descending
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(allTransactions);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError('Failed to fetch transaction history');
      
      // Fallback to localStorage cache
      const cached = localStorage.getItem(`tx_history_${address}`);
      if (cached) {
        setTransactions(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, getProvider]);

  // Add a transaction to local storage for immediate UI feedback
  const addLocalTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `local-${Date.now()}`,
    };
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      if (address) {
        localStorage.setItem(`tx_history_${address}`, JSON.stringify(updated.slice(0, 50)));
      }
      return updated;
    });
  }, [address]);

  useEffect(() => {
    fetchTransactionHistory();
  }, [fetchTransactionHistory]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactionHistory,
    addLocalTransaction,
    explorerUrl: getExplorerUrl(),
  };
};
