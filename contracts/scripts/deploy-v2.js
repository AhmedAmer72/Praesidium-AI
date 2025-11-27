const hre = require("hardhat");

async function main() {
  console.log("Deploying PraesidiumInsuranceV2 contract...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "POL\n");

  // Get existing contract addresses
  const contractAddresses = require("../contractAddresses.json");
  const liquidityPoolAddress = contractAddresses.amoy?.LiquidityPool || contractAddresses.LiquidityPool;
  const riskOracleAddress = contractAddresses.amoy?.RiskOracle || contractAddresses.RiskOracle;

  console.log("Using existing contracts:");
  console.log("  LiquidityPool:", liquidityPoolAddress);
  console.log("  RiskOracle:", riskOracleAddress);
  console.log("");

  // Deploy PraesidiumInsuranceV2 (constructor takes no arguments, only msg.sender for Ownable)
  console.log("Deploying PraesidiumInsuranceV2...");
  const PraesidiumInsuranceV2 = await hre.ethers.getContractFactory("PraesidiumInsuranceV2");
  const insuranceV2 = await PraesidiumInsuranceV2.deploy({
    gasLimit: 5000000
  });

  await insuranceV2.waitForDeployment();
  const v2Address = await insuranceV2.getAddress();
  
  console.log("PraesidiumInsuranceV2 deployed to:", v2Address);
  console.log("");

  // Verify deployment
  console.log("Verifying deployment...");
  const owner = await insuranceV2.owner();
  const policyCount = await insuranceV2.getPolicyCount();
  const claimCount = await insuranceV2.getClaimCount();
  
  console.log("  Owner:", owner);
  console.log("  Initial Policy Count:", policyCount.toString());
  console.log("  Initial Claim Count:", claimCount.toString());
  console.log("");

  // Update contract addresses
  const fs = require("fs");
  const path = require("path");
  
  // Handle both flat and nested JSON structures
  if (contractAddresses.amoy) {
    contractAddresses.amoy.PraesidiumInsuranceV2 = v2Address;
  } else {
    contractAddresses.PraesidiumInsuranceV2 = v2Address;
  }
  
  const addressesPath = path.join(__dirname, "../contractAddresses.json");
  fs.writeFileSync(addressesPath, JSON.stringify(contractAddresses, null, 2));
  console.log("Updated contractAddresses.json");

  // Also update the main constants.ts file
  const constantsPath = path.join(__dirname, "../../constants.ts");
  try {
    let constantsContent = fs.readFileSync(constantsPath, "utf8");
    
    // Update V2 address
    if (constantsContent.includes("PraesidiumInsuranceV2:")) {
      constantsContent = constantsContent.replace(
        /PraesidiumInsuranceV2:\s*import\.meta\.env\.VITE_PRAESIDIUM_INSURANCE_V2_ADDRESS\s*\|\|\s*'[^']*'/,
        `PraesidiumInsuranceV2: import.meta.env.VITE_PRAESIDIUM_INSURANCE_V2_ADDRESS || '${v2Address}'`
      );
      fs.writeFileSync(constantsPath, constantsContent);
      console.log("Updated constants.ts with V2 address");
    }
  } catch (err) {
    console.log("Note: Could not auto-update constants.ts:", err.message);
  }

  console.log("\n=== Deployment Complete ===");
  console.log("PraesidiumInsuranceV2:", v2Address);
  console.log("");
  console.log("Next steps:");
  console.log("1. Update frontend to use V2 contract for claims");
  console.log("2. Fund the contract with POL for claim payouts");
  console.log("3. Test the full claims flow");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
