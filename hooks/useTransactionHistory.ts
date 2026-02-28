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

  // Load cached data immediately so the UI isn't blank while fetching
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProvider = useCallback(() => {
    return new ethers.JsonRpcProvider(getRpcUrl());
  }, []);

  const fetchTransactionHistory = useCallback(async () => {
    if (!address || !isConnected) {
      setTransactions([]);
      return;
    }

    // Show cached data for this address immediately
    try {
      const cached = localStorage.getItem(`tx_history_${address}`);
      if (cached) {
        setTransactions(JSON.parse(cached));
      }
    } catch { /* ignore */ }

    setLoading(true);
    setError(null);

    try {
      const provider = getProvider();
      const currentBlock = await provider.getBlockNumber();
      // Look back ~28 hours (50,000 blocks at ~2s/block on Polygon) — fits in 1 RPC call
      const fromBlock = Math.max(0, currentBlock - 50000);

      const allTransactions: Transaction[] = [];

      // Helper: batch fetch block timestamps for a list of events
      const getTimestamps = async (events: ethers.EventLog[]): Promise<Map<number, number>> => {
        const uniqueBlocks = [...new Set(events.map(e => e.blockNumber))];
        const blockMap = new Map<number, number>();
        const results = await Promise.allSettled(
          uniqueBlocks.map(bn => provider.getBlock(bn))
        );
        results.forEach((r, i) => {
          if (r.status === 'fulfilled' && r.value) {
            blockMap.set(uniqueBlocks[i], r.value.timestamp * 1000);
          }
        });
        return blockMap;
      };

      // Helper: single-range event query (no chunking)
      const queryEvents = async (contract: ethers.Contract, filter: ethers.ContractEventName) => {
        try {
          const events = await contract.queryFilter(filter, fromBlock, currentBlock);
          return events as ethers.EventLog[];
        } catch (err) {
          console.warn('queryFilter failed:', err);
          return [] as ethers.EventLog[];
        }
      };

      // Fetch Liquidity Pool events
      const liquidityAddress = CONTRACT_ADDRESSES[ACTIVE_NETWORK].LiquidityPool;
      if (liquidityAddress) {
        const liquidityContract = new ethers.Contract(liquidityAddress, LIQUIDITY_ABI, provider);

        const [depositEvents, withdrawEvents] = await Promise.all([
          queryEvents(liquidityContract, liquidityContract.filters.Deposited(address)),
          queryEvents(liquidityContract, liquidityContract.filters.Withdrawn(address)),
        ]);

        const liqBlockMap = await getTimestamps([...depositEvents, ...withdrawEvents]);

        for (const event of depositEvents) {
          allTransactions.push({
            id: `deposit-${event.transactionHash}-${event.index}`,
            type: 'deposit',
            amount: parseFloat(ethers.formatEther(event.args[1])),
            timestamp: liqBlockMap.get(event.blockNumber) ?? Date.now(),
            txHash: event.transactionHash,
            status: 'confirmed',
            description: 'Deposited to Liquidity Pool',
          });
        }

        for (const event of withdrawEvents) {
          allTransactions.push({
            id: `withdraw-${event.transactionHash}-${event.index}`,
            type: 'withdraw',
            amount: parseFloat(ethers.formatEther(event.args[1])),
            timestamp: liqBlockMap.get(event.blockNumber) ?? Date.now(),
            txHash: event.transactionHash,
            status: 'confirmed',
            description: 'Withdrawn from Liquidity Pool',
          });
        }
      }

      // Fetch Insurance V2 events
      const insuranceAddress = CONTRACT_ADDRESSES[ACTIVE_NETWORK].PraesidiumInsuranceV2;
      if (insuranceAddress) {
        const insuranceContract = new ethers.Contract(insuranceAddress, INSURANCE_V2_ABI, provider);

        const [policyEvents, claimEvents, paidEvents] = await Promise.all([
          queryEvents(insuranceContract, insuranceContract.filters.PolicyCreated(null, address)),
          queryEvents(insuranceContract, insuranceContract.filters.ClaimSubmitted(null, null, address)),
          queryEvents(insuranceContract, insuranceContract.filters.ClaimPaid(null, address)),
        ]);

        const insBlockMap = await getTimestamps([...policyEvents, ...claimEvents, ...paidEvents]);

        for (const event of policyEvents) {
          allTransactions.push({
            id: `policy-${event.transactionHash}-${event.index}`,
            type: 'policy_purchase',
            amount: parseFloat(ethers.formatEther(event.args[2])),
            timestamp: insBlockMap.get(event.blockNumber) ?? Date.now(),
            txHash: event.transactionHash,
            status: 'confirmed',
            protocol: event.args[4],
            policyId: event.args[0].toString(),
            description: `Purchased ${event.args[4]} Insurance Policy`,
          });
        }

        for (const event of claimEvents) {
          allTransactions.push({
            id: `claim-${event.transactionHash}-${event.index}`,
            type: 'claim_submitted',
            amount: parseFloat(ethers.formatEther(event.args[3])),
            timestamp: insBlockMap.get(event.blockNumber) ?? Date.now(),
            txHash: event.transactionHash,
            status: 'confirmed',
            policyId: event.args[1].toString(),
            description: 'Submitted Insurance Claim',
          });
        }

        for (const event of paidEvents) {
          allTransactions.push({
            id: `paid-${event.transactionHash}-${event.index}`,
            type: 'claim_paid',
            amount: parseFloat(ethers.formatEther(event.args[2])),
            timestamp: insBlockMap.get(event.blockNumber) ?? Date.now(),
            txHash: event.transactionHash,
            status: 'confirmed',
            description: 'Received Claim Payout',
          });
        }
      }

      // Sort by timestamp descending
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);

      // Merge with any locally-cached txs that may be older than the block range
      try {
        const cached = localStorage.getItem(`tx_history_${address}`);
        if (cached) {
          const cachedTxs: Transaction[] = JSON.parse(cached);
          const onChainIds = new Set(allTransactions.map(t => t.txHash));
          const olderTxs = cachedTxs.filter(t => !onChainIds.has(t.txHash));
          allTransactions.push(...olderTxs);
          allTransactions.sort((a, b) => b.timestamp - a.timestamp);
        }
      } catch { /* ignore */ }

      const final = allTransactions.slice(0, 50);
      setTransactions(final);
      try {
        localStorage.setItem(`tx_history_${address}`, JSON.stringify(final));
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError('Failed to load recent transactions');
      // Keep whatever cached data is already displayed
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
