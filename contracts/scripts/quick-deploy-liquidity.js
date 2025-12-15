const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Quick deploy LiquidityPool...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  // Get the contract factory
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  
  // Deploy with explicit gas settings
  const deployTx = await LiquidityPool.getDeployTransaction();
  
  const tx = await deployer.sendTransaction({
    ...deployTx,
    gasLimit: 2500000,
    maxFeePerGas: ethers.parseUnits("100", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("50", "gwei")
  });
  
  console.log("TX Hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait(1);
  const address = receipt.contractAddress;
  
  console.log("\n✅ LiquidityPool deployed to:", address);

  // Update contractAddresses.json
  const addressesPath = path.join(__dirname, "../contractAddresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  addresses.amoy.LiquidityPool = address;
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  
  console.log("✅ Updated contractAddresses.json");
  console.log("\n⚠️  Update .env: VITE_LIQUIDITY_POOL_ADDRESS=" + address);
}

main().catch(console.error);
