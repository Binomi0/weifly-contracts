import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe.only("[Account]", () => {
  async function deployAccount() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Account = await ethers.getContractFactory("Account");
    const account = await Account.deploy(otherAccount.address);

    return { account };
  }

  it("Should deploy contract", async () => {
    const { account } = await loadFixture(deployAccount);
    await account.deployed();

    console.log("EntryPoint", account.address);
    expect(account.address).to.equal(
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    );
  });
});
