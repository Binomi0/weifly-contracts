import {
  deployAircraftNFT,
  lazyMintAircraft,
  mintAircraft,
  setClaimConditionsAircraft,
} from "../utils";
import { AirlineCoin, LicenseNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseUnits } from "ethers/lib/utils";

const deployAircraft = async (
  accounts: SignerWithAddress[],
  airlineCoin: AirlineCoin,
  license: LicenseNFT,
) => {
  console.group("----- DEPLOY AIRCRAFT NFT -----");

  const [owner, otherAccount] = accounts;
  const aircraft = await deployAircraftNFT(owner, license.address);

  await airlineCoin
    .connect(otherAccount)
    .approve(aircraft.address, parseUnits("160", "ether"));

  await lazyMintAircraft("4", 0, owner, aircraft);

  await setClaimConditionsAircraft(aircraft, 0, airlineCoin);
  await setClaimConditionsAircraft(aircraft, 1, airlineCoin);
  await setClaimConditionsAircraft(aircraft, 2, airlineCoin);
  await setClaimConditionsAircraft(aircraft, 3, airlineCoin);

  await mintAircraft(aircraft, otherAccount, 0, airlineCoin);
  await mintAircraft(aircraft, otherAccount, 1, airlineCoin);
  await mintAircraft(aircraft, otherAccount, 2, airlineCoin);
  await mintAircraft(aircraft, otherAccount, 3, airlineCoin);

  console.log("AIRCRAFT URI 0 =>", await aircraft.uri(0));
  console.log("AIRCRAFT URI 1 =>", await aircraft.uri(1));
  console.log("AIRCRAFT URI 2 =>", await aircraft.uri(2));
  console.log("AIRCRAFT URI 3 =>", await aircraft.uri(3));

  console.log("----- AIRCRAFT DEPLOYED AND MINTED");
  console.groupEnd();
  console.log("");

  return aircraft;
};

export default deployAircraft;
