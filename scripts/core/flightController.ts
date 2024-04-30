import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { AirlineCoin } from "../../typechain-types";
import { parseUnits } from "ethers/lib/utils";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const handleError = (err: unknown) => {
  const { error } = err as { error: Error };
  console.log(error.message);
};

const deployFlightController = async (
  accounts: SignerWithAddress[],
  aircraftNFTAddress: string,
  airlineCoin: AirlineCoin,
) => {
  console.group("deployFlightController");
  console.log("----- DEPLOYING Flight Controller -----");
  const [owner, otherAccount] = accounts;
  const FlightController = await ethers.getContractFactory("FlightController");
  const flightController = await FlightController.deploy(
    owner.address,
    aircraftNFTAddress,
    airlineCoin.address,
  );
  await flightController.deployed();
  console.log("----- Flight Controller deployed -----");
  console.log("FlightController address =>", flightController.address);

  console.log("Starting flight...");
  await flightController.connect(otherAccount).startFlight(123, 100, 0, 1);
  console.log("Flight started");

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const flight = await flightController
    .connect(otherAccount)
    .flightDetails(otherAccount.address);
  if (!flight.startTime.isZero()) {
    // try {
    //   console.log('Try to duplicate flight')
    //   await flightController.connect(otherAccount).startFlight(123, 100, 0, 1)
    // } catch (err) {
    //   handleError(err)
    // }

    await time.increase(1800);
    console.log("Ending flight...");
    try {
      const txReceipt = await flightController
        .connect(owner)
        .completeFlight(otherAccount.address, 123);

      // Get the contract instance
      const flightControllerContract = await ethers.getContractAt(
        "FlightController",
        flightController.address,
      );

      // Get the emitted event using the event filter
      const eventFilter = flightControllerContract.filters.FlightCompleted(
        null,
        null,
        null,
      );
      const [event] = await flightControllerContract.queryFilter(
        eventFilter,
        txReceipt.blockNumber,
      );

      // Access values from the emitted event
      const [pilot, flightId, rewards] = event.args;
      console.log("pilot =>", pilot);
      console.log("flightId =>", flightId.toString());

      if (rewards.isZero()) return;
      console.log("Ended OK");
      console.log("rewards =>", rewards.toString());
      console.log("Minting...");

      await airlineCoin.mintTo(
        otherAccount.address,
        parseUnits(String(rewards), "ether"),
      );
      console.log("Minted ok");
    } catch (err) {
      handleError(err);
    }
  }
  console.groupEnd();
};

export default deployFlightController;
