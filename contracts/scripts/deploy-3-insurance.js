// Step 3: Deploy PraesidiumInsuranceV2 ONLY
const hre = require("hardhat");

async function main() {
    console.log("=== DEPLOYING PRAESIDIUMINSURANCECV2 ===");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "POL");
    
    // Compile and deploy PraesidiumInsuranceV2 (no constructor args)
    const PraesidiumInsuranceV2 = await hre.ethers.getContractFactory("PraesidiumInsuranceV2");
    console.log("Deploying PraesidiumInsuranceV2...");
    
    const insurance = await PraesidiumInsuranceV2.deploy();
    await insurance.waitForDeployment();
    
    const address = await insurance.getAddress();
    console.log("\n✅ PRAESIDIUMINSURANCECV2 DEPLOYED!");
    console.log("Address:", address);
    
    // Verify bytecode
    const code = await hre.ethers.provider.getCode(address);
    console.log("Bytecode length:", code.length);
    
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
}

main().catch(console.error);
