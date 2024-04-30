import { ethers } from "hardhat";
import deployAircraft from "./nfts/aircraft";
import deployLicense from "./nfts/license";
import deployTokens from "./core/tokens";
import deployStaking from "./core/staking";
import { parseEther, parseUnits } from "ethers";
import deployFlightController from "./core/flightController";

const SMART_ACCOUNT = "0xcb3356cd40014fb43992325080330d96b2d7732f";

async function main() {
  const accounts = await ethers.getSigners();
  console.group("---- SETUP ACCOUNTS ----");
  console.log("account 1 (owner):", accounts[0].address.slice(-5));
  console.log("account 2 (otherAccount):", accounts[1].address.slice(-5));
  console.log("account 3 (thirdAccount):", accounts[2].address.slice(-5));
  console.groupEnd();
  console.log("---- ACCOUNTS SETUP OK ----");
  console.log("");
  const [owner, otherAccount, thirdAccount] = accounts;
  const initialOtherAccountBalance = await otherAccount.getBalance();
  const initialThirdAccountBalance = await thirdAccount.getBalance();

  console.log("----- INITIAL BALANCES -----");
  console.log("[ETH] otherAccount:", initialOtherAccountBalance.toString());
  console.log("[ETH] thirdAccount:", initialThirdAccountBalance.toString());
  console.log("----- INITIAL BALANCES -----");

  const { airLine, airLineReward, nativeTokenWrapper } =
    await deployTokens(owner);

  await airLine.approve(otherAccount.address, parseUnits("321", "ether"));
  await airLine.transfer(otherAccount.address, parseUnits("321", "ether"));
  await airLine.approve(thirdAccount.address, parseUnits("1", "ether"));
  await airLine.transfer(thirdAccount.address, parseUnits("1", "ether"));

  // await deployStaking(accounts, airLine, airLineReward, nativeTokenWrapper);

  // const license = await deployLicense(accounts, airLine);
  // const aircraft = await deployAircraft(accounts, airLine, license);

  // await deployFlightController(accounts, aircraft.address, airLine);

  // await airLine.approve(SMART_ACCOUNT, parseEther("100"));
  // await airLine.transfer(SMART_ACCOUNT, parseEther("100"));

  // console.log((await airLine.balanceOf(SMART_ACCOUNT)).toString());

  console.group("----- OTHER ACCOUNT -----");
  console.log(
    "otherAccount AIRL balance =>",
    (await airLine.balanceOf(otherAccount.address))
      .div(1e9)
      .div(1e9)
      .toString(),
  );
  console.log(
    "otherAccount AIRG balance =>",
    (await airLineReward.balanceOf(otherAccount.address))
      .div(1e9)
      .div(1e9)
      .toString(),
  );
  console.log(
    "otherAccount ETH balance =>",
    (await otherAccount.getBalance()).div(1e9).div(1e9).toString(),
  );
  console.log(
    "total otherAccount gas cost =>",
    initialOtherAccountBalance.sub(await otherAccount.getBalance()).toString(),
  );
  console.log("---------------------------------");
  console.groupEnd();
  console.log("");

  console.group("----- THIRD ACCOUNT -----");
  console.log(
    "thirdAccount AIRL balance =>",
    (await airLine.balanceOf(thirdAccount.address))
      .div(1e9)
      .div(1e9)
      .toString(),
  );
  console.log(
    "thirdAccount AIRG balance =>",
    (await airLineReward.balanceOf(thirdAccount.address))
      .div(1e9)
      .div(1e9)
      .toString(),
  );
  console.log(
    "thirdAccount ETH balance =>",
    (await thirdAccount.getBalance()).div(1e9).div(1e9).toString(),
  );
  console.log(
    "total thirdAccount gas cost =>",
    initialThirdAccountBalance.sub(await thirdAccount.getBalance()).toString(),
  );
  console.log("---------------------------------");
  console.groupEnd();
  console.log("");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
