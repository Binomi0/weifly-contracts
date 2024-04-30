import {
  deployLicenseNFT,
  lazyMintLicense,
  mintLicense,
  setClaimConditionsLicense,
} from "../../utils";
import { AirlineCoin } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { parseUnits } from "ethers";

const MAX_INT_ETH =
  "0x8000000000000000000000000000000000000000000000000000000000000000";

const deployLicense = async (
  accounts: HardhatEthersSigner[],
  airlineCoin: AirlineCoin,
) => {
  console.group("----- DEPLOY LICENSE -----");
  const [owner, otherAccount] = accounts;
  const license = await deployLicenseNFT(owner.address);

  await airlineCoin
    .connect(otherAccount)
    .approve(license.address, parseUnits("160", "ether"));

  await lazyMintLicense("4", 0, owner, license);
  await setClaimConditionsLicense(license, 0, airlineCoin);
  await setClaimConditionsLicense(license, 1, airlineCoin);
  await setClaimConditionsLicense(license, 2, airlineCoin);
  await setClaimConditionsLicense(license, 3, airlineCoin);

  await mintLicense(license, otherAccount, 0, airlineCoin, 0, 1);
  await mintLicense(license, otherAccount, 1, airlineCoin, 0, 1);
  await mintLicense(license, otherAccount, 2, airlineCoin, 1, 1);
  await mintLicense(license, otherAccount, 3, airlineCoin, 2, 1);

  console.log("LICENSE URI 0 =>", await license.uri("0"));
  console.log("LICENSE URI 1 =>", await license.uri("1"));
  console.log("LICENSE URI 2 =>", await license.uri("2"));
  console.log("LICENSE URI 3 =>", await license.uri("3"));

  console.log("----- LICENSE DEPLOYED AND MINTED");
  console.groupEnd();
  console.log("");
  return license;
};

const mintLicenses = async () => {};

export default deployLicense;
