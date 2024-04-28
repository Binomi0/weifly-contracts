import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  formatBytes32String,
  getCreate2Address,
  parseEther,
  parseUnits,
} from "ethers/lib/utils";
import { ethers } from "hardhat";
import { AccountFactory } from "../../typechain-types";
import { providers } from "ethers";

describe("[Account Factory]", () => {
  async function deployAccountFactory() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const AccountFactory = await ethers.getContractFactory("AccountFactory");
    const accountFactory = await AccountFactory.deploy();
    await accountFactory.deployed();

    return { accountFactory, owner, otherAccount };
  }

  async function deployAccount() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Account = await ethers.getContractFactory("Account");

    return { Account, otherAccount };
  }

  async function deployEntryPoint() {
    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    const entryPoint = await EntryPoint.deploy();

    return { entryPoint };
  }

  describe("Base Account", () => {
    it("Should deploy a new Smart Account Contract", async () => {
      const { accountFactory, otherAccount } =
        await loadFixture(deployAccountFactory);

      expect(accountFactory.address).to.equal(
        "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44",
      );

      const receipt = await accountFactory.createAccount(otherAccount.address);
      const returnedData = receipt.data.slice(2); // remove the '0x' prefix
      const returnedAddress = "0x" + returnedData.slice(-40); // extract last 40 characters

      console.log("New smartAccount address:", returnedAddress);
      expect(returnedAddress).to.equal(
        "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      );
    });
  });
  describe("Recoverable Account", () => {
    it("Should deploy a new Smart Account Contract", async () => {
      const { accountFactory, otherAccount } =
        await loadFixture(deployAccountFactory);
      await accountFactory.deployed();

      expect(accountFactory.address).to.equal(
        "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44",
      );

      const receipt = await accountFactory.createAccount(otherAccount.address);
      const returnedData = receipt.data.slice(2); // remove the '0x' prefix
      const returnedAddress = "0x" + returnedData.slice(-40); // extract last 40 characters

      console.log("New smartAccount address:", returnedAddress);
      expect(returnedAddress).to.equal(
        "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      );
    });
  });

  it("Should deploy a new Smart Account Contract", async () => {
    const { accountFactory, otherAccount } =
      await loadFixture(deployAccountFactory);
    await accountFactory.deployed();

    expect(accountFactory.address).to.equal(
      "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44",
    );

    const receipt = await accountFactory.createAccount(otherAccount.address);
    const returnedData = receipt.data.slice(2); // remove the '0x' prefix
    const returnedAddress = "0x" + returnedData.slice(-40); // extract last 40 characters

    console.log("New smartAccount address:", returnedAddress);
    expect(returnedAddress).to.equal(
      "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    );
  });

  it("Should send a user operation", async () => {
    const { owner, accountFactory } = await loadFixture(deployAccountFactory);
    const { Account } = await loadFixture(deployAccount);
    const { entryPoint } = await loadFixture(deployEntryPoint);

    console.log("Account Factory address:", accountFactory.address);

    let initCode =
      accountFactory.address +
      accountFactory.interface
        .encodeFunctionData("createAccount", [owner.address])
        .slice(2);
    console.log("Init code", initCode);

    let sender = "0x";
    try {
      await entryPoint.getSenderAddress(initCode);
    } catch (error) {
      const err = error as { error: { data: { data: string } } };
      sender = `0x${err.error.data.data.slice(-40)}`;
    }
    console.log("Sender by create2address Address:", sender);

    await entryPoint.depositTo(sender, { value: parseEther("1") });

    const userOp = {
      sender,
      nonce: await entryPoint.getNonce(sender, 0),
      initCode,
      callData: Account.interface.encodeFunctionData("execute"),
      callGasLimit: 400_000,
      verificationGasLimit: 400_000,
      preVerificationGas: 100_000,
      maxFeePerGas: ethers.utils.parseUnits("10", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
      paymasterAndData: "0x", // we're not using a paymaster, for now
      signature: "0x", // we're not validating a signature, for now
    };

    const receipt = await entryPoint.handleOps([userOp], owner.address);
    await receipt.wait(10);

    expect(receipt).to.equal(0);
  });
});
