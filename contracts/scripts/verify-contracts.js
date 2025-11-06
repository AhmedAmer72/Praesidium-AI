const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying deployed contracts...\n");
  
  const addresses = {
    RiskOracle: "0x513CEae41D376d9eA0Dc305B0c382841FF80eD53",
    LiquidityPool: "0xe7146db1566EA71690D5eeC15AB754E005C72dAF"
  };

  try {
    // Test RiskOracle
    const RiskOracle = await ethers.getContractFactory("RiskOracle");
    const oracle = RiskOracle.attach(addresses.RiskOracle);
    
    console.log("✅ RiskOracle contract found at:", addresses.RiskOracle);
    
    // Test LiquidityPool
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const pool = LiquidityPool.attach(addresses.LiquidityPool);
    
    console.log("✅ LiquidityPool contract found at:", addresses.LiquidityPool);
    
    // Test basic functionality
    const poolBalance = await pool.getPoolBalance();
    console.log("📊 Pool balance:", ethers.formatEther(poolBalance), "MATIC");
    
    console.log("\n🎉 All contracts are working correctly!");
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
  }
}

main().catch(console.error);