import { describe, it } from "node:test";

import hre from "hardhat";
import { expect } from "chai";
import { parseEther } from "ethers";

const { ethers } = await hre.network.connect();

describe("AirlineCoin", function () {
  async function deployAirlineCoin() {
    const ONE_MILLION = 1_000_000;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    const lockedAmount = ONE_MILLION;
    const AirlineCoin = await ethers.getContractFactory("AirlineCoin");
    const airlineCoin = await AirlineCoin.deploy(owner.address);

    return { airlineCoin, owner, otherAccount, lockedAmount };
  }

  it("Should set the right owner", async function () {
    const { airlineCoin, owner } = await deployAirlineCoin();

    expect(await airlineCoin.owner()).to.equal(owner.address);
  });

  it("Should receive and store the funds", async function () {
    const { airlineCoin, owner } = await deployAirlineCoin();

    expect(await airlineCoin.balanceOf(owner.address)).to.equal(
      parseEther("1000000"),
    );
  });
});
