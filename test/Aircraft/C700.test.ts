import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import {
  deployAircraftNFT,
  deployAirlineCoin,
  deployLicenseNFT,
  lazyMintAircraft,
  lazyMintLicense,
  mintAircraft,
  mintLicense,
  setClaimConditionsAircraft,
  setClaimConditionsLicense,
} from "../../utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseUnits } from "ethers/lib/utils";
import { AirlineCoin } from "../../typechain-types";

describe("Aircraft Cessna 700", async function () {
  async function deployContracts() {
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
    const airlineCoin = await deployAirlineCoin(owner.address);
    const license = await deployLicenseNFT(owner.address);
    const aircraft = await deployAircraftNFT(owner, license.address);

    return {
      license,
      aircraft,
      airlineCoin,
      owner,
      otherAccount,
      thirdAccount,
    };
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
    const [owner] = await ethers.getSigners();
    const { aircraft } = await loadFixture(deployContracts);

    expect(await aircraft.owner()).to.equal(owner.address);
  });

  it("Should set new claim conditions", async () => {
    const { aircraft, airlineCoin, owner } = await loadFixture(deployContracts);

    await lazyMintAircraft("2", 1, owner, aircraft);
    await setClaimConditionsAircraft(aircraft, 1, airlineCoin);

    const cc = await aircraft.claimCondition(1);

    expect(cc.maxClaimableSupply).to.be.equal(BigNumber.from("100"));
  });

  it("Should reject if no license 1 owner", async function () {
    const { aircraft, owner, otherAccount, airlineCoin } =
      await loadFixture(deployContracts);
    const beforeBalance = await aircraft.balanceOf(otherAccount.address, 1);
    expect(beforeBalance).to.equal(0);

    await lazyMintAircraft("2", 1, owner, aircraft);
    await setClaimConditionsAircraft(aircraft, 1, airlineCoin);
    try {
      await mintAircraft(aircraft, otherAccount, 1, airlineCoin);
      expect(true).to.equal(false);
    } catch (error) {
      const afterBalance = await aircraft.balanceOf(otherAccount.address, 1);
      expect(afterBalance).to.equal(0);
    }
  });

  it("Should be able to claim if has license 1", async function () {
    const { license, aircraft, owner, otherAccount, airlineCoin } =
      await loadFixture(deployContracts);
    const beforeBalance = await aircraft.balanceOf(otherAccount.address, 1);
    expect(beforeBalance).to.equal(0);
    await setBalances(airlineCoin, owner, otherAccount.address, "20");
    await airlineCoin
      .connect(otherAccount)
      .approve(license.address, parseUnits("10", "ether"));
    await airlineCoin
      .connect(otherAccount)
      .approve(aircraft.address, parseUnits("10", "ether"));

    await lazyMintLicense("2", 0, owner, license);
    await setClaimConditionsLicense(license, 0, airlineCoin);
    await mintLicense(license, otherAccount, 0, airlineCoin, 0);
    await setClaimConditionsLicense(license, 1, airlineCoin);
    await mintLicense(license, otherAccount, 1, airlineCoin, 0);

    expect(await license.balanceOf(otherAccount.address, 0)).to.equal(1);
    expect(await license.balanceOf(otherAccount.address, 1)).to.equal(1);
    expect(await aircraft.balanceOf(otherAccount.address, 1)).to.equal(0);

    await lazyMintAircraft("2", 1, owner, aircraft);
    await setClaimConditionsAircraft(aircraft, 1, airlineCoin);
    await mintAircraft(aircraft, otherAccount, 1, airlineCoin);

    const afterBalance = await aircraft.balanceOf(otherAccount.address, 1);
    expect(afterBalance).to.equal(1);
    expect(await airlineCoin.balanceOf(otherAccount.address)).to.equal(0);
  });
});
