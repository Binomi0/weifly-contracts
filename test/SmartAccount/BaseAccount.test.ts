// Contracts are deployed using the first signer/account by default

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers/lib/utils";
import { PackedUserOperationStruct } from "../../typechain-types/@account-abstraction/contracts/core/EntryPoint";
import { fillUserOp, fillUserOpDefaults, packUserOp } from "../../utils/UserOp";
import {
  getBaseInitCode,
  getSender,
  getUserOp,
  signUserOp,
} from "../../utils/testutils";

describe("[BaseAccount]", () => {
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

    const initCode = getBaseInitCode(accountFactory, owner.address);
    const sender = (await getSender(entryPoint, initCode)) as string;
    const Account = await ethers.getContractFactory("BaseAccount");

    const userOp = await getUserOp({
      sender,
      nonce: await entryPoint.getNonce(sender, 0),
      initCode,
      callData: Account.interface.encodeFunctionData("execute"),
      callGasLimit: 1_500_000,
      verificationGasLimit: 1_500_000,
    });

    const packedUserOp: PackedUserOperationStruct = packUserOp(
      fillUserOp(userOp, paymaster.address),
    );

    const signedUserOp = await signUserOp(entryPoint, packedUserOp, owner);

    const tx = await entryPoint.handleOps([signedUserOp], owner.address);
    await tx.wait();

    const account = await ethers.getContractAt("BaseAccount", sender);

    expect(await account.count()).to.equal(1);
  });
});
