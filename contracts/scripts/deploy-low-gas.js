const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying PraesidiumInsurance with low gas...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MATIC");

  try {
    const PraesidiumInsurance = await ethers.getContractFactory("PraesidiumInsurance");
    
    // Deploy with minimal gas settings
    const insurance = await PraesidiumInsurance.deploy({
      gasLimit: 2000000,
      gasPrice: ethers.parseUnits("1", "gwei") // Very low gas price
    });
    
    console.log("Waiting for deployment...");
    await insurance.waitForDeployment();
    
    const address = await insurance.getAddress();
    console.log("✅ PraesidiumInsurance deployed to:", address);

    // Update contract addresses
    const addresses = {
      amoy: {
        PraesidiumInsurance: address,
        LiquidityPool: "0xe7146db1566EA71690D5eeC15AB754E005C72dAF",
        RiskOracle: "0x513CEae41D376d9eA0Dc305B0c382841FF80eD53"
      }
    };
    
    fs.writeFileSync('contractAddresses.json', JSON.stringify(addresses, null, 2));
    console.log("✅ Contract addresses updated!");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
  }
}

main().catch(console.error);