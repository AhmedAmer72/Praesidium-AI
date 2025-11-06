const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Deploying Praesidium contracts...");
  const network = "amoy";
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  try {
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "MATIC");
  } catch (error) {
    console.log("Could not fetch balance, continuing...");
  }

  // Deploy RiskOracle
  console.log("\n1. Deploying RiskOracle...");
  const RiskOracle = await ethers.getContractFactory("RiskOracle");
  console.log("   Contract factory created");
  const riskOracle = await RiskOracle.deploy();
  console.log("   Deploy transaction sent, waiting for confirmation...");
  await riskOracle.waitForDeployment();
  const riskOracleAddress = await riskOracle.getAddress();
  console.log("   ✅ RiskOracle deployed to:", riskOracleAddress);

  // Deploy LiquidityPool
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy();
  await liquidityPool.waitForDeployment();
  const liquidityPoolAddress = await liquidityPool.getAddress();
  console.log("LiquidityPool deployed to:", liquidityPoolAddress);

  // Deploy PraesidiumInsurance
  const PraesidiumInsurance = await ethers.getContractFactory("PraesidiumInsurance");
  const insurance = await PraesidiumInsurance.deploy();
  await insurance.waitForDeployment();
  const insuranceAddress = await insurance.getAddress();
  console.log("PraesidiumInsurance deployed to:", insuranceAddress);

  // Initialize with sample data
  await riskOracle.updateRisk("Uniswap", 25);
  await riskOracle.updateRisk("Aave", 30);
  await riskOracle.updateRisk("Compound", 35);
  console.log("Sample risk scores initialized");

  // Save addresses to file
  const addresses = {
    [network]: {
      PraesidiumInsurance: insuranceAddress,
      LiquidityPool: liquidityPoolAddress,
      RiskOracle: riskOracleAddress
    }
  };

  let existingAddresses = {};
  try {
    existingAddresses = JSON.parse(fs.readFileSync('contractAddresses.json', 'utf8'));
  } catch (e) {}

  const updatedAddresses = { ...existingAddresses, ...addresses };
  fs.writeFileSync('contractAddresses.json', JSON.stringify(updatedAddresses, null, 2));

  console.log("\nDeployment completed!");
  console.log("Contract addresses saved to contractAddresses.json");
  console.log("- RiskOracle:", riskOracleAddress);
  console.log("- LiquidityPool:", liquidityPoolAddress);
  console.log("- PraesidiumInsurance:", insuranceAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});