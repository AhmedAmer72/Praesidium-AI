
import React from 'react';
import { motion } from 'framer-motion';
// FIX: Import AnimatedCounter to use it in the component.
import AnimatedCounter from './AnimatedCounter';

interface GaugeProps {
  value: number; // 0-100
  label: string;
}

const Gauge: React.FC<GaugeProps> = ({ value, label }) => {
  const circumference = 2 * Math.PI * 45; // 2 * PI * radius
  const offset = circumference - (value / 100) * circumference;

  const getColor = (val: number) => {
    if (val > 80) return '#4ade80'; // green-400
    if (val > 60) return '#facc15'; // yellow-400
    return '#f87171'; // red-400
  };

  const color = getColor(value);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#374151" // gray-700
          strokeWidth="10"
          fill="transparent"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke={color}
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-orbitron" style={{ color }}>
          <AnimatedCounter to={value} />
        </span>
        <span className="text-sm font-semibold text-gray-400 mt-1">{label}</span>
      </div>
    </div>
  );
};

export default Gauge;