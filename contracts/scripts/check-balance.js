const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("=".repeat(50));
  console.log("POLYGON MAINNET - Wallet Check");
  console.log("=".repeat(50));
  console.log("Address:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MATIC");
  console.log("Balance USD:", (parseFloat(ethers.formatEther(balance)) * 0.11).toFixed(2), "USD (@ $0.11/MATIC)");
  console.log("=".repeat(50));
  
  if (balance < ethers.parseEther("0.1")) {
    console.log("\n⚠️  WARNING: Low balance!");
    console.log("   You need at least 0.1 MATIC (~$0.01) for deployment");
    console.log("   Recommended: 0.5 MATIC for comfortable deployment + verification");
  } else {
    console.log("\n✅ Balance sufficient for deployment!");
  }
}

main().catch(console.error);
