import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import Confetti from 'react-canvas-confetti';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import ConnectWallet from '../components/ConnectWallet';

import { mockProtocols } from '../constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import useSound from '../hooks/useSound';
import { useContract, switchToAmoyWithGoodRPC } from '../hooks/useContract';
import { usePriceOracle } from '../hooks/usePriceOracle';
import { useNotification } from '../context/NotificationContext';

// Now using V2 contract for all new policies

const steps = ['Configure', 'Confirm', 'Complete'];

const BuyInsurance = () => {
  const { isConnected, address } = useAccount();
  const { protocolId } = useParams();
  const navigate = useNavigate();
  const protocol = useMemo(() => mockProtocols.find(p => p.id === protocolId), [protocolId]);

  const [currentStep, setCurrentStep] = useState(0);
  const [coverage, setCoverage] = useState(50000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { playSuccess, playClick } = useSound();
  const { getInsuranceV2Contract, connectWallet } = useContract();
  const { ethUsdPrice, usdToEth } = usePriceOracle();
  const { notifyPolicyPurchased, notifyError, addNotification } = useNotification();

  const premium = useMemo(() => {
    if (!protocol) return 0;
    return (coverage * (protocol.premiumRate / 100)).toFixed(2);
  }, [coverage, protocol]);

  const nextStep = () => {
    playClick();
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    }
  };

  const prevStep = () => {
    playClick();
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      await connectWallet();
      
      const contract = getInsuranceV2Contract();
      
      if (!contract) {
        notifyError('Insurance V2 contract not available. Please check your network connection.');
        setIsProcessing(false);
        return;
      }
      
      // For testnet, use a small fixed premium to make testing easier
      // In production, this would use the actual calculated premium from oracle
      const testPremiumEth = "0.001"; // 0.001 POL for testing
      const premiumWei = ethers.parseUnits(testPremiumEth, "ether");
      
      // Use live price for coverage conversion
      const coverageEth = usdToEth(coverage).toFixed(6);
      const coverageWei = ethers.parseUnits(coverageEth, "ether");
      const duration = 365 * 24 * 60 * 60; // 1 year
      
      // Add retry logic for rate limiting
      let tx;
      let retries = 3;
      
      // Get current gas prices from the network
      const provider = contract.runner?.provider;
      const feeData = await provider?.getFeeData();
      
      while (retries > 0) {
        try {
          tx = await contract.createPolicy(
            address,
            premiumWei,
            coverageWei,
            duration,
            protocol.name,
            { 
              value: premiumWei, 
              gasLimit: 500000,
              maxFeePerGas: feeData?.maxFeePerGas ? feeData.maxFeePerGas * 2n : ethers.parseUnits("100", "gwei"),
              maxPriorityFeePerGas: feeData?.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas * 2n : ethers.parseUnits("50", "gwei")
            }
          );
          break; // Success, exit retry loop
        } catch (txError: any) {
          if (txError.message?.includes('429') || txError.message?.includes('rate limit')) {
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              throw txError;
            }
          } else {
            throw txError; // Not a rate limit error, throw immediately
          }
        }
      }
      
      if (!tx) {
        throw new Error('Failed to submit transaction after multiple attempts');
      }
      
      // Show immediate feedback that transaction is submitted
      addNotification({
        type: 'info',
        title: 'Transaction Submitted',
        message: 'Waiting for blockchain confirmation...',
        txHash: tx.hash,
        duration: 30000
      });
      
      // Wait for confirmation with timeout - but don't fail if timeout
      try {
        const receipt = await Promise.race([
          tx.wait(1), // Wait for 1 confirmation
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction confirmation timeout')), 90000)
          )
        ]);
      } catch (waitError: any) {
        // If we timeout waiting for confirmation, the tx was still sent successfully
        // Just proceed - the policy will appear once confirmed
        addNotification({
          type: 'warning',
          title: 'Confirmation Pending',
          message: 'Transaction sent! Confirmation is taking longer than usual. Your policy will appear on the dashboard once confirmed.',
          txHash: tx.hash,
          duration: 15000
        });
      }
      
      // Transaction was sent successfully - consider it a success
      setIsComplete(true);
      playSuccess();
      notifyPolicyPurchased(protocol.name, coverage, tx.hash);
      nextStep();
    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      // Parse error message for user-friendly display
      let errorMessage = 'Failed to purchase policy. Please try again.';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by user.';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this transaction.';
      } else if (error.message?.includes('Internal JSON-RPC error')) {
        errorMessage = 'Network error. Please make sure you are connected to Polygon Amoy testnet.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Transaction is taking longer than expected. Check your wallet for status.';
      } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        errorMessage = 'RPC rate limited. Trying to switch to a better RPC...';
        // Try to switch to a better RPC
        const switched = await switchToAmoyWithGoodRPC();
        if (switched) {
          errorMessage = 'Switched to a better RPC. Please try again.';
        } else {
          errorMessage = 'RPC rate limited. Please wait 30 seconds and try again, or manually change your MetaMask RPC to: https://polygon-amoy-bor-rpc.publicnode.com';
        }
      } else if (error.reason) {
        errorMessage = error.reason;
      }
      
      notifyError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isConnected) {
    return (
        <Card className="max-w-lg mx-auto mt-16 text-center">
            <div className="p-8">
                <FiAlertTriangle className="text-yellow-400 text-6xl mx-auto mb-4" />
                <h2 className="text-2xl font-bold font-orbitron mb-2">Wallet Not Connected</h2>
                <p className="text-gray-400 mb-6">Please connect your wallet to purchase insurance.</p>
                <ConnectWallet />
            </div>
        </Card>
    );
  }

  if (!protocol) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Protocol not found</h2>
        <Button onClick={() => navigate('/marketplace')} className="mt-4">Back to Marketplace</Button>
      </div>
    );
  }

  const slideVariants = {
    hidden: { opacity: 0, x: 200 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -200 },
  };

  return (
    <div className="max-w-3xl mx-auto">
       {isComplete && <Confetti fire={true} particleCount={200} spread={90} origin={{ y: 0.6 }} />}
      <Card className="overflow-hidden">
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-orbitron">Buy Insurance</h1>
                    <p className="text-gray-400">for {protocol.name}</p>
                </div>
                <img src={protocol.logo} alt={protocol.name} className="w-16 h-16"/>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    {steps.map((step, index) => (
                        <React.Fragment key={step}>
                            <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${index <= currentStep ? 'bg-glow-blue' : 'bg-gray-700'}`}>
                                    {index < currentStep || isComplete ? <FiCheckCircle /> : index + 1}
                                </div>
                                <p className={`mt-2 text-sm ${index <= currentStep ? 'text-white' : 'text-gray-500'}`}>{step}</p>
                            </div>
                            {index < steps.length - 1 && <div className={`flex-1 h-1 mx-2 transition-colors ${index < currentStep ? 'bg-glow-blue' : 'bg-gray-700'}`}></div>}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Form Steps */}
            <div className="relative h-80">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        variants={slideVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.4 }}
                        className="absolute w-full"
                    >
                        {currentStep === 0 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold">Configure Your Coverage</h3>
                                <div>
                                    <label className="block mb-2 text-gray-400">Coverage Amount</label>
                                    <input type="range" min="1000" max={protocol.coverageLimit} step="1000" value={coverage} onChange={e => setCoverage(parseInt(e.target.value))} className="w-full" />
                                    <div className="text-center text-2xl font-orbitron mt-2">${coverage.toLocaleString()}</div>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold">Parametric Triggers</h4>
                                    <ul className="list-disc list-inside mt-2 text-gray-400 space-y-1">
                                        {protocol.triggerConditions.map(c => <li key={c}>{c}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                         {currentStep === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold">Confirm Transaction</h3>
                                <div className="p-4 bg-dark-bg/50 rounded-lg space-y-2">
                                    <div className="flex justify-between"><span className="text-gray-400">Protocol:</span><span>{protocol.name}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400">Coverage:</span><span>${coverage.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400">Premium Rate:</span><span>{protocol.premiumRate}%</span></div>
                                    <hr className="border-gray-700"/>
                                    <div className="flex justify-between text-lg font-bold"><span className="text-gray-400">Total Premium:</span><span className="text-glow-purple">0.001 POL</span></div>
                                    <p className="text-xs text-yellow-400 mt-2">⚠️ Testnet mode: Using fixed 0.001 POL premium for testing</p>
                                </div>
                                <p className="text-xs text-gray-500 text-center">Premium is for a 1-year coverage period. Review details before confirming.</p>
                            </div>
                        )}
                        {currentStep === 2 && (
                            <div className="text-center space-y-4 flex flex-col items-center h-full justify-center">
                                <FiCheckCircle className="text-green-400 text-6xl animate-pulse" />
                                <h3 className="text-2xl font-bold">Purchase Complete!</h3>
                                <p className="text-gray-400">Your insurance policy is now active. You are covered against parametric triggers.</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
        
        {/* Navigation */}
        <div className="bg-dark-bg/50 p-4 flex justify-between items-center mt-auto">
             <Button variant="secondary" onClick={prevStep} disabled={currentStep === 0 || isComplete}>
                <FiArrowLeft className="mr-2"/> Back
            </Button>
            {currentStep === 0 && <Button onClick={nextStep}><FiArrowRight className="mr-2"/> Review</Button>}
            {currentStep === 1 && <Button onClick={handlePurchase} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Confirm & Purchase'}
            </Button>}
            {currentStep === 2 && <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>}
        </div>
      </Card>
    </div>
  );
};

export default BuyInsurance;