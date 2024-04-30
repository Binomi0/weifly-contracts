import { ethers } from "hardhat";
import { parseUnits } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  AirlineCoin,
  AirlineRewardCoin,
  NativeTokenWrapper,
} from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const handleError = (err: unknown) => {
  const { error } = err as { error: Error };
  console.log(error.message);
};

const deployStaking = async (
  accounts: SignerWithAddress[],
  airLine: AirlineCoin,
  airLineReward: AirlineRewardCoin,
  nativeTokenWrapper: NativeTokenWrapper,
) => {
  console.group("#####  DEPLOY  STAKING  #####");
  const [owner, otherAccount] = accounts;
  const StakingAirline = await ethers.getContractFactory("StakingAirline");
  const stakingAirline = await StakingAirline.deploy(
    1,
    owner.address,
    1,
    100,
    airLine.address,
    airLineReward.address,
    nativeTokenWrapper.address,
  );
  await stakingAirline.deployed();
  console.log("Staking Deployed:", stakingAirline.address);

  console.log("----- OWNER DEPOSIT REWARDS -----");
  console.log("Balance before:", await airLineReward.balanceOf(owner.address));
  await airLineReward.approve(
    stakingAirline.address,
    parseUnits("1000000000", "ether"),
  );
  await stakingAirline.depositRewardTokens(parseUnits("1000000000", "ether"));
  console.log("Balance after:", await airLineReward.balanceOf(owner.address));
  console.log("----- OWNER REWARDS DEPOSITED -----");

  console.log(
    "OtherAccount AIRG balance:",
    await airLineReward.balanceOf(otherAccount.address),
  );
  const stakingRewardBalance = await stakingAirline.getRewardTokenBalance();
  console.log(
    "Staking Balance",
    stakingRewardBalance.div(1e9).div(1e9).toString(),
  );

  console.log(
    "OTHERACCOUNT AIRL Balance before stake",
    (await airLine.balanceOf(otherAccount.address)).toString(),
  );
  console.log("OTHER ACOUNT APPROVE 1 ETHER");
  await airLine
    .connect(otherAccount)
    .approve(stakingAirline.address, parseUnits("1", "ether"));
  // await airLine.transferFrom(otherAccount.address, stakingAirline.address, parseUnits('100', 'ether'))
  console.log("OTHER ACOUNT STAKE 1 ETHER");
  await stakingAirline.connect(otherAccount).stake(parseUnits("1", "ether"));
  const _stakeInfo = await stakingAirline
    .connect(otherAccount)
    .getStakeInfo(otherAccount.address);
  console.log(
    "✔️ tokensStaked:",
    _stakeInfo._tokensStaked.div(1e9).div(1e9).toString(),
  );
  console.log("Simulate 1 day");
  await time.increase(10000);

  console.log("OTHER ACOUNT WITHDRAW 1 ETHER...");
  await stakingAirline.connect(otherAccount).withdraw(parseUnits("1", "ether"));
  const stakeInfo = await stakingAirline
    .connect(otherAccount)
    .getStakeInfo(otherAccount.address);
  const { _rewards: rewards, _tokensStaked } = stakeInfo;
  console.log("✔️ _tokensStaked:", _tokensStaked.toString());

  if (stakingRewardBalance.gte(rewards)) {
    if (rewards.div(1e9).div(1e9).gte(100)) {
      try {
        console.log(
          "OTHER ACOUNT CLAIMiNG REWARDS...",
          rewards.div(1e9).div(1e9).toString(),
        );
        await stakingAirline.connect(otherAccount).claimRewards();
        console.log(
          "✔️ Rewards claimed!, otherAccount AIRG:",
          (await airLineReward.balanceOf(otherAccount.address))
            .div(1e9)
            .div(1e9)
            .toString(),
        );
      } catch (err) {
        handleError(err);
      }
    }
  }

  console.log(
    "new reward balance token of staking contract:",
    (await stakingAirline.getRewardTokenBalance()).div(1e9).div(1e9).toString(),
  );

  console.log("----- STAKING DEPLOYED OK -----");
  console.groupEnd();
  console.log("");
};

export default deployStaking;
