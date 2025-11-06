const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const SimpleInsurance = await ethers.getContractFactory("SimpleInsurance");
  const insurance = await SimpleInsurance.deploy();
  const address = await insurance.getAddress();
  
  console.log("SimpleInsurance deployed to:", address);
  
  // Update addresses
  const addresses = {
    amoy: {
      PraesidiumInsurance: address,
      LiquidityPool: "0xe7146db1566EA71690D5eeC15AB754E005C72dAF",
      RiskOracle: "0x513CEae41D376d9eA0Dc305B0c382841FF80eD53"
    }
  };
  
  fs.writeFileSync('contractAddresses.json', JSON.stringify(addresses, null, 2));
}

main().catch(console.error);