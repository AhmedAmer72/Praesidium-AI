const { ethers } = require("hardhat");

async function main() {
  try {
    console.log("Deploying SimpleLiquidityPool...");

    const SimpleLiquidityPool = await ethers.getContractFactory("SimpleLiquidityPool");
    const liquidityPool = await SimpleLiquidityPool.deploy();

    console.log("Waiting for deployment...");
    await liquidityPool.waitForDeployment();
    
    const address = await liquidityPool.getAddress();
    console.log("SimpleLiquidityPool deployed to:", address);
    
    // Test the contract
    console.log("Testing contract...");
    const balance = await liquidityPool.getPoolBalance();
    console.log("Initial pool balance:", balance.toString());
    
  } catch (error) {
    console.error("Deployment failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });