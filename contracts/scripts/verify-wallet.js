const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  // Get the private key from .env
  const privateKey = process.env.PRIV_KEY;
  
  if (!privateKey) {
    console.log("❌ No private key found in .env");
    return;
  }
  
  console.log("=".repeat(60));
  console.log("WALLET VERIFICATION");
  console.log("=".repeat(60));
  
  // Derive address from private key
  const wallet = new ethers.Wallet(privateKey);
  console.log("\nDerived address from PRIV_KEY:");
  console.log("  ", wallet.address);
  
  console.log("\nExpected address (from PolygonScan):");
  console.log("   0xF011D5e43BBE01cCc7ab1f1E799e974691FD530b");
  
  const matches = wallet.address.toLowerCase() === "0xF011D5e43BBE01cCc7ab1f1E799e974691FD530b".toLowerCase();
  console.log("\nAddress matches:", matches ? "✅ YES" : "❌ NO");
  
  if (!matches) {
    console.log("\n⚠️  The private key in .env does NOT match the wallet with POL!");
    console.log("   You need to use the private key from your MetaMask wallet that has the 35.96 POL");
    return;
  }
  
  // Try multiple RPCs
  const rpcs = [
    { name: "Polygon Public", url: "https://polygon-rpc.com" },
    { name: "Polygon Bor", url: "https://rpc-mainnet.matic.network" },
    { name: "Ankr", url: "https://rpc.ankr.com/polygon" },
  ];
  
  console.log("\n" + "=".repeat(60));
  console.log("CHECKING BALANCE ON MULTIPLE RPCS");
  console.log("=".repeat(60));
  
  for (const rpc of rpcs) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc.url);
      const balance = await provider.getBalance(wallet.address);
      console.log(`\n${rpc.name}:`);
      console.log(`   URL: ${rpc.url}`);
      console.log(`   Balance: ${ethers.formatEther(balance)} POL`);
    } catch (e) {
      console.log(`\n${rpc.name}: ❌ FAILED - ${e.message.substring(0, 50)}`);
    }
  }
}

main().catch(console.error);
