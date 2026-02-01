const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 MAINNET DEPLOYMENT - Praesidium AI Contracts\n");
  console.log("⚠️  WARNING: This will deploy to POLYGON MAINNET with REAL funds!\n");
  
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "POL");
  console.log("(Note: RPC may show stale balance, PolygonScan shows 35.96 POL)\n");
  
  // Confirm deployment
  console.log("Deploying contracts in 3 seconds... Press Ctrl+C to cancel.\n");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const addresses = { polygon: {} };
  
  // 1. Deploy RiskOracle
  console.log("1️⃣  Deploying RiskOracle...");
  const RiskOracle = await ethers.getContractFactory("RiskOracle");
  const riskOracle = await RiskOracle.deploy();
  await riskOracle.waitForDeployment();
  addresses.polygon.RiskOracle = await riskOracle.getAddress();
  // Verify bytecode
  const oracleCode = await ethers.provider.getCode(addresses.polygon.RiskOracle);
  console.log("   ✅ RiskOracle:", addresses.polygon.RiskOracle, "(bytecode:", oracleCode.length, ", expected ~2990)");
  
  // Wait between deployments
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 2. Deploy SimpleLiquidityPool
  console.log("2️⃣  Deploying SimpleLiquidityPool...");
  const SimpleLiquidityPool = await ethers.getContractFactory("SimpleLiquidityPool");
  const liquidityPool = await SimpleLiquidityPool.deploy();
  await liquidityPool.waitForDeployment();
  addresses.polygon.LiquidityPool = await liquidityPool.getAddress();
  // Verify bytecode
  const poolCode = await ethers.provider.getCode(addresses.polygon.LiquidityPool);
  console.log("   ✅ SimpleLiquidityPool:", addresses.polygon.LiquidityPool, "(bytecode:", poolCode.length, ", expected ~2748)");
  
  // Wait between deployments
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 3. Deploy PraesidiumInsuranceV2
  console.log("3️⃣  Deploying PraesidiumInsuranceV2...");
  const Insurance = await ethers.getContractFactory("PraesidiumInsuranceV2");
  const insurance = await Insurance.deploy();
  await insurance.waitForDeployment();
  addresses.polygon.PraesidiumInsuranceV2 = await insurance.getAddress();
  // Verify bytecode
  const insCode = await ethers.provider.getCode(addresses.polygon.PraesidiumInsuranceV2);
  console.log("   ✅ PraesidiumInsuranceV2:", addresses.polygon.PraesidiumInsuranceV2, "(bytecode:", insCode.length, ", expected ~17906)");
  
  // Save addresses
  const addressFile = path.join(__dirname, "..", "contractAddresses.json");
  const existingAddresses = JSON.parse(fs.readFileSync(addressFile, "utf8"));
  existingAddresses.polygon = addresses.polygon;
  fs.writeFileSync(addressFile, JSON.stringify(existingAddresses, null, 2));
  
  console.log("\n📄 Contract Addresses saved to contractAddresses.json");
  
  // Final balance
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  const spent = balance - finalBalance;
  console.log("\n💰 Deployment cost:", ethers.formatEther(spent), "MATIC");
  console.log("   Remaining balance:", ethers.formatEther(finalBalance), "MATIC");
  
  console.log("\n" + "=".repeat(60));
  console.log("🎉 MAINNET DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log("  RiskOracle:           ", addresses.polygon.RiskOracle);
  console.log("  LiquidityPool:        ", addresses.polygon.LiquidityPool);
  console.log("  PraesidiumInsuranceV2:", addresses.polygon.PraesidiumInsuranceV2);
  
  console.log("\n📝 Next Steps:");
  console.log("  1. Verify contracts on PolygonScan:");
  console.log(`     npx hardhat verify --network polygon ${addresses.polygon.RiskOracle}`);
  console.log(`     npx hardhat verify --network polygon ${addresses.polygon.LiquidityPool}`);
  console.log(`     npx hardhat verify --network polygon ${addresses.polygon.PraesidiumInsuranceV2}`);
  console.log("  2. Update frontend .env with new addresses");
  console.log("  3. Update constants.ts to use polygon network");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  });
