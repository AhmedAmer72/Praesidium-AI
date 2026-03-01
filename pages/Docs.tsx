import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBook, FiShield, FiDollarSign, FiAlertTriangle, FiActivity,
  FiCode, FiExternalLink, FiCheckCircle, FiChevronDown, FiChevronRight,
  FiDatabase, FiZap, FiUsers, FiLock, FiRefreshCw, FiFileText
} from 'react-icons/fi';

const CONTRACT_ADDRESSES = {
  polygon: {
    PraesidiumInsuranceV2: '0x657A362d009fFbCD90A94e08aa852aa8a0c5205f',
    LiquidityPool: '0x7dE62D0fD7Eb664FF2a2514230fdB349f465db87',
    RiskOracle: '0x41E41d1aEcb893616e8c24f32998F7c850670ABF',
  },
};
const EXPLORER = 'https://polygonscan.com';

const TABS = [
  { id: 'overview',   label: 'Overview',        icon: FiBook },
  { id: 'guide',      label: 'User Guide',       icon: FiUsers },
  { id: 'claims',     label: 'Claims',           icon: FiShield },
  { id: 'liquidity',  label: 'Liquidity Pool',   icon: FiDollarSign },
  { id: 'contracts',  label: 'Smart Contracts',  icon: FiCode },
  { id: 'faq',        label: 'FAQ',              icon: FiFileText },
];

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-800">
      <span className="text-glow-blue">{icon}</span>
      <h2 className="text-xl font-orbitron font-bold">{title}</h2>
    </div>
    {children}
  </div>
);

const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
  <div className="flex gap-4 mb-6">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-glow-blue/20 border border-glow-blue/50 flex items-center justify-center text-glow-blue font-bold text-sm">
      {number}
    </div>
    <div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </div>
  </div>
);

