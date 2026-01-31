import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowUpRight, FiArrowDownLeft, FiShield, FiDollarSign, FiExternalLink, FiFilter, FiRefreshCw } from 'react-icons/fi';
import { useTransactionHistory, Transaction } from '../hooks/useTransactionHistory';
import Card from './ui/Card';
import Button from './ui/Button';

type FilterType = 'all' | 'deposit' | 'withdraw' | 'policy_purchase' | 'claim_submitted' | 'claim_paid';

const TransactionHistory: React.FC = () => {
  const { transactions, loading, error, refetch, explorerUrl } = useTransactionHistory();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCount, setShowCount] = useState(10);

  const filteredTransactions = transactions.filter(tx => 
    filter === 'all' || tx.type === filter
  );

  const displayedTransactions = filteredTransactions.slice(0, showCount);

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <span className="text-green-400"><FiArrowDownLeft size={20} /></span>;
      case 'withdraw':
        return <span className="text-red-400"><FiArrowUpRight size={20} /></span>;
      case 'policy_purchase':
        return <span className="text-blue-400"><FiShield size={20} /></span>;
      case 'claim_submitted':
        return <span className="text-yellow-400"><FiShield size={20} /></span>;
      case 'claim_paid':
        return <span className="text-green-400"><FiDollarSign size={20} /></span>;
      default:
        return <span className="text-gray-400"><FiDollarSign size={20} /></span>;
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return 'Deposit';
      case 'withdraw': return 'Withdraw';
      case 'policy_purchase': return 'Policy Purchase';
      case 'claim_submitted': return 'Claim Submitted';
      case 'claim_paid': return 'Claim Paid';
      default: return 'Transaction';
    }
  };

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return 'text-green-400';
      case 'withdraw': return 'text-red-400';
      case 'policy_purchase': return 'text-blue-400';
      case 'claim_submitted': return 'text-yellow-400';
      case 'claim_paid': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const shortenHash = (hash: string) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">Transaction History</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-400"><FiFilter size={16} /></span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="bg-dark-700 text-white text-sm rounded-lg px-3 py-1.5 border border-dark-600 focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdraw">Withdrawals</option>
              <option value="policy_purchase">Policies</option>
              <option value="claim_submitted">Claims</option>
              <option value="claim_paid">Payouts</option>
            </select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <span className={loading ? 'animate-spin inline-block' : ''}>
              <FiRefreshCw size={16} />
            </span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading && transactions.length === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-dark-700/50 rounded-lg">
              <div className="w-10 h-10 bg-dark-600 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-dark-600 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-dark-600 rounded w-1/4"></div>
              </div>
              <div className="h-4 bg-dark-600 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : displayedTransactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No transactions found</p>
          <p className="text-gray-500 text-sm mt-2">
            Your transaction history will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedTransactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 bg-dark-700/50 rounded-lg hover:bg-dark-700 transition-colors"
            >
              <div className="w-10 h-10 bg-dark-600 rounded-full flex items-center justify-center">
                {getTypeIcon(tx.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${getTypeColor(tx.type)}`}>
                    {getTypeLabel(tx.type)}
                  </span>
                  {tx.protocol && (
                    <span className="text-gray-500 text-sm">• {tx.protocol}</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm truncate">{tx.description}</p>
                <p className="text-gray-500 text-xs mt-1">{formatDate(tx.timestamp)}</p>
              </div>

              <div className="text-right">
                <p className={`font-semibold ${
                  tx.type === 'deposit' || tx.type === 'claim_paid' ? 'text-green-400' : 
                  tx.type === 'withdraw' || tx.type === 'policy_purchase' ? 'text-red-400' : 
                  'text-white'
                }`}>
                  {tx.type === 'deposit' || tx.type === 'claim_paid' ? '+' : '-'}
                  {tx.amount.toFixed(4)} POL
                </p>
                <a
                  href={`${explorerUrl}/tx/${tx.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 text-xs hover:underline flex items-center justify-end gap-1 mt-1"
                >
                  {shortenHash(tx.txHash)}
                  <FiExternalLink size={10} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredTransactions.length > showCount && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCount(prev => prev + 10)}
          >
            Load More ({filteredTransactions.length - showCount} remaining)
          </Button>
        </div>
      )}
    </Card>
  );
};

export default TransactionHistory;
