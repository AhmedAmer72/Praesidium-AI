const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xBE94Ea21e057c948DfDdF25347A0527f8f8819c0";
  
  console.log("Checking contract at:", contractAddress);
  
  // Check if contract exists
  const provider = ethers.provider;
  const code = await provider.getCode(contractAddress);
  
  if (code === "0x") {
    console.log("❌ No contract deployed at this address!");
    return;
  }
  
  console.log("✅ Contract exists! Code length:", code.length);
  
  // Try to interact with it
  const abi = [
    "function getPolicyCount() external view returns (uint256)",
    "function totalPremiums() external view returns (uint256)",
    "function totalCoverage() external view returns (uint256)"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  try {
    const policyCount = await contract.getPolicyCount();
    console.log("Policy count:", policyCount.toString());
    
    const totalPremiums = await contract.totalPremiums();
    console.log("Total premiums:", ethers.formatEther(totalPremiums), "ETH");
    
    const totalCoverage = await contract.totalCoverage();
    console.log("Total coverage:", ethers.formatEther(totalCoverage), "ETH");
  } catch (error) {
    console.log("❌ Error calling contract:", error.message);
  }
}

main().catch(console.error);
