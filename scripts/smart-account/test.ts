import { ethers } from "hardhat";
import { ACCOUNT_ADDR, EP_ADDR, PM_ADDR } from ".";

async function main() {
  const account = await ethers.getContractAt("Account", ACCOUNT_ADDR);
  const count = await account.count();

  console.log({ count });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
