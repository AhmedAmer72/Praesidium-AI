const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const txHash = "0xc93f840dabc670198df1f8a4a20da846696e8811174d4cc56da9f6820fc8508b";
  
  console.log("Getting contract address from tx:", txHash);
  
  const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
  
  if (!receipt) {
    console.log("Transaction not found or not yet mined");
    return;
  }
  
  const contractAddress = receipt.contractAddress;
  console.log("\n✅ Contract Address:", contractAddress);
  
  // Verify it's our contract
  const PraesidiumInsuranceV2 = await hre.ethers.getContractFactory("PraesidiumInsuranceV2");
  const contract = PraesidiumInsuranceV2.attach(contractAddress);
  
  const owner = await contract.owner();
  const policyCount = await contract.getPolicyCount();
  
  console.log("   Owner:", owner);
  console.log("   Policy Count:", policyCount.toString());
  
  // Update files
  const addressesPath = path.join(__dirname, "../contractAddresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  if (addresses.amoy) {
    addresses.amoy.PraesidiumInsuranceV2 = contractAddress;
  }
  
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("\n📁 Updated contractAddresses.json");
  
  // Update constants.ts
  const constantsPath = path.join(__dirname, "../../constants.ts");
  let constants = fs.readFileSync(constantsPath, "utf8");
  constants = constants.replace(
    /PraesidiumInsuranceV2:\s*import\.meta\.env\.VITE_PRAESIDIUM_INSURANCE_V2_ADDRESS\s*\|\|\s*'[^']*'/,
    `PraesidiumInsuranceV2: import.meta.env.VITE_PRAESIDIUM_INSURANCE_V2_ADDRESS || '${contractAddress}'`
  );
  fs.writeFileSync(constantsPath, constants);
  console.log("📁 Updated constants.ts");
  
  console.log("\n🎉 Complete!");
  console.log(`View on explorer: https://amoy.polygonscan.com/address/${contractAddress}`);
}

main().catch(console.error);
