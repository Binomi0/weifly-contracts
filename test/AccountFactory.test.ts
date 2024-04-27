import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  formatBytes32String,
  getCreate2Address,
  parseEther,
  parseUnits,
} from "ethers/lib/utils";
import { ethers } from "hardhat";
import { AccountFactory } from "../typechain-types";
import { providers } from "ethers";

describe.only("[Account Factory]", () => {
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
    const account = await Account.deploy(otherAccount.address);
    await account.deployed();

    return { account, otherAccount };
  }

  async function deployEntryPoint() {
    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    const entryPoint = await EntryPoint.deploy();

    return { entryPoint };
  }

  it("Should deploy a new Smart Account Contract", async () => {
    const { accountFactory, otherAccount } =
      await loadFixture(deployAccountFactory);
    await accountFactory.deployed();

    expect(accountFactory.address).to.equal(
      "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
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
    const { account } = await loadFixture(deployAccount);
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
      const err = error as { data: string };
      sender = `0x${err.data.slice(-40)}`;
    }
    console.log("Sender by create2address Address:", sender);

    const beforeBalance = await owner.getBalance();
    expect(beforeBalance).to.equal(parseUnits("9999992646396270046835", "wei"));

    await entryPoint.depositTo(sender, { value: parseEther("1") });

    const afterBalance = await owner.getBalance();
    expect(afterBalance).to.equal(parseUnits("9998992578839381086859", "wei"));

    const code = await ethers.provider.getCode(sender);
    if (code !== "0x") {
      initCode = "0x";
    }

    const userOp = {
      sender,
      nonce: await entryPoint.getNonce(sender, 0),
      initCode,
      callData: account.interface.encodeFunctionData("execute"),
      callGasLimit: 200_000,
      verificationGasLimit: 200_000,
      preVerificationGas: 50_000,
      maxFeePerGas: ethers.utils.parseUnits("10", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
      paymasterAndData: "0x", // we're not using a paymaster, for now
      signature: "0x", // we're not validating a signature, for now
    };

    const receipt = await entryPoint.handleOps([userOp], owner.address);
    await receipt.wait(10);

    expect(await account.count()).to.equal(1);
  });
});
