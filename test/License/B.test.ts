import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import {
  deployAirlineCoin,
  deployLicenseNFT,
  lazyMintLicense,
  mintLicense,
  setClaimConditionsLicense,
} from "../../utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseUnits } from "ethers/lib/utils";
import { AirlineCoin } from "../../typechain-types";

describe("License B NFT", async function () {
  async function deployContracts() {
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
    const airlineCoin = await deployAirlineCoin(owner.address);
    const license = await deployLicenseNFT(owner.address);

    return { license, airlineCoin, owner, otherAccount, thirdAccount };
  }

  async function setBalances(
    airlineCoin: AirlineCoin,
    from: SignerWithAddress,
    to: string,
    amount: string,
  ) {
    await airlineCoin.connect(from).approve(to, parseUnits(amount, "ether"));
    await airlineCoin.connect(from).transfer(to, parseUnits(amount, "ether"));
  }

  it("Should set the right owner", async function () {
    const { license, owner } = await loadFixture(deployContracts);

    expect(await license.owner()).to.equal(owner.address);
  });

  it("Should set new claim conditions", async () => {
    const { license, owner, airlineCoin } = await loadFixture(deployContracts);
    await lazyMintLicense("3", 2, owner, license);
    await setClaimConditionsLicense(license, 2, airlineCoin);

    const cc = await license.claimCondition(2);

    expect(cc.maxClaimableSupply).to.be.equal(BigNumber.from("100"));
  });

  it("Should set the right URI", async () => {
    const { license, owner, otherAccount, airlineCoin } =
      await loadFixture(deployContracts);
    await setBalances(airlineCoin, owner, otherAccount.address, "60");
    await airlineCoin
      .connect(otherAccount)
      .approve(license.address, parseUnits("60", "ether"));

    await lazyMintLicense("3", 0, owner, license);
    await setClaimConditionsLicense(license, 0, airlineCoin);
    await mintLicense(license, otherAccount, 0, airlineCoin, 0);

    expect(await license.balanceOf(otherAccount.address, 0)).to.equal(1);
    expect(await license.balanceOf(otherAccount.address, 1)).to.equal(0);

    await setClaimConditionsLicense(license, 1, airlineCoin);
    await mintLicense(license, otherAccount, 1, airlineCoin, 0);

    expect(await license.balanceOf(otherAccount.address, 1)).to.equal(1);
    expect(await license.balanceOf(otherAccount.address, 2)).to.equal(0);

    await setClaimConditionsLicense(license, 2, airlineCoin);
    await mintLicense(license, otherAccount, 2, airlineCoin, 1);

    const uri = await license.uri(2);

    expect(uri).to.equal("http://localhost:3000/api/metadata/license/2");
  });

  it("Should NOT be able to claim license B if no license C", async () => {
    const { license, owner, otherAccount, airlineCoin } =
      await loadFixture(deployContracts);
    await setBalances(airlineCoin, owner, otherAccount.address, "300");
    await airlineCoin.connect(otherAccount).approve(license.address, 300);

    await lazyMintLicense("3", 2, owner, license);
    await setClaimConditionsLicense(license, 2, airlineCoin);

    try {
      await mintLicense(license, otherAccount, 2, airlineCoin, 1);
    } catch (error) {
      const balance = await license.balanceOf(otherAccount.address, 2);
      expect(balance).to.equal(0);
    }
  });

  it("Should be able to claim license B if has license C", async () => {
    const { license, owner, otherAccount, airlineCoin } =
      await loadFixture(deployContracts);
    await setBalances(airlineCoin, owner, otherAccount.address, "60");
    await airlineCoin
      .connect(otherAccount)
      .approve(license.address, parseUnits("60", "ether"));

    await lazyMintLicense("3", 0, owner, license);
    await setClaimConditionsLicense(license, 0, airlineCoin);
    await mintLicense(license, otherAccount, 0, airlineCoin, 0);

    expect(await license.balanceOf(otherAccount.address, 0)).to.equal(1);
    expect(await license.balanceOf(otherAccount.address, 1)).to.equal(0);

    await setClaimConditionsLicense(license, 1, airlineCoin);
    await mintLicense(license, otherAccount, 1, airlineCoin, 0);

    expect(await license.balanceOf(otherAccount.address, 1)).to.equal(1);
    expect(await license.balanceOf(otherAccount.address, 2)).to.equal(0);

    await setClaimConditionsLicense(license, 2, airlineCoin);
    await mintLicense(license, otherAccount, 2, airlineCoin, 1);

    expect(await license.balanceOf(otherAccount.address, 2)).to.equal(1);
  });
});
