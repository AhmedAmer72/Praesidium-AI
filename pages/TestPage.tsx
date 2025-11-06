import React from 'react';
import TestWeb3 from '../components/TestWeb3';
import ContractTest from '../components/ContractTest';

const TestPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-4xl font-orbitron text-center mb-8">Integration Testing</h1>
      <ContractTest />
      <TestWeb3 />
    </div>
  );
};

export default TestPage;