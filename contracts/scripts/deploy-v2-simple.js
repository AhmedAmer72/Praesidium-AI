const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying PraesidiumInsuranceV2...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "POL\n");

  const PraesidiumInsuranceV2 = await hre.ethers.getContractFactory("PraesidiumInsuranceV2");
  
  console.log("Sending deploy transaction...");
  const insuranceV2 = await PraesidiumInsuranceV2.deploy();
  
  console.log("Deploy tx hash:", insuranceV2.deploymentTransaction().hash);
  console.log("Waiting for confirmation (this may take 30-60 seconds)...\n");
  
  await insuranceV2.waitForDeployment();
  
  const v2Address = await insuranceV2.getAddress();
  console.log("\n✅ PraesidiumInsuranceV2 deployed to:", v2Address);

  // Verify
  const owner = await insuranceV2.owner();
  console.log("   Owner:", owner);

  // Update contractAddresses.json
  const addressesPath = path.join(__dirname, "../contractAddresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  if (addresses.amoy) {
    addresses.amoy.PraesidiumInsuranceV2 = v2Address;
  } else {
    addresses.PraesidiumInsuranceV2 = v2Address;
  }
  
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("\n📁 Updated contractAddresses.json");

  // Update constants.ts
  const constantsPath = path.join(__dirname, "../../constants.ts");
  let constants = fs.readFileSync(constantsPath, "utf8");
  constants = constants.replace(
    /PraesidiumInsuranceV2:\s*import\.meta\.env\.VITE_PRAESIDIUM_INSURANCE_V2_ADDRESS\s*\|\|\s*'[^']*'/,
    `PraesidiumInsuranceV2: import.meta.env.VITE_PRAESIDIUM_INSURANCE_V2_ADDRESS || '${v2Address}'`
  );
  fs.writeFileSync(constantsPath, constants);
  console.log("📁 Updated constants.ts");

  console.log("\n🎉 Deployment complete!");
  console.log(`\nView on explorer: https://amoy.polygonscan.com/address/${v2Address}`);
}

main().catch(console.error);
