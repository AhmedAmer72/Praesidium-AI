const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 RELIABLE MAINNET DEPLOYMENT\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "POL\n");
  
  const addressFile = path.join(__dirname, "..", "contractAddresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressFile, "utf8"));
  
  if (!addresses.polygon) {
    addresses.polygon = {};
  }
  
  // Deploy with explicit gas settings for reliability
  const gasSettings = {
    gasLimit: 3000000,
  };
  
  // 1. RiskOracle
  if (!addresses.polygon.RiskOracle) {
    console.log("1️⃣  Deploying RiskOracle...");
    const RiskOracle = await ethers.getContractFactory("RiskOracle");
    const oracle = await RiskOracle.deploy(gasSettings);
    await oracle.waitForDeployment();
    addresses.polygon.RiskOracle = await oracle.getAddress();
    console.log("   ✅ RiskOracle:", addresses.polygon.RiskOracle);
    fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
  } else {
    console.log("1️⃣  RiskOracle already deployed:", addresses.polygon.RiskOracle);
  }
  
  // 2. LiquidityPool
  if (!addresses.polygon.LiquidityPool) {
    console.log("2️⃣  Deploying LiquidityPool...");
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const pool = await LiquidityPool.deploy(gasSettings);
    await pool.waitForDeployment();
    addresses.polygon.LiquidityPool = await pool.getAddress();
    console.log("   ✅ LiquidityPool:", addresses.polygon.LiquidityPool);
    fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
  } else {
    console.log("2️⃣  LiquidityPool already deployed:", addresses.polygon.LiquidityPool);
  }
  
  // 3. PraesidiumInsuranceV2
  if (!addresses.polygon.PraesidiumInsuranceV2) {
    console.log("3️⃣  Deploying PraesidiumInsuranceV2...");
    const Insurance = await ethers.getContractFactory("PraesidiumInsuranceV2");
    const insurance = await Insurance.deploy(gasSettings);
    await insurance.waitForDeployment();
    addresses.polygon.PraesidiumInsuranceV2 = await insurance.getAddress();
    console.log("   ✅ PraesidiumInsuranceV2:", addresses.polygon.PraesidiumInsuranceV2);
    fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
  } else {
    console.log("3️⃣  PraesidiumInsuranceV2 already deployed:", addresses.polygon.PraesidiumInsuranceV2);
  }
  
  // Final balance
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  const spent = balance - finalBalance;
  
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nPolygon Mainnet Contracts:");
  console.log("  RiskOracle:           ", addresses.polygon.RiskOracle);
  console.log("  LiquidityPool:        ", addresses.polygon.LiquidityPool);
  console.log("  PraesidiumInsuranceV2:", addresses.polygon.PraesidiumInsuranceV2);
  console.log("\nDeployment cost:", ethers.formatEther(spent), "POL");
  console.log("Remaining balance:", ethers.formatEther(finalBalance), "POL");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });