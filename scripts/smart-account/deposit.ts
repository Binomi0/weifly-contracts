import { ethers } from "hardhat";
import { parseEther, parseUnits } from "ethers";
import { EP_ADDR, PM_ADDR } from ".";

async function main() {
  const entryPoint = await ethers.getContractAt("EntryPoint", EP_ADDR);

  await entryPoint.depositTo(PM_ADDR, { value: parseEther("100") });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
