
import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className = 'h-4' }) => {
  return (
    <div className={`bg-gray-700/50 rounded-md animate-pulse ${className}`}></div>
  );
};

export default SkeletonLoader;
