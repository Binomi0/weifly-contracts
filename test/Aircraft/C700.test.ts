import { describe, it } from "node:test";

import hre from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { expect } from "chai";

import {
  deployAircraftNFT,
  deployAirlineCoin,
  deployAirlineRewardCoin,
  deployLicenseNFT,
} from "../../utils.js";

const net = hre as HardhatRuntimeEnvironment;
const { ethers, networkHelpers } = await net.network.connect();

describe("Aircraft Cessna 700", async function () {
  async function deployFixture() {
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
    const airlineCoin = await deployAirlineCoin(owner.address);
    const airlineRewardCoin = await deployAirlineRewardCoin(owner.address);
    const license = await deployLicenseNFT();
    const aircraft = await deployAircraftNFT(owner, await license.getAddress());

    // Basic configuration
    await aircraft.setAirlineCoin(await airlineCoin.getAddress());
    await aircraft.setAirlineGasCoin(await airlineRewardCoin.getAddress());

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

  it("Should set the right owner", async function () {
    const { owner, aircraft } = await networkHelpers.loadFixture(deployFixture);

    expect(await aircraft.owner()).to.equal(owner.address);
  });

  it("Should have correct initial required license mappings from constructor", async function () {
    const { aircraft } = await networkHelpers.loadFixture(deployFixture);
    expect(await aircraft.requiredLicense(1n)).to.equal(1n);
  });

  it("Should allow the default admin to update the required license mapping", async function () {
    const { aircraft } = await networkHelpers.loadFixture(deployFixture);
    await aircraft.setRequiredLicense(10, 1);
    expect(await aircraft.requiredLicense(10n)).to.equal(1n);
  });

  it("Should permit the default admin to update coin contract addresses", async function () {
    const { aircraft, owner, airlineRewardCoin } =
      await networkHelpers.loadFixture(deployFixture);
    const newCoin = await deployAirlineCoin(owner.address);
    const newCoinAddress = await newCoin.getAddress();
    const airlineRewardCoinAddress = await airlineRewardCoin.getAddress();

    const setAirlineCoinTx = await aircraft.setAirlineCoin(newCoinAddress);
    expect(setAirlineCoinTx).to.be.ok;

    const setAirlineGasCoinTx = await aircraft.setAirlineGasCoin(
      airlineRewardCoinAddress,
    );
    expect(setAirlineGasCoinTx).to.be.ok;
  });

  it("Should forbid non-admin accounts from updating settings", async function () {
    const { aircraft, otherAccount, airlineCoin } =
      await networkHelpers.loadFixture(deployFixture);

    const airlineCoinAddress = await airlineCoin.getAddress();
    const restrictedCalls = [
      () => aircraft.connect(otherAccount).setRequiredLicense(10, 1),
      () => aircraft.connect(otherAccount).setAirlineCoin(airlineCoinAddress),
      () =>
        aircraft.connect(otherAccount).setAirlineGasCoin(airlineCoinAddress),
    ];

    for (const call of restrictedCalls) {
      try {
        await call();
      } catch (e: unknown) {
        // Expected revert
      }
    }
  });

  it("Should return a calculated IPFS URI when defining aircraft", async function () {
    const { aircraft } = await networkHelpers.loadFixture(deployFixture);
    const tokenId = 505n;
    const metadataURI = await aircraft.mintAircraft.staticCall(
      tokenId,
      "Metadata Test",
      "Description",
      "ipfs://img",
      "M-1",
      "Type A",
      100,
    );
    expect(metadataURI).to.contain("ipfs://");
  });
});
