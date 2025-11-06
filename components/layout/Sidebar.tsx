
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLayout, FiGrid, FiBarChart2, FiShield, FiChevronsLeft, FiChevronsRight, FiHome, FiBookOpen } from 'react-icons/fi';

const navItems = [
  { name: 'Home', path: '/', icon: FiHome },
  { name: 'Dashboard', path: '/dashboard', icon: FiLayout },
  { name: 'Marketplace', path: '/marketplace', icon: FiGrid },
  { name: 'Liquidity', path: '/liquidity', icon: FiBarChart2 },
  { name: 'Docs', path: '/docs', icon: FiBookOpen },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const sidebarVariants = {
    open: { width: '16rem' },
    closed: { width: '5rem' },
  };

  const textVariants = {
    open: { opacity: 1, x: 0, display: 'inline' },
    closed: { opacity: 0, x: -10, transitionEnd: { display: 'none' } },
  };
  
  const linkHover = {
    scale: 1.05,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#60A5FA',
    transition: { duration: 0.2 },
  }

  return (
    <motion.nav
      variants={sidebarVariants}
      animate={isOpen ? 'open' : 'closed'}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full bg-dark-card/30 backdrop-blur-sm flex flex-col justify-between border-r border-gray-800"
    >
      <div>
        <div className={`flex items-center ${isOpen ? 'justify-end' : 'justify-center'} p-4 h-[69px] border-b border-gray-800`}>
             <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-800 transition-colors">
                 {isOpen ? <FiChevronsLeft size={20} /> : <FiChevronsRight size={20} />}
             </button>
        </div>
        <ul className="flex flex-col p-2 space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink to={item.path} 
                className={({ isActive }) => `flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-glow-blue/20 text-blue-300' : 'text-gray-400 hover:bg-gray-800'}`}
              >
                  {({ isActive }) => (
                     <motion.div
                       whileHover={!isActive ? linkHover : {}}
                       className="flex items-center w-full"
                     >
                       <item.icon size={24} className="flex-shrink-0" />
                       <AnimatePresence>
                         {isOpen && (
                           <motion.span
                             variants={textVariants}
                             initial="closed"
                             animate="open"
                             exit="closed"
                             transition={{ duration: 0.2, delay: 0.1 }}
                             className="ml-4 font-semibold whitespace-nowrap"
                           >
                             {item.name}
                           </motion.span>
                         )}
                       </AnimatePresence>
                     </motion.div>
                   )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </motion.nav>
  );
};

export default Sidebar;
