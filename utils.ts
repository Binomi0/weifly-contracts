import { ethers } from "hardhat";
import { encodeBytes32String, getBytes, hexlify, parseUnits } from "ethers";
import { defaultAbiCoder } from "@ethersproject/abi";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AircraftNFT, AirlineCoin, LicenseNFT } from "./typechain-types";
import { aircrafts, licenses } from "./contants";

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export async function deployAirlineCoin(owner: string) {
  const AirlineCoin = await ethers.getContractFactory("AirlineCoin");
  const airlineCoin = await AirlineCoin.deploy(owner, "Airline Coin", "AIRL");

  return airlineCoin;
}

export async function deployAirlineRewardCoin(owner: string) {
  const AirlineRewardCoin =
    await ethers.getContractFactory("AirlineRewardCoin");
  const airlineRewardCoin = await AirlineRewardCoin.deploy(
    owner,
    "Airline Reward Coin",
    "AIRG",
  );

  return airlineRewardCoin;
}

export async function deployFlightController(
  owner: string,
  aircraftNFTAddress: string,
  airlineCoinAddress: string,
) {
  const FlightController = await ethers.getContractFactory("FlightController");
  const flightController = await FlightController.deploy(
    owner,
    aircraftNFTAddress,
    airlineCoinAddress,
  );

  return flightController;
}

export async function deployLicenseNFT(owner: string) {
  const License = await ethers.getContractFactory("LicenseNFT");
  const license = await License.deploy(
    owner,
    "License",
    "AIRC",
    owner,
    0,
    owner,
  );
  // console.log("LicenseNFT deployed at address:", license.address);

  return license;
}

export async function deployAircraftNFT(
  owner: HardhatEthersSigner,
  licenseAddress: string,
) {
  const Aircraft = await ethers.getContractFactory("AircraftNFT");
  const aircraft = await Aircraft.deploy(
    owner.address,
    "Aircraft",
    "AIRA",
    owner.address,
    0,
    owner.address,
    licenseAddress,
  );
  // console.log("AircraftNFT deployed at address:", aircraft.address);

  return aircraft;
}

export async function setClaimConditionsLicense(
  license: LicenseNFT,
  tokenId: number,
  airlineCoin: AirlineCoin,
) {
  await license.setClaimConditions(
    tokenId,
    {
      currency: await airlineCoin.getAddress(),
      maxClaimableSupply: 100,
      metadata: JSON.stringify(licenses[tokenId]),
      startTimestamp: await time.latest(),
      quantityLimitPerWallet: 1,
      pricePerToken: parseUnits(licenses[tokenId].price.toString(), "ether"),
      supplyClaimed: 0,
      merkleRoot: ZERO_ADDRESS,
    },
    false,
  );
}

export async function mintLicense(
  license: LicenseNFT,
  otherAccount: HardhatEthersSigner,
  tokenId: number,
  airlineCoin: AirlineCoin,
  requiredLicenseId: number,
  amount = 1,
) {
  // console.log("Minting License Token id =>", tokenId);
  const cc = await license.claimCondition(tokenId);
  const encodedData = defaultAbiCoder.encode(["uint256"], [requiredLicenseId]);

  return await license.connect(otherAccount).claim(
    otherAccount.address,
    tokenId,
    amount,
    await airlineCoin.getAddress(),
    parseUnits(licenses[tokenId].price.toString(), "ether"),
    {
      proof: [ZERO_ADDRESS],
      quantityLimitPerWallet: cc.quantityLimitPerWallet,
      pricePerToken: cc.pricePerToken,
      currency: cc.currency,
    },
    hexlify(encodedData),
  );
}

export async function lazyMintLicense(
  _amount: string,
  tokenId: number,
  owner: HardhatEthersSigner,
  license: LicenseNFT,
) {
  const amount = parseUnits(_amount, "wei"); // Minting 1 token
  const baseURIForTokens = "http://localhost:3000/api/metadata/license/";
  const encryptedURI = await owner.signMessage(baseURIForTokens);
  const provenanceHash = encodeBytes32String(""); // Convert to bytes32
  const _data = defaultAbiCoder.encode(
    ["bytes", "bytes32"],
    [getBytes(encryptedURI), provenanceHash],
  );

  try {
    await license.lazyMint(amount, baseURIForTokens, _data);

    return true;
  } catch (error) {
    console.log("ERROR =>", error);
    return false;
  }
}

export async function setClaimConditionsAircraft(
  aircraft: AircraftNFT,
  tokenId: number,
  airlineCoin: AirlineCoin,
) {
  await aircraft.setClaimConditions(
    tokenId,
    {
      currency: await airlineCoin.getAddress(),
      maxClaimableSupply: 100,
      metadata: JSON.stringify(aircrafts[tokenId]),
      startTimestamp: await time.latest(),
      quantityLimitPerWallet: 1,
      pricePerToken: parseUnits(aircrafts[tokenId].price.toString(), "ether"),
      supplyClaimed: 0,
      merkleRoot: ZERO_ADDRESS,
    },
    false,
  );
}

export async function mintAircraft(
  aircraft: AircraftNFT,
  otherAccount: HardhatEthersSigner,
  tokenId: number,
  airlineCoin: AirlineCoin,
  amount = 1,
) {
  // console.log("Minting Aircraft Token id =>", tokenId);

  const cc = await aircraft.claimCondition(tokenId);
  const encodedData = defaultAbiCoder.encode(["uint256"], [tokenId]);

  return await aircraft.connect(otherAccount).claim(
    otherAccount.address,
    tokenId,
    amount,
    await airlineCoin.getAddress(),
    parseUnits(aircrafts[tokenId].price.toString(), "ether"),
    {
      proof: [ZERO_ADDRESS],
      quantityLimitPerWallet: cc.quantityLimitPerWallet,
      pricePerToken: cc.pricePerToken,
      currency: cc.currency,
    },
    hexlify(encodedData),
  );
}

export async function lazyMintAircraft(
  _amount: string,
  tokenId: number,
  owner: HardhatEthersSigner,
  aircraft: LicenseNFT,
) {
  const amount = parseUnits(_amount, "wei"); // Minting 1 token
  const baseURIForTokens = "http://localhost:3000/api/metadata/aircraft/"; // Replace with your actual base URI
  const encryptedURI = await owner.signMessage(baseURIForTokens);
  const provenanceHash = encodeBytes32String(""); // Convert to bytes32
  const _data = defaultAbiCoder.encode(
    ["bytes", "bytes32"],
    [getBytes(encryptedURI), provenanceHash],
  );

  try {
    await aircraft.lazyMint(amount, baseURIForTokens, _data);

    return true;
  } catch (error) {
    console.log("ERROR =>", error);
    return false;
  }
}
