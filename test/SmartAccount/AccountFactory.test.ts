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

  it("✔ Should deploy contract", async () => {
    const { accountFactory } = await loadFixture(deploy);

    expect(accountFactory.createBaseAccount).to.exist;
    expect(accountFactory.createRecoverableAccount).to.exist;
  });

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

    it("Should deploy the same new Smart Account Contract", async () => {
      const { accountFactory, otherAccount } = await loadFixture(deploy);

      const create = async () => {
        const receipt = await accountFactory.createBaseAccount(
          otherAccount.address,
        );
        const returnedData = receipt.data.slice(2); // remove the '0x' prefix
        return "0x" + returnedData.slice(-40); // extract last 40 characters
      };

      const returnedAddress = await create();

      const account = await ethers.getContractAt(
        "BaseAccount",
        returnedAddress,
      );
      expect(getAddress(returnedAddress)).to.equal(otherAccount.address);
      expect(getAddress(account.address)).to.equal(otherAccount.address);

      const secondAddress = await create();

      expect(returnedAddress).to.equal(secondAddress);
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

    it("Should deploy the same new Recoverable Smart Account Contract", async () => {
      const { accountFactory, otherAccount, owner } = await loadFixture(deploy);
      await accountFactory.deployed();

      const create = async () => {
        const receipt = await accountFactory.createRecoverableAccount(
          otherAccount.address,
        );
        const returnedData = receipt.data.slice(2); // remove the '0x' prefix
        return "0x" + returnedData.slice(-40); // extract last 40 characters
      };

      const returnedAddress = await create();

      const account = await ethers.getContractAt(
        "RecoverableAccount",
        returnedAddress,
      );
      expect(getAddress(returnedAddress)).to.equal(otherAccount.address);
      expect(getAddress(account.address)).to.equal(otherAccount.address);

      const secondAddress = await create();
      expect(secondAddress).to.equal(returnedAddress);
    });
  });
});
