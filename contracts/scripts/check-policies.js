const { ethers } = require("hardhat");

async function main() {
  // Use the correct deployed contract address
  const contractAddress = "0xBE94Ea21e057c948DfDdF25347A0527f8f8819c0";
  const holderAddress = "0xF011D5e43BBE01cCc7ab1f1E799e974691FD530b";
  
  console.log("Checking contract:", contractAddress);
  console.log("Holder address:", holderAddress);
  console.log("");
  
  const [signer] = await ethers.getSigners();
  
  // Try with full struct return type
  const abi = [
    "function getPolicyCount() external view returns (uint256)",
    "function policies(uint256) external view returns (tuple(uint256 id, address holder, uint256 premium, uint256 coverage, uint256 expiry, bool active, string protocol))",
    "function getHolderPolicies(address) external view returns (uint256[])",
    "function ownerOf(uint256 tokenId) external view returns (address)"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, signer);
  
  try {
    // Get total policy count
    const policyCount = await contract.getPolicyCount();
    console.log("Total policy count:", policyCount.toString());
    
    // Get holder's policies
    const holderPolicies = await contract.getHolderPolicies(holderAddress);
    console.log("Holder policy IDs:", holderPolicies.map(id => id.toString()));
    
    // Check if these are NFTs owned by holder
    console.log("\nChecking NFT ownership:");
    for (const policyId of holderPolicies) {
      try {
        const owner = await contract.ownerOf(policyId);
        console.log(`Policy ${policyId} owner: ${owner}`);
      } catch (err) {
        console.log(`Policy ${policyId}: NFT doesn't exist - ${err.message?.slice(0, 30)}`);
      }
    }
    
    // Try raw call to policies mapping
    console.log("\nTrying raw call to policies:");
    const iface = new ethers.Interface([
      "function policies(uint256) view returns (uint256, address, uint256, uint256, uint256, bool, string)"
    ]);
    
    for (const policyId of holderPolicies.slice(0, 3)) {
      try {
        const data = iface.encodeFunctionData("policies", [policyId]);
        const result = await signer.call({ to: contractAddress, data });
        console.log(`Policy ${policyId} raw result length:`, result.length);
        const decoded = iface.decodeFunctionResult("policies", result);
        console.log(`Policy ${policyId}:`, decoded);
      } catch (err) {
        console.log(`Policy ${policyId}: Raw call error - ${err.message?.slice(0, 50)}`);
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
