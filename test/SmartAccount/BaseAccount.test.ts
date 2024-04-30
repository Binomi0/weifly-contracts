// Contracts are deployed using the first signer/account by default

import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { AccountFactory, EntryPoint } from "../../typechain-types";
import {
  AbiCoder,
  BigNumberish,
  getBytes,
  hexlify,
  id,
  parseEther,
  parseUnits,
} from "ethers";
import { PackedUserOperationStruct } from "../../typechain-types/@account-abstraction/contracts/core/EntryPoint";
import { defaultAbiCoder } from "@ethersproject/abi";

export function packAccountGasLimits(
  verificationGasLimit: BigNumberish,
  callGasLimit: BigNumberish,
): string {
  function hexZeroPad(hexString: string, length: number) {
    const cleanHexString = hexString.replace(/^0x/i, "");
    const paddingLength = Math.max(length - cleanHexString.length, 0);
    console.log({ paddingLength });
    console.log({ cleanHexString });
    return "0x" + "0".repeat(paddingLength) + cleanHexString;
  }

  const a = id(verificationGasLimit.toString(16));
  const b = id(verificationGasLimit.toString(16));
  console.log({ a, b });
  return `${hexZeroPad(verificationGasLimit.toString(16), 16)}${hexZeroPad(callGasLimit.toString(16), 16).slice(2)}`;
}

describe.only("[BaseAccount]", () => {
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
    nonce: bigint,
    initCode: string,
    callData: string,
    paymaster: string,
    entryPoint: EntryPoint,
    signer: HardhatEthersSigner,
  ) {
    const accountGasLimits = packAccountGasLimits(1_500_000, 1_500_000);
    console.log({ accountGasLimits });
    const gasFees = packAccountGasLimits(200_000, 200_000);
    console.log({ gasFees });
    const userOp: PackedUserOperationStruct = {
      sender,
      nonce,
      initCode,
      callData,
      accountGasLimits,
      preVerificationGas: 100_000,
      gasFees,
      paymasterAndData: paymaster,
      signature: "0x",
    };

    const userOpHash = await entryPoint.getUserOpHash(userOp);
    userOp.signature = await signer.signMessage(getBytes(userOpHash));

    return userOp;
  }

  const getInitCode = (
    factoryAddress: string,
    accountFactory: AccountFactory,
    account: string,
  ) =>
    factoryAddress +
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

  it.only("Should execute", async () => {
    const { accountFactory, entryPoint, paymaster, owner, otherAccount } =
      await loadFixture(deploy);

    const paymasterAddr = await paymaster.getAddress();

    await entryPoint.depositTo(paymasterAddr, {
      value: parseEther("100"),
    });
    const factoryAddress = await accountFactory.getAddress();
    const initCode = getInitCode(factoryAddress, accountFactory, owner.address);
    const sender = (await getSender(entryPoint, initCode)) as string;
    const Account = await ethers.getContractFactory("BaseAccount");

    const paymasterAndData = defaultAbiCoder.encode(
      ["address", "uint48", "uint48"],
      [paymasterAddr, Date.now() + 60 * 15, await time.latest()],
    );

    const userOp: PackedUserOperationStruct = await getSignedUserOp(
      sender,
      await entryPoint.getNonce(sender, 0),
      initCode,
      Account.interface.encodeFunctionData("execute"),
      paymasterAndData,
      entryPoint,
      owner,
    );

    const tx = await entryPoint.handleOps([userOp], await owner.getAddress());
    await tx.wait();

    const account = await ethers.getContractAt("BaseAccount", sender);

    expect(await account.count()).to.equal(1);
  });
});
