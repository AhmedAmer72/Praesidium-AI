// Step 2: Deploy SimpleLiquidityPool ONLY
const hre = require("hardhat");

async function main() {
    console.log("=== DEPLOYING SIMPLELIQUIDITYPOOL ===");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "POL");
    
    // Compile and deploy SimpleLiquidityPool (no constructor args)
    const SimpleLiquidityPool = await hre.ethers.getContractFactory("SimpleLiquidityPool");
    console.log("Deploying SimpleLiquidityPool...");
    
    const pool = await SimpleLiquidityPool.deploy();
    await pool.waitForDeployment();
    
    const address = await pool.getAddress();
    console.log("\n✅ SIMPLELIQUIDITYPOOL DEPLOYED!");
    console.log("Address:", address);
    
    // Verify bytecode
    const code = await hre.ethers.provider.getCode(address);
    console.log("Bytecode length:", code.length, "(should be ~2748)");
    console.log("\n📝 SAVE THIS ADDRESS FOR NEXT STEP!");
}

main().catch(console.error);
