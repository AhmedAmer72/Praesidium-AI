const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Starting reliable deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MATIC");
  
  if (parseFloat(ethers.formatEther(balance)) < 0.01) {
    console.log("❌ Insufficient balance for deployment");
    return;
  }

  try {
    // Deploy RiskOracle with gas settings
    console.log("\n📋 Deploying RiskOracle...");
    const RiskOracle = await ethers.getContractFactory("RiskOracle");
    const riskOracle = await RiskOracle.deploy({
      gasLimit: 2000000,
      gasPrice: ethers.parseUnits("30", "gwei")
    });
    
    await riskOracle.waitForDeployment();
    const riskOracleAddress = await riskOracle.getAddress();
    console.log("✅ RiskOracle deployed:", riskOracleAddress);

    // Verify deployment
    const code = await ethers.provider.getCode(riskOracleAddress);
    console.log("Contract code length:", code.length);
    
    // Save address
    const addresses = {
      amoy: {
        PraesidiumInsurance: riskOracleAddress, // Using same for now
        LiquidityPool: "",
        RiskOracle: riskOracleAddress
      }
    };
    
    fs.writeFileSync('contractAddresses.json', JSON.stringify(addresses, null, 2));
    console.log("✅ Addresses saved to contractAddresses.json");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
  }
}

main().catch(console.error);