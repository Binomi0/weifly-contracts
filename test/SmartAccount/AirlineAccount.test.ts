import { expect } from "chai";
import { ethers } from "hardhat";

describe("Airline", () => {
  it("Should set owner on create", async () => {
    const [owner] = await ethers.getSigners();
    const Airline = await ethers.getContractFactory("Airline");
    const airline = await Airline.deploy(owner.address);

    expect(await airline.owner()).to.equal(owner.address);
  });
});
