// Step 1: Deploy RiskOracle ONLY
const hre = require("hardhat");

async function main() {
    console.log("=== DEPLOYING RISKORACLE ===");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "POL");
    
    // Compile and deploy RiskOracle
    const RiskOracle = await hre.ethers.getContractFactory("RiskOracle");
    console.log("Deploying RiskOracle...");
    
    const riskOracle = await RiskOracle.deploy();
    await riskOracle.waitForDeployment();
    
    const address = await riskOracle.getAddress();
    console.log("\n✅ RISKORACLE DEPLOYED!");
    console.log("Address:", address);
    
    // Verify bytecode
    const code = await hre.ethers.provider.getCode(address);
    console.log("Bytecode length:", code.length);
    console.log("\n📝 SAVE THIS ADDRESS FOR NEXT STEP!");
}

main().catch(console.error);
