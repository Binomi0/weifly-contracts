import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers'
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

describe('Aircraft Cessna 172', async function () {
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

    await lazyMintAircraft('1', 0, owner, aircraft)
    await setClaimConditionsAircraft(aircraft, 0, airlineCoin)

    const cc = await aircraft.claimCondition(0)

    expect(cc.maxClaimableSupply).to.be.equal(BigNumber.from('100'))
  })

  it('Should fail if tries to claim more than 1 aircraft', async function () {
    const { license, aircraft, owner, airlineCoin, otherAccount } = await loadFixture(deployContracts)

    await lazyMintLicense('1', 0, owner, license)
    await setClaimConditionsLicense(license, 0, airlineCoin)
    await mintLicense(license, otherAccount, 0, airlineCoin, 0)

    await lazyMintAircraft('1', 0, owner, aircraft)
    await setClaimConditionsAircraft(aircraft, 0, airlineCoin)

    try {
      await mintAircraft(aircraft, otherAccount, 0, airlineCoin, 2)
      expect(0).to.equal(1)
    } catch (error) {
      expect(await aircraft.balanceOf(otherAccount.address, 0)).to.equal(0)
    }
  })

  it('Should reject if has not license 0', async function () {
    const { license, aircraft, owner, otherAccount } = await loadFixture(deployContracts)
    const beforeBalance = await aircraft.balanceOf(otherAccount.address, 0)
    expect(beforeBalance).to.equal(0)

    await lazyMintLicense('1', 0, owner, license)

    try {
      await lazyMintAircraft('1', 0, owner, aircraft)
    } catch (error) {
      expect(true).to.equal(true)
    }

    const afterBalance = await aircraft.balanceOf(otherAccount.address, 0)
    expect(afterBalance).to.equal(0)
  })

  it('Should be able to claim if has license 0', async function () {
    const { license, aircraft, owner, otherAccount, airlineCoin } = await loadFixture(deployContracts)
    const beforeBalance = await aircraft.balanceOf(otherAccount.address, 0)
    expect(beforeBalance).to.equal(0)

    await lazyMintLicense('1', 0, owner, license)
    await setClaimConditionsLicense(license, 0, airlineCoin)
    await mintLicense(license, otherAccount, 0, airlineCoin, 0)

    expect(await license.balanceOf(otherAccount.address, 0)).to.equal(1)
    expect(await aircraft.balanceOf(otherAccount.address, 0)).to.equal(0)

    await lazyMintAircraft('1', 0, owner, aircraft)
    await setClaimConditionsAircraft(aircraft, 0, airlineCoin)
    await mintAircraft(aircraft, otherAccount, 0, airlineCoin)

    const afterBalance = await aircraft.balanceOf(otherAccount.address, 0)
    expect(afterBalance).to.equal(1)
  })
})
