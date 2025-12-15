const { ethers } = require("ethers");

async function main() {
  // Try multiple RPCs
  const rpcs = [
    "https://polygon-mainnet.g.alchemy.com/v2/oBfGkBSMrA10MUVKzcaRb",
    "https://polygon-rpc.com",
    "https://rpc-mainnet.matic.quiknode.pro",
    "https://polygon.llamarpc.com"
  ];
  
  const address = "0xF011D5e43BBE01cCc7ab1f1E799e974691FD530b";
  
  console.log("Checking balance on multiple RPCs...\n");
  
  for (const rpc of rpcs) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      const balance = await provider.getBalance(address);
      console.log(`${rpc.substring(0, 40)}...`);
      console.log(`  Balance: ${ethers.formatEther(balance)} POL\n`);
    } catch (e) {
      console.log(`${rpc.substring(0, 40)}... FAILED: ${e.message}\n`);
    }
  }
}

main();
