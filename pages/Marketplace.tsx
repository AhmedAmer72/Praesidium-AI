import React, { useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FiSearch, FiTrendingUp, FiBarChart2, FiShield } from 'react-icons/fi';
import { useAccount } from 'wagmi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SparklineChart from '../components/ui/SparklineChart';
import { mockProtocols } from '../constants';
import { Protocol, RiskLevel } from '../types';
import { Link } from 'react-router-dom';
import { useRiskOracle } from '../hooks/useRiskOracle';

const riskStyles = {
  [RiskLevel.Low]: {
    bar: 'bg-green-500',
    text: 'text-green-400',
    indicator: 'bg-green-500',
  },
  [RiskLevel.Medium]: {
    bar: 'bg-yellow-500',
    text: 'text-yellow-400',
    indicator: 'bg-yellow-500',
  },
  [RiskLevel.High]: {
    bar: 'bg-red-500',
    text: 'text-red-400',
    indicator: 'bg-red-500',
  },
};

const ProtocolCard = ({ protocol, isConnected }: { protocol: Protocol, isConnected: boolean }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['12.5deg', '-12.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-12.5deg', '12.5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        pointerEvents: 'auto'
      }}
      className="relative"
    >
      <div style={{ transform: 'translateZ(50px)' }} className="absolute inset-4 bg-glow-blue/20 blur-xl pointer-events-none"></div>
      <div style={{ transformStyle: 'preserve-3d' }} className="bg-dark-card/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 shadow-2xl shadow-black/20 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src={protocol.logo} 
              alt={protocol.name} 
              className="w-10 h-10 rounded-full bg-gray-700 p-1" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-10 h-10 rounded-full bg-gradient-to-br from-glow-blue to-glow-purple flex items-center justify-center text-white font-bold text-sm">
              {protocol.name.charAt(0)}
            </div>
            <h3 className="text-xl font-bold font-orbitron">{protocol.name}</h3>
          </div>
          <div className={`flex items-center space-x-2 text-sm font-semibold ${riskStyles[protocol.riskLevel].text}`}>
            <div className={`w-2 h-2 rounded-full ${riskStyles[protocol.riskLevel].indicator} animate-pulse-slow`}></div>
            <span>{protocol.riskLevel} Risk</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-400 text-sm">Risk Score</p>
          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
            <motion.div
                className={`h-2.5 rounded-full ${riskStyles[protocol.riskLevel].bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${protocol.riskScore}%`}}
                transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="flex-grow space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-gray-400">Premium</p>
                    <p className="font-semibold text-lg">{protocol.premiumRate}% / yr</p>
                </div>
                <div>
                    <p className="text-gray-400">Max Coverage</p>
                    <p className="font-semibold text-lg">${(protocol.coverageLimit / 1_000_000).toFixed(1)}M</p>
                </div>
            </div>

            <div>
                <p className="text-gray-400 text-sm">TVL Trend (30d)</p>
                <SparklineChart data={protocol.tvlHistory} color={riskStyles[protocol.riskLevel].indicator} />
            </div>
        </div>
        
        <div className="mt-auto pt-4">
          <button 
            className="w-full px-6 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-full font-bold"
            onClick={() => {
              console.log('Button clicked! isConnected:', isConnected, 'protocol:', protocol.id);
              window.location.hash = `#/buy/${protocol.id}`;
            }}
          >
            🛡️ Get Covered
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Marketplace = () => {
  const { isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const { riskScores, premiumRates, loading } = useRiskOracle();

  const filteredProtocols = useMemo(() => {
    // Update protocols with real oracle data
    const updatedProtocols = mockProtocols.map(protocol => ({
      ...protocol,
      riskScore: riskScores[protocol.name] || protocol.riskScore,
      premiumRate: premiumRates[protocol.name] || protocol.premiumRate
    }));
    
    return updatedProtocols.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const riskMatch = riskFilter === 'all' || p.riskLevel === riskFilter;
        return nameMatch && riskMatch;
    });
  }, [searchTerm, riskFilter, riskScores, premiumRates]);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-orbitron font-bold">Insurance Marketplace</h1>
          <div className="flex items-center space-x-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
            <span className="text-sm text-gray-400">
              {loading ? 'Loading risk data...' : 'Risk Oracle active'}
            </span>
          </div>
        </div>
        <div className="relative">
          <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search protocols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-dark-card border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-glow-blue w-64"
          />
        </div>
      </div>
      
      <div className="flex justify-center space-x-2 mb-8">
        {(['all', ...Object.values(RiskLevel)] as const).map(level => (
            <button key={level} onClick={() => setRiskFilter(level)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-full capitalize transition-colors ${riskFilter === level ? 'bg-glow-blue text-white' : 'bg-dark-card hover:bg-gray-800'}`}>
                {level}
            </button>
        ))}
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
      >
        {filteredProtocols.map(protocol => (
          <motion.div layout key={protocol.id}>
            <ProtocolCard protocol={protocol} isConnected={isConnected} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Marketplace;