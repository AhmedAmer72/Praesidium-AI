import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiXCircle, FiZap, FiShield, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import { ethers } from 'ethers';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { useContract } from '../hooks/useContract';
import { usePriceOracle } from '../hooks/usePriceOracle';
import { useNotification } from '../context/NotificationContext';
import { OnChainPolicy, OnChainClaim, ClaimStatus, TriggerType } from '../types';

// Local Claim interface for UI state (extends on-chain claim)
interface LocalClaim {
  id: string;
  policyId: string;
  protocol: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  triggerType: number;
  timestamp: number;
  txHash?: string;
  onChain: boolean;
}

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

const statusConfig = {
  pending: {
    icon: FiClock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/20',
    label: 'Pending'
  },
  approved: {
    icon: FiCheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-400/20',
    label: 'Approved'
  },
  rejected: {
    icon: FiXCircle,
    color: 'text-red-400',
    bg: 'bg-red-400/20',
    label: 'Rejected'
  },
  paid: {
    icon: FiCheckCircle,
    color: 'text-blue-400',
    bg: 'bg-blue-400/20',
    label: 'Paid Out'
  }
};

const triggerTypes = [
  { id: 0, label: 'TVL Drop > 50%', description: 'Total Value Locked dropped significantly' },
  { id: 1, label: 'Smart Contract Exploit', description: 'Security vulnerability exploited' },
  { id: 2, label: 'Oracle Failure', description: 'Price oracle malfunction' },
  { id: 3, label: 'Governance Attack', description: 'Malicious governance proposal' },
  { id: 4, label: 'Depeg Event', description: 'Stablecoin lost peg > 5%' },
];

