const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying LiquidityDeposit...");

  const LiquidityDeposit = await ethers.getContractFactory("LiquidityDeposit");
  const deposit = await LiquidityDeposit.deploy();

  const address = await deposit.getAddress();
  console.log("LiquidityDeposit deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});