const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying RiskOracle...");

  const RiskOracle = await ethers.getContractFactory("RiskOracle");
  const oracle = await RiskOracle.deploy();

  const address = await oracle.getAddress();
  console.log("RiskOracle deployed to:", address);
  
  // Test the oracle
  console.log("Testing oracle...");
  const aaveScore = await oracle.getRiskScore("Aave");
  const aaveRate = await oracle.getPremiumRate("Aave");
  console.log("Aave risk score:", aaveScore.toString());
  console.log("Aave premium rate:", aaveRate.toString(), "basis points");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});