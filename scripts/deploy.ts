import { ethers } from "hardhat";
import deployAircraft from "./aircraft";
import deployLicense from "./license";
import deployTokens from "./tokens";
import deployStaking from "./staking";
import { parseUnits } from "ethers/lib/utils";
import deployFlightController from "./flightController";

async function main() {
  const accounts = await ethers.getSigners();
  console.group("---- SETUP ACCOUNTS ----");
  console.log("account 1 (owner):", accounts[0].address);
  console.log("account 2 (otherAccount):", accounts[1].address);
  console.groupEnd();
  console.log("---- ACCOUNTS SETUP OK ----");
  console.log("");
  const [owner, otherAccount] = accounts;
  const initialBalance = await otherAccount.getBalance();
  const { airLine, airLineReward, nativeTokenWrapper } =
    await deployTokens(owner);

  await airLine.approve(otherAccount.address, parseUnits("1", "ether"));
  await airLine.transfer(otherAccount.address, parseUnits("1", "ether"));

  await deployStaking(accounts, airLine, airLineReward, nativeTokenWrapper);

  const license = await deployLicense(accounts, airLine);
  const aircraft = await deployAircraft(accounts, airLine, license);

  // await deployFlightController(accounts, aircraft.address, airLine)

  // console.log(
  //   'otherAccount AIRL balance =>',
  //   (await airLine.balanceOf(otherAccount.address)).div(1e9).div(1e9).toString()
  // )
  // console.log(
  //   'otherAccount AIRG balance =>',
  //   (await airLineReward.balanceOf(otherAccount.address)).div(1e9).div(1e9).toString()
  // )
  // console.log('otherAccount ETH balance =>', (await otherAccount.getBalance()).div(1e9).div(1e9).toString())
  // console.log('total otherAccount gas cost =>', initialBalance.sub(await otherAccount.getBalance()).toString())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
