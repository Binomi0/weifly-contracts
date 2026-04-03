import hre from "hardhat";
import { expect } from "chai";
import { describe, it } from "node:test";
import { parseEther } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { StakingAirline } from "@artifacts/contracts/v1/StakingAirline.sol";
import { AirlineCoin } from "@artifacts/contracts/v1/tokens/AirlineCoin.sol";
import { AirlineRewardCoin } from "@artifacts/contracts/v1/tokens/AirlineRewardCoin.sol";
import { deployAirlineCoin } from "../../utils.js";
import deployStaking from "@scripts/core/staking.js";

const net = hre as HardhatRuntimeEnvironment;
const { ethers, networkHelpers } = await net.network.connect();

const { time, mine } = networkHelpers;

describe("StakingAirline: Production Tests", async () => {
  async function deployStakingAirlineFixture() {
    const [owner, pilot1, pilot2] = await ethers.getSigners();

    const airlineCoin = await deployAirlineCoin(owner.address);
    const StakingAirline = await deployStaking(owner.address);
    const AirlineRewardCoin =
      await ethers.getContractFactory("AirlineRewardCoin");
    const NativeTokenWrapper =
      await ethers.getContractFactory("NativeTokenWrapper");

    const nativeTokenWrapper = await NativeTokenWrapper.deploy(
      owner.address,
      "WETH",
      "WETH",
    );

    const airlineRewardCoin: AirlineRewardCoin = await AirlineRewardCoin.deploy(
      owner.address,
      "Reward Coin",
      "AIRG",
    );

    const stakingAirline: StakingAirline = await StakingAirline.deploy(
      1n,
      owner.address,
      1n,
      100n, // ratio 1/100: cada 100 tokens por 1 segundo generan 1 reward
      await airlineCoin.getAddress(),
      await airlineRewardCoin.getAddress(),
      await nativeTokenWrapper.getAddress(),
    );

    const stakingAddr = await stakingAirline.getAddress();
    await airlineRewardCoin.approve(stakingAddr, parseEther("10000000"));
    await stakingAirline.depositRewardTokens(parseEther("10000000"));

    return {
      owner,
      pilot1,
      pilot2,
      stakingAirline,
      airlineCoin,
      airlineRewardCoin,
    };
  }

  describe("Boundary: Staking Amounts", () => {
    it("Exactly 1 token (min) and 1M tokens (max)", async () => {
      const { stakingAirline, airlineCoin, pilot1 } =
        await deployStakingAirlineFixture();
      const min = parseEther("1");
      const max = parseEther("1000000");

      await airlineCoin.transfer(pilot1.address, max);
      await airlineCoin
        .connect(pilot1)
        .approve(await stakingAirline.getAddress(), max);

      await stakingAirline.connect(pilot1).stake(min);
      const infoMin = await stakingAirline.getStakeInfo(pilot1.address);
      expect(infoMin._tokensStaked).to.equal(min);

      await stakingAirline.connect(pilot1).stake(max - min);
      const infoMax = await stakingAirline.getStakeInfo(pilot1.address);
      expect(infoMax._tokensStaked).to.equal(max);
    });

    it("Fail: Below 1 token (1e18 - 1)", async () => {
      const { stakingAirline, pilot1 } = await deployStakingAirlineFixture();
      const small = parseEther("1") - 1n;
      try {
        await stakingAirline.connect(pilot1).stake(small);
        throw new Error("Did not revert");
      } catch (e: any) {
        expect(e.message).to.contain("Stake amount below minimum");
      }
    });

    it("Fail: Above 1M tokens (1e6 + 1e-18)", async () => {
      const { stakingAirline, pilot1 } = await deployStakingAirlineFixture();
      const over = parseEther("1000001");
      try {
        await stakingAirline.connect(pilot1).stake(over);
        throw new Error("Did not revert");
      } catch (e: any) {
        expect(e.message).to.contain("Stake amount exceeds maximum");
      }
    });
  });

  describe("Boundary: Reward Claims", () => {
    it("Exactly 100 rewards: Should allow claim", async () => {
      const { stakingAirline, airlineCoin, pilot1 } =
        await deployStakingAirlineFixture();
      const stakeAmount = parseEther("100");
      await airlineCoin.transfer(pilot1.address, stakeAmount);
      await airlineCoin
        .connect(pilot1)
        .approve(await stakingAirline.getAddress(), stakeAmount);

      const startTime = await time.latest();
      await time.setNextBlockTimestamp(startTime + 10);
      await stakingAirline.connect(pilot1).stake(stakeAmount);

      await time.setNextBlockTimestamp(startTime + 110);
      // 100 seconds passed. 100 tokens * 100 / 100 = 100 rewards.

      // Manual check for no revert
      await stakingAirline.connect(pilot1).claimRewards();
    });

    it("Exactly 99.99 rewards: Should deny claim", async () => {
      const { stakingAirline, airlineCoin, pilot1 } =
        await deployStakingAirlineFixture();
      const stakeAmount = parseEther("100");
      await airlineCoin.transfer(pilot1.address, stakeAmount);
      await airlineCoin
        .connect(pilot1)
        .approve(await stakingAirline.getAddress(), stakeAmount);

      const startTime = await time.latest();
      await time.setNextBlockTimestamp(startTime + 10);
      await stakingAirline.connect(pilot1).stake(stakeAmount);

      // 99 seconds = 99 rewards
      await time.setNextBlockTimestamp(startTime + 10 + 99);

      try {
        await stakingAirline.connect(pilot1).claimRewards();
        throw new Error("Did not revert");
      } catch (e: any) {
        expect(e.message).to.contain("Rewards below minimum claim amount");
      }
    });
  });

  describe("Isolation and Continuity", () => {
    it("Multi-pilot Isolation", async () => {
      const { stakingAirline, airlineCoin, pilot1, pilot2 } =
        await deployStakingAirlineFixture();

      const addr = await stakingAirline.getAddress();
      await airlineCoin.transfer(pilot1.address, parseEther("100"));
      await airlineCoin.transfer(pilot2.address, parseEther("500"));
      await airlineCoin.connect(pilot1).approve(addr, parseEther("100"));
      await airlineCoin.connect(pilot2).approve(addr, parseEther("500"));

      const startTime = await time.latest();
      await time.setNextBlockTimestamp(startTime + 10);
      await stakingAirline.connect(pilot1).stake(parseEther("100"));

      await time.setNextBlockTimestamp(startTime + 110);
      await stakingAirline.connect(pilot2).stake(parseEther("500"));

      await time.setNextBlockTimestamp(startTime + 120);
      await mine(); // Ensure the latest block is at T120

      const info1 = await stakingAirline.getStakeInfo(pilot1.address);
      const info2 = await stakingAirline.getStakeInfo(pilot2.address);

      expect(info1._rewards).to.equal(parseEther("110"));
      expect(info2._rewards).to.equal(parseEther("50"));
    });

    it("Continuity: Re-staking preserves pending rewards", async () => {
      const { stakingAirline, airlineCoin, pilot1 } =
        await deployStakingAirlineFixture();

      await airlineCoin.transfer(pilot1.address, parseEther("200"));
      await airlineCoin
        .connect(pilot1)
        .approve(await stakingAirline.getAddress(), parseEther("200"));

      const startTime = await time.latest();
      await time.setNextBlockTimestamp(startTime + 10);
      await stakingAirline.connect(pilot1).stake(parseEther("100"));

      await time.setNextBlockTimestamp(startTime + 60);
      await stakingAirline.connect(pilot1).stake(parseEther("100"));

      await time.setNextBlockTimestamp(startTime + 110);
      await mine(); // Ensure latest block is at T110

      const info = await stakingAirline.getStakeInfo(pilot1.address);
      expect(info._rewards).to.equal(parseEther("150"));
    });
  });
});
