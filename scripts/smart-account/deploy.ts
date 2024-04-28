import { ethers } from "hardhat";
import { AF_ADDR, EP_ADDR, PM_ADDR } from ".";

async function main() {
  const ep = await ethers.provider.getCode(EP_ADDR);

  if (ep === "0x") {
    console.log("EP Not deployed yet, deploying...");
    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    const entryPoint = await EntryPoint.deploy();
    await entryPoint.deployed();

    console.log(entryPoint.address);
  } else {
    console.log(EP_ADDR);
  }

  const af = await ethers.provider.getCode(AF_ADDR);

  if (af === "0x") {
    console.log("AF Not deployed yet, deploying...");

    const AccountFactory = await ethers.getContractFactory("AccountFactory");
    const accountFactory = await AccountFactory.deploy();
    await accountFactory.deployed();

    console.log(accountFactory.address);
  } else {
    console.log(AF_ADDR); // AF_ADDR
  }

  const pm = await ethers.provider.getCode(PM_ADDR);

  if (pm === "0x") {
    console.log("PM Not deployed yet, deploying...");
    const Paymaster = await ethers.getContractFactory("Paymaster");
    const paymaster = await Paymaster.deploy();
    await paymaster.deployed();

    console.log(paymaster.address);
  } else {
    console.log(PM_ADDR);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
