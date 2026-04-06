import { describe, it } from "node:test";

import { expect } from "chai";

import {
  ethers,
  networkHelpers,
  deployAirlineCoin,
  deployLicenseNFT,
} from "../../utils.js";

describe("LicenseNFT - LAPL (0)", async function () {
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

    return { license, airlineCoin, pilotCareer, owner, pilotAccount, treasury };
  }

  it("Should set the right owner", async function () {
    const { license, owner } = await networkHelpers.loadFixture(deployFixture);
    expect(await license.owner()).to.equal(owner.address);
  });

  it("Should allow claim if pilot has 1+ hours and pays 10 AIRL", async () => {
    const { license, airlineCoin, pilotCareer, owner, pilotAccount } =
      await networkHelpers.loadFixture(deployFixture);

    const claimFee = await license.claimFee();
    expect(claimFee).to.equal(10000000000000000000n);

    const pilotAddress = await pilotAccount.getAddress();
    const licenseAddress = await license.getAddress();

    await airlineCoin.transfer(pilotAddress, claimFee);
    await airlineCoin.connect(pilotAccount).approve(licenseAddress, claimFee);

    const pilotControllerRole = await pilotCareer.PILOT_CONTROLLER_ROLE();
    await pilotCareer.grantRole(pilotControllerRole, owner.address);
    await pilotCareer.initPilot(pilotAccount.address, owner.address);
    await pilotCareer.recordFlight(pilotAccount.address, 1); // 2 hours

    await license
      .connect(pilotAccount)
      .claimLicense(0n, "ipfs://LAPL_METADATA"); // 0n = LAPL

    expect(await license.balanceOf(pilotAccount.address)).to.equal(1n);
    expect(await license.ownerOf(1n)).to.equal(pilotAccount.address);
    expect(await license.parseLicenseLevel("LAPL")).to.equal(1n);
  });

  it("Should FAIL if pilot has < 1 hours", async () => {
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
    // 0 hours

    try {
      await license.connect(pilotAccount).claimLicense(0n, "ipfs://");
      expect.fail("Should have reverted");
    } catch (e: unknown) {
      const error = e as Error;
      expect(error.message).to.include("Not enough flight hours");
    }
  });
});
