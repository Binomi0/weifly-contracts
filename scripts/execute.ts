import { ethers } from "hardhat";
import {
  ACCOUNT_ADDR,
  COIN_ADDR,
  FC_ADDR,
  REWARD_ADDR,
  STAKING_ADDR,
} from "./smart-account";
import { parseEther } from "ethers";

async function main() {
  const account = await ethers.getContractAt("BaseAccount", ACCOUNT_ADDR);
  const coin = await ethers.getContractAt("AirlineCoin", COIN_ADDR);
  const reward = await ethers.getContractAt("AirlineRewardCoin", REWARD_ADDR);
  const staking = await ethers.getContractAt("StakingAirline", STAKING_ADDR);
  const flightController = await ethers.getContractAt(
    "FlightController",
    FC_ADDR,
  );

  await coin.approve(await account.getAddress(), parseEther("100"));
  await coin.transfer(await account.getAddress(), parseEther("100"));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
