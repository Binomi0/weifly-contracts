import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { getBytes, id, keccak256 } from "ethers";
import { ethers } from "hardhat";

describe("Virtual Airline", () => {
  const deploy = async () => {
    const [signer1, signer2] = await ethers.getSigners();
    const address1 = await signer1.getAddress();
    const address2 = await signer2.getAddress();
    const Airline = await ethers.getContractFactory("Airline");
    const airline = await Airline.deploy(address1);

    return { airline, address1, address2, signer1, signer2 };
  };

  it("Should deploy contract", async () => {
    const { airline, address1 } = await loadFixture(deploy);

    expect(airline.isOpen).to.exist;
    expect(airline.owner).to.exist;
    expect(airline.pilots).to.exist;

    const _owner = await airline.owner();
    expect(_owner).to.equal(address1);
  });

  describe("When deployed", () => {
    describe("Only owner", () => {
      it("Should be able to close airline", async () => {
        const { airline, signer1, address1 } = await loadFixture(deploy);

        const signature = await signer1.signMessage(getBytes(id(address1)));
        const senderHash = getBytes(id(address1));
        await airline.closeAirline(signature, senderHash);

        expect(await airline.isOpen()).to.equal(false);
      });
      it("Should Not be able to close airline if closed", async () => {
        const { airline, signer1, address1 } = await loadFixture(deploy);

        const signature = await signer1.signMessage(getBytes(id(address1)));
        const senderHash = getBytes(id(address1));
        await airline.closeAirline(signature, senderHash);
        airline.closeAirline(signature, senderHash).catch((error) => {
          expect(error.message).to.contains("Airline is already closed");
        });
      });

      it("Should be able to open airline", async () => {
        const { airline, signer1, address1 } = await loadFixture(deploy);

        const signature = await signer1.signMessage(getBytes(id(address1)));
        const senderHash = getBytes(id(address1));
        await airline.closeAirline(signature, senderHash);
        await airline.openAirline(signature, senderHash);

        expect(await airline.isOpen()).to.equal(true);
      });

      it("Should Not be able to open airline if opened", async () => {
        const { airline, signer1, address1 } = await loadFixture(deploy);

        const signature = await signer1.signMessage(getBytes(id(address1)));
        const senderHash = getBytes(id(address1));
        airline.openAirline(signature, senderHash).catch((error) => {
          expect(error.message).to.contains("Airline is already open");
        });
      });
    });

    it("Should allow a pilot to join if open", async () => {
      const { airline, address2 } = await loadFixture(deploy);

      await airline.joinAirline(address2, 1);

      expect(await airline.pilots(address2)).to.equal(1);
    });

    it("Should NOT allow a pilot to join if closed", async () => {
      const { airline, address1, address2 } = await loadFixture(deploy);

      await airline.joinAirline(address2, 1);

      expect(await airline.pilots(address2)).to.equal(1);
    });
  });
});
