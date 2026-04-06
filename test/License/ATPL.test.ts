import { describe, it } from "node:test";

import { expect } from "chai";

import {
  ethers,
  networkHelpers,
  deployAirlineCoin,
  deployLicenseNFT,
} from "../../utils.js";

describe("License D NFT", async function () {
  async function deployFixture() {
    const [owner, pilotAccount, treasury] = await ethers.getSigners();
    const airlineCoin = await deployAirlineCoin(owner.address);
    const license = await deployLicenseNFT();
    const PilotCareer = await ethers.getContractFactory("PilotCareer");
    const pilotCareer = await PilotCareer.deploy(owner.address);
    await pilotCareer.waitForDeployment();

    await license.setDependencies(
      await airlineCoin.getAddress(),
      await pilotCareer.getAddress(),
    );

    return {
      license,
      airlineCoin,
      pilotCareer,
      owner,
      pilotAccount,
      treasury,
    };
  }
  it("Should set the right owner", async function () {
    const { license, owner } = await networkHelpers.loadFixture(deployFixture);
    expect(await license.owner()).to.equal(owner.address);
  });

  it("Should allow claim if pilot has 500+ hours and pays 10 AIRL", async () => {
    const { license, airlineCoin, pilotCareer, owner, pilotAccount } =
      await networkHelpers.loadFixture(deployFixture);

    const claimFee = await license.claimFee();
    await airlineCoin.connect(owner).transfer(pilotAccount.address, claimFee);
    await airlineCoin
      .connect(pilotAccount)
      .approve(await license.getAddress(), claimFee);

    await pilotCareer.grantRole(
      await pilotCareer.PILOT_CONTROLLER_ROLE(),
      owner.address,
    );
    await pilotCareer.initPilot(pilotAccount.address, owner.address);
    await pilotCareer.recordFlight(pilotAccount.address, 501);

    await license.connect(pilotAccount).claimLicense(2n, "ipfs://PPL_METADATA"); // 1n = PPL

    expect(await license.balanceOf(pilotAccount.address)).to.equal(1n);
    expect(await license.parseLicenseLevel("CPL")).to.equal(3n);
  });

  it("Should FAIL if pilot pays fee but has < 500 hours", async () => {
    const { license, airlineCoin, owner, pilotAccount, pilotCareer } =
      await networkHelpers.loadFixture(deployFixture);

    const claimFee = await license.claimFee();
    await airlineCoin.connect(owner).transfer(pilotAccount.address, claimFee);
    await airlineCoin
      .connect(pilotAccount)
      .approve(await license.getAddress(), claimFee);

    await pilotCareer.grantRole(
      await pilotCareer.PILOT_CONTROLLER_ROLE(),
      owner.address,
    );
    await pilotCareer.initPilot(pilotAccount.address, owner.address);
    await pilotCareer.recordFlight(pilotAccount.address, 499);

    try {
      await license.connect(pilotAccount).claimLicense(2n, "ipfs://");
      expect.fail("Should have reverted");
    } catch (e: unknown) {
      const error = e as Error;
      expect(error.message).to.include("Not enough flight hours");
    }
  });
});
