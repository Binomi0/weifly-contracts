import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers/lib/utils";

describe("AirlineRewardCoin", function () {
  const ONE_THOUSAND_MILLION = 1_000_000_000;

  async function deployAirlineRewardCoin() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    const lockedAmount = ONE_THOUSAND_MILLION;
    const AirlineRewardCoin =
      await ethers.getContractFactory("AirlineRewardCoin");
    const airlineRewardCoin = await AirlineRewardCoin.deploy(
      owner.address,
      "Airline Reward Coin",
      "AIRG",
    );

    return { airlineRewardCoin, owner, otherAccount, lockedAmount };
  }

  it("Should set the right owner", async function () {
    const { airlineRewardCoin, owner } = await loadFixture(
      deployAirlineRewardCoin,
    );

    expect(await airlineRewardCoin.owner()).to.equal(owner.address);
  });

  it("Should be initialized with right amount of tokens", async function () {
    const { airlineRewardCoin, owner } = await loadFixture(
      deployAirlineRewardCoin,
    );

    expect(await airlineRewardCoin.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther(ONE_THOUSAND_MILLION.toString()),
    );
  });

  it("Should be able to send funds", async () => {
    const { airlineRewardCoin, owner, otherAccount } = await loadFixture(
      deployAirlineRewardCoin,
    );

    await airlineRewardCoin.approve(otherAccount.address, parseEther("100"));
    await airlineRewardCoin.transfer(otherAccount.address, parseEther("100"));
    const balance = await airlineRewardCoin.balanceOf(otherAccount.address);

    expect(balance).to.equal(parseEther("100"));
  });
});
