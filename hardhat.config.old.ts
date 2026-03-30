import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import "hardhat-gas-reporter";

const COINMARKETCAP_API_KEY = "eb317b12-ae71-4ecb-84cb-9fcaf9459954";

const config: HardhatUserConfig = {
  gasReporter: {
    enabled: !!process.env.REPORT,
    currency: "EUR",
    L1: "ethereum",
    coinmarketcap: COINMARKETCAP_API_KEY,
    L1Etherscan: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 42161,
      allowUnlimitedContractSize: false,
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com",
      chainId: 11155111,
      accounts: process.env.SEPOLIA_PRIVATE_KEY
        ? [process.env.SEPOLIA_PRIVATE_KEY]
        : undefined,
      gas: 3000000,
      gasPrice: "auto",
      timeout: 100000,
      httpTimeout: 10000,
    },
    "arbitrum-sepolia": {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: process.env.ARB_SEPOLIA_PRIVATE_KEY
        ? [process.env.ARB_SEPOLIA_PRIVATE_KEY]
        : undefined,
      gas: 3000000,
      gasPrice: "auto",
      timeout: 100000,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
