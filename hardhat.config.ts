import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
// import '@nomicfoundation/hardhat-verify'
import { vars } from "hardhat/config";
import "solidity-coverage";

const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");

const config: HardhatUserConfig = {
  defaultNetwork: "localhost",
  // etherscan: { apiKey: ETHERSCAN_API_KEY },
  solidity: {
    version: "0.8.13",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // set 1000 if error
      },
    },
  },
  networks: {
    // bundler: {
    //   url: "http://localhost:3000/rpc",
    // },
    // remote: {
    //   url: "http://192.168.50.34:8545",
    // },
    // sepolia: {
    //   url: "https://airline.infura-ipfs.io/2ObUSr3bXjsWHhF2u1PTzPrImCF",
    //   accounts: [
    //     "8403cafb32c0df5462ac53020acba0d76e4729e4ac3080f63c99149ca7cc2ac9",
    //   ],
    // },
    // hardhat: {
    //   forking: {
    //     url: 'https://mainnet.infura.io/v3/2ObUSr3bXjsWHhF2u1PTzPrImCF'
    //   }
    // }
  },
};

export default config;
