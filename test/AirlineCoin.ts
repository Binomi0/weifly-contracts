import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('AirlineCoin', function () {
  async function deployAirlineCoin() {
    const ONE_MILLION = 1_000_000

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners()
    const lockedAmount = ONE_MILLION
    const AirlineCoin = await ethers.getContractFactory('AirlineCoin')
    const airlineCoin = await AirlineCoin.deploy(owner.address, 'Airline Coin', 'AIRL')

    return { airlineCoin, owner, otherAccount, lockedAmount }
  }

  it('Should set the right owner', async function () {
    const { airlineCoin, owner } = await loadFixture(deployAirlineCoin)

    expect(await airlineCoin.owner()).to.equal(owner.address)
  })

  it('Should receive and store the funds', async function () {
    const { airlineCoin, owner } = await loadFixture(deployAirlineCoin)

    expect(await airlineCoin.balanceOf(owner.address)).to.equal(ethers.utils.parseEther('1000000'))
  })
})
