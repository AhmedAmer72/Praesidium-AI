import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FiExternalLink, FiClock, FiShield, FiAlertTriangle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';

import Card from '../components/ui/Card';
import Gauge from '../components/ui/Gauge';
import SparklineChart from '../components/ui/SparklineChart';
import Button from '../components/ui/Button';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import TransactionHistory from '../components/TransactionHistory';
import { mockProtocols } from '../constants';
import { useContract } from '../hooks/useContract';
import { usePriceOracle } from '../hooks/usePriceOracle';
import { useNotification } from '../context/NotificationContext';
import { Policy, Claim, OnChainPolicy } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const PolicyCard: React.FC<{ policy: OnChainPolicy; ethUsdPrice: number }> = ({ policy, ethUsdPrice }) => (
  <motion.div variants={itemVariants} className="bg-dark-card/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 shadow-2xl shadow-black/20 overflow-hidden relative nft-card">
    <div className="absolute inset-0 bg-gradient-to-br from-glow-purple/20 to-glow-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="flex justify-between items-start">
        <div>
            <h3 className="text-xl font-bold font-orbitron">{policy.protocol}</h3>
            <p className="text-sm text-gray-400">Policy #{policy.id}</p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-glow-blue to-glow-purple rounded-full flex items-center justify-center text-white font-bold">
          {policy.protocol.charAt(0)}
        </div>
    </div>
    <div className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-400">Coverage</span> <span className="font-semibold">${Math.round(policy.coverage * ethUsdPrice).toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Premium Paid</span> <span className="font-semibold">${Math.round(policy.premium * ethUsdPrice * 100) / 100}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Status</span> <span className={`font-semibold ${policy.active ? 'text-green-400' : 'text-gray-500'}`}>{policy.active ? 'Active' : 'Expired'}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Expires</span> <span className="font-semibold">{new Date(Number(policy.expiry) * 1000).toLocaleDateString()}</span></div>
    </div>
  </motion.div>
);

const ClaimItem: React.FC<{ claim: Claim }> = ({ claim }) => {
    const statusColors = {
        Approved: 'text-green-400 border-green-400',
        Pending: 'text-yellow-400 border-yellow-400',
        Rejected: 'text-red-400 border-red-400',
    }
    return (
        <motion.li variants={itemVariants} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50">
            <div className={`p-2 rounded-full text-sm font-bold border ${statusColors[claim.status]}`}>
                {claim.status.slice(0,1)}
            </div>
            <div>
                <p className="font-semibold">{claim.protocolName} Claim</p>
                <p className="text-xs text-gray-400">{new Date(claim.claimDate).toLocaleDateString()} - ${claim.amount.toLocaleString()}</p>
            </div>
        </motion.li>
    );
};

