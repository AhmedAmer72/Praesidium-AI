
import React from 'react';
import { motion } from 'framer-motion';
import ConnectWallet from '../ConnectWallet';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 50 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-dark-card/50 backdrop-blur-lg border-b border-gray-800"
    >
      <Link to="/" className="flex items-center space-x-3">
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 10,
            ease: 'linear',
            repeat: Infinity,
          }}
          className="w-10 h-10 bg-gradient-to-br from-glow-purple to-glow-blue rounded-full flex items-center justify-center"
        >
            <div className="w-6 h-6 bg-dark-bg rounded-full flex items-center justify-center">
                 <div className="w-2 h-2 bg-glow-blue rounded-full"></div>
            </div>
        </motion.div>
        <h1 className="text-2xl font-orbitron tracking-wider text-white">PRAESIDIUM</h1>
      </Link>
      <div className="flex items-center space-x-4">
        <ConnectWallet />
      </div>
    </motion.header>
  );
};

export default Header;
