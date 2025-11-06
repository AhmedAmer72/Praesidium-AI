const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SimpleLiquidityPool...");

  const SimpleLiquidityPool = await ethers.getContractFactory("SimpleLiquidityPool");
  const liquidityPool = await SimpleLiquidityPool.deploy();

  const address = await liquidityPool.getAddress();
  console.log("SimpleLiquidityPool deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});