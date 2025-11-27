const hre = require("hardhat");
const addresses = require("../contractAddresses.json");

async function main() {
  console.log("Creating a test policy on V2...\n");
  
  const v2Address = addresses.amoy.PraesidiumInsuranceV2;
  console.log("V2 Contract Address:", v2Address);
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);
  
  // V2 Contract ABI
  const V2_ABI = [
    "function createPolicy(address, uint256, uint256, uint256, string) payable returns (uint256)",
    "function getPolicyCount() view returns (uint256)",
    "function getHolderPolicies(address) view returns (uint256[])",
    "function getPolicy(uint256) view returns (uint256, address, uint256, uint256, uint256, bool, string, bool)"
  ];
  
  const contract = new hre.ethers.Contract(v2Address, V2_ABI, signer);
  
  try {
    const premium = hre.ethers.parseEther("0.001");
    const coverage = hre.ethers.parseEther("20"); // 20 POL coverage (~$50,000 at $2500)
    const duration = 365 * 24 * 60 * 60; // 1 year
    const protocol = "Aave";
    
    console.log("Creating policy with:");
    console.log("  Premium:", hre.ethers.formatEther(premium), "POL");
    console.log("  Coverage:", hre.ethers.formatEther(coverage), "POL");
    console.log("  Duration: 1 year");
    console.log("  Protocol:", protocol);
    
    const tx = await contract.createPolicy(
      signer.address,
      premium,
      coverage,
      duration,
      protocol,
      { value: premium, gasLimit: 500000 }
    );
    
    console.log("\nTransaction sent:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Check policy count
    const policyCount = await contract.getPolicyCount();
    console.log("\n📊 New Policy Count:", policyCount.toString());
    
    // Get holder policies
    const holderPolicies = await contract.getHolderPolicies(signer.address);
    console.log("📋 Your Policies:", holderPolicies.map(p => p.toString()));
    
    // Read the newly created policy
    if (holderPolicies.length > 0) {
      const latestId = holderPolicies[holderPolicies.length - 1];
      const policy = await contract.getPolicy(latestId);
      console.log("\n📄 Latest Policy Details:");
      console.log("  ID:", policy[0].toString());
      console.log("  Holder:", policy[1]);
      console.log("  Premium:", hre.ethers.formatEther(policy[2]), "POL");
      console.log("  Coverage:", hre.ethers.formatEther(policy[3]), "POL");
      console.log("  Expiry:", new Date(Number(policy[4]) * 1000).toLocaleDateString());
      console.log("  Active:", policy[5]);
      console.log("  Protocol:", policy[6]);
      console.log("  Claimed:", policy[7]);
    }
    
    console.log("\n✅ Test policy created successfully!");
    console.log("   Refresh your dashboard to see it.");
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main().catch(console.error);
