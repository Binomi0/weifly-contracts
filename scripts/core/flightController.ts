import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { AirlineCoin } from "../../typechain-types";
import { parseUnits } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ContractRunner } from "ethers";
import { ZERO_ADDRESS } from "../../utils";

const handleError = (err: unknown) => {
  const { error } = err as { error: Error };
  console.log(error.message);
};

const deployFlightController = async (
  accounts: HardhatEthersSigner[],
  aircraftNFTAddress: string,
  airlineCoin: AirlineCoin,
  ownerAddr: string,
  airlineCoinAddr: string,
) => {
  console.group("deployFlightController");
  console.log("----- DEPLOYING Flight Controller -----");
  const [owner, otherAccount] = accounts;
  const FlightController = await ethers.getContractFactory("FlightController");
  const flightController = await FlightController.deploy(
    ownerAddr,
    aircraftNFTAddress,
    airlineCoinAddr,
  );
  console.log("----- Flight Controller deployed -----");
  console.log("FlightController address =>", flightController.getAddress());

  console.log("Starting flight...");
  await flightController.connect(otherAccount).startFlight(123, 100, 0, 1);
  console.log("Flight started");

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const flight = await flightController
    .connect(otherAccount)
    .flightDetails(otherAccount);
  if (flight.startTime === BigInt(0)) {
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
        await flightController.getAddress(),
      );

      // Get the emitted event using the event filter
      const eventFilter = flightControllerContract.filters.FlightCompleted(
        ZERO_ADDRESS,
        0,
        0,
      );
      const [event] = await flightControllerContract.queryFilter(
        eventFilter,
        txReceipt.blockNumber || 0,
        txReceipt.blockNumber || 10,
      );

      // Access values from the emitted event
      const [pilot, flightId, rewards] = event.args;
      console.log("pilot =>", pilot);
      console.log("flightId =>", flightId.toString());

      if (BigInt(rewards) === BigInt(0)) return;
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
