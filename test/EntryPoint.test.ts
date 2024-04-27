import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("[ENTRYPOINT]", () => {
  async function deployEntryPoint() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    const entryPoint = await EntryPoint.deploy();

    return { entryPoint };
  }

  it("Should deploy contract", async () => {
    const { entryPoint } = await loadFixture(deployEntryPoint);
    await entryPoint.deployed();

    expect(entryPoint.address).to.equal(
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    );
  });
});
