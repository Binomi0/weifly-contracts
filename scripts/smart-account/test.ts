import { ethers } from "hardhat";
import { ACCOUNT_ADDR, EP_ADDR, PM_ADDR } from ".";

async function main() {
  const account = await ethers.getContractAt("Account", ACCOUNT_ADDR);
  const count = await account.count();
  const recover = await account.recover();
  const owner = await account.owner();

  console.log({ count });
  console.log({ recover });
  console.log({ owner });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
