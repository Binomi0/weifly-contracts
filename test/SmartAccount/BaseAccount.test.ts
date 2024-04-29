// Contracts are deployed using the first signer/account by default

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { AccountFactory, EntryPoint } from "../../typechain-types";
import { arrayify, id, parseEther } from "ethers/lib/utils";
import { BigNumber } from "ethers";

describe("[BaseAccount]", () => {
  const getSender = async (entryPoint: EntryPoint, initCode: string) =>
    entryPoint.getSenderAddress(initCode).catch((err) => {
      if (err.data) {
        return `0x${err.data.slice(-40)}`;
      } else if (err.error) {
        return `0x${err.error.data.data.slice(-40)}`;
      }
      throw new Error("Wrong data from getSenderAddress");
    });

  async function getSignedUserOp(
    sender: string,
    nonce: BigNumber,
    initCode: string,
    callData: string,
    paymaster: string,
    entryPoint: EntryPoint,
    signer: SignerWithAddress,
  ) {
    const userOp = {
      sender,
      nonce,
      initCode,
      callData,
      callGasLimit: 1_500_000,
      verificationGasLimit: 1_500_000,
      preVerificationGas: 400_000,
      maxFeePerGas: ethers.utils.parseUnits("100", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("50", "gwei"),
      paymasterAndData: paymaster,
      signature: "0x",
    };

    const userOpHash = await entryPoint.getUserOpHash(userOp);
    userOp.signature = await signer.signMessage(
      ethers.utils.arrayify(userOpHash),
    );

    return userOp;
  }

  const getInitCode = (accountFactory: AccountFactory, account: string) =>
    accountFactory.address +
    accountFactory.interface
      .encodeFunctionData("createBaseAccount", [account])
      .slice(2);

  async function deploy() {
    const [owner, otherAccount] = await ethers.getSigners();

    const AccountFactory = await ethers.getContractFactory("AccountFactory");
    const accountFactory = await AccountFactory.deploy();
    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    const entryPoint = await EntryPoint.deploy();
    const Paymaster = await ethers.getContractFactory("Paymaster");
    const paymaster = await Paymaster.deploy();

    return {
      paymaster,
      entryPoint,
      accountFactory,
      owner,
      otherAccount,
    };
  }

  it("Should deploy contract", async () => {
    const { accountFactory } = await loadFixture(deploy);

    expect(accountFactory.createBaseAccount).to.exist;
    expect(accountFactory.createRecoverableAccount).to.exist;
  });

  it("Should execute", async () => {
    const { accountFactory, entryPoint, paymaster, owner, otherAccount } =
      await loadFixture(deploy);

    await entryPoint.depositTo(paymaster.address, { value: parseEther("100") });

    const initCode = getInitCode(accountFactory, owner.address);
    const sender = (await getSender(entryPoint, initCode)) as string;
    const Account = await ethers.getContractFactory("BaseAccount");

    const userOp = await getSignedUserOp(
      sender,
      await entryPoint.getNonce(sender, 0),
      initCode,
      Account.interface.encodeFunctionData("execute"),
      paymaster.address,
      entryPoint,
      owner,
    );

    const tx = await entryPoint.handleOps([userOp], owner.address);
    await tx.wait();

    const account = await ethers.getContractAt("BaseAccount", sender);

    expect(await account.count()).to.equal(1);
  });
});
