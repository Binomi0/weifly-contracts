import { ethers } from "hardhat";
import { expect } from "chai";
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
} from "../utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { AirlineCoin } from "../typechain-types";
import { parseUnits } from "ethers/lib/utils";

export async function deployFlightController(
  owner: string,
  aircraftNFTAddress: string,
  airlineCoin: string,
) {
  const FlightController = await ethers.getContractFactory("FlightController");
  const flightController = await FlightController.deploy(
    owner,
    aircraftNFTAddress,
    airlineCoin,
  );
  await flightController.deployed();

  return flightController;
}

describe("FlightController", () => {
  async function deployContracts() {
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
    const airlineCoin = await deployAirlineCoin(owner.address);
    const license = await deployLicenseNFT(owner.address);
    const aircraft = await deployAircraftNFT(owner, license.address);
    const flightController = await deployFlightController(
      owner.address,
      aircraft.address,
      airlineCoin.address,
    );

    return {
      license,
      aircraft,
      airlineCoin,
      flightController,
      owner,
      otherAccount,
      thirdAccount,
    };
  }

  async function setBalances(
    airlineCoin: AirlineCoin,
    otherAccount: SignerWithAddress,
    thirdAccount: SignerWithAddress,
  ) {
    await airlineCoin.approve(otherAccount.address, parseUnits("300", "ether"));
    await airlineCoin.transfer(
      otherAccount.address,
      parseUnits("300", "ether"),
    );
    await airlineCoin.approve(thirdAccount.address, parseUnits("300", "ether"));
    await airlineCoin.transfer(
      thirdAccount.address,
      parseUnits("300", "ether"),
    );
  }

  it("Should have set flight details after start", async () => {
    const {
      flightController,
      otherAccount,
      license,
      aircraft,
      owner,
      airlineCoin,
    } = await deployContracts();
    await lazyMintLicense("1", 0, owner, license);
    await setClaimConditionsLicense(license, 0, airlineCoin);
    await mintLicense(license, otherAccount, 0, airlineCoin, 0);

    await lazyMintAircraft("1", 0, owner, aircraft);
    await setClaimConditionsAircraft(aircraft, 0, airlineCoin);
    await mintAircraft(aircraft, otherAccount, 0, airlineCoin, 1);

    await flightController.connect(otherAccount).startFlight(123, 100, 0, 1);

    const details = await flightController
      .connect(otherAccount)
      .flightDetails(otherAccount.address);

    expect(details.id).to.equal(123);
    expect(details.distance).to.equal(100);
    expect(details.aircraftId).to.equal(0);
    expect(details.multiplier).to.equal(1);
  });

  it("Should not be able to start a second flight", async () => {
    const {
      flightController,
      otherAccount,
      license,
      aircraft,
      owner,
      airlineCoin,
    } = await deployContracts();
    await lazyMintLicense("1", 0, owner, license);
    await setClaimConditionsLicense(license, 0, airlineCoin);
    await mintLicense(license, otherAccount, 0, airlineCoin, 0);

    await lazyMintAircraft("1", 0, owner, aircraft);
    await setClaimConditionsAircraft(aircraft, 0, airlineCoin);
    await mintAircraft(aircraft, otherAccount, 0, airlineCoin, 1);

    await flightController.connect(otherAccount).startFlight(123, 100, 0, 1);
    try {
      await flightController.connect(otherAccount).startFlight(123, 100, 0, 1);
    } catch (err) {
      const error = err as Error;
      expect(error.message).to.contain(
        "Flight already in progress or minimum lock time not met",
      );
    }
  });

  it("Should be able to handle 2 or more flights at the same time", async () => {
    const {
      flightController,
      otherAccount,
      thirdAccount,
      license,
      aircraft,
      owner,
      airlineCoin,
    } = await deployContracts();
    await setBalances(airlineCoin, otherAccount, thirdAccount);

    await airlineCoin
      .connect(otherAccount)
      .approve(license.address, parseUnits("300", "ether"));
    await airlineCoin
      .connect(thirdAccount)
      .approve(license.address, parseUnits("300", "ether"));

    await lazyMintLicense("1", 0, owner, license);
    await setClaimConditionsLicense(license, 0, airlineCoin);
    await mintLicense(license, otherAccount, 0, airlineCoin, 0, 1);
    await mintLicense(license, thirdAccount, 0, airlineCoin, 0, 1);

    await lazyMintAircraft("1", 0, owner, aircraft);
    await setClaimConditionsAircraft(aircraft, 0, airlineCoin);
    await mintAircraft(aircraft, otherAccount, 0, airlineCoin, 1);
    await mintAircraft(aircraft, thirdAccount, 0, airlineCoin, 1);

    await flightController.connect(otherAccount).startFlight(123, 100, 0, 1);
    await flightController.connect(thirdAccount).startFlight(321, 100, 0, 2);
    const secondFlightDetails = await flightController.flightDetails(
      otherAccount.address,
    );
    const thirdFlightDetails = await flightController.flightDetails(
      thirdAccount.address,
    );

    expect(secondFlightDetails.id).to.equal(123);
    expect(thirdFlightDetails.id).to.equal(321);
  });
});
