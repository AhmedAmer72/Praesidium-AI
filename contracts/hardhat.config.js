require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    amoy: {
      url: process.env.RPC_URL_AMOY || "https://rpc-amoy.polygon.technology",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
      chainId: 80002
    },
    polygon: {
      url: process.env.RPC_URL_POLYGON || "https://polygon-bor-rpc.publicnode.com",
      accounts: process.env.PRIV_KEY ? [process.env.PRIV_KEY] : [],
      chainId: 137,
      gasPrice: "auto",
      timeout: 120000
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY || ""
  },
  sourcify: {
    enabled: false
  }
};