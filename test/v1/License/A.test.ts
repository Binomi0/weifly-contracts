import { describe, it } from "node:test";

import hre from "hardhat";
import { expect } from "chai";

import {
  deployAirlineCoin,
  deployLicenseNFT,
  lazyMintLicense,
  mintLicense,
  setClaimConditionsLicense,
} from "../../../utils.js";

const { ethers, networkHelpers } = await hre.network.connect();

describe("License A NFT", async function () {
  async function deployFixture() {
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
    const airlineCoin = await deployAirlineCoin(owner.address);
    const license = await deployLicenseNFT(owner.address);

    return { license, airlineCoin, owner, otherAccount, thirdAccount };
  }

  async function setBalances(
    airlineCoin: AirlineCoin,
    from: HardhatEthersSigner,
    to: string,
    amount: string,
  ) {
    await airlineCoin
      .connect(from)
      .approve(to, ethers.parseUnits(amount, "ether"));
    await airlineCoin
      .connect(from)
      .transfer(to, ethers.parseUnits(amount, "ether"));
  }

  it("Should set the right owner", async function () {
    const { license, owner } = await networkHelpers.loadFixture(deployFixture);

    expect(await license.owner()).to.equal(owner.address);
  });

  it("Should set new claim conditions", async () => {
    const { license, owner, airlineCoin } =
      await networkHelpers.loadFixture(deployFixture);
    await lazyMintLicense("4", 3n, owner, license);
    await setClaimConditionsLicense(license, 3n, airlineCoin);

    const cc = await license.claimCondition(3n);

    expect(cc.maxClaimableSupply).to.be.equal(100n);
  });

  it("Should set the right URI", async () => {
    const { license, owner, airlineCoin, otherAccount } =
      await networkHelpers.loadFixture(deployFixture);
    await setBalances(airlineCoin, owner, otherAccount.address, "160");
    await airlineCoin
      .connect(otherAccount)
      .approve(license.address, ethers.parseUnits("160", "ether"));

    await lazyMintLicense("4", 3n, owner, license);
    await setClaimConditionsLicense(license, 3n, airlineCoin);
    await mintLicense(license, otherAccount, 3n, airlineCoin, 0);

    expect(await license.balanceOf(otherAccount.address, 3n)).to.equal(1);

    await setClaimConditionsLicense(license, 2n, airlineCoin);
    await mintLicense(license, otherAccount, 2n, airlineCoin, 1);

    expect(await license.balanceOf(otherAccount.address, 2n)).to.equal(1);

    await setClaimConditionsLicense(license, 1n, airlineCoin);
    await mintLicense(license, otherAccount, 1n, airlineCoin, 0);

    expect(await license.balanceOf(otherAccount.address, 1n)).to.equal(1);

    await setClaimConditionsLicense(license, 0n, airlineCoin);
    await mintLicense(license, otherAccount, 0n, airlineCoin, 0);

    expect(await license.balanceOf(otherAccount.address, 0n)).to.equal(1);

    const uri = await license.uri(3n);

    expect(uri).to.equal("http://localhost:3000/api/metadata/license/3");
  });

  it("Should NOT be able to claim license A if no license B", async () => {
    const { license, owner, otherAccount, airlineCoin } =
      await networkHelpers.loadFixture(deployFixture);
    await setBalances(airlineCoin, owner, otherAccount.address, "300");
    await airlineCoin.connect(otherAccount).approve(license.address, 300);

    await lazyMintLicense("4", 3n, owner, license);
    await setClaimConditionsLicense(license, 3n, airlineCoin);

    try {
      await mintLicense(license, otherAccount, 3n, airlineCoin, 2);
    } catch (error) {
      const balance = await license.balanceOf(otherAccount.address, 3n);
      expect(balance).to.equal(0);
    }
  });

  it("Should be able to claim license A if has license B", async () => {
    const { license, owner, otherAccount, airlineCoin } =
      await networkHelpers.loadFixture(deployFixture);
    await setBalances(airlineCoin, owner, otherAccount.address, "160");
    await airlineCoin
      .connect(otherAccount)
      .approve(license.address, ethers.parseUnits("160", "ether"));

    await lazyMintLicense("4", 0n, owner, license);
    await setClaimConditionsLicense(license, 0n, airlineCoin);
    await mintLicense(license, otherAccount, 0n, airlineCoin, 0);

    expect(await license.balanceOf(otherAccount.address, 0n)).to.equal(1);
    expect(await license.balanceOf(otherAccount.address, 1n)).to.equal(0);

    await setClaimConditionsLicense(license, 1n, airlineCoin);
    await mintLicense(license, otherAccount, 1n, airlineCoin, 0);

    expect(await license.balanceOf(otherAccount.address, 1n)).to.equal(1);
    expect(await license.balanceOf(otherAccount.address, 2n)).to.equal(0);

    await setClaimConditionsLicense(license, 2n, airlineCoin);
    await mintLicense(license, otherAccount, 2n, airlineCoin, 1);

    expect(await license.balanceOf(otherAccount.address, 2n)).to.equal(1);
    expect(await license.balanceOf(otherAccount.address, 3n)).to.equal(0);

    await setClaimConditionsLicense(license, 3n, airlineCoin);
    await mintLicense(license, otherAccount, 3n, airlineCoin, 2);

    expect(await license.balanceOf(otherAccount.address, 3n)).to.equal(1);

    const uri = await license.uri(3n);
    expect(uri).to.equal("http://localhost:3000/api/metadata/license/3");
  });
});
