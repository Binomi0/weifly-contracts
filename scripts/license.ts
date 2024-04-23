import {
  deployLicenseNFT,
  lazyMintLicense,
  mintLicense,
  setClaimConditionsLicense,
} from "../utils";
import { AirlineCoin } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const deployLicense = async (
  accounts: SignerWithAddress[],
  airlineCoin: AirlineCoin,
) => {
  console.group("----- DEPLOY LICENSE -----");
  const [owner, otherAccount] = accounts;
  const license = await deployLicenseNFT(owner.address);

  await lazyMintLicense("4", 0, owner, license);
  await setClaimConditionsLicense(license, 0, airlineCoin);
  await mintLicense(license, otherAccount, 0, airlineCoin, 0, 1);

  await lazyMintLicense("4", 1, owner, license);
  await setClaimConditionsLicense(license, 1, airlineCoin);
  await mintLicense(license, otherAccount, 1, airlineCoin, 0, 1);

  await lazyMintLicense("4", 2, owner, license);
  await setClaimConditionsLicense(license, 2, airlineCoin);
  await mintLicense(license, otherAccount, 2, airlineCoin, 1, 1);

  await lazyMintLicense("4", 3, owner, license);
  await setClaimConditionsLicense(license, 3, airlineCoin);
  await mintLicense(license, otherAccount, 3, airlineCoin, 2, 1);

  console.log("----- LICENSE DEPLOYED AND MINTED");
  console.groupEnd();
  console.log("");
  return license;
};

export default deployLicense;
