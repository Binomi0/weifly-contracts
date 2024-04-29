import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { getAddress, parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

describe("[Account Factory]", () => {
  async function deploy() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    const entryPoint = await EntryPoint.deploy();
    const AccountFactory = await ethers.getContractFactory("AccountFactory");
    const accountFactory = await AccountFactory.deploy();
    await accountFactory.deployed();

    return { accountFactory, owner, otherAccount, entryPoint };
  }

  describe("Base Account", () => {
    it("Should deploy a new Smart Account Contract", async () => {
      const { accountFactory, otherAccount } = await loadFixture(deploy);

      const receipt = await accountFactory.createBaseAccount(
        otherAccount.address,
      );
      const returnedData = receipt.data.slice(2); // remove the '0x' prefix
      const returnedAddress = "0x" + returnedData.slice(-40); // extract last 40 characters

      const account = await ethers.getContractAt(
        "BaseAccount",
        returnedAddress,
      );
      expect(getAddress(returnedAddress)).to.equal(otherAccount.address);
      expect(getAddress(account.address)).to.equal(otherAccount.address);
    });
  });

  describe("Recoverable Account", () => {
    it("Should deploy a new Recoverable Smart Account Contract", async () => {
      const { accountFactory, otherAccount, owner } = await loadFixture(deploy);
      await accountFactory.deployed();

      const receipt = await accountFactory.createRecoverableAccount(
        otherAccount.address,
      );
      const returnedData = receipt.data.slice(2); // remove the '0x' prefix
      const returnedAddress = "0x" + returnedData.slice(-40); // extract last 40 characters

      const account = await ethers.getContractAt(
        "RecoverableAccount",
        returnedAddress,
      );
      expect(getAddress(returnedAddress)).to.equal(otherAccount.address);
      expect(getAddress(account.address)).to.equal(otherAccount.address);
    });
  });
});
