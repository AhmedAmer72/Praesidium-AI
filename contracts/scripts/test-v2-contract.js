const hre = require("hardhat");
const addresses = require("../contractAddresses.json");

async function main() {
  console.log("Testing V2 Contract...\n");
  
  const v2Address = addresses.amoy.PraesidiumInsuranceV2;
  console.log("V2 Contract Address:", v2Address);
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);
  
  // V2 Contract ABI
  const V2_ABI = [
    "function owner() view returns (address)",
    "function getPolicyCount() view returns (uint256)",
    "function getClaimCount() view returns (uint256)",
    "function getHolderPolicies(address) view returns (uint256[])",
    "function getPolicy(uint256) view returns (uint256, address, uint256, uint256, uint256, bool, string, bool)",
    "function policies(uint256) view returns (uint256 id, address holder, uint256 premium, uint256 coverage, uint256 expiry, bool active, string memory protocol, bool claimed)",
    "function createPolicy(address, uint256, uint256, uint256, string) payable returns (uint256)",
    "function totalClaimsPaid() view returns (uint256)"
  ];
  
  const contract = new hre.ethers.Contract(v2Address, V2_ABI, signer);
  
  try {
    // Basic contract checks
    const owner = await contract.owner();
    console.log("\n✅ Owner:", owner);
    
    const policyCount = await contract.getPolicyCount();
    console.log("✅ Policy Count:", policyCount.toString());
    
    const claimCount = await contract.getClaimCount();
    console.log("✅ Claim Count:", claimCount.toString());
    
    const totalPaid = await contract.totalClaimsPaid();
    console.log("✅ Total Claims Paid:", hre.ethers.formatEther(totalPaid), "POL");
    
    // Check if signer has any policies
    const holderPolicies = await contract.getHolderPolicies(signer.address);
    console.log("\n📋 Your policies in V2:", holderPolicies.length > 0 ? holderPolicies.map(p => p.toString()) : "None yet");
    
    // If there are policies, try to read them
    if (holderPolicies.length > 0) {
      console.log("\n📄 Policy Details:");
      for (const id of holderPolicies) {
        try {
          const policy = await contract.getPolicy(id);
          console.log(`  Policy #${id}:`, {
            holder: policy[1],
            premium: hre.ethers.formatEther(policy[2]) + " POL",
            coverage: hre.ethers.formatEther(policy[3]) + " POL",
            expiry: new Date(Number(policy[4]) * 1000).toLocaleDateString(),
            active: policy[5],
            protocol: policy[6],
            claimed: policy[7]
          });
        } catch (e) {
          console.log(`  Policy #${id}: Error reading - ${e.message}`);
        }
      }
    }
    
    console.log("\n✅ V2 Contract is working correctly!");
    console.log("\n🎯 Next: Create a test policy on V2");
    console.log("   The frontend is now configured to use V2 for all operations.");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
