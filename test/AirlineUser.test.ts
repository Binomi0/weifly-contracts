import { expect } from "chai";
import { ethers } from "hardhat";

describe("AirlineUser", () => {
  it("Should deploy contract", async () => {
    const AirlineUser = await ethers.getContractFactory("AirlineUser");
    const airlineUser = await AirlineUser.deploy();

    expect(airlineUser.flightTime).to.exist;

    const flightHours = await airlineUser.flightTime();
    expect(flightHours).to.equal(0);
  });

  describe("When interacting with Airline", () => {
    it("Should be able to join an Airline if not already in one", async () => {
      const [signer1, signer2] = await ethers.getSigners();
      const address1 = await signer1.getAddress();
      const address2 = await signer2.getAddress();
      const Airline = await ethers.getContractFactory("Airline");
      const airline = await Airline.deploy(address1);
      const AirlineUser = await ethers.getContractFactory("AirlineUser");
      const airlineUser = await AirlineUser.deploy();

      await airlineUser.connectToAirline(
        await airline.getAddress(),
        address2,
        1,
      );

      expect(await airline.pilots(address2)).to.equal(1);
    });
    it("Should be able to join an Airline if is open", async () => {
      const [signer1, signer2] = await ethers.getSigners();
      const address1 = await signer1.getAddress();
      const address2 = await signer2.getAddress();
      const Airline = await ethers.getContractFactory("Airline");
      const airline = await Airline.deploy(address1);
      const AirlineUser = await ethers.getContractFactory("AirlineUser");
      const airlineUser = await AirlineUser.deploy();

      await airline.isOpen();

      await airlineUser.connectToAirline(
        await airline.getAddress(),
        address2,
        1,
      );

      expect(await airline.pilots(address2)).to.equal(1);
    });

    it("Should NOT be able to join an Airline if already in one", async () => {
      const [signer1, signer2, signer3] = await ethers.getSigners();
      const address1 = await signer1.getAddress();
      const address2 = await signer2.getAddress();
      const address3 = await signer3.getAddress();
      const Airline = await ethers.getContractFactory("Airline");
      const airline1 = await Airline.deploy(address1);
      const airline2 = await Airline.deploy(address3);
      const AirlineUser = await ethers.getContractFactory("AirlineUser");
      const airlineUser = await AirlineUser.deploy();

      await airlineUser.connectToAirline(
        await airline1.getAddress(),
        address2,
        1,
      );

      expect(await airline1.pilots(address2)).to.equal(1);

      airlineUser
        .connectToAirline(await airline2.getAddress(), address2, 1)
        .catch((error) => {
          expect(error.message).to.contains(
            "Pilots only can be in one Airline at the same time",
          );
        });
    });
  });
});
