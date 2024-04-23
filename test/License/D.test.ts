import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'
import {
  deployAirlineCoin,
  deployLicenseNFT,
  lazyMintLicense,
  mintLicense,
  setClaimConditionsLicense
} from '../../utils'

describe('License D NFT', async function () {
  async function deployContracts() {
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners()
    const airlineCoin = await deployAirlineCoin(owner.address)
    const license = await deployLicenseNFT(owner.address)

    return { license, airlineCoin, owner, otherAccount, thirdAccount }
  }

  it('Should set the right owner', async function () {
    const { license, owner } = await loadFixture(deployContracts)
    expect(await license.owner()).to.equal(owner.address)
  })

  it('Should set new claim conditions', async () => {
    const { license, airlineCoin } = await loadFixture(deployContracts)
    await setClaimConditionsLicense(license, 0, airlineCoin)

    const cc = await license.claimCondition(0)
    expect(cc.maxClaimableSupply).to.be.equal(BigNumber.from('100'))
    expect(cc.pricePerToken.toNumber()).to.equal(0)
  })

  it('Any address should be able to claim license D', async () => {
    const { license, owner, otherAccount, airlineCoin } = await loadFixture(deployContracts)
    await lazyMintLicense('1', 0, owner, license)
    await setClaimConditionsLicense(license, 0, airlineCoin)
    await mintLicense(license, otherAccount, 0, airlineCoin, 0)

    const balance = await license.balanceOf(otherAccount.address, 0)
    expect(balance).to.equal(1)
  })

  it('Any address should be able to claim license D', async () => {
    const { license, owner, airlineCoin, thirdAccount } = await loadFixture(deployContracts)
    await lazyMintLicense('1', 0, owner, license)
    await setClaimConditionsLicense(license, 0, airlineCoin)
    await mintLicense(license, thirdAccount, 0, airlineCoin, 0)

    const balance = await license.balanceOf(thirdAccount.address, 0)
    expect(balance).to.equal(1)
  })
})
