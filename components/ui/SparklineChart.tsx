
import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface SparklineChartProps {
  data: { date: string; value: number }[];
  color?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card/80 p-2 rounded-md border border-gray-700 text-xs">
        <p className="font-bold text-white">{`$${payload[0].value.toLocaleString()}M`}</p>
        <p className="text-gray-400">{label}</p>
      </div>
    );
  }
  return null;
};


const SparklineChart: React.FC<SparklineChartProps> = ({ data, color = '#3b82f6' }) => {
  return (
    <div style={{ width: '100%', height: 60 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SparklineChart;