const Claims = () => {
  const { isConnected, address } = useAccount();
  const { getInsuranceV2Contract, getInsuranceV2ContractReadOnly, connectWallet } = useContract();
  const { ethUsdPrice, ethToUsd } = usePriceOracle();
  const { notifyClaimApproved, notifyClaimSubmitted, notifyError, addNotification } = useNotification();
  
  const [claims, setClaims] = useState<LocalClaim[]>([]);
  const [policies, setPolicies] = useState<OnChainPolicy[]>([]);
  const [activeTriggers, setActiveTriggers] = useState<Record<string, { active: boolean; type: number; severity: number }>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<string>('');
  const [triggerType, setTriggerType] = useState<number>(0);
  const [claimEvidence, setClaimEvidence] = useState<string>('');

  useEffect(() => {
    if (isConnected && address) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const loadData = async () => {
    setLoading(true);
    try {
      await connectWallet();
      
      // Using V2 contract with getPolicy function
      const contract = getInsuranceV2ContractReadOnly();
      if (!contract) {
        setLoading(false);
        return;
      }

      // Load user policies from V2 contract
      const policyIds = await contract.getHolderPolicies(address);
      const userPolicies: Policy[] = [];

      for (let i = 0; i < policyIds.length; i++) {
        try {
          // Add delay between requests to avoid rate limiting
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          const policyId = policyIds[i];
          // Skip if policy ID is 0 or invalid
          if (!policyId || policyId.toString() === '0') {
            continue;
          }
          
          // V2 uses getPolicy function
          const policyData = await contract.getPolicy(policyId);
          
          // Check if policy data is valid
          if (policyData && policyData[1] && policyData[1] !== '0x0000000000000000000000000000000000000000') {
            userPolicies.push({
              id: policyData[0].toString(),
              holder: policyData[1],
              premium: parseFloat(ethers.formatEther(policyData[2])),
              coverage: parseFloat(ethers.formatEther(policyData[3])),
              expiry: parseInt(policyData[4].toString()),
              active: policyData[5],
              protocol: policyData[6] || 'Unknown',
              claimed: policyData[7] || false
            });
          }
        } catch (err) {
          // Silently skip invalid policies
        }
      }

      setPolicies(userPolicies);

      // Try to load claims from on-chain first
      try {
        const claimIds = await contract.getHolderClaims(address);
        const onChainClaims: LocalClaim[] = [];
        
        for (let i = 0; i < claimIds.length; i++) {
          try {
            if (i > 0) await new Promise(resolve => setTimeout(resolve, 100));
            const claimData = await contract.getClaim(claimIds[i]);
            const policy = userPolicies.find(p => p.id === claimData[1].toString());
            
            const statusMap: Record<number, 'pending' | 'approved' | 'rejected' | 'paid'> = {
              0: 'pending',
              1: 'approved', 
              2: 'rejected',
              3: 'paid'
            };
            
            onChainClaims.push({
              id: claimData[0].toString(),
              policyId: claimData[1].toString(),
              protocol: policy?.protocol || 'Unknown',
              amount: ethToUsd(parseFloat(ethers.formatEther(claimData[3]))),
              triggerType: Number(claimData[4]),
              timestamp: Number(claimData[5]) * 1000,
              status: statusMap[Number(claimData[6])] || 'pending',
              onChain: true
            });
          } catch (err) {
            // Skip invalid claims
          }
        }
        
        if (onChainClaims.length > 0) {
          setClaims(onChainClaims);
        } else {
          // Fallback to localStorage for hybrid approach
          const storedClaims = localStorage.getItem(`claims_${address}`);
          if (storedClaims) {
            setClaims(JSON.parse(storedClaims));
          }
        }
      } catch (claimError) {
        // Fallback to localStorage
        const storedClaims = localStorage.getItem(`claims_${address}`);
        if (storedClaims) {
          setClaims(JSON.parse(storedClaims));
        }
      }

      // Load active triggers from localStorage
      const protocols = ['Aave', 'Compound', 'Curve Finance', 'Uniswap', 'SushiSwap', 'Balancer V2'];
      const triggers: Record<string, { active: boolean; type: number; severity: number }> = {};
      
      for (const protocol of protocols) {
        const storedTrigger = localStorage.getItem(`trigger_${protocol}`);
        if (storedTrigger) {
          triggers[protocol] = JSON.parse(storedTrigger);
        } else {
          triggers[protocol] = { active: false, type: 0, severity: 0 };
        }
      }
      setActiveTriggers(triggers);

    } catch (error) {
      // Error loading data - user will see empty state
    } finally {
      setLoading(false);
    }
  };

  // Simulate a parametric trigger activation
  const simulateTrigger = (protocol: string, type: number, severity: number) => {
    const trigger = { active: true, type, severity };
    localStorage.setItem(`trigger_${protocol}`, JSON.stringify(trigger));
    setActiveTriggers(prev => ({ ...prev, [protocol]: trigger }));
    
    addNotification({
      type: 'warning',
      title: '⚠️ Trigger Activated',
      message: `${triggerTypes[type]?.label} detected for ${protocol}!`,
      duration: 8000
    });
  };

  const deactivateTrigger = (protocol: string) => {
    localStorage.removeItem(`trigger_${protocol}`);
    setActiveTriggers(prev => ({ ...prev, [protocol]: { active: false, type: 0, severity: 0 } }));
    
    addNotification({
      type: 'info',
      title: 'Trigger Deactivated',
      message: `Trigger for ${protocol} has been deactivated.`,
      duration: 5000
    });
  };

  const handleSubmitClaim = async () => {
    if (!selectedPolicy) {
      notifyError('Please select a policy to claim');
      return;
    }

    const policy = policies.find(p => p.id === selectedPolicy);
    if (!policy) {
      notifyError('Policy not found');
      return;
    }

    // Check if trigger is active for this protocol
    const trigger = activeTriggers[policy.protocol];
    if (!trigger?.active) {
      notifyError(`No active trigger for ${policy.protocol}. Admin must activate a trigger first.`);
      return;
    }

    setProcessing(true);
    try {
      await connectWallet();
      
      // V2 contract with submitClaim function
      const contract = getInsuranceV2Contract();
      
      // Create a new claim record
      const newClaim: Claim = {
        id: `claim_${Date.now()}`,
        policyId: selectedPolicy,
        protocol: policy.protocol,
        amount: policy.coverage * 2500, // Convert to USD
        status: 'pending',
        triggerType: trigger.type,
        timestamp: Date.now(),
        onChain: false
      };

      // Submit claim on-chain using V2's submitClaim function
      if (contract) {
        try {
          // Get current gas prices - use legacy gasPrice as fallback for RPC compatibility
          const provider = contract.runner?.provider;
          let gasOptions: any = { gasLimit: 350000 };
          
          try {
            const feeData = await provider?.getFeeData();
            if (feeData?.maxFeePerGas && feeData?.maxPriorityFeePerGas) {
              gasOptions.maxFeePerGas = feeData.maxFeePerGas * 2n;
              gasOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas * 2n;
            } else if (feeData?.gasPrice) {
              gasOptions.gasPrice = feeData.gasPrice * 2n;
            } else {
              gasOptions.gasPrice = ethers.parseUnits("100", "gwei");
            }
          } catch (gasError) {
            gasOptions.gasPrice = ethers.parseUnits("100", "gwei");
          }
          
          const tx = await contract.submitClaim(
            selectedPolicy,
            trigger.type,
            claimEvidence || 'Parametric trigger detected',
            gasOptions
          );
          
          addNotification({
            type: 'info',
            title: 'Claim Submitted',
            message: 'Transaction pending confirmation...',
            txHash: tx.hash,
            duration: 10000
          });

          const receipt = await tx.wait(1);
          if (receipt && receipt.status === 0) {
            throw new Error('Transaction was reverted by the contract');
          }
          newClaim.txHash = tx.hash;
          newClaim.onChain = true;
        } catch (txError: any) {
          console.log('On-chain claim submission failed:', txError.message);
          // If on-chain fails, still track locally
          notifyError('On-chain submission failed: ' + (txError.reason || txError.message));
        }
      }

      // Add to claims list
      const updatedClaims = [...claims, newClaim];
      setClaims(updatedClaims);
      localStorage.setItem(`claims_${address}`, JSON.stringify(updatedClaims));

      notifyClaimSubmitted(policy.protocol, newClaim.amount);
      setSelectedPolicy('');
      setClaimEvidence('');

    } catch (error: any) {
      console.error('Error submitting claim:', error);
      notifyError(error.message || 'Failed to submit claim');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    setProcessing(true);
    try {
      await connectWallet();
      
      const claim = claims.find(c => c.id === claimId);
      if (!claim) {
        notifyError('Claim not found');
        setProcessing(false);
        return;
      }

      const contract = getInsuranceV2Contract();
      let txHash = '';

      // V2 contract uses approveClaim for on-chain approval
      if (contract) {
        try {
          // Get current gas prices - use legacy gasPrice as fallback for RPC compatibility
          const provider = contract.runner?.provider;
          let gasOptions: any = { gasLimit: 350000 };
          
          try {
            const feeData = await provider?.getFeeData();
            if (feeData?.maxFeePerGas && feeData?.maxPriorityFeePerGas) {
              gasOptions.maxFeePerGas = feeData.maxFeePerGas * 2n;
              gasOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas * 2n;
            } else if (feeData?.gasPrice) {
              gasOptions.gasPrice = feeData.gasPrice * 2n;
            } else {
              gasOptions.gasPrice = ethers.parseUnits("100", "gwei");
            }
          } catch (gasError) {
            gasOptions.gasPrice = ethers.parseUnits("100", "gwei");
          }
          
          // For V2, we need to get the on-chain claim ID
          // For now, use claimPolicy as fallback if available
          const tx = await contract.approveClaim(claim.policyId, gasOptions);
          
          addNotification({
            type: 'info',
            title: 'Processing Claim',
            message: 'Waiting for blockchain confirmation...',
            txHash: tx.hash,
            duration: 15000
          });

          await tx.wait(1);
          txHash = tx.hash;
        } catch (txError: any) {
          console.log('On-chain claim approval failed:', txError.message);
          notifyError('On-chain payout failed. Contract may have insufficient funds.');
          setProcessing(false);
          return;
        }
      }

      // Update claim status
      const updatedClaims = claims.map(c => 
        c.id === claimId ? { ...c, status: 'paid' as const, txHash } : c
      );
      setClaims(updatedClaims);
      localStorage.setItem(`claims_${address}`, JSON.stringify(updatedClaims));

      notifyClaimApproved(claim.protocol, claim.amount, txHash);

      // Refresh policies
      loadData();

    } catch (error: any) {
      console.error('Error approving claim:', error);
      notifyError(error.message || 'Failed to approve claim');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClaim = (claimId: string) => {
    const updatedClaims = claims.map(c => 
      c.id === claimId ? { ...c, status: 'rejected' as const } : c
    );
    setClaims(updatedClaims);
    localStorage.setItem(`claims_${address}`, JSON.stringify(updatedClaims));
    
    addNotification({
      type: 'warning',
      title: 'Claim Rejected',
      message: 'The claim has been rejected.',
      duration: 5000
    });
  };

  const clearAllClaims = () => {
    setClaims([]);
    localStorage.removeItem(`claims_${address}`);
  };

  // Get eligible policies (active, not claimed, not expired)
  const eligiblePolicies = policies.filter(p => 
    p.active && 
    !p.claimed && 
    p.expiry > Math.floor(Date.now() / 1000)
  );

  // Get policies with active triggers
  const policiesWithTriggers = eligiblePolicies.filter(p => 
    activeTriggers[p.protocol]?.active
  );

  if (!isConnected) {
    return (
      <Card className="max-w-lg mx-auto mt-16 text-center">
        <div className="p-8">
          <div className="text-yellow-400 text-6xl mx-auto mb-4 flex justify-center">
            <FiAlertTriangle size={64} />
          </div>
          <h2 className="text-2xl font-bold font-orbitron mb-2">Wallet Not Connected</h2>
          <p className="text-gray-400 mb-6">Please connect your wallet to view claims.</p>
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
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-orbitron font-bold mb-2">Claims Center</h1>
          <p className="text-gray-400">Submit and manage insurance claims with automated parametric triggers</p>
        </div>
        <Button variant="secondary" onClick={loadData} disabled={loading}>
          <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span className="ml-2">Refresh</span>
        </Button>
      </motion.div>

      {/* Active Triggers Alert */}
      {Object.entries(activeTriggers).some(([_, t]) => t.active) && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-500/50 bg-red-500/10">
            <div className="flex items-center gap-3">
              <div className="text-red-400 animate-pulse">
                <FiAlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-red-400">Active Parametric Triggers Detected</h3>
                <p className="text-sm text-gray-400">
                  {Object.entries(activeTriggers)
                    .filter(([_, t]) => t.active)
                    .map(([protocol, t]) => `${protocol}: ${triggerTypes[t.type]?.label}`)
                    .join(', ')}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submit Claim Section */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <h2 className="text-2xl font-orbitron mb-6 flex items-center gap-2">
              <span className="text-glow-blue"><FiZap size={24} /></span>
              Submit New Claim
            </h2>

            {eligiblePolicies.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mx-auto mb-4 flex justify-center">
                  <FiShield size={48} />
                </div>
                <p className="text-gray-400">No eligible policies available for claims.</p>
                <p className="text-sm text-gray-500 mt-2">Policies must be active and not expired.</p>
              </div>
            ) : policiesWithTriggers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-yellow-400 text-4xl mx-auto mb-4 flex justify-center">
                  <FiClock size={48} />
                </div>
                <p className="text-gray-400">No active triggers for your policies.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Claims can only be submitted when a parametric trigger is active.
                  Use the Admin Panel below to simulate triggers.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Policy Selection */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Select Policy with Active Trigger</label>
                  <select
                    value={selectedPolicy}
                    onChange={(e) => setSelectedPolicy(e.target.value)}
                    className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-glow-blue"
                  >
                    <option value="">Choose a policy...</option>
                    {policiesWithTriggers.map(policy => (
                      <option key={policy.id} value={policy.id}>
                        #{policy.id} - {policy.protocol} (${(policy.coverage * 2500).toLocaleString()} coverage) 
                        - ⚠️ {triggerTypes[activeTriggers[policy.protocol]?.type]?.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Evidence Input */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Evidence / Notes (Optional)</label>
                  <textarea
                    value={claimEvidence}
                    onChange={(e) => setClaimEvidence(e.target.value)}
                    placeholder="Describe the incident or provide transaction hashes as evidence..."
                    className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-glow-blue h-24 resize-none"
                  />
                </div>

                <Button 
                  className="w-full"
                  onClick={handleSubmitClaim}
                  disabled={processing || !selectedPolicy}
                >
                  {processing ? 'Processing...' : 'Submit Claim'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Claims are verified against on-chain parametric triggers. Approved claims are paid instantly.
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants}>
          <Card>
            <h3 className="text-xl font-orbitron mb-4">Claims Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Claims</span>
                <span className="text-2xl font-bold"><AnimatedCounter to={claims.length} /></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Pending</span>
                <span className="text-2xl font-bold text-yellow-400">
                  <AnimatedCounter to={claims.filter(c => c.status === 'pending').length} />
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Approved/Paid</span>
                <span className="text-2xl font-bold text-green-400">
                  <AnimatedCounter to={claims.filter(c => c.status === 'approved' || c.status === 'paid').length} />
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Paid Out</span>
                <span className="text-xl font-bold text-glow-blue">
                  $<AnimatedCounter to={claims.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0)} />
                </span>
              </div>
            </div>

            <hr className="border-gray-700 my-4" />

            <h4 className="font-semibold mb-3">Active Triggers</h4>
            <div className="space-y-2">
              {Object.entries(activeTriggers).filter(([_, t]) => t.active).length === 0 ? (
                <p className="text-sm text-gray-500">No active triggers</p>
              ) : (
                Object.entries(activeTriggers)
                  .filter(([_, t]) => t.active)
                  .map(([protocol, t]) => (
                    <div key={protocol} className="flex justify-between items-center text-sm">
                      <span className="text-red-400">{protocol}</span>
                      <span className="text-gray-400">{triggerTypes[t.type]?.label}</span>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Claims History */}
      <motion.div variants={itemVariants}>
        <Card>
          <h2 className="text-2xl font-orbitron mb-6">Claims History</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-glow-blue mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading claims...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mx-auto mb-4 flex justify-center">
                <FiClock size={48} />
              </div>
              <p className="text-gray-400">No claims submitted yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Claim ID</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Protocol</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Trigger</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Amount</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Status</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Date</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map(claim => {
                    const config = statusConfig[claim.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <tr key={claim.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm">#{claim.id.slice(-6)}</span>
                          {claim.onChain && (
                            <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-1 rounded">On-chain</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-semibold">{claim.protocol}</td>
                        <td className="py-4 px-4 text-sm text-gray-400">
                          {triggerTypes[claim.triggerType]?.label || 'Unknown'}
                        </td>
                        <td className="py-4 px-4 font-semibold text-green-400">
                          ${claim.amount.toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
                            <StatusIcon size={12} />
                            {config.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-400 text-sm">
                          {new Date(claim.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          {claim.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveClaim(claim.id)}
                                disabled={processing}
                                className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-semibold hover:bg-green-500/30 transition-colors disabled:opacity-50"
                              >
                                Approve & Pay
                              </button>
                              <button
                                onClick={() => handleRejectClaim(claim.id)}
                                disabled={processing}
                                className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {claim.txHash && (
                            <a
                              href={`https://amoy.polygonscan.com/tx/${claim.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-glow-blue text-xs hover:underline"
                            >
                              View Tx <FiExternalLink size={10} />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Admin Panel - Trigger Simulator */}
      <motion.div variants={itemVariants}>
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-yellow-400"><FiAlertTriangle size={20} /></span>
            <h2 className="text-xl font-orbitron text-yellow-400">Admin Panel - Trigger Simulator</h2>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Simulate parametric trigger events. In production, these would be triggered by oracles monitoring on-chain data.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {['Aave', 'Compound', 'Curve Finance', 'Uniswap', 'SushiSwap', 'Balancer V2'].map(protocol => (
              <div key={protocol} className="p-4 bg-dark-bg/50 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold">{protocol}</span>
                  {activeTriggers[protocol]?.active ? (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full animate-pulse">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-600/20 text-gray-400 px-2 py-1 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!activeTriggers[protocol]?.active ? (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          simulateTrigger(protocol, parseInt(e.target.value), 75);
                        }
                      }}
                      className="flex-1 bg-dark-bg border border-gray-600 rounded px-2 py-1 text-xs"
                      defaultValue=""
                    >
                      <option value="">Activate trigger...</option>
                      {triggerTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => deactivateTrigger(protocol)}
                      className="flex-1 px-3 py-1 bg-gray-600/20 text-gray-400 rounded text-xs hover:bg-gray-600/30"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button 
              variant="secondary" 
              className="text-sm"
              onClick={clearAllClaims}
            >
              Clear All Claims
            </Button>
            <Button 
              variant="secondary" 
              className="text-sm"
              onClick={() => {
                ['Aave', 'Compound', 'Curve Finance', 'Uniswap', 'SushiSwap', 'Balancer V2'].forEach(p => {
                  localStorage.removeItem(`trigger_${p}`);
                });
                setActiveTriggers({});
                addNotification({
                  type: 'info',
                  title: 'All Triggers Cleared',
                  message: 'All parametric triggers have been deactivated.',
                  duration: 4000
                });
              }}
            >
              Clear All Triggers
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Claims;
