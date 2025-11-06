
import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  disableHover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', disableHover = false }) => {
  const cardVariants = {
    rest: { scale: 1, boxShadow: '0px 10px 30px rgba(0,0,0,0.1)' },
    hover: { scale: 1.03, boxShadow: '0px 20px 40px rgba(106, 17, 203, 0.3)' }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="rest"
      whileHover={!disableHover ? "hover" : ""}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`bg-dark-card/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 shadow-2xl shadow-black/20 overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;
