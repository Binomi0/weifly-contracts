import {
  deployAircraftNFT,
  lazyMintAircraft,
  mintAircraft,
  setClaimConditionsAircraft,
} from "../utils";
import { AirlineCoin, LicenseNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const deployAircraft = async (
  accounts: SignerWithAddress[],
  airlineCoin: AirlineCoin,
  license: LicenseNFT,
) => {
  console.group("----- DEPLOY AIRCRAFT NFT -----");

  const [owner, otherAccount] = accounts;
  const aircraft = await deployAircraftNFT(owner, license.address);

  await lazyMintAircraft("4", 0, owner, aircraft);
  await setClaimConditionsAircraft(aircraft, 0, airlineCoin);
  await mintAircraft(aircraft, otherAccount, 0, airlineCoin);

  await lazyMintAircraft("4", 1, owner, aircraft);
  await setClaimConditionsAircraft(aircraft, 1, airlineCoin);
  await mintAircraft(aircraft, otherAccount, 1, airlineCoin);

  await lazyMintAircraft("4", 2, owner, aircraft);
  await setClaimConditionsAircraft(aircraft, 2, airlineCoin);
  await mintAircraft(aircraft, otherAccount, 2, airlineCoin);

  await lazyMintAircraft("4", 3, owner, aircraft);
  await setClaimConditionsAircraft(aircraft, 3, airlineCoin);
  await mintAircraft(aircraft, otherAccount, 3, airlineCoin);

  console.log("----- AIRCRAFT DEPLOYED AND MINTED");
  console.groupEnd();
  console.log("");

  return aircraft;
};

export default deployAircraft;
