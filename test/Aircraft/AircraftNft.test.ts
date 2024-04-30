import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  deployAircraftNFT,
  deployAirlineCoin,
  deployAirlineRewardCoin,
  deployLicenseNFT,
} from "../../utils";

describe("Aircraft", function () {
  async function deployContracts() {
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
    const airlineCoin = await deployAirlineCoin(owner.address);
    const airlineRewardCoin = await deployAirlineRewardCoin(owner.address);
    const license = await deployLicenseNFT(owner.address);
    const aircraft = await deployAircraftNFT(owner, await license.getAddress());

    return {
      license,
      aircraft,
      airlineCoin,
      airlineRewardCoin,
      owner,
      otherAccount,
      thirdAccount,
    };
  }

  describe("If is an admin", async function () {
    it("Should set new required license ID", async function () {
      const { aircraft } = await loadFixture(deployContracts);

      await aircraft.setRequiredLicense(4, 4);
      expect(await aircraft.requiredLicense(4)).to.equal(4);
    });
  });

  describe("If is NOT an admin", async function () {
    it("Should fail while trying to set required license ID", async function () {
      const { aircraft } = await loadFixture(deployContracts);

      try {
        await aircraft.setRequiredLicense(4, 4);
      } catch (error) {
        expect(await aircraft.requiredLicense(4)).to.equal(0);
      }
    });
  });
});
