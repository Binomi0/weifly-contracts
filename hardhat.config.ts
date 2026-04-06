import { HardhatUserConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import hardhatViemAssertions from "@nomicfoundation/hardhat-viem-assertions";
import hardhatNodeTestRunner from "@nomicfoundation/hardhat-node-test-runner";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import hardhatTypechain from "@nomicfoundation/hardhat-typechain";

const config: HardhatUserConfig = {
  typechain: {
    outDir: "./types",
  },
  plugins: [
    hardhatEthers,
    hardhatViem,
    hardhatTypechain,
    hardhatViemAssertions,
    hardhatNodeTestRunner,
    hardhatNetworkHelpers,
  ],
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://192.168.1.101:8545",
      chainId: 42161,
      type: "http",
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
      type: "http",
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
      type: "http",
    },
  },
};

export default config;
