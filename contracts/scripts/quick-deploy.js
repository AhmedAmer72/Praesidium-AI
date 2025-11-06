const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Quick deploy starting...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy RiskOracle
  const RiskOracle = await ethers.getContractFactory("RiskOracle");
  const riskOracle = await RiskOracle.deploy();
  const riskOracleAddress = await riskOracle.getAddress();
  console.log("RiskOracle:", riskOracleAddress);

  // Deploy LiquidityPool
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy();
  const liquidityPoolAddress = await liquidityPool.getAddress();
  console.log("LiquidityPool:", liquidityPoolAddress);

  // Deploy PraesidiumInsurance
  const PraesidiumInsurance = await ethers.getContractFactory("PraesidiumInsurance");
  const insurance = await PraesidiumInsurance.deploy();
  const insuranceAddress = await insurance.getAddress();
  console.log("PraesidiumInsurance:", insuranceAddress);

  // Save addresses
  const addresses = {
    amoy: {
      PraesidiumInsurance: insuranceAddress,
      LiquidityPool: liquidityPoolAddress,
      RiskOracle: riskOracleAddress
    }
  };

  fs.writeFileSync('contractAddresses.json', JSON.stringify(addresses, null, 2));
  console.log("Addresses saved!");
}

main().catch(console.error);