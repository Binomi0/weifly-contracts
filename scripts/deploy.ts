import { ethers } from "hardhat";
import deployAircraft from "./aircraft";
import deployLicense from "./license";
import deployTokens from "./tokens";
import deployStaking from "./staking";
import { parseEther, parseUnits } from "ethers/lib/utils";
import deployFlightController from "./flightController";

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

  const license = await deployLicense(accounts, airLine);
  const aircraft = await deployAircraft(accounts, airLine, license);
  // await deployFlightController(accounts, aircraft.address, airLine);

  await airLineReward.approve(otherAccount.address, parseEther("1"));
  await airLineReward.transfer(otherAccount.address, parseEther("1"));

  await airLineReward
    .connect(otherAccount)
    .approve(aircraft.address, parseEther("1"));
  await airLineReward
    .connect(otherAccount)
    .transfer(aircraft.address, parseEther("1"));

  airLineReward.on("Transfer", (...args) => {
    const [from, to, amount] = args;
    console.log(from === otherAccount.address);
    console.log(to === aircraft.address);
    console.log(parseEther("1").eq(amount));
  });
  console.log((await airLineReward.balanceOf(aircraft.address)).toString());

  await airLineReward.approve(aircraft.address, parseEther("1"), {
    from: aircraft.address,
  });
  console.log("Approved");

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
