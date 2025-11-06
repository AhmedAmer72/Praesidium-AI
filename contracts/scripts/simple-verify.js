const { ethers } = require("hardhat");

async function main() {
  console.log("Testing contract connections...");
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  
  // Check if contracts exist
  const oracleCode = await provider.getCode("0x513CEae41D376d9eA0Dc305B0c382841FF80eD53");
  const poolCode = await provider.getCode("0xe7146db1566EA71690D5eeC15AB754E005C72dAF");
  
  if (oracleCode !== "0x") {
    console.log("✅ RiskOracle contract deployed successfully");
  } else {
    console.log("❌ RiskOracle contract not found");
  }
  
  if (poolCode !== "0x") {
    console.log("✅ LiquidityPool contract deployed successfully");
  } else {
    console.log("❌ LiquidityPool contract not found");
  }
  
  console.log("Contract verification complete!");
}

main().catch(console.error);