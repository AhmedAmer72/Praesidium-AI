const { ethers } = require("hardhat");

async function main() {
  console.log("Testing simple deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy just RiskOracle
  console.log("Deploying RiskOracle...");
  const RiskOracle = await ethers.getContractFactory("RiskOracle");
  const riskOracle = await RiskOracle.deploy();
  
  console.log("Transaction hash:", riskOracle.deploymentTransaction().hash);
  console.log("Waiting for deployment...");
  
  await riskOracle.waitForDeployment();
  console.log("✅ RiskOracle deployed to:", await riskOracle.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});