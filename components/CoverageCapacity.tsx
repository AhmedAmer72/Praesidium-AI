import React from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiAlertTriangle, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Card from './ui/Card';
import { useCoverageCapacity } from '../hooks/useCoverageCapacity';
import { usePriceOracle } from '../hooks/usePriceOracle';

interface CoverageCapacityProps {
  compact?: boolean;
}

const CoverageCapacity: React.FC<CoverageCapacityProps> = ({ compact = false }) => {
  const {
    poolBalance,
    totalActiveCoverage,
    utilizationRatio,
    availableCapacity,
    capacityStatus,
    collateralizationRatio,
    maxSingleClaim,
    loading,
    error,
  } = useCoverageCapacity();
  const { ethToUsd } = usePriceOracle();

  const getStatusColor = () => {
    switch (capacityStatus) {
      case 'healthy': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'critical': return 'text-orange-400';
      case 'exceeded': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (capacityStatus) {
      case 'healthy': return <span className="text-green-400"><FiCheckCircle size={20} /></span>;
      case 'moderate': return <span className="text-yellow-400"><FiAlertCircle size={20} /></span>;
      case 'critical': return <span className="text-orange-400"><FiAlertTriangle size={20} /></span>;
      case 'exceeded': return <span className="text-red-400"><FiAlertTriangle size={20} /></span>;
      default: return <span className="text-gray-400"><FiShield size={20} /></span>;
    }
  };

  const getStatusLabel = () => {
    switch (capacityStatus) {
      case 'healthy': return 'Fully Collateralized';
      case 'moderate': return 'Adequately Collateralized';
      case 'critical': return 'Low Collateralization';
      case 'exceeded': return 'Under-Collateralized';
      default: return 'Unknown';
    }
  };

  const getProgressBarColor = () => {
    if (utilizationRatio > 100) return 'bg-red-500';
    if (utilizationRatio > 80) return 'bg-orange-500';
    if (utilizationRatio > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Card className={compact ? 'p-4' : 'p-6'}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-glow-blue"><FiShield size={18} /></span>
            <h3 className="font-semibold text-sm">Coverage Capacity</h3>
          </div>
          {getStatusIcon()}
        </div>
        
        {/* Progress bar */}
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(utilizationRatio, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`absolute top-0 left-0 h-full ${getProgressBarColor()} rounded-full`}
          />
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">{utilizationRatio.toFixed(1)}% utilized</span>
          <span className={getStatusColor()}>{getStatusLabel()}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-glow-blue/20 rounded-lg">
            <span className="text-glow-blue"><FiShield size={24} /></span>
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-lg">Coverage Capacity</h3>
            <p className="text-sm text-gray-400">Protocol solvency metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`font-semibold ${getStatusColor()}`}>{getStatusLabel()}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Main utilization display */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-gray-400">Pool Utilization</span>
          <span className={`text-2xl font-orbitron ${getStatusColor()}`}>
            {utilizationRatio.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(utilizationRatio, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`absolute top-0 left-0 h-full ${getProgressBarColor()} rounded-full`}
          />
          {/* Threshold markers */}
          <div className="absolute top-0 left-[60%] w-px h-full bg-yellow-500/50" />
          <div className="absolute top-0 left-[80%] w-px h-full bg-orange-500/50" />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>60%</span>
          <span>80%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-bg/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Pool Balance (TVL)</p>
          <p className="text-lg font-semibold">{poolBalance.toFixed(4)} POL</p>
          <p className="text-xs text-gray-500">${ethToUsd(poolBalance).toLocaleString()}</p>
        </div>
        
        <div className="bg-dark-bg/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Active Coverage</p>
          <p className="text-lg font-semibold">{totalActiveCoverage.toFixed(4)} POL</p>
          <p className="text-xs text-gray-500">${ethToUsd(totalActiveCoverage).toLocaleString()}</p>
        </div>
        
        <div className="bg-dark-bg/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Collateralization Ratio</p>
          <p className={`text-lg font-semibold ${collateralizationRatio >= 1.5 ? 'text-green-400' : collateralizationRatio >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
            {collateralizationRatio === Infinity ? '∞' : `${(collateralizationRatio * 100).toFixed(0)}%`}
          </p>
          <p className="text-xs text-gray-500">Target: 150%+</p>
        </div>
        
        <div className="bg-dark-bg/50 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Available Capacity</p>
          <p className="text-lg font-semibold text-green-400">{availableCapacity.toFixed(4)} POL</p>
          <p className="text-xs text-gray-500">${ethToUsd(availableCapacity).toLocaleString()}</p>
        </div>
      </div>

      {/* Warning for low capacity */}
      {capacityStatus === 'critical' || capacityStatus === 'exceeded' ? (
        <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-orange-400 mt-0.5"><FiAlertTriangle size={20} /></span>
            <div>
              <p className="text-orange-400 font-semibold">Capacity Warning</p>
              <p className="text-sm text-gray-400 mt-1">
                {capacityStatus === 'exceeded' 
                  ? 'The pool is under-collateralized. New policies may not be fully covered until more liquidity is added.'
                  : 'The pool is nearing capacity limits. Consider adding liquidity to ensure full claim coverage.'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Max claim info */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Max Single Claim Payout</span>
          <span className="font-semibold">{maxSingleClaim.toFixed(4)} POL (${ethToUsd(maxSingleClaim).toLocaleString()})</span>
        </div>
      </div>
    </Card>
  );
};

export default CoverageCapacity;
