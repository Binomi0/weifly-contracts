import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'
import {
  deployAircraftNFT,
  deployAirlineCoin,
  deployLicenseNFT,
  lazyMintAircraft,
  lazyMintLicense,
  mintAircraft,
  mintLicense,
  setClaimConditionsAircraft,
  setClaimConditionsLicense
} from '../../utils'

describe('Aircraft Antonov AN225', async function () {
  async function deployContracts() {
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners()
    const airlineCoin = await deployAirlineCoin(owner.address)
    const license = await deployLicenseNFT(owner.address)
    const aircraft = await deployAircraftNFT(owner, license.address)

    return { license, aircraft, airlineCoin, owner, otherAccount, thirdAccount }
  }

  it('Should set the right owner', async function () {
    const [owner] = await ethers.getSigners()
    const { aircraft } = await loadFixture(deployContracts)

    expect(await aircraft.owner()).to.equal(owner.address)
  })

  it('Should set new claim conditions', async () => {
    const { aircraft, airlineCoin, owner } = await loadFixture(deployContracts)

    await lazyMintAircraft('4', 3, owner, aircraft)
    await setClaimConditionsAircraft(aircraft, 3, airlineCoin)

    const cc = await aircraft.claimCondition(3)

    expect(cc.maxClaimableSupply).to.be.equal(BigNumber.from('100'))
  })

  it('Should reject if no license 3 owner', async function () {
    const { aircraft, owner, otherAccount, airlineCoin } = await loadFixture(deployContracts)
    const beforeBalance = await aircraft.balanceOf(otherAccount.address, 3)
    expect(beforeBalance).to.equal(0)

    await lazyMintAircraft('4', 3, owner, aircraft)
    await setClaimConditionsAircraft(aircraft, 3, airlineCoin)
    try {
      await mintAircraft(aircraft, otherAccount, 3, airlineCoin)
      expect(true).to.equal(false)
    } catch (error) {
      const afterBalance = await aircraft.balanceOf(otherAccount.address, 3)
      expect(afterBalance).to.equal(0)
    }
  })

  it('Should be able to claim if has license 3', async function () {
    const { license, aircraft, owner, otherAccount, airlineCoin } = await loadFixture(deployContracts)
    const beforeBalance = await aircraft.balanceOf(otherAccount.address, 2)
    expect(beforeBalance).to.equal(0)

    await lazyMintLicense('4', 0, owner, license)
    await setClaimConditionsLicense(license, 0, airlineCoin)
    await mintLicense(license, otherAccount, 0, airlineCoin, 0)
    await lazyMintLicense('4', 1, owner, license)
    await setClaimConditionsLicense(license, 1, airlineCoin)
    await mintLicense(license, otherAccount, 1, airlineCoin, 0)
    await lazyMintLicense('4', 2, owner, license)
    await setClaimConditionsLicense(license, 2, airlineCoin)
    await mintLicense(license, otherAccount, 2, airlineCoin, 1)
    await lazyMintLicense('4', 3, owner, license)
    await setClaimConditionsLicense(license, 3, airlineCoin)
    await mintLicense(license, otherAccount, 3, airlineCoin, 2)

    expect(await license.balanceOf(otherAccount.address, 0)).to.equal(1)
    expect(await license.balanceOf(otherAccount.address, 1)).to.equal(1)
    expect(await license.balanceOf(otherAccount.address, 2)).to.equal(1)
    expect(await license.balanceOf(otherAccount.address, 3)).to.equal(1)
    expect(await aircraft.balanceOf(otherAccount.address, 3)).to.equal(0)

    await lazyMintAircraft('4', 3, owner, aircraft)
    await setClaimConditionsAircraft(aircraft, 3, airlineCoin)
    await mintAircraft(aircraft, otherAccount, 3, airlineCoin)

    const afterBalance = await aircraft.balanceOf(otherAccount.address, 3)
    expect(afterBalance).to.equal(1)
  })
})
