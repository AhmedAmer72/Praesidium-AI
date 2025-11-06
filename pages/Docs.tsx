import React from 'react';
import { motion } from 'framer-motion';
import { DOC_CONTENT } from '../constants';
import { FiLogIn, FiSearch, FiSettings, FiShoppingCart, FiAward, FiZap } from 'react-icons/fi';

const icons: { [key: string]: React.ReactElement } = {
  "Step 1": <FiLogIn size={24} className="text-glow-blue" />,
  "Step 2": <FiSearch size={24} className="text-glow-blue" />,
  "Step 3": <FiSettings size={24} className="text-glow-blue" />,
  "Step 4": <FiShoppingCart size={24} className="text-glow-blue" />,
  "Step 5": <FiAward size={24} className="text-glow-blue" />,
  "Step 6": <FiZap size={24} className="text-glow-blue" />,
};

const Docs = () => {
  const steps = DOC_CONTENT.split('\n\n').map(step => {
    const [title, ...content] = step.split('\n');
    return { title, content: content.join('\n') };
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="p-8 text-white"
    >
      <h1 className="text-4xl font-bold mb-8 font-orbitron text-center">How It Works</h1>
      <motion.div
        className="max-w-4xl mx-auto grid gap-8 md:grid-cols-1"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {steps.map((step, index) => (
          <motion.div
            key={index}
            className="bg-dark-card border border-gray-800 p-6 rounded-lg shadow-lg flex items-start space-x-4"
            variants={itemVariants}
          >
            <div className="flex-shrink-0">
              {icons[step.title.split(':')[0]]}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2 font-orbitron text-glow-purple">{step.title}</h2>
              <p className="text-gray-300 whitespace-pre-line">{step.content}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Docs;