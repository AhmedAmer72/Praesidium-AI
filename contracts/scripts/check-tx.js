const { ethers } = require("hardhat");

async function main() {
  const provider = ethers.provider;
  
  // Check pending transactions from deployer
  const [deployer] = await ethers.getSigners();
  const nonce = await provider.getTransactionCount(deployer.address);
  const pendingNonce = await provider.getTransactionCount(deployer.address, "pending");
  
  console.log("Current nonce:", nonce);
  console.log("Pending nonce:", pendingNonce);
  console.log("Pending txs:", pendingNonce - nonce);
  
  // Try to deploy with higher gas
  if (pendingNonce > nonce) {
    console.log("\nPending transactions detected. Deploying with replacement...");
  }
  
  console.log("\nDeploying new LiquidityPool with high priority...");
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  
  const feeData = await provider.getFeeData();
  const maxPriorityFee = feeData.maxPriorityFeePerGas * 3n;
  const maxFee = feeData.maxFeePerGas * 3n;
  
  console.log("Max Priority Fee:", ethers.formatUnits(maxPriorityFee, "gwei"), "gwei");
  console.log("Max Fee:", ethers.formatUnits(maxFee, "gwei"), "gwei");
  
  const pool = await LiquidityPool.deploy({
    maxPriorityFeePerGas: maxPriorityFee,
    maxFeePerGas: maxFee,
    gasLimit: 3000000
  });
  
  console.log("TX sent:", pool.deploymentTransaction().hash);
  console.log("Waiting for 2 confirmations...");
  
  await pool.waitForDeployment();
  const address = await pool.getAddress();
  
  console.log("\n✅ LiquidityPool deployed at:", address);
  
  // Update contractAddresses.json
  const fs = require("fs");
  const path = require("path");
  const addressFile = path.join(__dirname, "..", "contractAddresses.json");
  
  const addresses = JSON.parse(fs.readFileSync(addressFile, "utf8"));
  addresses.amoy.LiquidityPool = address;
  fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
  
  console.log("✅ Updated contractAddresses.json");
}

main().catch(console.error);
