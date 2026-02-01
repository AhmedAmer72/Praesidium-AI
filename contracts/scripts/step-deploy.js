const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Mainnet Deployment - Sequential\n");
  
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "POL\n");
  
  const addressFile = path.join(__dirname, "..", "contractAddresses.json");
  let addresses;
  try {
    addresses = JSON.parse(fs.readFileSync(addressFile, "utf8"));
  } catch {
    addresses = { amoy: {}, polygon: {} };
  }
  if (!addresses.polygon) addresses.polygon = {};

  // Check what's already deployed
  const step = process.env.DEPLOY_STEP || "1";
  
  if (step === "1") {
    console.log("Step 1: Deploying RiskOracle...");
    const RiskOracle = await ethers.getContractFactory("RiskOracle");
    const riskOracle = await RiskOracle.deploy();
    const txHash = riskOracle.deploymentTransaction()?.hash;
    console.log("TX:", txHash);
    console.log("Waiting for confirmation...");
    await riskOracle.waitForDeployment();
    addresses.polygon.RiskOracle = await riskOracle.getAddress();
    console.log("✅ RiskOracle:", addresses.polygon.RiskOracle);
    fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
    console.log("\nRun again with DEPLOY_STEP=2 to deploy LiquidityPool");
  }
  else if (step === "2") {
    console.log("Step 2: Deploying LiquidityPool...");
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const liquidityPool = await LiquidityPool.deploy();
    const txHash = liquidityPool.deploymentTransaction()?.hash;
    console.log("TX:", txHash);
    console.log("Waiting for confirmation...");
    await liquidityPool.waitForDeployment();
    addresses.polygon.LiquidityPool = await liquidityPool.getAddress();
    console.log("✅ LiquidityPool:", addresses.polygon.LiquidityPool);
    fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
    console.log("\nRun again with DEPLOY_STEP=3 to deploy Insurance");
  }
  else if (step === "3") {
    console.log("Step 3: Deploying PraesidiumInsuranceV2...");
    const Insurance = await ethers.getContractFactory("PraesidiumInsuranceV2");
    const insurance = await Insurance.deploy();
    const txHash = insurance.deploymentTransaction()?.hash;
    console.log("TX:", txHash);
    console.log("Waiting for confirmation...");
    await insurance.waitForDeployment();
    addresses.polygon.PraesidiumInsuranceV2 = await insurance.getAddress();
    console.log("✅ PraesidiumInsuranceV2:", addresses.polygon.PraesidiumInsuranceV2);
    fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("RiskOracle:", addresses.polygon.RiskOracle);
    console.log("LiquidityPool:", addresses.polygon.LiquidityPool);
    console.log("PraesidiumInsuranceV2:", addresses.polygon.PraesidiumInsuranceV2);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
