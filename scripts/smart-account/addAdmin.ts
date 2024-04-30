import { ethers } from "hardhat";
import { arrayify, id, parseEther } from "ethers";
import { AF_ADDR, EP_ADDR, PM_ADDR } from ".";

async function main() {
  const entryPoint = await ethers.getContractAt("EntryPoint", EP_ADDR);
  const accountFactory = await ethers.getContractFactory("AccountFactory");

  const [signer, signer2] = await ethers.getSigners();
  const account0 = await signer.getAddress();
  const account2 = await signer2.getAddress();

  // InitCode is only used to create-deploy a new smart Account Address into a blockchain
  // So if entryPoint receives initcode other than 0x, it will understand that it's time to create it
  let initCode =
    AF_ADDR +
    accountFactory.interface
      .encodeFunctionData("createRecoverableAccount", [account0])
      .slice(2);
  console.log("Init code", initCode);

  let sender = "";
  try {
    await entryPoint.getSenderAddress(initCode);
  } catch (error) {
    // console.log(error);
    const err = error as { error: { data: { data: string } } };
    sender = `0x${err.error.data.data.slice(-40)}`;
  }

  console.log({ sender });
  if (!sender) {
    throw new Error("Missing sender");
  }

  const Account = await ethers.getContractFactory("BaseAccount");
  const signature = await signer.signMessage(arrayify(id(account2)));
  const userOp = {
    sender,
    nonce: await entryPoint.getNonce(sender, 0),
    // initCode,
    initCode: "0x",
    callData: Account.interface.encodeFunctionData("addAdmin", [
      arrayify(id(account2)),
      signature,
      account2,
    ]),
    callGasLimit: 600_000,
    verificationGasLimit: 600_000,
    preVerificationGas: 200_000,
    maxFeePerGas: ethers.utils.parseUnits("10", "gwei"),
    maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
    paymasterAndData: PM_ADDR, // we're not using a paymaster, for now
    signature: "0x", //
  };

  const userOpHash = await entryPoint.getUserOpHash(userOp);
  userOp.signature = await signer.signMessage(
    ethers.utils.arrayify(userOpHash),
  );

  const tx = await entryPoint.handleOps([userOp], account0);
  const receipt = await tx.wait();

  console.log(!!receipt);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
