require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    amoy: {
      type: "http",
      url: process.env.RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
    },
    polygon: {
      type: "http",
      url: process.env.RPC_URL || "https://polygon-rpc.com",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
    }
  }
};