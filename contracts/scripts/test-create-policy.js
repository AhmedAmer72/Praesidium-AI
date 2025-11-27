const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xBE94Ea21e057c948DfDdF25347A0527f8f8819c0";
  
  console.log("Testing createPolicy on:", contractAddress);
  
  const abi = [
    "function createPolicy(address holder, uint256 premium, uint256 coverage, uint256 duration, string memory protocol) external payable returns (uint256)"
  ];
  
  const provider = ethers.provider;
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  // Test parameters
  const holder = "0xf011d5e43bbe01ccc7ab1f1e799e974691fd530b";
  const premium = ethers.parseEther("0.001"); // Small test amount
  const coverage = ethers.parseEther("0.01");
  const duration = 365 * 24 * 60 * 60; // 1 year
  const protocol = "Aave";
  
  try {
    // Try to estimate gas
    const gasEstimate = await contract.createPolicy.estimateGas(
      holder,
      premium,
      coverage,
      duration,
      protocol,
      { value: premium }
    );
    console.log("✅ Gas estimate:", gasEstimate.toString());
  } catch (error) {
    console.log("❌ Error estimating gas:", error.message);
    
    // Try to get more details
    if (error.data) {
      console.log("Error data:", error.data);
    }
  }
}

main().catch(console.error);
