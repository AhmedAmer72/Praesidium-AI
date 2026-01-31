import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FiAlertTriangle } from 'react-icons/fi';
import { ethers } from 'ethers';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { useContract } from '../hooks/useContract';
import { usePriceOracle } from '../hooks/usePriceOracle';
import { CONTRACT_ADDRESSES } from '../constants';
import { useNotification } from '../context/NotificationContext';

const poolStatsData = [
  { name: 'USDC', value: 45, color: '#2775CA' },
  { name: 'DAI', value: 30, color: '#F4B731' },
  { name: 'USDT', value: 20, color: '#50AF95' },
  { name: 'MATIC', value: 5, color: '#8247E5' },
];

const LiquidityPool = () => {
  const { isConnected, address } = useAccount();
  const { getLiquidityContract, connectWallet } = useContract();
  const { ethUsdPrice, ethToUsd } = usePriceOracle();
  const { notifyDeposit, notifyWithdraw, notifyError } = useNotification();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [userShares, setUserShares] = useState(0);
  const [poolBalance, setPoolBalance] = useState(0);
  const [userEarnings, setUserEarnings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadPoolData();
    }
  }, [isConnected, address]);

  const loadPoolData = async () => {
    setLoading(true);
    try {
      await connectWallet();
      
      const contract = getLiquidityContract();
      
      if (!contract) {
        setUserBalance(0);
        setUserShares(0);
        setPoolBalance(0);
        setUserEarnings(0);
        return;
      }
      
      // Get pool balance - this always exists
      const poolBalanceWei = await contract.getPoolBalance();
      const poolBalanceEth = parseFloat(ethers.formatEther(poolBalanceWei));
      
      // Get user shares (ERC20 balanceOf - inherited)
      const userSharesAmount = await contract.getUserShares(address);
      const userSharesNum = parseFloat(ethers.formatEther(userSharesAmount));
      
      // Try to get totalShares, fallback to totalSupply (ERC20)
      let totalSharesNum = 0;
      try {
        const totalShares = await contract.totalShares();
        totalSharesNum = parseFloat(ethers.formatEther(totalShares));
      } catch {
        // Fallback: use totalSupply from ERC20
        const totalSupply = await contract.totalSupply();
        totalSharesNum = parseFloat(ethers.formatEther(totalSupply));
      }
      
      // Try to get user balance, fallback to calculating from shares
      let userBalanceEth = 0;
      try {
        const userBalanceWei = await contract.getUserBalance(address);
        userBalanceEth = parseFloat(ethers.formatEther(userBalanceWei));
      } catch {
        // Fallback: calculate from shares ratio
        // userBalance = (userShares / totalShares) * poolBalance
        if (totalSharesNum > 0) {
          // Get totalDeposits if available
          try {
            const totalDeposits = await contract.totalDeposits();
            const totalDepositsEth = parseFloat(ethers.formatEther(totalDeposits));
            userBalanceEth = (userSharesNum / totalSharesNum) * totalDepositsEth;
          } catch {
            userBalanceEth = (userSharesNum / totalSharesNum) * poolBalanceEth;
          }
        }
      }
      
      // Calculate pool share percentage
      const poolSharePercent = totalSharesNum > 0 ? (userSharesNum / totalSharesNum) * 100 : 0;
      
      // Use live price from oracle
      setPoolBalance(ethToUsd(poolBalanceEth));
      setUserBalance(ethToUsd(userBalanceEth));
      setUserShares(poolSharePercent);
      
      // Calculate earnings (simplified - in real app would track deposits vs current value)
      const estimatedEarnings = ethToUsd(userBalanceEth * 0.0875); // 8.75% APY
      setUserEarnings(estimatedEarnings);
      
    } catch (error) {
      // Set to zero if contract fails
      setUserBalance(0);
      setUserShares(0);
      setPoolBalance(0);
      setUserEarnings(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      notifyError('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      await connectWallet();
      
      const contract = getLiquidityContract();
      
      if (!contract) {
        notifyError('Contract not available. Please check your connection.');
        setProcessing(false);
        return;
      }
      
      const depositAmount = ethers.parseUnits(amount, "ether");
      
      // Simple gas options - let MetaMask handle gas pricing
      const gasOptions: any = { 
        value: depositAmount, 
        gasLimit: 250000 
      };
      
      console.log('Depositing:', depositAmount.toString());
      
      const tx = await contract.deposit(gasOptions);
      
      // Wait for confirmation and check status
      const receipt = await tx.wait(1);
      if (receipt && receipt.status === 0) {
        throw new Error('Transaction was reverted by the contract');
      }
      
      notifyDeposit(parseFloat(amount), tx.hash);
      
      setAmount('');
      loadPoolData();
    } catch (error) {
      notifyError(error.message || 'Deposit failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      notifyError('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      await connectWallet();
      
      const contract = getLiquidityContract();
      if (!contract) {
        notifyError('Contract not available. Please check your connection.');
        setProcessing(false);
        return;
      }
      
      const withdrawShares = ethers.parseUnits(amount, "ether");
      
      // Simple gas options - let MetaMask handle gas pricing
      const gasOptions: any = { 
        gasLimit: 250000 
      };
      
      console.log('Withdrawing shares:', withdrawShares.toString());
      
      const tx = await contract.withdraw(withdrawShares, gasOptions);
      
      // Wait for confirmation and check status
      const receipt = await tx.wait(1);
      if (receipt && receipt.status === 0) {
        throw new Error('Transaction was reverted by the contract');
      }
      
      notifyWithdraw(parseFloat(amount), tx.hash);
      
      setAmount('');
      loadPoolData();
    } catch (error) {
      notifyError(error.message || 'Withdrawal failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isConnected) {
    return (
        <Card className="max-w-lg mx-auto mt-16 text-center">
            <div className="p-8">
                <FiAlertTriangle className="text-yellow-400 text-6xl mx-auto mb-4" />
                <h2 className="text-2xl font-bold font-orbitron mb-2">Wallet Not Connected</h2>
                <p className="text-gray-400 mb-6">Please connect your wallet to manage liquidity.</p>
                <ConnectButton />
            </div>
        </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-3 space-y-8">
        <Card className="relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] text-center p-8">
          <div className="absolute inset-0 bg-dark-bg">
            <div className="absolute inset-0 opacity-20 ripple-bg"></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-sm uppercase tracking-widest text-gray-400">Pool APY</h2>
            <p 
                className="text-7xl font-orbitron my-2"
                style={{ textShadow: '0 0 10px #A855F7, 0 0 20px #A855F7, 0 0 30px #A855F7' }}
            >
                <AnimatedCounter to={8.75} precision={2} />%
            </p>
            <p className="text-gray-300">Earn yield by providing liquidity to the insurance pool.</p>
          </div>
        </Card>

        <Card>
            <div className="flex border-b border-gray-700">
                <button 
                    onClick={() => setActiveTab('deposit')}
                    className={`flex-1 py-3 font-semibold text-center transition-colors ${activeTab === 'deposit' ? 'text-glow-blue border-b-2 border-glow-blue' : 'text-gray-500 hover:text-white'}`}>
                    Deposit
                </button>
                 <button 
                    onClick={() => setActiveTab('withdraw')}
                    className={`flex-1 py-3 font-semibold text-center transition-colors ${activeTab === 'withdraw' ? 'text-glow-blue border-b-2 border-glow-blue' : 'text-gray-500 hover:text-white'}`}>
                    Withdraw
                </button>
            </div>
            <div className="p-6">
                <div className="mb-4">
                    <label className="block text-sm mb-2 text-gray-400">Amount</label>
                    <div className="relative">
                        <input 
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 px-4 pr-20 focus:outline-none focus:ring-2 focus:ring-glow-blue"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                            <button 
                                onClick={() => setAmount(activeTab === 'deposit' ? '0.1' : (userBalance / 2500).toFixed(4))}
                                className="text-xs bg-glow-blue/20 text-glow-blue px-2 py-1 rounded hover:bg-glow-blue/30"
                            >
                                MAX
                            </button>
                            <span className="text-gray-400 font-bold">MATIC</span>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {activeTab === 'deposit' ? 'Available: Check wallet balance' : `Available: ${(userBalance / 2500).toFixed(4)} MATIC worth of shares`}
                    </div>
                </div>
                <Button 
                  className="w-full text-lg capitalize" 
                  onClick={activeTab === 'deposit' ? handleDeposit : handleWithdraw}
                  disabled={processing || !amount}
                >
                  {processing ? 'Processing...' : activeTab}
                </Button>
            </div>
        </Card>
      </div>
      
      {/* Side Content */}
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <h3 className="text-xl font-orbitron mb-4">Your Position</h3>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-glow-blue mx-auto"></div>
              <p className="text-gray-400 text-sm mt-2">Loading...</p>
            </div>
          ) : (
          <div className="space-y-3">
             <div className="flex justify-between text-lg">
                <span className="text-gray-400">Deposited</span>
                <span className="font-bold">
                    $<AnimatedCounter to={userBalance} precision={2} />
                </span>
             </div>
             <div className="flex justify-between text-lg">
                <span className="text-gray-400">Earnings</span>
                <span className="font-bold text-green-400">
                    +$<AnimatedCounter to={userEarnings} precision={2} />
                </span>
             </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-400">Pool Share</span>
                <span className="font-bold">
                    <AnimatedCounter to={userShares} precision={2} />%
                </span>
             </div>
          </div>
          )}
        </Card>

        <Card>
          <h3 className="text-xl font-orbitron mb-4">Pool Statistics</h3>
          <div className="space-y-3 mb-6">
             <div className="flex justify-between">
                <span className="text-gray-400">Total Liquidity</span>
                <span>$<AnimatedCounter to={poolBalance} /></span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-400">Utilization</span>
                <span><AnimatedCounter to={63.5} precision={1}/>%</span>
             </div>
          </div>
          <h4 className="font-semibold mb-4">Asset Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={poolStatsData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(100,100,100,0.1)'}} contentStyle={{ backgroundColor: '#121326', border: '1px solid #374151' }} />
                    <Bar dataKey="value" barSize={20} radius={[0, 10, 10, 0]}>
                        {poolStatsData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default LiquidityPool;