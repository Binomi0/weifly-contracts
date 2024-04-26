import { ethers } from "hardhat";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";

describe("StakingAirline", async () => {
  async function deployAirlineCoin() {
    const [owner] = await ethers.getSigners();
    const ONE_MILLION = 1_000_000;
    // Contracts are deployed using the first signer/account by default
    const lockedAmount = ONE_MILLION;
    const AirlineCoin = await ethers.getContractFactory("AirlineCoin");
    const airlineCoin = await AirlineCoin.deploy(
      owner.address,
      "Airline Coin",
      "AIRL",
    );

    return { airlineCoin, lockedAmount };
  }
  async function deployAirlineRewardCoin() {
    const [owner] = await ethers.getSigners();
    const ONE_THOUSAND_MILLION = 1_000_000_000;

    // Contracts are deployed using the first signer/account by default
    const lockedAmount = ONE_THOUSAND_MILLION;
    const AirlineRewardCoin =
      await ethers.getContractFactory("AirlineRewardCoin");
    const airlineRewardCoin = await AirlineRewardCoin.deploy(
      owner.address,
      "Airline Reward Coin",
      "AIRG",
    );

    return { airlineRewardCoin, lockedAmount };
  }
  async function deployNativeTokenWrapper() {
    const [owner] = await ethers.getSigners();

    // Contracts are deployed using the first signer/account by default
    const NativeTokenWrapper =
      await ethers.getContractFactory("NativeTokenWrapper");
    const nativeTokenWrapper = await NativeTokenWrapper.deploy(
      owner.address,
      "NativeTokenWrapper",
      "WETH",
    );

    return { nativeTokenWrapper };
  }
  async function deployStakingAirline() {
    const [owner] = await ethers.getSigners();

    const { airlineCoin } = await deployAirlineCoin();
    const { airlineRewardCoin } = await deployAirlineRewardCoin();
    const { nativeTokenWrapper } = await deployNativeTokenWrapper();
    // Contracts are deployed using the first signer/account by default
    const StakingAirline = await ethers.getContractFactory("StakingAirline");
    const stakingAirline = await StakingAirline.deploy(
      1,
      owner.address,
      1,
      100,
      airlineCoin.address,
      airlineRewardCoin.address,
      nativeTokenWrapper.address,
    );

    return { stakingAirline, airlineCoin, airlineRewardCoin };
  }

  it("Should have the right owner after deploy", async () => {
    const [owner] = await ethers.getSigners();

    const { stakingAirline } = await deployStakingAirline();

    expect(await stakingAirline.owner()).to.equal(owner.address);
  });

  it("Should be able to handle deposit and withdraws", async () => {
    const [owner] = await ethers.getSigners();
    const ONE_THOUSAND_MILLION = 1_000_000_000;
    const { stakingAirline, airlineRewardCoin } = await deployStakingAirline();

    airlineRewardCoin.approve(
      stakingAirline.address,
      parseEther(ONE_THOUSAND_MILLION.toString()),
    );

    await stakingAirline.depositRewardTokens(
      parseEther(ONE_THOUSAND_MILLION.toString()),
    );
    expect(await stakingAirline.getRewardTokenBalance()).to.equal(
      parseEther(ONE_THOUSAND_MILLION.toString()),
    );

    await stakingAirline.withdrawRewardTokens(
      parseEther(ONE_THOUSAND_MILLION.toString()),
    );

    expect(await stakingAirline.getRewardTokenBalance()).to.equal(0);
  });

  it("Should be able to stake and unstake user tokens", async () => {
    const [owner, otherAccount] = await ethers.getSigners();
    const ONE_THOUSAND_MILLION = 1_000_000_000;
    const { stakingAirline, airlineRewardCoin, airlineCoin } =
      await deployStakingAirline();

    airlineRewardCoin.approve(
      stakingAirline.address,
      parseEther(ONE_THOUSAND_MILLION.toString()),
    );

    await stakingAirline.depositRewardTokens(
      parseEther(ONE_THOUSAND_MILLION.toString()),
    );

    expect(await stakingAirline.getRewardTokenBalance()).to.equal(
      parseEther(ONE_THOUSAND_MILLION.toString()),
    );

    expect(await airlineCoin.balanceOf(owner.address)).to.equal(
      parseEther("1000000"),
    );

    await airlineCoin.approve(otherAccount.address, parseEther("1"));
    await airlineCoin.transfer(otherAccount.address, parseEther("1"));
    await airlineCoin
      .connect(otherAccount)
      .approve(stakingAirline.address, parseEther("1"));
    await stakingAirline.connect(otherAccount).stake(parseEther("1"));

    const stakeInfo = await stakingAirline.getStakeInfo(otherAccount.address);

    expect(stakeInfo._tokensStaked).to.equal(parseEther("1"));
  });

  it("Should be able to stake and unstake user tokens", async () => {
    const [owner, otherAccount] = await ethers.getSigners();
    const ONE_THOUSAND_MILLION = 1_000_000_000;
    const { stakingAirline, airlineRewardCoin, airlineCoin } =
      await deployStakingAirline();

    airlineRewardCoin.approve(
      stakingAirline.address,
      parseEther(ONE_THOUSAND_MILLION.toString()),
    );

    await stakingAirline.depositRewardTokens(
      parseEther(ONE_THOUSAND_MILLION.toString()),
    );

    expect(await stakingAirline.getRewardTokenBalance()).to.equal(
      parseEther(ONE_THOUSAND_MILLION.toString()),
    );

    expect(await airlineCoin.balanceOf(owner.address)).to.equal(
      parseEther("1000000"),
    );

    await airlineCoin.approve(otherAccount.address, parseEther("10000"));
    await airlineCoin.transfer(otherAccount.address, parseEther("10000"));
    await airlineCoin
      .connect(otherAccount)
      .approve(stakingAirline.address, parseEther("10000"));
    await stakingAirline.connect(otherAccount).stake(parseEther("10000"));

    const stakeInfo = await stakingAirline.getStakeInfo(otherAccount.address);
    expect(stakeInfo._tokensStaked).to.equal(parseEther("10000"));

    await stakingAirline.connect(otherAccount).withdraw(parseEther("10000"));

    const unStakeInfo = await stakingAirline.getStakeInfo(otherAccount.address);
    expect(unStakeInfo._tokensStaked).to.equal(0);
    expect(unStakeInfo._rewards).to.equal(parseEther("100"));
    expect(await airlineRewardCoin.balanceOf(otherAccount.address)).to.equal(0);

    await stakingAirline.connect(otherAccount).claimRewards();
    expect(await airlineRewardCoin.balanceOf(otherAccount.address)).to.equal(
      parseEther("100"),
    );
  });
});
