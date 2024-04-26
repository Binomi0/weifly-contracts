import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import {
  deployAircraftNFT,
  deployAirlineCoin,
  deployAirlineRewardCoin,
  deployLicenseNFT,
  lazyMintAircraft,
  lazyMintLicense,
  mintAircraft,
  mintLicense,
  setClaimConditionsAircraft,
  setClaimConditionsLicense,
} from "../../utils";
import { ethers } from "hardhat";

describe("Handle Gas", async () => {
  async function deployContracts() {
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();
    const airlineCoin = await deployAirlineCoin(owner.address);
    const airlineRewardCoin = await deployAirlineRewardCoin(owner.address);
    const license = await deployLicenseNFT(owner.address);
    const aircraft = await deployAircraftNFT(owner, license.address);

    return {
      license,
      aircraft,
      airlineCoin,
      airlineRewardCoin,
      owner,
      otherAccount,
      thirdAccount,
    };
  }

  it("Should hanlde correctly combustible", async () => {
    const {
      owner,
      license,
      airlineCoin,
      airlineRewardCoin,
      otherAccount,
      aircraft,
    } = await loadFixture(deployContracts);

    await airlineCoin.approve(otherAccount.address, parseEther("2"));
    await airlineCoin.transfer(otherAccount.address, parseEther("2"));
    await airlineRewardCoin.approve(otherAccount.address, parseEther("1"));
    await airlineRewardCoin.transfer(otherAccount.address, parseEther("1"));

    const prevBalance = await airlineRewardCoin.balanceOf(aircraft.address);
    expect(prevBalance).to.eq(0);

    await airlineRewardCoin
      .connect(otherAccount)
      .approve(aircraft.address, parseEther("1"));
    await airlineRewardCoin
      .connect(otherAccount)
      .transfer(aircraft.address, parseEther("1"));

    const afterBalance = await airlineRewardCoin.balanceOf(aircraft.address);
    expect(afterBalance).to.eq(parseEther("1"));

    await aircraft.setAirlineCoin(airlineCoin.address);
    await aircraft.setAirlineGasCoin(airlineRewardCoin.address);

    await lazyMintLicense("1", 0, owner, license);
    await setClaimConditionsLicense(license, 0, airlineCoin);
    await mintLicense(license, otherAccount, 0, airlineCoin, 0);

    await lazyMintAircraft("1", 0, owner, aircraft);
    await setClaimConditionsAircraft(aircraft, 0, airlineCoin);
    await mintAircraft(aircraft, otherAccount, 0, airlineCoin);

    expect(await aircraft.gasBalance(otherAccount.address, 0)).to.equal(0);
    await aircraft.sendGas(otherAccount.address, parseEther("1"), 0);
    expect(await aircraft.gasBalance(otherAccount.address, 0)).to.equal(
      parseEther("1"),
    );
    expect(await aircraft.gasBalance(otherAccount.address, 1)).to.equal(0);

    const balance = await airlineRewardCoin.balanceOf(aircraft.address);
    expect(balance).to.equal(parseEther("1"));
    expect(await aircraft.gasBalance(otherAccount.address, 0)).to.equal(
      parseEther("1"),
    );
    expect(await airlineRewardCoin.totalSupply()).to.equal(
      parseEther("1000000000"),
    );

    await airlineRewardCoin.approve(aircraft.address, parseEther("1"));
    await aircraft.burnGas(otherAccount.address, 0, parseEther("1"));
    expect(await aircraft.gasBalance(otherAccount.address, 0)).to.equal(0);

    expect(await airlineRewardCoin.totalSupply()).to.equal(
      parseEther("999999999"),
    );
  });
});
