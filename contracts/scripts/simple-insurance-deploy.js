const { ethers } = require("hardhat");

async function main() {
  const PraesidiumInsurance = await ethers.getContractFactory("PraesidiumInsurance");
  const insurance = await PraesidiumInsurance.deploy();
  const address = await insurance.getAddress();
  console.log("PraesidiumInsurance deployed to:", address);
}

main().catch(console.error);