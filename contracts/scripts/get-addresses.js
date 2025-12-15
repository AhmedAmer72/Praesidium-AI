const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("📋 Getting deployed contract addresses from transaction receipts...\n");
  
  // Transaction hashes from PolygonScan
  const txHashes = [
    { name: "RiskOracle", hash: "0xc4b798182168f96242b55d2fa984e67b910410b1be3b98d72a23aad6d47023d0" },
    { name: "LiquidityPool", hash: "0x8b98ec7d04d832dd2e1cf05d7d0ac92c63e68c0e172156084819ec85aa2b9263" },
    { name: "PraesidiumInsuranceV2", hash: "0x300e884c04390c087aaa31f5abbdc43fcd5919756c1adeb3c086c8a8140b69d4" }
  ];
  
  const polygon = {};
  
  for (const tx of txHashes) {
    console.log(`Fetching ${tx.name}...`);
    const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
    
    if (receipt && receipt.contractAddress) {
      polygon[tx.name] = receipt.contractAddress;
      console.log(`  ✅ ${tx.name}: ${receipt.contractAddress}`);
    } else {
      console.log(`  ❌ ${tx.name}: Could not get address`);
    }
  }
  
  // Update contractAddresses.json
  const addressFile = path.join(__dirname, "..", "contractAddresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressFile, "utf8"));
  addresses.polygon = polygon;
  fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
  
  console.log("\n✅ Updated contractAddresses.json with polygon addresses!");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch(console.error);
