import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'
import { deployAirlineCoin, deployLicenseNFT } from '../utils'

describe('AircraftNFT', function () {
  describe('Cessna 172', async function () {
    const [owner, otherAccount] = await ethers.getSigners()
    const airlineCoin = await deployAirlineCoin(owner.address)
    async function deployLicense() {
      const license = await deployLicenseNFT(owner.address)

      const amount = ethers.utils.parseUnits('1', 'wei') // Minting 1 token
      const baseURIForTokens = 'http://localhost:3000/api/metadata/license' // Replace with your actual base URI
      const encryptedURI = await owner.signMessage(`${baseURIForTokens}/0`)
      const provenanceHash = ethers.utils.formatBytes32String('0') // Convert to bytes32
      const _data = ethers.utils.defaultAbiCoder.encode(
        ['bytes', 'bytes32'],
        [ethers.utils.arrayify(encryptedURI), provenanceHash]
      )

      try {
        await license.lazyMint(amount, baseURIForTokens, _data)
        await license.setClaimConditions(
          0,
          {
            currency: airlineCoin.address,
            maxClaimableSupply: 100,
            metadata: JSON.stringify({ price: 0, type: 'D' }),
            startTimestamp: await time.latest(),
            quantityLimitPerWallet: 1,
            pricePerToken: 0,
            supplyClaimed: 0,
            merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000'
          },
          false
        )
        const cc = await license.claimCondition(0)

        await license.claim(
          otherAccount.address,
          0,
          1,
          airlineCoin.address,
          0,
          {
            proof: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
            quantityLimitPerWallet: cc.quantityLimitPerWallet,
            pricePerToken: cc.pricePerToken,
            currency: cc.currency
          },
          '0x00'
        )

        return { license, owner, airlineCoin: airlineCoin.address }
      } catch (error) {
        console.log('ERROR =>', error)
        return { license, owner, airlineCoin: airlineCoin.address }
      }
    }
    async function deployAircraft() {
      const Aircraft = await ethers.getContractFactory('AircraftNFT')

      const { license } = await deployLicense()
      const aircraft = await Aircraft.deploy(
        owner.address,
        'Aircraft',
        'AIRA',
        owner.address,
        0,
        owner.address,
        license.address
      )

      await aircraft.deployed()
      await airlineCoin.deployed()

      const amount = ethers.utils.parseUnits('1', 'wei') // Minting 1 token
      const baseURIForTokens = 'http://localhost:3000/api/metadata/aircraft' // Replace with your actual base URI
      const encryptedURI = await owner.signMessage(`${baseURIForTokens}/0`)
      const provenanceHash = ethers.utils.formatBytes32String('0') // Convert to bytes32
      const _data = ethers.utils.defaultAbiCoder.encode(
        ['bytes', 'bytes32'],
        [ethers.utils.arrayify(encryptedURI), provenanceHash]
      )

      try {
        await aircraft.lazyMint(amount, baseURIForTokens, _data)
        await aircraft.setClaimConditions(
          0,
          {
            currency: airlineCoin.address,
            maxClaimableSupply: 100,
            metadata: JSON.stringify({ price: 10, type: 'C-172' }),
            startTimestamp: await time.latest(),
            quantityLimitPerWallet: 1,
            pricePerToken: 0,
            supplyClaimed: 0,
            merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000'
          },
          false
        )

        return { aircraft, owner, airlineCoin: airlineCoin.address }
      } catch (error) {
        console.log('ERROR =>', error)
        return { aircraft, owner, airlineCoin: airlineCoin.address }
      }
    }

    it('Should set the right owner', async function () {
      const { aircraft, owner } = await loadFixture(deployAircraft)

      expect(await aircraft.owner()).to.equal(owner.address)
    })

    it('Should set new claim conditions', async () => {
      const { aircraft } = await loadFixture(deployAircraft)
      const cc = await aircraft.claimCondition(0)

      expect(cc.maxClaimableSupply).to.be.equal(BigNumber.from('100'))
    })

    it('Only license 0 owner can be able to claim Aircraft 0', async function () {
      const { aircraft, airlineCoin } = await loadFixture(deployAircraft)
      await deployLicense()
      const cc = await aircraft.claimCondition(0)
      const beforeBalance = await aircraft.balanceOf(otherAccount.address, 0)

      expect(beforeBalance).to.equal(0)

      const claimed = await aircraft.claim(
        otherAccount.address,
        0,
        1,
        airlineCoin ?? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        0,
        {
          proof: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
          quantityLimitPerWallet: cc.quantityLimitPerWallet,
          pricePerToken: cc.pricePerToken,
          currency: cc.currency
        },
        '0x00'
      )
      const afterBalance = await aircraft.balanceOf(otherAccount.address, 0)

      expect(afterBalance).to.equal(1)
      expect(claimed.hash).to.be.a.string
    })
  })

  // describe('Cessna 700', async function () {
  //   const [owner, otherAccount, thirdAccount] = await ethers.getSigners()
  //   const airlineCoin = await deployAirlineCoin(owner.address)
  //   async function deployLicense() {
  //     const license = await deployLicenseNFT(owner.address)
  //     const amount = ethers.utils.parseUnits('2', 'wei') // Minting 1 token

  //     const baseURIForTokens = 'http://localhost:3000/api/metadata/license' // Replace with your actual base URI

  //     const encryptedURI = await owner.signMessage(`${baseURIForTokens}/0`)

  //     const provenanceHash = ethers.utils.formatBytes32String('0') // Convert to bytes32

  //     const _data = ethers.utils.defaultAbiCoder.encode(
  //       ['bytes', 'bytes32'],
  //       [ethers.utils.arrayify(encryptedURI), provenanceHash]
  //     )

  //     try {
  //       await license.lazyMint(amount, baseURIForTokens, _data)

  //       await license.setClaimConditions(
  //         0,
  //         {
  //           currency: airlineCoin.address,
  //           maxClaimableSupply: 100,
  //           metadata: JSON.stringify({ price: 0, type: 'D' }),
  //           startTimestamp: await time.latest(),
  //           quantityLimitPerWallet: 1,
  //           pricePerToken: 0,
  //           supplyClaimed: 0,
  //           merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000'
  //         },
  //         false
  //       )
  //       const cc = await license.claimCondition(0)
  //       await license.claim(
  //         otherAccount.address,
  //         0,
  //         1,
  //         airlineCoin.address,
  //         0,
  //         {
  //           proof: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
  //           quantityLimitPerWallet: cc.quantityLimitPerWallet,
  //           pricePerToken: cc.pricePerToken,
  //           currency: cc.currency
  //         },
  //         '0x00'
  //       )

  //       const encryptedURI1 = await owner.signMessage(`${baseURIForTokens}/1`)
  //       const provenanceHash1 = ethers.utils.formatBytes32String('1') // Convert to bytes32
  //       const _data1 = ethers.utils.defaultAbiCoder.encode(
  //         ['bytes', 'bytes32'],
  //         [ethers.utils.arrayify(encryptedURI1), provenanceHash1]
  //       )
  //       await license.lazyMint(amount, baseURIForTokens, _data1)
  //       await license.setClaimConditions(
  //         1,
  //         {
  //           currency: airlineCoin.address,
  //           maxClaimableSupply: 100,
  //           metadata: JSON.stringify({ price: 10, type: 'C' }),
  //           startTimestamp: await time.latest(),
  //           quantityLimitPerWallet: 1,
  //           pricePerToken: 10,
  //           supplyClaimed: 0,
  //           merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000'
  //         },
  //         false
  //       )

  //       const cc1 = await license.claimCondition(1)
  //       await license.claim(
  //         otherAccount.address,
  //         1,
  //         1,
  //         airlineCoin.address,
  //         10,
  //         {
  //           proof: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
  //           quantityLimitPerWallet: cc1.quantityLimitPerWallet,
  //           pricePerToken: cc1.pricePerToken,
  //           currency: cc1.currency
  //         },
  //         '0x00'
  //       )

  //       return { license, airlineCoin: airlineCoin.address }
  //     } catch (error) {
  //       console.log('ERROR =>', error)
  //       return { license, airlineCoin: airlineCoin.address }
  //     }
  //   }
  //   async function deployAircraft() {
  //     // Contracts are deployed using the first signer/account by default
  //     const Aircraft = await ethers.getContractFactory('AircraftNFT')
  //     const { license } = await deployLicense()

  //     const aircraft = await Aircraft.deploy(
  //       owner.address,
  //       'Aircraft',
  //       'AIRA',
  //       owner.address,
  //       0,
  //       owner.address,
  //       license.address
  //     )

  //     await aircraft.deployed()
  //     await airlineCoin.deployed()

  //     const amount = ethers.utils.parseUnits('2', 'wei') // Minting 1 token
  //     const baseURIForTokens = 'http://localhost:3000/api/metadata/aircraft' // Replace with your actual base URI
  //     const encryptedURI = await owner.signMessage(`${baseURIForTokens}/1`)
  //     const provenanceHash = ethers.utils.formatBytes32String('1') // Convert to bytes32
  //     const _data = ethers.utils.defaultAbiCoder.encode(
  //       ['bytes', 'bytes32'],
  //       [ethers.utils.arrayify(encryptedURI), provenanceHash]
  //     )

  //     try {
  //       await aircraft.lazyMint(amount, baseURIForTokens, _data)
  //       await aircraft.setClaimConditions(
  //         1,
  //         {
  //           currency: airlineCoin.address,
  //           maxClaimableSupply: 100,
  //           metadata: JSON.stringify({ price: 10, type: 'C-700' }),
  //           startTimestamp: await time.latest(),
  //           quantityLimitPerWallet: 1,
  //           pricePerToken: 10,
  //           supplyClaimed: 0,
  //           merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000'
  //         },
  //         false
  //       )

  //       return { aircraft, airlineCoin: airlineCoin.address }
  //     } catch (error) {
  //       console.log('ERROR =>', error)
  //       return { aircraft, airlineCoin: airlineCoin.address }
  //     }
  //   }

  //   it('Should set the right owner', async function () {
  //     const { aircraft } = await loadFixture(deployAircraft)

  //     expect(await aircraft.owner()).to.equal(owner.address)
  //   })

  //   it('Should set new claim conditions', async () => {
  //     const { aircraft } = await loadFixture(deployAircraft)
  //     const cc = await aircraft.claimCondition(1)

  //     expect(cc.maxClaimableSupply).to.be.equal(BigNumber.from('100'))
  //   })

  //   it('Should fail if no License 0 owned to claim Aircfrat 1', async function () {
  //     const { aircraft, airlineCoin } = await loadFixture(deployAircraft)
  //     const cc = await aircraft.claimCondition(1)

  //     const beforeBalance = await aircraft.balanceOf(thirdAccount.address, 1)

  //     expect(beforeBalance).to.equal(0)
  //     try {
  //       await aircraft.claim(
  //         thirdAccount.address,
  //         1,
  //         1,
  //         airlineCoin,
  //         10,
  //         {
  //           proof: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
  //           quantityLimitPerWallet: cc.quantityLimitPerWallet,
  //           pricePerToken: cc.pricePerToken,
  //           currency: cc.currency
  //         },
  //         '0x00'
  //       )
  //     } catch (error) {}

  //     const afterBalance = await aircraft.balanceOf(thirdAccount.address, 1)
  //     expect(afterBalance).to.equal(0)
  //   })

  //   it('License 0 owner should be able to claim Aircraft 1', async function () {
  //     const { aircraft, airlineCoin } = await loadFixture(deployAircraft)
  //     const { license } = await deployLicense()
  //     const cc = await aircraft.claimCondition(1)
  //     const beforeBalance = await aircraft.balanceOf(otherAccount.address, 1)
  //     expect(beforeBalance).to.equal(0)

  //     const licenseBalance = await license.balanceOf(otherAccount.address, 0)
  //     expect(licenseBalance).to.equal(1)

  //     await aircraft.claim(
  //       otherAccount.address,
  //       1,
  //       1,
  //       airlineCoin,
  //       10,
  //       {
  //         proof: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
  //         quantityLimitPerWallet: cc.quantityLimitPerWallet,
  //         pricePerToken: cc.pricePerToken,
  //         currency: cc.currency
  //       },
  //       '0x00'
  //     )
  //     const afterBalance = await aircraft.balanceOf(otherAccount.address, 1)

  //     expect(afterBalance).to.equal(1)
  //   })
  // })

  // describe('Boeing 737', async function () {
  //   const [owner, otherAccount] = await ethers.getSigners()
  //   const airlineCoin = await deployAirlineCoin(owner.address)
  //   async function deployLicense() {
  //     const license = await deployLicenseNFT(owner.address)
  //     const amount = ethers.utils.parseUnits('3', 'wei') // Minting 1 token

  //     const baseURIForTokens = 'http://localhost:3000/api/metadata/license' // Replace with your actual base URI

  //     const encryptedURI = await owner.signMessage(`${baseURIForTokens}/0`)
  //     const encryptedURI1 = await owner.signMessage(`${baseURIForTokens}/1`)
  //     const encryptedURI2 = await owner.signMessage(`${baseURIForTokens}/2`)

  //     const provenanceHash = ethers.utils.formatBytes32String('0') // Convert to bytes32
  //     const provenanceHash1 = ethers.utils.formatBytes32String('1') // Convert to bytes32
  //     const provenanceHash2 = ethers.utils.formatBytes32String('2') // Convert to bytes32

  //     const _data = ethers.utils.defaultAbiCoder.encode(
  //       ['bytes', 'bytes32'],
  //       [ethers.utils.arrayify(encryptedURI), provenanceHash]
  //     )
  //     const _data1 = ethers.utils.defaultAbiCoder.encode(
  //       ['bytes', 'bytes32'],
  //       [ethers.utils.arrayify(encryptedURI1), provenanceHash1]
  //     )
  //     const _data2 = ethers.utils.defaultAbiCoder.encode(
  //       ['bytes', 'bytes32'],
  //       [ethers.utils.arrayify(encryptedURI2), provenanceHash2]
  //     )

  //     try {
  //       await license.lazyMint(amount, baseURIForTokens, _data)
  //       await license.lazyMint(amount, baseURIForTokens, _data1)
  //       await license.lazyMint(amount, baseURIForTokens, _data2)

  //       await license.setClaimConditions(
  //         0,
  //         {
  //           currency: airlineCoin.address,
  //           maxClaimableSupply: 100,
  //           metadata: JSON.stringify({ price: 0, type: 'D' }),
  //           startTimestamp: await time.latest(),
  //           quantityLimitPerWallet: 1,
  //           pricePerToken: 0,
  //           supplyClaimed: 0,
  //           merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000'
  //         },
  //         false
  //       )
  //       await license.setClaimConditions(
  //         1,
  //         {
  //           currency: airlineCoin.address,
  //           maxClaimableSupply: 100,
  //           metadata: JSON.stringify({ price: 10, type: 'C' }),
  //           startTimestamp: await time.latest(),
  //           quantityLimitPerWallet: 1,
  //           pricePerToken: 10,
  //           supplyClaimed: 0,
  //           merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000'
  //         },
  //         false
  //       )
  //       await license.setClaimConditions(
  //         2,
  //         {
  //           currency: airlineCoin.address,
  //           maxClaimableSupply: 100,
  //           metadata: JSON.stringify({ price: 100, type: 'B' }),
  //           startTimestamp: await time.latest(),
  //           quantityLimitPerWallet: 1,
  //           pricePerToken: 100,
  //           supplyClaimed: 0,
  //           merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000'
  //         },
  //         false
  //       )

  //       const cc = await license.claimCondition(0)

  //       await license.claim(
  //         otherAccount.address,
  //         0,
  //         1,
  //         airlineCoin.address,
  //         0,
  //         {
  //           proof: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
  //           quantityLimitPerWallet: cc.quantityLimitPerWallet,
  //           pricePerToken: cc.pricePerToken,
  //           currency: cc.currency
  //         },
  //         '0x00'
  //       )

  //       // const cc1 = await license.claimCondition(1)

  //       // await license.claim(
  //       //   otherAccount.address,
  //       //   1,
  //       //   1,
  //       //   airlineCoin.address,
  //       //   10,
  //       //   {
  //       //     proof: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
  //       //     quantityLimitPerWallet: cc1.quantityLimitPerWallet,
  //       //     pricePerToken: cc1.pricePerToken,
  //       //     currency: cc1.currency
  //       //   },
  //       //   '0x00'
  //       // )

  //       // const cc2 = await license.claimCondition(2)

  //       // await license.claim(
  //       //   otherAccount.address,
  //       //   2,
  //       //   1,
  //       //   airlineCoin.address,
  //       //   100,
  //       //   {
  //       //     proof: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
  //       //     quantityLimitPerWallet: cc2.quantityLimitPerWallet,
  //       //     pricePerToken: cc2.pricePerToken,
  //       //     currency: cc2.currency
  //       //   },
  //       //   '0x00'
  //       // )

  //       return { license, airlineCoin: airlineCoin.address }
  //     } catch (error) {
  //       console.log('ERROR =>', error)
  //       return { license, airlineCoin: airlineCoin.address }
  //     }
  //   }
  //   async function deployAircraft() {
  //     // Contracts are deployed using the first signer/account by default
  //     const Aircraft = await ethers.getContractFactory('AircraftNFT')
  //     const { license } = await deployLicense()

  //     const aircraft = await Aircraft.deploy(
  //       owner.address,
  //       'Aircraft',
  //       'AIRA',
  //       owner.address,
  //       0,
  //       owner.address,
  //       license.address
  //     )

  //     await aircraft.deployed()
  //     await airlineCoin.deployed()

  //     const amount = ethers.utils.parseUnits('3', 'wei') // Minting 1 token
  //     const baseURIForTokens = 'http://localhost:3000/api/metadata/aircraft' // Replace with your actual base URI
  //     const encryptedURI = await owner.signMessage(`${baseURIForTokens}/2`)
  //     const provenanceHash = ethers.utils.formatBytes32String('2') // Convert to bytes32
  //     const _data = ethers.utils.defaultAbiCoder.encode(
  //       ['bytes', 'bytes32'],
  //       [ethers.utils.arrayify(encryptedURI), provenanceHash]
  //     )

  //     try {
  //       await aircraft.lazyMint(amount, baseURIForTokens, _data)
  //       await aircraft.setClaimConditions(
  //         2,
  //         {
  //           currency: airlineCoin.address,
  //           maxClaimableSupply: 100,
  //           metadata: JSON.stringify({ price: 100, type: 'B737' }),
  //           startTimestamp: await time.latest(),
  //           quantityLimitPerWallet: 1,
  //           pricePerToken: 100,
  //           supplyClaimed: 0,
  //           merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000'
  //         },
  //         false
  //       )

  //       return { aircraft, airlineCoin: airlineCoin.address }
  //     } catch (error) {
  //       console.log('ERROR =>', error)
  //       return { aircraft, airlineCoin: airlineCoin.address }
  //     }
  //   }

  //   it('Should set the right owner', async function () {
  //     const { aircraft } = await loadFixture(deployAircraft)

  //     expect(await aircraft.owner()).to.equal(owner.address)
  //   })

  //   it('Should set new claim conditions', async () => {
  //     const { aircraft } = await loadFixture(deployAircraft)
  //     const cc = await aircraft.claimCondition(2)

  //     expect(cc.maxClaimableSupply).to.be.equal(BigNumber.from('100'))
  //   })

  //   // it('Should fail if no License 2 owned to claim Aircfrat 2', async function () {
  //   //   const { aircraft, airlineCoin } = await loadFixture(deployAircraft)
  //   //   const cc = await aircraft.claimCondition(2)

  //   //   const beforeBalance = await aircraft.balanceOf(thirdAccount.address, 2)

  //   //   expect(beforeBalance).to.equal(0)
  //   //   try {
  //   //     await aircraft.claim(
  //   //       thirdAccount.address,
  //   //       2,
  //   //       1,
  //   //       airlineCoin,
  //   //       100,
  //   //       {
  //   //         proof: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
  //   //         quantityLimitPerWallet: cc.quantityLimitPerWallet,
  //   //         pricePerToken: cc.pricePerToken,
  //   //         currency: cc.currency
  //   //       },
  //   //       '0x00'
  //   //     )
  //   //   } catch (error) {}

  //   //   const afterBalance = await aircraft.balanceOf(thirdAccount.address, 2)
  //   //   expect(afterBalance).to.equal(0)
  //   // })

  //   // it('License 2 owner should be able to claim Aircraft 2', async function () {
  //   //   const { aircraft } = await loadFixture(deployAircraft)
  //   //   const { license } = await deployLicense()
  //   //   const cc = await aircraft.claimCondition(2)

  //   //   const beforeBalance = await aircraft.balanceOf(otherAccount.address, 2)

  //   //   expect(beforeBalance).to.equal(0)
  //   //   const licenseBalance = await license.balanceOf(otherAccount.address, 2)
  //   //   expect(licenseBalance).to.equal(1)

  //   //   // await aircraft.claim(
  //   //   //   otherAccount.address,
  //   //   //   2,
  //   //   //   1,
  //   //   //   airlineCoin,
  //   //   //   100,
  //   //   //   {
  //   //   //     proof: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
  //   //   //     quantityLimitPerWallet: cc.quantityLimitPerWallet,
  //   //   //     pricePerToken: cc.pricePerToken,
  //   //   //     currency: cc.currency
  //   //   //   },
  //   //   //   '0x00'
  //   //   // )
  //   //   // const afterBalance = await aircraft.balanceOf(otherAccount.address, 2)

  //   //   // expect(afterBalance).to.equal(1)
  //   // })
  // })
})
