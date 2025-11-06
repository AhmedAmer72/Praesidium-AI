const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x4A6914e7A7AE6bb866bbcEFFCb710B175179AccD";
  const userAddress = "0xF011D5e43BBE01cCc7ab1f1E799e974691FD530b";
  
  const SimpleInsurance = await ethers.getContractFactory("SimpleInsurance");
  const contract = SimpleInsurance.attach(contractAddress);
  
  try {
    console.log("Testing contract functions...");
    
    // Test getPolicyCount
    const policyCount = await contract.getPolicyCount();
    console.log("Total policies:", policyCount.toString());
    
    // Test getHolderPolicies
    const holderPolicies = await contract.getHolderPolicies(userAddress);
    console.log("User policies:", holderPolicies);
    
    console.log("✅ Contract is working!");
    
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
  }
}

main().catch(console.error);