const InfoBox: React.FC<{ type?: 'info' | 'warning' | 'success'; children: React.ReactNode }> = ({ type = 'info', children }) => {
  const styles = {
    info:    'bg-blue-500/10 border-blue-500/30 text-blue-300',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    success: 'bg-green-500/10 border-green-500/30 text-green-300',
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm mb-4 ${styles[type]}`}>
      {children}
    </div>
  );
};

const ContractCard: React.FC<{ name: string; address: string; description: string }> = ({ name, address, description }) => (
  <div className="bg-dark-card/60 border border-gray-800 rounded-xl p-5 mb-4">
    <div className="flex items-start justify-between gap-4 mb-2">
      <div>
        <h3 className="font-semibold text-white">{name}</h3>
        <p className="text-gray-400 text-sm mt-1">{description}</p>
      </div>
      <a
        href={`${EXPLORER}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 flex items-center gap-1 text-xs text-glow-blue hover:underline"
      >
        PolygonScan <FiExternalLink size={11} />
      </a>
    </div>
    <code className="block bg-dark-bg rounded px-3 py-2 text-xs text-gray-300 font-mono break-all">{address}</code>
  </div>
);

const Accordion: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-800 rounded-xl mb-3 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/30 transition-colors"
      >
        <span className="font-medium text-white">{question}</span>
        {open ? <FiChevronDown className="text-glow-blue flex-shrink-0" /> : <FiChevronRight className="text-gray-400 flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed border-t border-gray-800/60">
              <div className="pt-3">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Docs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-orbitron font-bold mb-2">Documentation</h1>
        <p className="text-gray-400">Everything you need to know about Praesidium — DeFi insurance powered by parametric triggers on Polygon.</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 flex-wrap mb-8 bg-dark-card/50 p-1 rounded-xl border border-gray-800">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-glow-blue/20 text-glow-blue border border-glow-blue/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* ─── OVERVIEW ──────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div>
              <Section title="What is Praesidium?" icon={<FiBook size={20} />}>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Praesidium is a decentralized, parametric insurance protocol built on Polygon Mainnet. It protects DeFi users against smart contract exploits, TVL collapses, oracle failures, governance attacks, and stablecoin depeg events — without the delays and subjectivity of traditional claim processes.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Policies are priced in real-time using the <strong className="text-white">Praesidium Risk Oracle</strong>, which continuously scores each covered protocol from 0–100. Premiums adjust automatically based on risk. Claims are submitted on-chain and paid from the shared liquidity pool.
                </p>
              </Section>

              <Section title="Core Features" icon={<FiZap size={20} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: FiShield,     title: 'Parametric Coverage',  desc: 'Policies trigger on measurable on-chain events — no claims adjusters, no ambiguity.' },
                    { icon: FiActivity,   title: 'Live Risk Scoring',    desc: 'The Risk Oracle updates protocol scores in real-time, dynamically pricing premiums.' },
                    { icon: FiDollarSign, title: 'Shared Liquidity Pool', desc: 'LPs earn yield by backing the insurance pool. Capital is deployed automatically.' },
                    { icon: FiLock,       title: 'Fully On-Chain',       desc: 'Policies, claims, and payouts all live on Polygon — verifiable by anyone.' },
                    { icon: FiRefreshCw,  title: 'Instant Payouts',      desc: 'Approved claims are paid directly from the pool with no waiting period.' },
                    { icon: FiDatabase,   title: 'Global Claims Feed',   desc: 'All submitted claims are visible on the Analytics page in real time.' },
                  ].map(f => (
                    <div key={f.title} className="flex gap-3 p-4 bg-dark-card/50 rounded-xl border border-gray-800">
                      <span className="text-glow-blue mt-0.5 flex-shrink-0"><f.icon size={18} /></span>
                      <div>
                        <p className="font-semibold text-white text-sm">{f.title}</p>
                        <p className="text-gray-400 text-xs mt-1">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Covered Event Types" icon={<FiAlertTriangle size={20} />}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs border-b border-gray-800">
                        <th className="text-left py-2 pr-4 font-medium">Trigger</th>
                        <th className="text-left py-2 pr-4 font-medium">Description</th>
                        <th className="text-left py-2 font-medium">Example</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-400">
                      {[
                        ['TVL Drop > 50%',            'Protocol reserves fall by more than half',      'Depeg / bank run'],
                        ['Smart Contract Exploit',     'Security vulnerability actively exploited',     'Reentrancy attack'],
                        ['Oracle Failure',             'Price feed manipulation or downtime',           'Flash-loan oracle attack'],
                        ['Governance Attack',          'Malicious on-chain governance proposal passes', 'Flash-loan governance takeover'],
                        ['Stablecoin Depeg > 5%',      'Stablecoin loses its peg by more than 5%',      'UST collapse scenario'],
                      ].map(([t, d, e]) => (
                        <tr key={t} className="border-b border-gray-800/50">
                          <td className="py-3 pr-4 text-white font-medium whitespace-nowrap">{t}</td>
                          <td className="py-3 pr-4">{d}</td>
                          <td className="py-3 text-gray-500 italic">{e}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            </div>
          )}

          {/* ─── USER GUIDE ─────────────────────────────────── */}
          {activeTab === 'guide' && (
            <div>
              <Section title="Getting Started" icon={<FiUsers size={20} />}>
                <InfoBox type="info">
                  Praesidium runs on <strong>Polygon Mainnet (Chain ID 137)</strong>. Make sure your wallet is connected to the correct network before purchasing a policy.
                </InfoBox>
                <Step number={1} title="Connect Your Wallet">
                  Click <strong className="text-white">Connect Wallet</strong> in the top-right corner. Select MetaMask or any WalletConnect-compatible wallet. Approve the connection and switch to <strong className="text-white">Polygon Mainnet</strong> if prompted.
                </Step>
                <Step number={2} title="Browse the Marketplace">
                  Navigate to <strong className="text-white">Marketplace</strong> from the sidebar. Each protocol card shows its live Risk Score (0–100), premium rate, coverage limit, and TVL history. Filter by risk level or search by name.
                </Step>
                <Step number={3} title="Configure Your Coverage">
                  Click a protocol card and click <strong className="text-white">Get Coverage</strong>. On the configuration page, drag the slider or type a coverage amount in USD. The premium is calculated instantly. Review the parametric trigger conditions listed on this page.
                </Step>
                <Step number={4} title="Confirm & Purchase">
                  Click <strong className="text-white">Review</strong> to see a full summary, then <strong className="text-white">Confirm Purchase</strong>. Your wallet will ask you to sign one transaction. The premium (in POL) is sent to the liquidity pool and your policy is minted on-chain.
                </Step>
                <Step number={5} title="Monitor Your Dashboard">
                  All active policies appear in <strong className="text-white">Dashboard → Your Portfolio</strong>. You can see coverage amount, status, expiry date, and a <strong className="text-white">Renew</strong> button for policies expiring within 30 days.
                </Step>
              </Section>

              <Section title="Renewing a Policy" icon={<FiRefreshCw size={20} />}>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Policies are valid for the duration set at purchase. When a policy expires or is within 30 days of expiry, a <strong className="text-white">Renew</strong> button appears in the Dashboard table. Clicking it takes you back to the BuyInsurance flow for the same protocol.
                </p>
              </Section>
            </div>
          )}

          {/* ─── CLAIMS ─────────────────────────────────────── */}
          {activeTab === 'claims' && (
            <div>
              <Section title="Submitting a Claim" icon={<FiShield size={20} />}>
                <InfoBox type="warning">
                  Only policies that are <strong>active and not expired</strong> are eligible for claims. Each policy can only be claimed once.
                </InfoBox>
                <Step number={1} title="Go to Claims Center">
                  Click <strong className="text-white">Claims</strong> in the sidebar. Your eligible policies will be listed automatically.
                </Step>
                <Step number={2} title="Select a Policy">
                  Choose the policy you want to claim against from the dropdown. Only active, non-expired, un-claimed policies appear here.
                </Step>
                <Step number={3} title="Choose a Claim Reason">
                  Select the event type that caused your loss (e.g., Smart Contract Exploit). Add any optional evidence such as transaction hashes or incident links.
                </Step>
                <Step number={4} title="Submit On-Chain">
                  Click <strong className="text-white">Submit Claim</strong>. MetaMask will prompt you to sign a transaction calling <code className="text-xs bg-gray-800 px-1 rounded">submitClaim()</code> on the insurance contract. Once confirmed, the claim appears in your Claims History with a <strong className="text-white">Pending</strong> status.
                </Step>
                <Step number={5} title="Claim Review & Payout">
                  Claims are reviewed against the on-chain data. Approved claims trigger <code className="text-xs bg-gray-800 px-1 rounded">approveClaim()</code>, which transfers funds directly from the liquidity pool to the policy holder.
                </Step>
              </Section>

              <Section title="Claim Statuses" icon={<FiCheckCircle size={20} />}>
                <div className="space-y-3">
                  {[
                    { label: 'Pending',  color: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30', desc: 'Claim submitted on-chain, awaiting review.' },
                    { label: 'Approved', color: 'bg-green-400/10 text-green-400 border-green-400/30',   desc: 'Claim approved. Payout is being processed.' },
                    { label: 'Paid Out', color: 'bg-blue-400/10 text-blue-400 border-blue-400/30',      desc: 'Funds have been sent to the policy holder.' },
                    { label: 'Rejected', color: 'bg-red-400/10 text-red-400 border-red-400/30',         desc: 'Claim did not meet the trigger criteria.' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-4">
                      <span className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold w-24 text-center ${s.color}`}>{s.label}</span>
                      <span className="text-gray-400 text-sm">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ─── LIQUIDITY POOL ─────────────────────────────── */}
          {activeTab === 'liquidity' && (
            <div>
              <Section title="How the Pool Works" icon={<FiDollarSign size={20} />}>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  The Praesidium Liquidity Pool is the capital backing all insurance policies. Liquidity Providers (LPs) deposit POL into the pool and receive yield proportional to premiums collected. In return, their capital is at risk if a large wave of claims is paid out.
                </p>
                <InfoBox type="success">
                  The pool targets a <strong>150% collateralization ratio</strong> — for every $1 of coverage sold, at least $1.50 in liquidity must be present. Deposits are capped once the pool reaches 80% utilization.
                </InfoBox>
              </Section>

              <Section title="Depositing Liquidity" icon={<FiDatabase size={20} />}>
                <Step number={1} title="Navigate to Liquidity">Go to <strong className="text-white">Liquidity</strong> in the sidebar.</Step>
                <Step number={2} title="Enter Amount">Type the amount of POL you want to deposit in the amount field.</Step>
                <Step number={3} title="Click Deposit">Click the <strong className="text-white">Deposit</strong> button and confirm the transaction in MetaMask. You will receive pool shares representing your proportional ownership.</Step>
                <Step number={4} title="Earn Yield">Yield accrues continuously from premiums paid by policy holders. Check the APY metric at the top of the Liquidity page.</Step>
              </Section>

              <Section title="Withdrawing" icon={<FiRefreshCw size={20} />}>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Switch to the <strong className="text-white">Withdraw</strong> tab and enter the amount of shares you wish to redeem. Your share balance is shown as a percentage of the pool. The contract will burn your shares and return the proportional POL to your wallet.
                </p>
                <InfoBox type="warning">
                  Withdrawals may be limited if the pool is processing open claims. Ensure sufficient unlocked liquidity is available before attempting a withdrawal.
                </InfoBox>
              </Section>
            </div>
          )}

          {/* ─── SMART CONTRACTS ────────────────────────────── */}
          {activeTab === 'contracts' && (
            <div>
              <Section title="Deployed Contracts — Polygon Mainnet" icon={<FiCode size={20} />}>
                <InfoBox type="info">All contracts are deployed on <strong>Polygon Mainnet (Chain ID 137)</strong> and are publicly verifiable on PolygonScan.</InfoBox>

                <ContractCard
                  name="PraesidiumInsuranceV2"
                  address={CONTRACT_ADDRESSES.polygon.PraesidiumInsuranceV2}
                  description="Core insurance contract. Handles policy creation, claim submission, claim approval, and payout logic."
                />
                <ContractCard
                  name="LiquidityPool"
                  address={CONTRACT_ADDRESSES.polygon.LiquidityPool}
                  description="ERC-20 share-based pool. LPs deposit POL, receive yield shares, and back all insurance policies."
                />
                <ContractCard
                  name="RiskOracle"
                  address={CONTRACT_ADDRESSES.polygon.RiskOracle}
                  description="On-chain risk scoring oracle. Provides real-time risk scores (0–100) for each covered protocol, used to price premiums."
                />
              </Section>

              <Section title="Key Contract Functions" icon={<FiFileText size={20} />}>
                <div className="space-y-3">
                  {[
                    { fn: 'buyPolicy(protocol, coverage)',    contract: 'InsuranceV2', desc: 'Purchase a new insurance policy. Sends premium in POL.' },
                    { fn: 'submitClaim(policyId, reason, evidence)', contract: 'InsuranceV2', desc: 'Submit a claim against an active policy.' },
                    { fn: 'approveClaim(policyId)',           contract: 'InsuranceV2', desc: 'Admin: approve a pending claim and trigger payout.' },
                    { fn: 'deposit()',                        contract: 'LiquidityPool', desc: 'Deposit POL into the liquidity pool. Send value with this call.' },
                    { fn: 'withdraw(shares)',                 contract: 'LiquidityPool', desc: 'Redeem pool shares for proportional POL.' },
                    { fn: 'getRiskScore(protocol)',           contract: 'RiskOracle', desc: 'Read the current risk score (0–100) for a protocol.' },
                  ].map(r => (
                    <div key={r.fn} className="flex gap-3 p-3 bg-dark-bg rounded-lg border border-gray-800/60">
                      <div className="flex-1">
                        <code className="text-glow-blue text-xs font-mono">{r.fn}</code>
                        <span className="ml-2 text-xs text-gray-600">({r.contract})</span>
                        <p className="text-gray-400 text-xs mt-1">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Network Details" icon={<FiDatabase size={20} />}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ['Network',       'Polygon Mainnet'],
                    ['Chain ID',      '137'],
                    ['Native Token',  'POL (MATIC)'],
                    ['Block Time',    '~2 seconds'],
                    ['Explorer',      'polygonscan.com'],
                    ['RPC',           'polygon-bor-rpc.publicnode.com'],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-dark-card/60 rounded-lg px-4 py-3 border border-gray-800">
                      <p className="text-gray-500 text-xs mb-1">{k}</p>
                      <p className="text-white font-mono text-xs">{v}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ─── FAQ ────────────────────────────────────────── */}
          {activeTab === 'faq' && (
            <div>
              <Section title="Frequently Asked Questions" icon={<FiFileText size={20} />}>
                <Accordion question="What networks does Praesidium support?">
                  Currently, Praesidium is deployed on <strong>Polygon Mainnet</strong>. Polygon offers fast, low-cost transactions ideal for insurance premiums and claim payouts. Testnet (Polygon Amoy) contracts also exist for developer testing.
                </Accordion>
                <Accordion question="How are premiums calculated?">
                  Premiums are calculated as: <code className="text-xs bg-gray-800 px-1 rounded">Coverage Amount × Annual Premium Rate</code>. The rate is determined by the protocol's live Risk Score from the oracle — lower score means higher risk, higher premium.
                </Accordion>
                <Accordion question="Can I cancel my policy and get a refund?">
                  Policies are non-refundable once purchased. The premium is transferred to the liquidity pool at purchase time. You may choose not to renew when the policy expires.
                </Accordion>
                <Accordion question="How long does a payout take?">
                  Once a claim is approved on-chain, the payout happens in the same transaction — there is no waiting period. The funds are transferred from the liquidity pool to the policy holder immediately.
                </Accordion>
                <Accordion question="What happens if the pool doesn't have enough funds to pay a claim?">
                  The pool maintains a 150% collateralization ratio and caps new coverage at 80% pool utilization to protect solvency. In an extreme scenario where the pool is under-collateralized, partial payouts would be distributed proportionally.
                </Accordion>
                <Accordion question="Can I cover multiple protocols at once?">
                  Yes. Each policy covers one protocol, but you can purchase multiple policies — one per protocol you want to protect.
                </Accordion>
                <Accordion question="Is the code audited?">
                  The contracts are deployed on Polygon Mainnet and publicly verifiable on PolygonScan. A full third-party audit is planned. Always review the contract code before depositing significant funds.
                </Accordion>
                <Accordion question="How does the Risk Oracle work?">
                  The RiskOracle contract maintains a score (0–100) for each protocol. Scores are updated by the oracle admin based on on-chain data including TVL changes, governance activity, and exploit history. Higher scores = lower risk = lower premium.
                </Accordion>
              </Section>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default Docs;
