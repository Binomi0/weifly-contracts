import { ethers } from 'hardhat'
import { deployAircraftNFT, deployAirlineCoin, deployLicenseNFT } from '../../utils'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'

describe('Aircraft', function () {
  describe('If is an admin', async function () {
    async function deployContracts() {
      const [owner, otherAccount, thirdAccount] = await ethers.getSigners()
      const airlineCoin = await deployAirlineCoin(owner.address)
      const license = await deployLicenseNFT(owner.address)
      const aircraft = await deployAircraftNFT(owner, license.address)

      return { license, aircraft, airlineCoin, owner, otherAccount, thirdAccount }
    }
    it('Should set new required license ID', async function () {
      const { aircraft } = await loadFixture(deployContracts)

      await aircraft.setRequiredLicense(4, 4)
      expect(await aircraft.requiredLicense(4)).to.equal(4)
    })
  })

  describe('If is NOT an admin', async function () {
    async function deployContracts() {
      const [owner, otherAccount, thirdAccount] = await ethers.getSigners()
      const airlineCoin = await deployAirlineCoin(owner.address)
      const license = await deployLicenseNFT(owner.address)
      const aircraft = await deployAircraftNFT(otherAccount, license.address)

      return { license, aircraft, airlineCoin, owner, otherAccount, thirdAccount }
    }
    it('Should fail white tring to set required license ID', async function () {
      const { aircraft } = await loadFixture(deployContracts)

      try {
        await aircraft.setRequiredLicense(4, 4)
      } catch (error) {
        expect(await aircraft.requiredLicense(4)).to.equal(0)
      }
    })
  })
})
