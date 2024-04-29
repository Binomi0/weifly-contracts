// Contracts are deployed using the first signer/account by default

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { AccountFactory, EntryPoint } from "../../typechain-types";
import { arrayify, id, parseEther } from "ethers/lib/utils";
import { BigNumber } from "ethers";

describe("[RecoverableAccount]", () => {
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
      callGasLimit: 1_000_000,
      verificationGasLimit: 1_000_000,
      preVerificationGas: 500_000,
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
      .encodeFunctionData("createRecoverableAccount", [account])
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
    const Account = await ethers.getContractFactory("RecoverableAccount");

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

    const account = await ethers.getContractAt("RecoverableAccount", sender);

    expect(await account.count()).to.equal(1);
  });

  it("Should allow owner to add recovery address.", async () => {
    const [owner, otherAccount] = await ethers.getSigners();
    const { accountFactory, entryPoint, paymaster } = await loadFixture(deploy);

    await entryPoint.depositTo(paymaster.address, { value: parseEther("100") });

    const initCode = getInitCode(accountFactory, owner.address);
    const sender = (await getSender(entryPoint, initCode)) as string;
    const signature = await owner.signMessage(
      arrayify(id(otherAccount.address)),
    );
    const Account = await ethers.getContractFactory("RecoverableAccount");

    const userOp = {
      sender,
      nonce: await entryPoint.getNonce(sender, 0),
      initCode,
      callData: Account.interface.encodeFunctionData("addAdmin", [
        arrayify(id(otherAccount.address)),
        signature,
        otherAccount.address,
      ]),
      callGasLimit: 1_000_000,
      verificationGasLimit: 1_000_000,
      preVerificationGas: 400_000,
      maxFeePerGas: ethers.utils.parseUnits("10", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
      paymasterAndData: paymaster.address,
      signature: "0x",
    };

    const userOpHash = await entryPoint.getUserOpHash(userOp);
    userOp.signature = await owner.signMessage(
      ethers.utils.arrayify(userOpHash),
    );

    const tx = await entryPoint.handleOps([userOp], owner.address);
    await tx.wait();

    const account = await ethers.getContractAt("RecoverableAccount", sender);

    expect(await account.admins(1)).to.equal(otherAccount.address);
  });

  it("Should NOT allow any other than owner to set a recover address.", async () => {
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
    const { accountFactory, entryPoint, paymaster } = await loadFixture(deploy);

    await entryPoint.depositTo(paymaster.address, { value: parseEther("100") });

    const initCode = getInitCode(accountFactory, owner.address);
    const sender = (await getSender(entryPoint, initCode)) as string;
    const signature = await thirdAccount.signMessage(
      arrayify(id(otherAccount.address)),
    );
    const Account = await ethers.getContractFactory("RecoverableAccount");

    const userOp = {
      sender,
      nonce: await entryPoint.getNonce(sender, 0),
      // initCode,
      initCode,
      callData: Account.interface.encodeFunctionData("addAdmin", [
        arrayify(id(otherAccount.address)),
        signature,
        otherAccount.address,
      ]),
      callGasLimit: 600_000,
      verificationGasLimit: 600_000,
      preVerificationGas: 200_000,
      maxFeePerGas: ethers.utils.parseUnits("10", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
      paymasterAndData: paymaster.address,
      signature: "0x",
    };

    const userOpHash = await entryPoint.getUserOpHash(userOp);
    userOp.signature = await thirdAccount.signMessage(
      ethers.utils.arrayify(userOpHash),
    );

    entryPoint.handleOps([userOp], thirdAccount.address).catch((error) => {
      expect(error.message).to.contain("AA24 signature error");
    });
  });

  describe("When has recover address set", () => {
    it("Should ALLOW a recover address to set a new owner.", async () => {
      const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
      const { accountFactory, entryPoint, paymaster } =
        await loadFixture(deploy);

      await entryPoint.depositTo(paymaster.address, {
        value: parseEther("100"),
      });

      const initCode = getInitCode(accountFactory, owner.address);
      const sender = (await getSender(entryPoint, initCode)) as string;

      const Account = await ethers.getContractFactory("RecoverableAccount");

      const addAdmin = async () => {
        const signature = await owner.signMessage(
          arrayify(id(otherAccount.address)),
        );
        const callData = Account.interface.encodeFunctionData("addAdmin", [
          arrayify(id(otherAccount.address)),
          signature,
          otherAccount.address,
        ]);

        const userOp = await getSignedUserOp(
          sender,
          await entryPoint.getNonce(sender, 0),
          initCode,
          callData,
          paymaster.address,
          entryPoint,
          owner,
        );

        const tx = await entryPoint.handleOps([userOp], owner.address);
        await tx.wait();

        const account = await ethers.getContractAt(
          "RecoverableAccount",
          sender,
        );

        expect(await account.admins(1)).to.equal(otherAccount.address);
      };

      await addAdmin();

      const resetOwner = async () => {
        const signature = await otherAccount.signMessage(
          arrayify(id(thirdAccount.address)),
        );

        const callData = Account.interface.encodeFunctionData("resetOwner", [
          arrayify(id(thirdAccount.address)),
          signature,
          thirdAccount.address,
        ]);
        const userOp = await getSignedUserOp(
          sender,
          await entryPoint.getNonce(sender, 0),
          "0x",
          callData,
          paymaster.address,
          entryPoint,
          owner,
        );

        const tx = await entryPoint.handleOps([userOp], owner.address);
        await tx.wait();

        const account = await ethers.getContractAt(
          "RecoverableAccount",
          sender,
        );

        expect(await account.admins(1)).to.equal(otherAccount.address);
        expect(await account.admins(0)).to.equal(thirdAccount.address);
      };

      await resetOwner();
    });
    it("Should DENY a non recover address to set a new owner.", async () => {
      const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
      const { accountFactory, entryPoint, paymaster } =
        await loadFixture(deploy);

      await entryPoint.depositTo(paymaster.address, {
        value: parseEther("100"),
      });

      const initCode = getInitCode(accountFactory, owner.address);
      const sender = (await getSender(entryPoint, initCode)) as string;

      const Account = await ethers.getContractFactory("RecoverableAccount");

      const addAdmin = async () => {
        const signature = await owner.signMessage(
          arrayify(id(otherAccount.address)),
        );
        const callData = Account.interface.encodeFunctionData("addAdmin", [
          arrayify(id(otherAccount.address)),
          signature,
          otherAccount.address,
        ]);

        const userOp = await getSignedUserOp(
          sender,
          await entryPoint.getNonce(sender, 0),
          initCode,
          callData,
          paymaster.address,
          entryPoint,
          owner,
        );

        const tx = await entryPoint.handleOps([userOp], owner.address);
        await tx.wait();

        const account = await ethers.getContractAt(
          "RecoverableAccount",
          sender,
        );

        expect(await account.admins(1)).to.equal(otherAccount.address);
      };

      await addAdmin();

      const resetOwner = async () => {
        const signature = await thirdAccount.signMessage(
          arrayify(id(thirdAccount.address)),
        );

        const callData = Account.interface.encodeFunctionData("resetOwner", [
          arrayify(id(thirdAccount.address)),
          signature,
          thirdAccount.address,
        ]);
        const userOp = await getSignedUserOp(
          sender,
          await entryPoint.getNonce(sender, 0),
          "0x",
          callData,
          paymaster.address,
          entryPoint,
          thirdAccount,
        );

        try {
          const tx = await entryPoint.handleOps([userOp], owner.address);
          await tx.wait();
        } catch (error) {
          const account = await ethers.getContractAt(
            "RecoverableAccount",
            sender,
          );

          expect(await account.admins(1)).to.equal(otherAccount.address);
          expect(await account.admins(0)).to.equal(owner.address);
        }
      };

      await resetOwner();
    });
  });
});
