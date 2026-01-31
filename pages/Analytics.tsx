import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiDollarSign, FiShield, FiTrendingUp, FiPieChart, 
  FiActivity, FiUsers, FiPercent, FiAlertTriangle,
  FiRefreshCw
} from 'react-icons/fi';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { useProtocolMetrics } from '../hooks/useProtocolMetrics';
import { usePoolAPY } from '../hooks/usePoolAPY';
import { usePriceOracle } from '../hooks/usePriceOracle';

const COLORS = ['#00D4AA', '#4F46E5', '#F59E0B', '#EF4444', '#8B5CF6'];

const Analytics: React.FC = () => {
  const { metrics, loading, error, refetch } = useProtocolMetrics();
  const { currentAPY, sevenDayAPY, utilizationRate } = usePoolAPY();
  const { ethUsdPrice } = usePriceOracle();

  // Mock historical data for charts
  const tvlHistory = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: Math.max(0, metrics.tvl * (0.7 + Math.random() * 0.6) + i * (metrics.tvl / 100)),
  }));

  const premiumHistory = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
    premiums: Math.random() * metrics.totalPremiums / 6 + metrics.totalPremiums / 12,
    claims: Math.random() * metrics.totalClaimsPaid / 6,
  }));

  const riskDistribution = [
    { name: 'Low Risk', value: 45, color: '#00D4AA' },
    { name: 'Medium Risk', value: 35, color: '#F59E0B' },
    { name: 'High Risk', value: 20, color: '#EF4444' },
  ];

  const protocolDistribution = [
    { name: 'Aave', value: 30 },
    { name: 'Compound', value: 25 },
    { name: 'Uniswap', value: 20 },
    { name: 'Curve', value: 15 },
    { name: 'Others', value: 10 },
  ];

  const MetricCard: React.FC<{
    title: string;
    value: number;
    prefix?: string;
    suffix?: string;
    icon: React.ReactNode;
    change?: number;
    color?: string;
  }> = ({ title, value, prefix = '', suffix = '', icon, change, color = 'text-primary-400' }) => (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {prefix}<AnimatedCounter value={value} decimals={2} />{suffix}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs last week
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-dark-700 ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Protocol Analytics</h1>
          <p className="text-gray-400 mt-1">Real-time metrics and performance data</p>
        </div>
        <Button
          variant="secondary"
          onClick={refetch}
          disabled={loading}
        >
          <span className="flex items-center gap-2">
            <span className={loading ? 'animate-spin inline-block' : ''}>
              <FiRefreshCw />
            </span>
            Refresh
          </span>
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
            <FiAlertTriangle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Value Locked"
          value={metrics.tvl * ethUsdPrice}
          prefix="$"
          icon={<FiDollarSign size={24} />}
          change={5.2}
          color="text-primary-400"
        />
        <MetricCard
          title="Total Premiums Collected"
          value={metrics.totalPremiums * ethUsdPrice}
          prefix="$"
          icon={<FiTrendingUp size={24} />}
          change={12.3}
          color="text-green-400"
        />
        <MetricCard
          title="Active Policies"
          value={metrics.activePolicies}
          icon={<FiShield size={24} />}
          change={8.1}
          color="text-blue-400"
        />
        <MetricCard
          title="Current APY"
          value={currentAPY}
          suffix="%"
          icon={<FiPercent size={24} />}
          color="text-yellow-400"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Claims Paid"
          value={metrics.totalClaimsPaid * ethUsdPrice}
          prefix="$"
          icon={<FiActivity size={24} />}
          color="text-red-400"
        />
        <MetricCard
          title="Loss Ratio"
          value={metrics.lossRatio}
          suffix="%"
          icon={<FiPieChart size={24} />}
          color={metrics.lossRatio < 50 ? 'text-green-400' : metrics.lossRatio < 80 ? 'text-yellow-400' : 'text-red-400'}
        />
        <MetricCard
          title="Capital Efficiency"
          value={metrics.capitalEfficiency}
          suffix="%"
          icon={<FiUsers size={24} />}
          color="text-purple-400"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TVL Chart */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">TVL History (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tvlHistory}>
                <defs>
                  <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#9CA3AF' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'TVL']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00D4AA"
                  fill="url(#tvlGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Premium vs Claims Chart */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Premiums vs Claims</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={premiumHistory}>
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Legend />
                <Bar dataKey="premiums" name="Premiums" fill="#00D4AA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="claims" name="Claims" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Risk Distribution */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Coverage by Risk Level</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Protocol Distribution */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Coverage by Protocol</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocolDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {protocolDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Pool Stats */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Liquidity Pool Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-400 text-sm">Pool Balance</p>
            <p className="text-2xl font-bold text-white">
              {metrics.poolBalance.toFixed(4)} POL
            </p>
            <p className="text-gray-500 text-sm">
              ${(metrics.poolBalance * ethUsdPrice).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Deposits</p>
            <p className="text-2xl font-bold text-green-400">
              {metrics.totalLPDeposits.toFixed(4)} POL
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">7-Day APY</p>
            <p className="text-2xl font-bold text-yellow-400">
              {sevenDayAPY.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Utilization Rate</p>
            <p className="text-2xl font-bold text-blue-400">
              {utilizationRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
