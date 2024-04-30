// Contracts are deployed using the first signer/account by default

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { AccountFactory, EntryPoint } from "../../typechain-types";
import { arrayify, id, parseEther } from "ethers/lib/utils";
import { BigNumber } from "ethers";
import {
  getInitCode,
  getSender,
  getUserOp,
  signUserOp,
} from "../../utils/testutils";
import { fillUserOp, packUserOp } from "../../utils/UserOp";
import { UserOperation } from "../../utils/UserOperation";
import { PackedUserOperationStruct } from "../../typechain-types/@account-abstraction/contracts/core/EntryPoint";

describe("[RecoverableAccount]", () => {
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

    const userOp = await getUserOp({
      sender,
      nonce: await entryPoint.getNonce(sender, 0),
      initCode,
      callData: Account.interface.encodeFunctionData("execute"),
      callGasLimit: 2_000_000,
      verificationGasLimit: 2_000_000,
      preVerificationGas: 100_000,
      maxFeePerGas: ethers.utils.parseUnits("40", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("20", "gwei"),
    });
    const packedUserOp: PackedUserOperationStruct = packUserOp(
      fillUserOp(userOp, paymaster.address),
    );

    const signedUserOp = await signUserOp(entryPoint, packedUserOp, owner);

    const tx = await entryPoint.handleOps([signedUserOp], owner.address);
    await tx.wait();

    const account = await ethers.getContractAt("RecoverableAccount", sender);

    expect(await account.count()).to.equal(1);
  });

  it("Should allow owner to add recovery address.", async () => {
    const { owner, otherAccount, accountFactory, entryPoint, paymaster } =
      await loadFixture(deploy);

    await entryPoint.depositTo(paymaster.address, { value: parseEther("100") });

    const initCode = getInitCode(accountFactory, owner.address);
    const sender = (await getSender(entryPoint, initCode)) as string;
    const signature = await owner.signMessage(
      arrayify(id(otherAccount.address)),
    );
    const Account = await ethers.getContractFactory("RecoverableAccount");

    const userOp = await getUserOp({
      sender,
      nonce: await entryPoint.getNonce(sender, 0),
      initCode,
      callData: Account.interface.encodeFunctionData("addAdmin", [
        arrayify(id(otherAccount.address)),
        signature,
        otherAccount.address,
      ]),
      callGasLimit: 2_000_000,
      verificationGasLimit: 2_000_000,
      preVerificationGas: 100_000,
      maxFeePerGas: ethers.utils.parseUnits("40", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("20", "gwei"),
    });

    const packedUserOp: PackedUserOperationStruct = packUserOp(
      fillUserOp(userOp, paymaster.address),
    );
    const signedUserOp = await signUserOp(entryPoint, packedUserOp, owner);

    const tx = await entryPoint.handleOps([signedUserOp], owner.address);
    await tx.wait();

    const account = await ethers.getContractAt("RecoverableAccount", sender);

    expect(await account.admins(1)).to.emit(account, "AddAdmin");
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

    const userOp = await getUserOp({
      sender,
      nonce: await entryPoint.getNonce(sender, 0),
      initCode,
      callData: Account.interface.encodeFunctionData("addAdmin", [
        arrayify(id(otherAccount.address)),
        signature,
        otherAccount.address,
      ]),
      callGasLimit: 2_000_000,
      verificationGasLimit: 2_000_000,
      preVerificationGas: 100_000,
      maxFeePerGas: ethers.utils.parseUnits("40", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("20", "gwei"),
    });

    const packedUserOp = packUserOp(userOp);
    const signedUserOp = await signUserOp(
      entryPoint,
      packedUserOp,
      thirdAccount,
    );

    entryPoint
      .handleOps([signedUserOp], thirdAccount.address)
      .catch((error) => {
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

        const userOp = await getUserOp({
          sender,
          nonce: await entryPoint.getNonce(sender, 0),
          initCode,
          callData,
          callGasLimit: 2_000_000,
          verificationGasLimit: 2_000_000,
          preVerificationGas: 100_000,
          maxFeePerGas: ethers.utils.parseUnits("40", "gwei"),
          maxPriorityFeePerGas: ethers.utils.parseUnits("20", "gwei"),
        });

        const packedUserOp: PackedUserOperationStruct = packUserOp(
          fillUserOp(userOp, paymaster.address),
        );
        const signedUserOp = await signUserOp(entryPoint, packedUserOp, owner);

        const tx = await entryPoint.handleOps([signedUserOp], owner.address);
        await tx.wait();

        const account = await ethers.getContractAt(
          "RecoverableAccount",
          sender,
        );

        expect(await account.admins(1)).to.equal(otherAccount.address);
      };

      await addAdmin();

      const setNewOwner = async () => {
        const signature = await otherAccount.signMessage(
          arrayify(id(thirdAccount.address)),
        );

        const callData = Account.interface.encodeFunctionData("setNewOwner", [
          arrayify(id(thirdAccount.address)),
          signature,
          thirdAccount.address,
        ]);

        const userOp = await getUserOp({
          sender,
          nonce: await entryPoint.getNonce(sender, 0),
          initCode: "0x",
          callData,
          callGasLimit: 1_000_000,
          verificationGasLimit: 1_000_000,
        });

        const packedUserOp: PackedUserOperationStruct = packUserOp(
          fillUserOp(userOp, paymaster.address),
        );
        const signedUserOp = await signUserOp(
          entryPoint,
          packedUserOp,
          otherAccount,
        );

        const tx = await entryPoint.handleOps(
          [signedUserOp],
          otherAccount.address,
        );
        await tx.wait();

        const account = await ethers.getContractAt(
          "RecoverableAccount",
          sender,
        );

        expect(await account.admins(1)).to.equal(otherAccount.address);
        expect(await account.admins(0)).to.equal(thirdAccount.address);
      };

      await setNewOwner();
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

        const userOp = await getUserOp({
          sender,
          nonce: await entryPoint.getNonce(sender, 0),
          initCode,
          callData,
          callGasLimit: 2_000_000,
          verificationGasLimit: 2_000_000,
          preVerificationGas: 100_000,
          maxFeePerGas: ethers.utils.parseUnits("40", "gwei"),
          maxPriorityFeePerGas: ethers.utils.parseUnits("20", "gwei"),
        });

        const packedUserOp: PackedUserOperationStruct = packUserOp(
          fillUserOp(userOp, paymaster.address),
        );
        const signedUserOp = await signUserOp(entryPoint, packedUserOp, owner);

        const tx = await entryPoint.handleOps([signedUserOp], owner.address);
        await tx.wait();

        const account = await ethers.getContractAt(
          "RecoverableAccount",
          sender,
        );

        expect(await account.admins(1)).to.equal(otherAccount.address);
      };

      await addAdmin();

      const setNewOwner = async () => {
        const signature = await otherAccount.signMessage(
          arrayify(id(thirdAccount.address)),
        );

        const callData = Account.interface.encodeFunctionData("setNewOwner", [
          arrayify(id(thirdAccount.address)),
          signature,
          thirdAccount.address,
        ]);

        const userOp = await getUserOp({
          sender,
          nonce: await entryPoint.getNonce(sender, 0),
          initCode: "0x",
          callData,
          callGasLimit: 2_000_000,
          verificationGasLimit: 2_000_000,
          preVerificationGas: 100_000,
          maxFeePerGas: ethers.utils.parseUnits("40", "gwei"),
          maxPriorityFeePerGas: ethers.utils.parseUnits("20", "gwei"),
        });

        const packedUserOp: PackedUserOperationStruct = packUserOp(
          fillUserOp(userOp, paymaster.address),
        );
        const signedUserOp = await signUserOp(
          entryPoint,
          packedUserOp,
          otherAccount,
        );

        try {
          const tx = await entryPoint.handleOps([signedUserOp], owner.address);
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

      await setNewOwner();
    });
    it("Only owner should be able to changeLock status", async () => {
      const [owner, otherAccount] = await ethers.getSigners();
      const { accountFactory, entryPoint, paymaster } =
        await loadFixture(deploy);
      await entryPoint.depositTo(paymaster.address, {
        value: parseEther("100"),
      });
      const initCode = getInitCode(accountFactory, owner.address);
      const sender = (await getSender(entryPoint, initCode)) as string;

      const Account = await ethers.getContractFactory("RecoverableAccount");
      const account = await ethers.getContractAt("RecoverableAccount", sender);

      const addAdmin = async () => {
        const signature = await owner.signMessage(
          arrayify(id(otherAccount.address)),
        );
        const callData = Account.interface.encodeFunctionData("addAdmin", [
          arrayify(id(otherAccount.address)),
          signature,
          otherAccount.address,
        ]);

        const userOp = await getUserOp({
          sender,
          nonce: await entryPoint.getNonce(sender, 0),
          initCode,
          callData,
          callGasLimit: 2_000_000,
          verificationGasLimit: 2_000_000,
          preVerificationGas: 100_000,
          maxFeePerGas: ethers.utils.parseUnits("40", "gwei"),
          maxPriorityFeePerGas: ethers.utils.parseUnits("20", "gwei"),
        });

        const packedUserOp: PackedUserOperationStruct = packUserOp(
          fillUserOp(userOp, paymaster.address),
        );
        const signedUserOp = await signUserOp(entryPoint, packedUserOp, owner);

        const tx = await entryPoint.handleOps([signedUserOp], owner.address);
        await tx.wait();

        const account = await ethers.getContractAt(
          "RecoverableAccount",
          sender,
        );

        expect(await account.admins(1)).to.equal(otherAccount.address);
      };

      await addAdmin();
      expect(await account.locked()).to.equal(0);

      const signature = await owner.signMessage(arrayify(id("1")));
      account.changeLock(arrayify(id("1")), signature, 1).catch((error) => {
        expect(error.message).to.rejectedWith("Only EntryPoint can call this");
      });

      const callData = Account.interface.encodeFunctionData("changeLock", [
        arrayify(id("1")),
        signature,
        1,
      ]);

      const userOp = await getUserOp({
        sender,
        nonce: await entryPoint.getNonce(sender, 0),
        initCode: "0x",
        callData,
        callGasLimit: 200_000,
        verificationGasLimit: 200_000,
        preVerificationGas: 20_000,
        maxFeePerGas: ethers.utils.parseUnits("40", "gwei"),
        maxPriorityFeePerGas: ethers.utils.parseUnits("20", "gwei"),
      });

      const packedUserOp: PackedUserOperationStruct = packUserOp(
        fillUserOp(userOp, paymaster.address),
      );
      const signedUserOp = await signUserOp(entryPoint, packedUserOp, owner);

      const tx = await entryPoint.handleOps([signedUserOp], owner.address);
      await tx.wait();

      // expect(await account.locked()).to.equal(0);
      expect(await account.locked()).to.equal(1);
    });
  });
});
