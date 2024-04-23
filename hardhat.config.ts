import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
// import '@nomicfoundation/hardhat-verify'

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.13',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    remote: {
      url: 'http://192.168.50.34:8545'
    }
    // sepolia: {
    //   url: 'https://airline.infura-ipfs.io/2ObUSr3bXjsWHhF2u1PTzPrImCF',
    //   accounts: ['8403cafb32c0df5462ac53020acba0d76e4729e4ac3080f63c99149ca7cc2ac9']
    // }

    // hardhat: {
    //   forking: {
    //     url: 'https://mainnet.infura.io/v3/2ObUSr3bXjsWHhF2u1PTzPrImCF'
    //   }
    // }
  }
}

export default config
