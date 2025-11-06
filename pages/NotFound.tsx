
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { FiAlertTriangle } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
      <FiAlertTriangle className="text-glow-purple text-6xl mb-4" />
      <h1 className="text-6xl font-orbitron font-bold">404</h1>
      <p className="text-xl text-gray-400 mt-2 mb-8">Page Not Found</p>
      <Link to="/">
        <Button>Go to Home</Button>
      </Link>
    </div>
  );
};

export default NotFound;
