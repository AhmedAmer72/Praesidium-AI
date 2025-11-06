
import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
  icon?: React.ReactElement;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', icon, ...props }) => {
  const baseClasses = 'px-6 py-2 rounded-full font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg flex items-center justify-center space-x-2';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-glow-purple/20 hover:shadow-glow-purple/40 focus:ring-glow-purple',
    secondary: 'bg-dark-card border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-glow-blue focus:ring-glow-blue',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && React.cloneElement(icon, { className: "w-5 h-5" })}
      <span>{children}</span>
    </motion.button>
  );
};

export default Button;
