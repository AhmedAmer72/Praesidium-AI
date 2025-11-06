const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying CompleteLiquidityPool...");

  const CompleteLiquidityPool = await ethers.getContractFactory("CompleteLiquidityPool");
  const pool = await CompleteLiquidityPool.deploy();

  const address = await pool.getAddress();
  console.log("CompleteLiquidityPool deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});