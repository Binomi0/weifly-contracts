import { ethers } from "hardhat";
import { expect } from "chai";
import { parseEther, parseUnits } from "ethers";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("StakingAirline", async () => {
  async function deployStakingAirline() {
    const [owner, otherAccount] = await ethers.getSigners();

    const AirlineCoin = await ethers.getContractFactory("AirlineCoin");
    const StakingAirline = await ethers.getContractFactory("StakingAirline");
    const AirlineRewardCoin =
      await ethers.getContractFactory("AirlineRewardCoin");
    const NativeTokenWrapper =
      await ethers.getContractFactory("NativeTokenWrapper");

    const nativeTokenWrapper = await NativeTokenWrapper.deploy(
      owner.address,
      "NativeTokenWrapper",
      "WETH",
    );
    const airlineCoin = await AirlineCoin.deploy(
      owner.address,
      "Airline Coin",
      "AIRL",
    );
    const airlineRewardCoin = await AirlineRewardCoin.deploy(
      owner.address,
      "Airline Reward Coin",
      "AIRG",
    );
    // Contracts are deployed using the first signer/account by default
    const stakingAirline = await StakingAirline.deploy(
      1,
      owner.address,
      1,
      100,
      await airlineCoin.getAddress(),
      await airlineRewardCoin.getAddress(),
      await nativeTokenWrapper.getAddress(),
    );

    return {
      owner,
      otherAccount,
      stakingAirline,
      airlineCoin,
      airlineRewardCoin,
    };
  }

  it("Should have the right owner after deploy", async () => {
    const [owner] = await ethers.getSigners();

    const { stakingAirline } = await loadFixture(deployStakingAirline);

    expect(await stakingAirline.owner()).to.equal(owner.address);
  });

  it("Should be able to handle deposit and withdraws", async () => {
    const ONE_THOUSAND_MILLION = 1_000_000_000;
    const { stakingAirline, airlineRewardCoin } =
      await loadFixture(deployStakingAirline);

    await airlineRewardCoin.approve(
      await stakingAirline.getAddress(),
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

  it("Should be able to stake and unstake 1 token", async () => {
    const [owner, otherAccount] = await ethers.getSigners();
    const ONE_THOUSAND_MILLION = 1_000_000_000;
    const { stakingAirline, airlineRewardCoin, airlineCoin } =
      await loadFixture(deployStakingAirline);

    await airlineRewardCoin.approve(
      await stakingAirline.getAddress(),
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
      .approve(await stakingAirline.getAddress(), parseEther("1"));
    await stakingAirline.connect(otherAccount).stake(parseEther("1"));

    const stakeInfo = await stakingAirline.getStakeInfo(otherAccount.address);

    expect(stakeInfo._tokensStaked).to.equal(parseEther("1"));
  });

  it("Should be able to stake and unstake 10000 tokens", async () => {
    const [owner, otherAccount] = await ethers.getSigners();
    const ONE_THOUSAND_MILLION = 1_000_000_000;
    const { stakingAirline, airlineRewardCoin, airlineCoin } =
      await loadFixture(deployStakingAirline);

    await airlineRewardCoin.approve(
      await stakingAirline.getAddress(),
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
      .approve(await stakingAirline.getAddress(), parseEther("10000"));
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

  describe("When staked", () => {
    it("Should Stake 1 AIRL", async () => {
      const { owner, stakingAirline, airlineCoin } =
        await loadFixture(deployStakingAirline);

      await airlineCoin.approve(
        await stakingAirline.getAddress(),
        parseEther("1"),
      );
      await stakingAirline.stake(parseEther("1"));
      const stakeInfo = await stakingAirline.getStakeInfo(owner.address);
      expect(stakeInfo._tokensStaked).to.equal(parseEther("1"));
    });
    it("Should give the right rewards after 1 day", async () => {
      const { owner, stakingAirline, airlineCoin } =
        await loadFixture(deployStakingAirline);

      await airlineCoin.approve(
        await stakingAirline.getAddress(),
        parseEther("1"),
      );
      await stakingAirline.stake(parseEther("1"));
      await time.increase(10000);

      const stakeInfo = await stakingAirline.getStakeInfo(owner.address);
      expect(stakeInfo._tokensStaked).to.equal(parseEther("1"));
      expect(stakeInfo._rewards).to.equal(parseEther("100"));
    });

    it("Should give the right rewards after 7 days", async () => {
      const { owner, stakingAirline, airlineCoin } =
        await loadFixture(deployStakingAirline);

      await airlineCoin.approve(
        await stakingAirline.getAddress(),
        parseEther("1"),
      );
      await stakingAirline.stake(parseEther("1"));
      await time.increase(70000);

      const stakeInfo = await stakingAirline.getStakeInfo(owner.address);
      expect(stakeInfo._tokensStaked).to.equal(parseEther("1"));
      expect(stakeInfo._rewards).to.equal(parseEther("700"));
    });

    it("Should DENY claim rewards if rewards are less than 100", async () => {
      const { otherAccount, stakingAirline, airlineCoin } =
        await loadFixture(deployStakingAirline);

      await airlineCoin.approve(otherAccount.address, parseEther("1"));
      await airlineCoin.transfer(otherAccount.address, parseEther("1"));
      expect(await airlineCoin.balanceOf(otherAccount.address)).to.equal(
        parseEther("1"),
      );

      await airlineCoin
        .connect(otherAccount)
        .approve(await stakingAirline.getAddress(), parseEther("1"));

      await stakingAirline.connect(otherAccount).stake(parseEther("1"));
      expect(await airlineCoin.balanceOf(otherAccount.address)).to.equal(0);

      stakingAirline
        .connect(otherAccount)
        .claimRewards()
        .catch((error) => {
          expect(error.message).to.contains("Min reward withdraw is 100");
        });
    });

    it("Should ALLOW claim rewards if rewards are equal or more than 100", async () => {
      const { otherAccount, stakingAirline, airlineCoin, airlineRewardCoin } =
        await loadFixture(deployStakingAirline);

      await airlineRewardCoin.approve(
        await stakingAirline.getAddress(),
        parseEther("1000000"),
      );
      await stakingAirline.depositRewardTokens(parseEther("1000000"));

      expect(await stakingAirline.getRewardTokenBalance()).to.equal(
        parseEther("1000000"),
      );

      await airlineCoin.approve(otherAccount.address, parseEther("1"));
      await airlineCoin.transfer(otherAccount.address, parseEther("1"));
      expect(await airlineCoin.balanceOf(otherAccount.address)).to.equal(
        parseEther("1"),
      );

      expect(await airlineRewardCoin.balanceOf(otherAccount.address)).to.equal(
        0,
      );

      await airlineCoin
        .connect(otherAccount)
        .approve(await stakingAirline.getAddress(), parseEther("1"));
      await stakingAirline.connect(otherAccount).stake(parseEther("1"));

      await time.increase(10000);

      const stakeInfo = await stakingAirline.getStakeInfo(otherAccount.address);
      expect(stakeInfo._rewards).to.equal(parseEther("100"));
      expect(stakeInfo._tokensStaked).to.equal(parseEther("1"));

      await stakingAirline.connect(otherAccount).claimRewards();

      const balance = await airlineRewardCoin.balanceOf(otherAccount.address);
      expect(balance).to.equal(parseEther("100") + parseUnits("10", "finney"));
    });
  });
});
