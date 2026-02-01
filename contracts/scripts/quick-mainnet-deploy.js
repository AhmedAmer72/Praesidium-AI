const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Quick Mainnet Deployment\n");
  
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "POL\n");
  
  // Get current gas price
  const feeData = await ethers.provider.getFeeData();
  console.log("Gas Price:", ethers.formatUnits(feeData.gasPrice || 0n, "gwei"), "gwei\n");
  
  const addresses = { polygon: {} };
  
  // Gas options - use minimal gas for cheaper deployment
  const gasOptions = {
    gasLimit: 2000000
    // Let the network determine gas price automatically
  };
  
  try {
    // 1. Deploy RiskOracle
    console.log("1️⃣  Deploying RiskOracle...");
    const RiskOracle = await ethers.getContractFactory("RiskOracle");
    const riskOracle = await RiskOracle.deploy(gasOptions);
    console.log("   Transaction sent:", riskOracle.deploymentTransaction()?.hash);
    await riskOracle.waitForDeployment();
    addresses.polygon.RiskOracle = await riskOracle.getAddress();
    console.log("   ✅ RiskOracle:", addresses.polygon.RiskOracle);
    
    // 2. Deploy LiquidityPool
    console.log("2️⃣  Deploying LiquidityPool...");
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const liquidityPool = await LiquidityPool.deploy(gasOptions);
    console.log("   Transaction sent:", liquidityPool.deploymentTransaction()?.hash);
    await liquidityPool.waitForDeployment();
    addresses.polygon.LiquidityPool = await liquidityPool.getAddress();
    console.log("   ✅ LiquidityPool:", addresses.polygon.LiquidityPool);
    
    // 3. Deploy PraesidiumInsuranceV2
    console.log("3️⃣  Deploying PraesidiumInsuranceV2...");
    const Insurance = await ethers.getContractFactory("PraesidiumInsuranceV2");
    const insurance = await Insurance.deploy(gasOptions);
    console.log("   Transaction sent:", insurance.deploymentTransaction()?.hash);
    await insurance.waitForDeployment();
    addresses.polygon.PraesidiumInsuranceV2 = await insurance.getAddress();
    console.log("   ✅ PraesidiumInsuranceV2:", addresses.polygon.PraesidiumInsuranceV2);
    
    // Save addresses
    const addressFile = path.join(__dirname, "..", "contractAddresses.json");
    const existingAddresses = JSON.parse(fs.readFileSync(addressFile, "utf8"));
    existingAddresses.polygon = addresses.polygon;
    fs.writeFileSync(addressFile, JSON.stringify(existingAddresses, null, 2));
    
    console.log("\n📄 Addresses saved to contractAddresses.json");
    console.log("\n✅ DEPLOYMENT COMPLETE!");
    console.log("RiskOracle:", addresses.polygon.RiskOracle);
    console.log("LiquidityPool:", addresses.polygon.LiquidityPool);
    console.log("PraesidiumInsuranceV2:", addresses.polygon.PraesidiumInsuranceV2);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (addresses.polygon.RiskOracle) {
      console.log("Partial deployment - RiskOracle:", addresses.polygon.RiskOracle);
    }
    if (addresses.polygon.LiquidityPool) {
      console.log("Partial deployment - LiquidityPool:", addresses.polygon.LiquidityPool);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