const Dashboard = () => {
  const { isConnected, address } = useAccount();
  const { getInsuranceV2ContractReadOnly, connectWallet } = useContract();
  const { ethUsdPrice, ethToUsd } = usePriceOracle();
  const { notifyPolicyExpiring } = useNotification();
  const [policies, setPolicies] = useState<OnChainPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCoverage: 0,
    activePolicies: 0,
    totalPremiumPaid: 0,
    avgScore: 0
  });

  useEffect(() => {
    const fetchPolicies = async () => {
      if (!isConnected || !address) {
        setLoading(false);
        return;
      }

      // Ensure wallet is connected
      await connectWallet();

      try {
        // Using V2 contract with getPolicy function
        const contract = getInsuranceV2ContractReadOnly();
        if (!contract) {
          throw new Error('V2 Contract not available');
        }
        
        const policyIds = await contract.getHolderPolicies(address);
        console.log('Policy IDs from V2:', policyIds);
        
        const userPolicies = [];

        // Fetch policies with delay to avoid rate limiting
        for (let i = 0; i < policyIds.length; i++) {
          try {
            // Add small delay between requests to avoid rate limiting
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            const policyId = policyIds[i];
            // Skip if policy ID is 0 or invalid
            if (!policyId || policyId.toString() === '0') {
              continue;
            }
            
            // V2 uses getPolicy function which returns 8 values
            const policyData = await contract.getPolicy(policyId);
            
            // Check if policy data is valid (has a holder address)
            if (policyData && policyData[1] && policyData[1] !== '0x0000000000000000000000000000000000000000') {
              userPolicies.push({
                id: policyData[0].toString(),
                holder: policyData[1],
                premium: parseFloat(ethers.formatEther(policyData[2])),
                coverage: parseFloat(ethers.formatEther(policyData[3])),
                expiry: policyData[4].toString(),
                active: policyData[5],
                protocol: policyData[6] || 'Unknown',
                claimed: policyData[7] || false
              });
            }
          } catch (policyError) {
            // Silently skip invalid policies - this is expected for deleted/invalid policy IDs
            console.log(`Skipping policy ${policyIds[i]} - may not exist`);
          }
        }

        setPolicies(userPolicies);
        
        // Calculate stats from real policies using live ETH/USD price
        const totalCoverage = userPolicies.reduce((sum, p) => sum + ethToUsd(p.coverage), 0);
        const activePolicies = userPolicies.filter(p => p.active).length;
        const totalPremiumPaid = userPolicies.reduce((sum, p) => sum + p.premium, 0);
        const avgScore = 85;
        
        setStats({
          totalCoverage,
          activePolicies,
          totalPremiumPaid,
          avgScore
        });
        
        // Check for expiring policies (within 30 days)
        const now = Math.floor(Date.now() / 1000);
        userPolicies.forEach(policy => {
          if (policy.active) {
            const daysLeft = Math.floor((Number(policy.expiry) - now) / (24 * 60 * 60));
            if (daysLeft <= 30 && daysLeft > 0) {
              notifyPolicyExpiring(policy.protocol, daysLeft);
            }
          }
        });
      } catch (error) {
        // Show empty state for now - user can purchase policies
        setPolicies([]);
        setStats({
          totalCoverage: 0,
          activePolicies: 0,
          totalPremiumPaid: 0,
          avgScore: 85
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [isConnected, address, getInsuranceV2ContractReadOnly]);

  if (!isConnected) {
    return (
        <Card className="max-w-lg mx-auto mt-16 text-center">
            <div className="p-8">
                <FiAlertTriangle className="text-yellow-400 text-6xl mx-auto mb-4" />
                <h2 className="text-2xl font-bold font-orbitron mb-2">Wallet Not Connected</h2>
                <p className="text-gray-400 mb-6">Please connect your wallet to view your dashboard.</p>
                <ConnectButton />
            </div>
        </Card>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-8">
        <motion.div variants={itemVariants}>
          <Card>
            <div className="grid md:grid-cols-3 items-center">
                <div className="col-span-1 flex justify-center p-4">
                    <Gauge value={stats.avgScore} label="Avg. Praesidium Score" />
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-6 p-6 border-t md:border-t-0 md:border-l border-gray-800">
                    <div className="text-center">
                        <p className="text-sm text-gray-400">Total Coverage</p>
                        <p className="text-3xl font-orbitron font-bold text-white">
                            $<AnimatedCounter to={Math.round(stats.totalCoverage)} />
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-400">Active Policies</p>
                        <p className="text-3xl font-orbitron font-bold text-white"><AnimatedCounter to={stats.activePolicies} /></p>
                    </div>
                     <div className="text-center">
                        <p className="text-sm text-gray-400">Total Premium Paid</p>
                        <p className="text-3xl font-orbitron font-bold text-white">
                            <AnimatedCounter to={stats.totalPremiumPaid} precision={3} /> MATIC
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-400">Total Claims Value</p>
                        <p className="text-3xl font-orbitron font-bold text-white">$<AnimatedCounter to={0} /></p>
                    </div>
                </div>
            </div>
          </Card>
        </motion.div>

        <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-orbitron mb-4">Your Portfolio</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-glow-blue mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading policies...</p>
              </div>
            ) : policies.length > 0 ? (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-4 px-4 text-gray-400 font-semibold">Policy ID</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-semibold">Protocol</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-semibold">Coverage</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-semibold">Premium Paid</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-semibold">Status</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-semibold">Expires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policies.map(policy => (
                        <tr key={policy.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                          <td className="py-4 px-4 font-mono text-sm">#{policy.id}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-glow-blue to-glow-purple rounded-full flex items-center justify-center text-white font-bold text-xs">
                                {policy.protocol.charAt(0)}
                              </div>
                              <span className="font-semibold">{policy.protocol}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-green-400">
                            ${Math.round(policy.coverage * 2500).toLocaleString()}
                          </td>
                          <td className="py-4 px-4 font-semibold">
                            {policy.premium.toFixed(3)} MATIC
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              policy.active ? 'bg-green-400/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
                            }`}>
                              {policy.active ? 'Active' : 'Expired'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-400">
                            {new Date(policy.expiry * 1000).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <FiShield className="text-gray-400 text-4xl mx-auto mb-4" />
                  <p className="text-gray-400">No policies found. Get started by purchasing insurance from the marketplace.</p>
                  <Link to="/marketplace">
                    <Button className="mt-4" icon={<FiShield />}>Browse Marketplace</Button>
                  </Link>
                </div>
              </Card>
            )}
        </motion.section>
      </div>
      
      {/* Right Column */}
      <div className="lg:col-span-1 space-y-8">
        <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-orbitron mb-4">Claims History</h2>
            <Card>
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Claims are processed automatically when parametric triggers occur.</p>
                  <Link to="/claims">
                    <Button variant="secondary">View Claims Center</Button>
                  </Link>
                </div>
            </Card>
        </motion.section>

        <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-orbitron mb-4">Transaction History</h2>
            <TransactionHistory maxItems={5} />
        </motion.section>

        <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-orbitron mb-4">Quick Actions</h2>
             <Card>
                <div className="space-y-4">
                    <p className="text-gray-400">Ready to secure more assets? Find the best coverage for your favorite protocols.</p>
                    <Link to="/marketplace">
                      <Button className="w-full" icon={<FiShield />}>Buy New Insurance</Button>
                    </Link>
                    <Link to="/claims">
                      <Button variant="secondary" className="w-full">Manage Claims</Button>
                    </Link>
                    <Link to="/liquidity">
                      <Button variant="secondary" className="w-full">Manage Liquidity</Button>
                    </Link>
                </div>
             </Card>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default Dashboard;