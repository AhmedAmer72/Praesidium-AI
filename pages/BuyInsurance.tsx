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
import { useContract } from '../hooks/useContract';

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
  const { getInsuranceContract, connectWallet } = useContract();

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
      
      const contract = getInsuranceContract();
      if (!contract) {
        console.log('Insurance contract not available');
        return;
      }
      
      const premiumWei = ethers.parseUnits("0.001", "ether");
      const coverageEth = (coverage / 2500).toString(); // Convert USD to ETH at $2500/ETH
      const coverageWei = ethers.parseUnits(coverageEth, "ether");
      const duration = 365 * 24 * 60 * 60;
      
      const tx = await contract.createPolicy(
        address,
        premiumWei,
        coverageWei,
        duration,
        protocol.name,
        { value: premiumWei, gasLimit: 500000 }
      );
      
      await tx.wait();
      setIsComplete(true);
      playSuccess();
      nextStep();
    } catch (error) {
      console.error('Purchase failed:', error);
      console.error('Purchase failed:', error.message || 'Unknown error');
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
                                    <div className="flex justify-between text-lg font-bold"><span className="text-gray-400">Total Premium:</span><span className="text-glow-purple">${premium}</span></div>
                                </div>
                                <p className="text-xs text-gray-500 text-center">Premium is for a 1-year coverage period. Review details before confirming.</p>
                            </div>
                        )}
                        {currentStep === 2 && (
                            <div className="text-center space-y-4 flex flex-col items-center h-full justify-center">
                                <FiCheckCircle className="text-green-400 text-6xl animate-pulse" />
                                <h3 className="text-2xl font-bold">Purchase Complete!</h3>
                                <p className="text-gray-400">Your policy has been minted as an NFT to your wallet. You are now covered.</p>
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