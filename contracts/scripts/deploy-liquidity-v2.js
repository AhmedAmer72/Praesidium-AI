const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying LiquidityPool with getUserBalance function...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "POL");

  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  
  console.log("Sending deployment transaction...");
  const liquidityPool = await LiquidityPool.deploy({
    gasLimit: 3000000,
    maxFeePerGas: ethers.parseUnits("50", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("30", "gwei")
  });

  console.log("Waiting for deployment confirmation...");
  await liquidityPool.waitForDeployment();
  
  const address = await liquidityPool.getAddress();
  console.log("\n✅ LiquidityPool deployed to:", address);

  // Update contractAddresses.json
  const addressesPath = path.join(__dirname, "../contractAddresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const oldAddress = addresses.amoy.LiquidityPool;
  addresses.amoy.LiquidityPool = address;
  
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("\n📝 Updated contractAddresses.json");
  console.log("   Old address:", oldAddress);
  console.log("   New address:", address);

  // Verify the contract has the new function
  console.log("\n🔍 Verifying contract functions...");
  try {
    const poolBalance = await liquidityPool.getPoolBalance();
    console.log("   getPoolBalance():", ethers.formatEther(poolBalance), "POL");
    
    const userBalance = await liquidityPool.getUserBalance(deployer.address);
    console.log("   getUserBalance():", ethers.formatEther(userBalance), "POL");
    
    const totalShares = await liquidityPool.totalShares();
    console.log("   totalShares():", ethers.formatEther(totalShares));
    
    console.log("\n✅ All functions working correctly!");
  } catch (error) {
    console.error("   Error verifying functions:", error.message);
  }

  console.log("\n⚠️  IMPORTANT: Update your .env file with the new address:");
  console.log(`   VITE_LIQUIDITY_POOL_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
