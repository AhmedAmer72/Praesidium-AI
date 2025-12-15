const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Force-deploying LiquidityPool...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Get current balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MATIC\n");
  
  // Deploy without waiting for excessive confirmations
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  
  // Use very high gas to ensure inclusion
  const deployTx = await LiquidityPool.getDeployTransaction();
  
  const tx = await deployer.sendTransaction({
    data: deployTx.data,
    gasLimit: 3000000,
    maxPriorityFeePerGas: ethers.parseUnits("50", "gwei"),
    maxFeePerGas: ethers.parseUnits("100", "gwei"),
  });
  
  console.log("TX Hash:", tx.hash);
  console.log("Waiting for receipt (1 confirmation)...");
  
  const receipt = await tx.wait(1);
  
  if (receipt && receipt.contractAddress) {
    console.log("\n✅ SUCCESS!");
    console.log("LiquidityPool deployed at:", receipt.contractAddress);
    
    // Update addresses
    const addressFile = path.join(__dirname, "..", "contractAddresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressFile, "utf8"));
    addresses.amoy.LiquidityPool = receipt.contractAddress;
    fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
    console.log("✅ Updated contractAddresses.json");
    
    // Also update the root constants
    const frontendEnv = path.join(__dirname, "..", "..", ".env");
    let envContent = fs.readFileSync(frontendEnv, "utf8");
    envContent = envContent.replace(
      /VITE_LIQUIDITY_POOL_ADDRESS=.*/,
      `VITE_LIQUIDITY_POOL_ADDRESS=${receipt.contractAddress}`
    );
    fs.writeFileSync(frontendEnv, envContent);
    console.log("✅ Updated frontend .env");
    
  } else {
    console.log("❌ Deployment failed - no contract address in receipt");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
