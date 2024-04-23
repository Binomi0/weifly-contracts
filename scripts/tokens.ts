import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'

const deployTokens = async (owner: SignerWithAddress) => {
  console.group('---- DEPLOY TOKENS ----')
  console.log('---- DEPLOY AIRL ----')
  const Airline = await ethers.getContractFactory('AirlineCoin')
  const airLine = await Airline.deploy(owner.address, 'Airline Coin', 'AIRL')
  await airLine.deployed()
  console.log(`deployed to ${airLine.address}`)
  console.log('---- AIRL DEPLOYED ----')

  console.log('---- DEPLOY AIRG ----')
  const AirlineRewardCoin = await ethers.getContractFactory('AirlineRewardCoin')
  const airLineReward = await AirlineRewardCoin.deploy(owner.address, 'Airline Gas', 'FLG')
  await airLineReward.deployed()
  console.log(`deployed to ${airLineReward.address}`)
  console.log('---- AIRG DEPLOYED ----')

  console.log('---- ADMINS ----')
  console.log('AIRL Admin =>', await airLine.owner())
  console.log('AIRG Admin =>', await airLineReward.owner())
  console.log('')

  const NativeTokenWrapper = await ethers.getContractFactory('NativeTokenWrapper')
  const nativeTokenWrapper = await NativeTokenWrapper.deploy(owner.address, 'Wrapped ETH', 'WETH')
  await nativeTokenWrapper.deployed()

  console.log(`NativeTokenWrapper deployed to ${nativeTokenWrapper.address}`)

  console.log('---- TOKENS DEPLOYED OK ----')
  console.groupEnd()
  console.log('')
  return { owner, airLine, airLineReward, nativeTokenWrapper }
}

export default deployTokens
