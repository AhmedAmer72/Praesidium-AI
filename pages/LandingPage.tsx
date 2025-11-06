
import React from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiTrendingUp, FiLayers } from 'react-icons/fi';
import Card from '../components/ui/Card';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

const StatCard = ({ icon, value, label, format }: { icon: React.ReactElement; value: number; label: string; format?: (v:number) => string; }) => (
  <Card className="text-center p-8">
    <div className="text-glow-purple mx-auto text-4xl mb-4">{icon}</div>
    <div className="text-4xl font-orbitron text-white">
      <AnimatedCounter to={value} format={format} />
    </div>
    <p className="text-gray-400 mt-2">{label}</p>
  </Card>
);

const LandingPage = () => {
  return (
    <div className="space-y-32">
      {/* Hero Section */}
      <section className="relative h-screen -mt-20 flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary via-purple-500 to-brand-secondary animate-gradient-bg bg-[length:200%_200%]"></div>
        <div className="absolute inset-0 bg-dark-bg/60 backdrop-blur-sm"></div>
        {/* Particle effect */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
              }}
              animate={{
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'linear',
              }}
            />
          ))}
        </div>
        <div className="relative z-10 px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-orbitron font-bold text-white tracking-wider"
          >
            Praesidium AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-4 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto"
          >
            AI-Powered Parametric Insurance for the Polygon Ecosystem.
            <br />
            Secure your DeFi assets with real-time risk assessment and automated claims.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8"
          >
            <Link to="/marketplace">
              <Button size="large" className="text-lg px-8 py-3">
                Explore Marketplace
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4">
         <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-3 gap-8"
        >
          <StatCard icon={<FiShield />} value={1.2} label="Billion TVL Covered" format={(v) => `$${v.toFixed(1)}B`} />
          <StatCard icon={<FiLayers />} value={25} label="Protocols Secured" />
          <StatCard icon={<FiTrendingUp />} value={5.7} label="Million in Claims Paid" format={(v) => `$${v.toFixed(1)}M`} />
        </motion.div>
      </section>

      <section className="text-center py-20 container mx-auto px-4">
        <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-orbitron font-bold mb-4">How It Works</motion.h2>
        <motion.p 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-gray-400 max-w-3xl mx-auto mb-12">
            Praesidium AI continuously monitors DeFi protocols, using AI to generate a real-time risk score. Based on this score, we offer parametric insurance with dynamic premiums. When a trigger event occurs, claims are paid out automatically.
        </motion.p>
      </section>
    </div>
  );
};

export default LandingPage;
