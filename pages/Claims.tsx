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
import { ACTIVE_NETWORK } from '../constants';

// Helper to get the correct block explorer URL
const getExplorerUrl = () => ACTIVE_NETWORK === 'polygon' ? 'https://polygonscan.com' : 'https://amoy.polygonscan.com';

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
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<string>('');
  const [triggerType, setTriggerType] = useState<number>(0);
  const [claimEvidence, setClaimEvidence] = useState<string>('');
  // Trigger status per protocol
  const [triggerStatuses, setTriggerStatuses] = useState<Record<string, { isActive: boolean; triggerType: number; severity: number }>>({});
  // Mock (demo) triggers — local state, no on-chain tx needed
  const [mockTriggers, setMockTriggers] = useState<Record<string, { isActive: boolean; triggerType: number; severity: number }>>({});
  const [showMockPanel, setShowMockPanel] = useState(false);
  // Contract owner detection
  const [isOwner, setIsOwner] = useState(false);
  // Admin panel state
  const [adminProtocol, setAdminProtocol] = useState('');
  const [adminTriggerType, setAdminTriggerType] = useState(1);
  const [adminSeverity, setAdminSeverity] = useState(80);
  const [adminProcessing, setAdminProcessing] = useState(false);
  // Mock admin state (reuse same fields)
  const [mockProtocol, setMockProtocol] = useState('');
  const [mockTriggerType, setMockTriggerType] = useState(1);
  const [mockSeverity, setMockSeverity] = useState(80);

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

      // Check trigger status for each unique protocol
      const uniqueProtocols = [...new Set(userPolicies.map(p => p.protocol))];
      const statuses: Record<string, { isActive: boolean; triggerType: number; severity: number }> = {};
      for (const proto of uniqueProtocols) {
        try {
          const [isActive, tType, severity] = await contract.isTriggerActive(proto);
          statuses[proto] = { isActive: Boolean(isActive), triggerType: Number(tType), severity: Number(severity) };
        } catch { statuses[proto] = { isActive: false, triggerType: 0, severity: 0 }; }
      }
      setTriggerStatuses(statuses);

      // Check if connected wallet is contract owner
      try {
        const owner = await contract.owner();
        setIsOwner(owner.toLowerCase() === (address || '').toLowerCase());
      } catch { setIsOwner(false); }

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

    } catch (error) {
      // Error loading data - user will see empty state
    } finally {
      setLoading(false);
    }
  };

  // Merged effective triggers: on-chain takes priority, mock fills the rest
  const effectiveTriggers = { ...triggerStatuses };
  Object.entries(mockTriggers).forEach(([proto, mt]) => {
    if (!effectiveTriggers[proto] || !effectiveTriggers[proto].isActive) {
      effectiveTriggers[proto] = mt;
    }
  });

  // Mock trigger helpers
  const handleMockActivate = () => {
    if (!mockProtocol) { notifyError('Select a protocol'); return; }
    setMockTriggers(prev => ({
      ...prev,
      [mockProtocol]: { isActive: true, triggerType: mockTriggerType, severity: mockSeverity }
    }));
    addNotification({ type: 'info', title: 'Demo Trigger Activated', message: `Mock trigger set for ${mockProtocol} (${triggerTypes[mockTriggerType]?.label})`, duration: 4000 });
  };

  const handleMockDeactivate = (proto: string) => {
    setMockTriggers(prev => {
      const next = { ...prev };
      delete next[proto];
      return next;
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

    // Pre-validate: check trigger is active and type matches (on-chain OR mock)
    const ts = effectiveTriggers[policy.protocol];
    const isMockTrigger = !triggerStatuses[policy.protocol]?.isActive && mockTriggers[policy.protocol]?.isActive;
    if (!ts || !ts.isActive) {
      notifyError(`No active trigger for ${policy.protocol}. Use the Demo Panel below to simulate a trigger, or the contract owner can activate one on-chain.`);
      return;
    }
    if (ts.triggerType !== triggerType) {
      notifyError(`Trigger type mismatch. The active trigger for ${policy.protocol} is "${triggerTypes[ts.triggerType]?.label}". Please select that trigger type.`);
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
        triggerType: triggerType,
        timestamp: Date.now(),
        onChain: false
      };

      // Submit claim on-chain using V2's submitClaim function
      // Skip on-chain if this is a mock/demo trigger
      if (contract && !isMockTrigger) {
        try {
          // Simple gas options - let MetaMask handle gas pricing
          const gasOptions: any = { gasLimit: 350000 };
          
          const tx = await contract.submitClaim(
            selectedPolicy,
            triggerType,
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
      } else if (isMockTrigger) {
        // Demo mode — simulate a short delay then mark as locally recorded
        await new Promise(resolve => setTimeout(resolve, 800));
        newClaim.id = `demo_${Date.now()}`;
        addNotification({ type: 'info', title: 'Demo Claim Recorded', message: `Mock claim for ${policy.protocol} saved locally.`, duration: 5000 });
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
          // Simple gas options - let MetaMask handle gas pricing
          const gasOptions: any = { gasLimit: 350000 };
          
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

  // Admin: activate trigger for a protocol (onlyOwner)
  const handleActivateTrigger = async () => {
    if (!adminProtocol) { notifyError('Select a protocol'); return; }
    setAdminProcessing(true);
    try {
      await connectWallet();
      const contract = getInsuranceV2Contract();
      if (!contract) throw new Error('Contract unavailable');
      const tx = await contract.activateTrigger(adminProtocol, adminTriggerType, adminSeverity, { gasLimit: 200000 });
      addNotification({ type: 'info', title: 'Activating Trigger', message: `Tx sent for ${adminProtocol}...`, txHash: tx.hash, duration: 10000 });
      await tx.wait(1);
      addNotification({ type: 'success', title: 'Trigger Activated', message: `${adminProtocol} trigger is now active (severity ${adminSeverity})`, duration: 6000 });
      await loadData(); // refresh trigger statuses
    } catch (e: any) {
      notifyError('activateTrigger failed: ' + (e.reason || e.message));
    } finally { setAdminProcessing(false); }
  };

  // Admin: deactivate trigger
  const handleDeactivateTrigger = async (proto: string) => {
    setAdminProcessing(true);
    try {
      await connectWallet();
      const contract = getInsuranceV2Contract();
      if (!contract) throw new Error('Contract unavailable');
      const tx = await contract.deactivateTrigger(proto, { gasLimit: 100000 });
      await tx.wait(1);
      addNotification({ type: 'info', title: 'Trigger Deactivated', message: `${proto} trigger removed`, duration: 5000 });
      await loadData();
    } catch (e: any) {
      notifyError('deactivateTrigger failed: ' + (e.reason || e.message));
    } finally { setAdminProcessing(false); }
  };

  const clearAllClaims = () => {
    setClaims([]);
    localStorage.removeItem(`claims_${address}`);
  };

  // Get eligible policies (active, not claimed, not expired)
  // Also annotate with trigger status
  const eligiblePolicies = policies.filter(p =>
    p.active &&
    !p.claimed &&
    p.expiry > Math.floor(Date.now() / 1000)
  );

  // Policy selected → auto-set triggerType to match active trigger
  const handleSelectPolicy = (policyId: string) => {
    setSelectedPolicy(policyId);
    const policy = policies.find(p => p.id === policyId);
    if (policy) {
      const ts = effectiveTriggers[policy.protocol];
      if (ts?.isActive) setTriggerType(ts.triggerType);
    }
  };

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
                <p className="text-sm text-gray-500 mt-2">Policies must be active and not expired to submit a claim.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Policy Selection */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Select Policy</label>
                  <select
                    value={selectedPolicy}
                    onChange={(e) => handleSelectPolicy(e.target.value)}
                    className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-glow-blue"
                  >
                    <option value="">Choose a policy...</option>
                    {eligiblePolicies.map(policy => {
                      const ts = effectiveTriggers[policy.protocol];
                      const hasActiveTrigger = ts?.isActive;
                      return (
                        <option key={policy.id} value={policy.id}>
                          {hasActiveTrigger ? '✓' : '⚠'} #{policy.id} - {policy.protocol} (${(policy.coverage * 2500).toLocaleString()}){!hasActiveTrigger ? ' — no trigger' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {/* Show trigger status for selected policy */}
                  {selectedPolicy && (() => {
                    const policy = policies.find(p => p.id === selectedPolicy);
                    const ts = policy ? effectiveTriggers[policy.protocol] : null;
                    const isMock = policy && !triggerStatuses[policy.protocol]?.isActive && mockTriggers[policy.protocol]?.isActive;
                    if (!ts) return null;
                    return ts.isActive ? (
                      <p className={`text-xs mt-1 ${isMock ? 'text-orange-400' : 'text-green-400'}`}>
                        {isMock ? '🎭 Demo trigger' : '✓ Active trigger'} for {policy!.protocol} — severity {ts.severity} — type: {triggerTypes[ts.triggerType]?.label}
                        {isMock && <span className="ml-1 text-gray-500">(mock, not on-chain)</span>}
                      </p>
                    ) : (
                      <p className="text-xs text-red-400 mt-1">⚠ No active trigger for {policy!.protocol}. Use the <strong>Demo Panel</strong> below to simulate one.</p>
                    );
                  })()}
                </div>

                {/* Claim Reason */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Claim Reason</label>
                  {(selectedPolicy && (() => {
                    const policy = policies.find(p => p.id === selectedPolicy);
                    const ts = policy ? effectiveTriggers[policy.protocol] : null;
                    if (ts?.isActive) {
                      // lock to the active trigger type
                      return (
                        <div className="w-full bg-dark-bg border border-green-700/50 rounded-lg py-3 px-4 text-green-300 text-sm">
                          {triggerTypes[ts.triggerType]?.label} — {triggerTypes[ts.triggerType]?.description}
                          <span className="ml-2 text-xs text-gray-500">(locked to active trigger)</span>
                        </div>
                      );
                    }
                    return (
                      <select
                        value={triggerType}
                        onChange={(e) => setTriggerType(parseInt(e.target.value))}
                        className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-glow-blue"
                      >
                        {triggerTypes.map(t => (
                          <option key={t.id} value={t.id}>{t.label} — {t.description}</option>
                        ))}
                      </select>
                    );
                  })()) ?? (
                    <select
                      value={triggerType}
                      onChange={(e) => setTriggerType(parseInt(e.target.value))}
                      className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-glow-blue"
                    >
                      {triggerTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.label} — {t.description}</option>
                      ))}
                    </select>
                  )}
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
                  Claims are reviewed and paid out from the liquidity pool upon approval.
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

            <h4 className="font-semibold mb-3">Eligible Policies</h4>
            <div className="space-y-2">
              {eligiblePolicies.length === 0 ? (
                <p className="text-sm text-gray-500">No active policies</p>
              ) : (
                eligiblePolicies.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">{p.protocol}</span>
                    <span className="text-green-400">${(p.coverage * 2500).toLocaleString()}</span>
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
                              href={`${getExplorerUrl()}/tx/${claim.txHash}`}
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


      {/* Demo / Mock Admin Panel — visible to all users for testing */}
      <motion.div variants={itemVariants}>
        <Card className="border border-orange-500/30 bg-orange-500/5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-orbitron flex items-center gap-2 text-orange-400">
              <FiZap size={20} /> Demo Mode — Simulate Triggers
            </h2>
            <button
              onClick={() => setShowMockPanel(p => !p)}
              className="text-xs px-3 py-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40 hover:bg-orange-500/30 transition-colors"
            >
              {showMockPanel ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-0">
            Simulate parametric trigger events locally for demo purposes — no wallet or on-chain transaction required.
          </p>

          {showMockPanel && (
            <div className="mt-4 space-y-4">
              {/* Active mock triggers */}
              {Object.keys(mockTriggers).length > 0 && (
                <div>
                  <h4 className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Active Demo Triggers</h4>
                  <div className="space-y-2">
                    {Object.entries(mockTriggers).map(([proto, mt]) => (
                      <div key={proto} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                          <span className="font-semibold text-sm">{proto}</span>
                          <span className="text-xs text-orange-300">{triggerTypes[mt.triggerType]?.label} · severity {mt.severity}</span>
                          <span className="text-xs bg-orange-400/20 text-orange-400 px-2 py-0.5 rounded-full">DEMO</span>
                        </div>
                        <button
                          onClick={() => handleMockDeactivate(proto)}
                          className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activate mock trigger form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Protocol</label>
                  <select
                    value={mockProtocol}
                    onChange={e => setMockProtocol(e.target.value)}
                    className="w-full bg-dark-bg border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    <option value="">Select protocol...</option>
                    {policies.length > 0
                      ? [...new Set(policies.map(p => p.protocol))].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))
                      : ['Aave', 'Compound', 'Uniswap', 'Curve', 'MakerDAO'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Trigger Type</label>
                  <select
                    value={mockTriggerType}
                    onChange={e => setMockTriggerType(parseInt(e.target.value))}
                    className="w-full bg-dark-bg border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    {triggerTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Severity (1–100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={mockSeverity}
                    onChange={e => setMockSeverity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="w-full bg-dark-bg border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
              </div>
              <button
                onClick={handleMockActivate}
                disabled={!mockProtocol}
                className="px-6 py-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40 hover:bg-orange-500/30 font-semibold text-sm disabled:opacity-50 transition-colors"
              >
                Activate Demo Trigger
              </button>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Admin Trigger Panel — visible only to contract owner */}
      {isOwner && (
        <motion.div variants={itemVariants}>
          <Card className="border border-yellow-500/30 bg-yellow-500/5">
            <h2 className="text-2xl font-orbitron mb-2 flex items-center gap-2 text-yellow-400">
              <FiZap size={22} /> Admin — Parametric Triggers
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Only the contract owner can activate / deactivate triggers. A trigger MUST be active for a protocol before policyholders can submit claims.
            </p>

            {/* Current trigger statuses */}
            {Object.keys(triggerStatuses).length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm text-gray-400 mb-3 font-semibold uppercase tracking-wider">Current Trigger Status</h4>
                <div className="space-y-2">
                  {Object.entries(triggerStatuses).map(([proto, ts]) => (
                    <div key={proto} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${ts.isActive ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                        <span className="font-semibold">{proto}</span>
                        {ts.isActive && (
                          <span className="text-xs text-green-400">{triggerTypes[ts.triggerType]?.label} · severity {ts.severity}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ts.isActive ? 'bg-green-400/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                          {ts.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        {ts.isActive && (
                          <button
                            onClick={() => handleDeactivateTrigger(proto)}
                            disabled={adminProcessing}
                            className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activate new trigger */}
            <h4 className="text-sm text-gray-400 mb-3 font-semibold uppercase tracking-wider">Activate Trigger</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Protocol</label>
                <select
                  value={adminProtocol}
                  onChange={e => setAdminProtocol(e.target.value)}
                  className="w-full bg-dark-bg border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                >
                  <option value="">Select protocol...</option>
                  {[...new Set(policies.map(p => p.protocol))].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  {/* Allow custom input */}
                  {adminProtocol && ![...new Set(policies.map(p => p.protocol))].includes(adminProtocol) && (
                    <option value={adminProtocol}>{adminProtocol} (custom)</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Trigger Type</label>
                <select
                  value={adminTriggerType}
                  onChange={e => setAdminTriggerType(parseInt(e.target.value))}
                  className="w-full bg-dark-bg border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                >
                  {triggerTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Severity (1–100)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={adminSeverity}
                  onChange={e => setAdminSeverity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-full bg-dark-bg border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                />
              </div>
            </div>
            <button
              onClick={handleActivateTrigger}
              disabled={adminProcessing || !adminProtocol}
              className="px-6 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30 font-semibold text-sm disabled:opacity-50 transition-colors"
            >
              {adminProcessing ? 'Processing...' : 'Activate Trigger'}
            </button>
          </Card>
        </motion.div>
      )}

    </motion.div>
  );
};

export default Claims;
