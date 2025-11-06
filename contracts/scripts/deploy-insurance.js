const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying PraesidiumInsurance contract...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MATIC");

  try {
    const PraesidiumInsurance = await ethers.getContractFactory("PraesidiumInsurance");
    const insurance = await PraesidiumInsurance.deploy({
      gasLimit: 3000000,
      gasPrice: ethers.parseUnits("30", "gwei")
    });
    
    await insurance.waitForDeployment();
    const insuranceAddress = await insurance.getAddress();
    console.log("✅ PraesidiumInsurance deployed:", insuranceAddress);

    // Update addresses
    const addresses = {
      amoy: {
        PraesidiumInsurance: insuranceAddress,
        LiquidityPool: "0xe7146db1566EA71690D5eeC15AB754E005C72dAF",
        RiskOracle: "0x513CEae41D376d9eA0Dc305B0c382841FF80eD53"
      }
    };
    
    fs.writeFileSync('contractAddresses.json', JSON.stringify(addresses, null, 2));
    console.log("✅ Contract address updated!");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
  }
}

main().catch(console.error);