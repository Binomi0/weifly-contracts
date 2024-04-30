import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
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
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { parseUnits } from "ethers";
import { AirlineCoin } from "../../typechain-types";

describe("Aircraft Boeing 737", async function () {
  async function deployContracts() {
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
    const airlineCoin = await deployAirlineCoin(owner.address);
    const license = await deployLicenseNFT(owner.address);
    const aircraft = await deployAircraftNFT(owner, await license.getAddress());

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
    from: HardhatEthersSigner,
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

    await lazyMintAircraft("3", 2, owner, aircraft);
    await setClaimConditionsAircraft(aircraft, 2, airlineCoin);

    const cc = await aircraft.claimCondition(2);

    expect(cc.maxClaimableSupply).to.be.equal(BigInt("100"));
  });

  it("Should reject if no license 2 owner", async function () {
    const { aircraft, owner, otherAccount, airlineCoin } =
      await loadFixture(deployContracts);
    const beforeBalance = await aircraft.balanceOf(otherAccount.address, 2);
    expect(beforeBalance).to.equal(0);

    await lazyMintAircraft("3", 2, owner, aircraft);
    await setClaimConditionsAircraft(aircraft, 2, airlineCoin);
    try {
      await mintAircraft(aircraft, otherAccount, 2, airlineCoin);
      expect(true).to.equal(false);
    } catch (error) {
      const afterBalance = await aircraft.balanceOf(otherAccount.address, 2);
      expect(afterBalance).to.equal(0);
    }
  });

  it("Should be able to claim if has license 2", async function () {
    const { license, aircraft, owner, otherAccount, airlineCoin } =
      await loadFixture(deployContracts);
    await setBalances(airlineCoin, owner, otherAccount.address, "110");
    await airlineCoin
      .connect(otherAccount)
      .approve(await license.getAddress(), parseUnits("60", "ether"));
    await airlineCoin
      .connect(otherAccount)
      .approve(await aircraft.getAddress(), parseUnits("50", "ether"));

    const beforeBalance = await aircraft.balanceOf(otherAccount.address, 2);
    expect(beforeBalance).to.equal(0);

    await lazyMintLicense("3", 0, owner, license);

    await setClaimConditionsLicense(license, 0, airlineCoin);
    await setClaimConditionsLicense(license, 1, airlineCoin);
    await setClaimConditionsLicense(license, 2, airlineCoin);

    await mintLicense(license, otherAccount, 0, airlineCoin, 0);
    await mintLicense(license, otherAccount, 1, airlineCoin, 0);
    await mintLicense(license, otherAccount, 2, airlineCoin, 1);

    expect(await license.balanceOf(otherAccount.address, 0)).to.equal(1);
    expect(await license.balanceOf(otherAccount.address, 1)).to.equal(1);
    expect(await license.balanceOf(otherAccount.address, 2)).to.equal(1);
    expect(await aircraft.balanceOf(otherAccount.address, 2)).to.equal(0);

    await lazyMintAircraft("3", 2, owner, aircraft);
    await setClaimConditionsAircraft(aircraft, 2, airlineCoin);
    await mintAircraft(aircraft, otherAccount, 2, airlineCoin);

    const afterBalance = await aircraft.balanceOf(otherAccount.address, 2);
    expect(afterBalance).to.equal(1);
    expect(await airlineCoin.balanceOf(otherAccount.address)).to.equal(0);
  });
});
