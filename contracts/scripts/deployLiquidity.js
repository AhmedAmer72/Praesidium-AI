const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SimpleLiquidityPool...");

  const SimpleLiquidityPool = await ethers.getContractFactory("SimpleLiquidityPool");
  const liquidityPool = await SimpleLiquidityPool.deploy();

  await liquidityPool.waitForDeployment();
  const address = await liquidityPool.getAddress();

  console.log("SimpleLiquidityPool deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });