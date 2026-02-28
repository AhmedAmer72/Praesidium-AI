import React from 'react';
import { motion } from 'framer-motion';
import { FiExternalLink, FiRefreshCw, FiClock, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import { useGlobalClaims, GlobalClaim } from '../hooks/useGlobalClaims';
import { ACTIVE_NETWORK, CONTRACT_ADDRESSES } from '../constants';
import { usePriceOracle } from '../hooks/usePriceOracle';
import Card from './ui/Card';

const CONTRACT_ADDRESS_LINK = CONTRACT_ADDRESSES[ACTIVE_NETWORK].PraesidiumInsuranceV2;
const getExplorerUrl = () =>
  ACTIVE_NETWORK === 'polygon' ? 'https://polygonscan.com' : 'https://amoy.polygonscan.com';

const statusConfig = {
  pending:  { icon: FiClock,       color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', label: 'Pending' },
  approved: { icon: FiCheckCircle, color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/30',  label: 'Approved' },
  rejected: { icon: FiXCircle,     color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/30',      label: 'Rejected' },
  paid:     { icon: FiCheckCircle, color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/30',    label: 'Paid Out' },
};

const triggerColors: Record<number, string> = {
  0: 'text-orange-400',
  1: 'text-red-400',
  2: 'text-yellow-400',
  3: 'text-purple-400',
  4: 'text-pink-400',
};

interface Props {
  maxItems?: number;
  compact?: boolean;
}

const ClaimRow: React.FC<{ claim: GlobalClaim; ethUsdPrice: number; compact: boolean; index: number }> = ({
  claim, ethUsdPrice, compact, index,
}) => {
  const cfg = statusConfig[claim.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;
  const amountUsd = (claim.amountEth * ethUsdPrice).toFixed(0);

  const timeAgo = () => {
    const diff = Date.now() - claim.timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors"
    >
      <td className="py-3 px-3">
        <span className="font-mono text-xs text-gray-400">#{claim.id}</span>
      </td>
      {!compact && (
        <td className="py-3 px-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-glow-blue to-glow-purple rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(claim.protocol || 'U').charAt(0)}
            </div>
            <span className="text-sm font-medium">{claim.protocol || 'Unknown'}</span>
          </div>
        </td>
      )}
      <td className="py-3 px-3">
        <span className={`text-xs font-medium ${triggerColors[claim.triggerType] || 'text-gray-400'}`}>
          {claim.triggerLabel}
        </span>
      </td>
      <td className="py-3 px-3">
        <div>
          <p className="text-sm font-semibold text-white">{claim.amountEth.toFixed(4)} POL</p>
          <p className="text-xs text-gray-400">${Number(amountUsd).toLocaleString()}</p>
        </div>
      </td>
      <td className="py-3 px-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
          <StatusIcon size={10} />
          {cfg.label}
        </span>
      </td>
      {!compact && (
        <td className="py-3 px-3">
          <div>
            <p className="text-xs text-gray-400">{timeAgo()}</p>
            <a
              href={`${getExplorerUrl()}/address/${claim.claimant}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-glow-blue hover:underline inline-flex items-center gap-0.5"
            >
              {claim.claimantShort} <FiExternalLink size={9} />
            </a>
          </div>
        </td>
      )}
    </motion.tr>
  );
};

const GlobalClaimsFeed: React.FC<Props> = ({ maxItems = 10, compact = false }) => {
  const { claims, loading, totalClaims, error, refetch } = useGlobalClaims();
  const { ethUsdPrice } = usePriceOracle();
  const displayClaims = claims.slice(0, maxItems);

  return (
    <Card className="p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium">Live</span>
          </div>
          <h3 className="font-orbitron font-bold text-sm">Global Claims Feed</h3>
        </div>
        <div className="flex items-center gap-3">
          {totalClaims > 0 && (
            <span className="text-xs text-gray-400">{totalClaims} total on-chain</span>
          )}
          <button
            onClick={refetch}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white disabled:opacity-50"
            title="Refresh"
          >
            <span className={loading ? 'animate-spin inline-block' : 'inline-block'}>
              <FiRefreshCw size={13} />
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-6 h-6 border-2 border-glow-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Fetching on-chain claims...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-red-400">
          <FiAlertTriangle size={24} />
          <p className="text-sm">{error}</p>
          <button onClick={refetch} className="text-xs text-glow-blue hover:underline">Retry</button>
        </div>
      ) : displayClaims.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <span className="text-gray-600 inline-block"><FiCheckCircle size={32} /></span>
          <p className="text-sm text-gray-400">No claims on-chain yet</p>
          <p className="text-xs text-gray-500">Claims submitted by users will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800/50">
                <th className="text-left py-2 px-3 font-medium">ID</th>
                {!compact && <th className="text-left py-2 px-3 font-medium">Protocol</th>}
                <th className="text-left py-2 px-3 font-medium">Trigger</th>
                <th className="text-left py-2 px-3 font-medium">Amount</th>
                <th className="text-left py-2 px-3 font-medium">Status</th>
                {!compact && <th className="text-left py-2 px-3 font-medium">Claimant</th>}
              </tr>
            </thead>
            <tbody>
              {displayClaims.map((claim, i) => (
                <ClaimRow
                  key={claim.id}
                  claim={claim}
                  ethUsdPrice={ethUsdPrice}
                  compact={compact}
                  index={i}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {!loading && displayClaims.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-800/50 flex justify-between items-center">
          <span className="text-xs text-gray-500">Showing {displayClaims.length} of {totalClaims} claims</span>
          <a
            href={`${getExplorerUrl()}/address/${CONTRACT_ADDRESS_LINK}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-glow-blue hover:underline inline-flex items-center gap-1"
          >
            View on PolygonScan <FiExternalLink size={10} />
          </a>
        </div>
      )}
    </Card>
  );
};

export default GlobalClaimsFeed;
