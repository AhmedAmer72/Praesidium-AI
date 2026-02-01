const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Sequential Contract Deployment to Polygon Mainnet\n");
  
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "POL\n");
  
  const addresses = {};
  
  // Deploy each contract one at a time with verification
  
  // ============= 1. RiskOracle =============
  console.log("=" .repeat(50));
  console.log("1️⃣  DEPLOYING RiskOracle");
  console.log("=" .repeat(50));
  
  const RiskOracle = await ethers.getContractFactory("RiskOracle");
  console.log("Contract factory created");
  console.log("Bytecode length:", RiskOracle.bytecode.length);
  
  const riskOracle = await RiskOracle.deploy();
  console.log("Transaction hash:", riskOracle.deploymentTransaction()?.hash);
  console.log("Waiting for deployment...");
  
  await riskOracle.waitForDeployment();
  addresses.RiskOracle = await riskOracle.getAddress();
  console.log("✅ RiskOracle deployed at:", addresses.RiskOracle);
  
  // Verify bytecode on chain
  const roBytecode = await ethers.provider.getCode(addresses.RiskOracle);
  console.log("On-chain bytecode length:", roBytecode.length);
  console.log();
  
  // Wait a bit between deployments
  await new Promise(r => setTimeout(r, 3000));
  
  // ============= 2. LiquidityPool =============
  console.log("=" .repeat(50));
  console.log("2️⃣  DEPLOYING LiquidityPool");
  console.log("=" .repeat(50));
  
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  console.log("Contract factory created");
  console.log("Bytecode length:", LiquidityPool.bytecode.length);
  
  const liquidityPool = await LiquidityPool.deploy();
  console.log("Transaction hash:", liquidityPool.deploymentTransaction()?.hash);
  console.log("Waiting for deployment...");
  
  await liquidityPool.waitForDeployment();
  addresses.LiquidityPool = await liquidityPool.getAddress();
  console.log("✅ LiquidityPool deployed at:", addresses.LiquidityPool);
  
  // Verify bytecode on chain
  const lpBytecode = await ethers.provider.getCode(addresses.LiquidityPool);
  console.log("On-chain bytecode length:", lpBytecode.length);
  console.log();
  
  // Wait a bit between deployments
  await new Promise(r => setTimeout(r, 3000));
  
  // ============= 3. PraesidiumInsuranceV2 =============
  console.log("=" .repeat(50));
  console.log("3️⃣  DEPLOYING PraesidiumInsuranceV2");
  console.log("=" .repeat(50));
  
  const Insurance = await ethers.getContractFactory("PraesidiumInsuranceV2");
  console.log("Contract factory created");
  console.log("Bytecode length:", Insurance.bytecode.length);
  
  const insurance = await Insurance.deploy();
  console.log("Transaction hash:", insurance.deploymentTransaction()?.hash);
  console.log("Waiting for deployment...");
  
  await insurance.waitForDeployment();
  addresses.PraesidiumInsuranceV2 = await insurance.getAddress();
  console.log("✅ PraesidiumInsuranceV2 deployed at:", addresses.PraesidiumInsuranceV2);
  
  // Verify bytecode on chain
  const insBytecode = await ethers.provider.getCode(addresses.PraesidiumInsuranceV2);
  console.log("On-chain bytecode length:", insBytecode.length);
  console.log();
  
  // ============= Save Results =============
  console.log("=" .repeat(50));
  console.log("📄 SAVING ADDRESSES");
  console.log("=" .repeat(50));
  
  const addressFile = path.join(__dirname, "..", "contractAddresses.json");
  const existing = JSON.parse(fs.readFileSync(addressFile, "utf8"));
  existing.polygon = addresses;
  fs.writeFileSync(addressFile, JSON.stringify(existing, null, 2));
  console.log("Saved to contractAddresses.json");
  
  // ============= Final Summary =============
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  const spent = balance - finalBalance;
  
  console.log("\n" + "=" .repeat(50));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(50));
  console.log("RiskOracle:           ", addresses.RiskOracle);
  console.log("LiquidityPool:        ", addresses.LiquidityPool);
  console.log("PraesidiumInsuranceV2:", addresses.PraesidiumInsuranceV2);
  console.log("\nGas spent:", ethers.formatEther(spent), "POL");
  console.log("Remaining:", ethers.formatEther(finalBalance), "POL");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  });
