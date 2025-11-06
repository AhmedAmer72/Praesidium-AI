const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x13B90C0563Aa98015793aC4e0F3F4379950b1208";
  
  // Check if contract exists
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const code = await provider.getCode(contractAddress);
  
  if (code === "0x") {
    console.log("❌ Contract not found at address");
    return;
  }
  
  console.log("✅ Contract found, code length:", code.length);
  
  // Try to interact with it
  const SimpleInsurance = await ethers.getContractFactory("SimpleInsurance");
  const contract = SimpleInsurance.attach(contractAddress);
  
  try {
    const policyCount = await contract.getPolicyCount();
    console.log("✅ Contract working! Policy count:", policyCount.toString());
  } catch (error) {
    console.log("❌ Contract call failed:", error.message);
  }
}

main().catch(console.error);