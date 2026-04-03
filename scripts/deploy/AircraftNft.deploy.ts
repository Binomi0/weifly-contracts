import hre from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Script de deploy para AircraftNFT (ERC-1155)
 *
 * Requiere que LicenseNFT esté desplegado previamente.
 * Establece LICENSE_ADDRESS en el environment o modifica la variable.
 *
 * Uso:
 *   LICENSE_ADDRESS=0x... npx hardhat run scripts/deploy/AircraftNft.deploy.ts --network arbitrum-rinkeby
 *   npx hardhat run scripts/deploy/AircraftNft.deploy.ts --network localhost
 */

async function main() {
  const net = hre as HardhatRuntimeEnvironment;
  const { ethers } = await net.network.connect();

  console.log("🚀 Deploy de AircraftNFT...");

  const [deployer] = await ethers.getSigners();

  // Leer address de LicenseNFT
  let licenseAddress = process.env.LICENSE_ADDRESS;
  if (!licenseAddress) {
    // Intentar leer del archivo de deployment
    const fs = require("fs");
    const path = require("path");
    const licenseDeployPath = path.join(
      __dirname,
      "../deployment/LicenseNFT.deployed.json",
    );
    if (fs.existsSync(licenseDeployPath)) {
      const licenseData = JSON.parse(
        fs.readFileSync(licenseDeployPath, "utf8"),
      );
      licenseAddress = licenseData.address;
      console.log("📖 LicenseNFT address leído de:", licenseDeployPath);
    } else {
      throw new Error(
        "LicenseNFT no desplegado. Ejecuta primero LicenseNFT.deploy.ts o establece LICENSE_ADDRESS",
      );
    }
  }

  const NAME = "WeiFly Aircraft";
  const SYMBOL = "WAIRC";
  const ROYALTY_RECIPIENT = deployer.address;
  const ROYALTY_BPS = 500; // 5%
  const PRIMARY_SALE_RECIPIENT = deployer.address;

  const AircraftNFTFactory = await ethers.getContractFactory("AircraftNFT");
  const aircraftNFT = await AircraftNFTFactory.deploy(
    deployer.address,
    NAME,
    SYMBOL,
    ROYALTY_RECIPIENT,
    ROYALTY_BPS,
    PRIMARY_SALE_RECIPIENT,
    licenseAddress,
  );

  await aircraftNFT.waitForDeployment();

  console.log("✅ AircraftNFT deployed to:", await aircraftNFT.getAddress());

  // Guardar address en archivo
  const fs = require("fs");
  const path = require("path");
  const deployPath = path.join(
    __dirname,
    "../deployment/AircraftNft.deployed.json",
  );
  fs.writeFileSync(
    deployPath,
    JSON.stringify(
      {
        address: await aircraftNFT.getAddress(),
        network: process.env.NETWORK || "hardhat",
      },
      null,
      2,
    ),
  );

  console.log("📁 Address guardado en:", deployPath);

  console.log("\n🔑 Deployer:", deployer.address);
  console.log("🔗 License Address:", licenseAddress);

  console.log("\n📋 Métodos disponibles:");
  console.log("  - mintTo(to, tokenId, amount, data)");
  console.log("  - burnFrom(from, tokenId, amount)");
  console.log("  - sendGas(to, aircraftId, amount)");
  console.log("  - burnGas(holder, aircraftId, amount)");
  console.log("  - getGasBalance(holder, aircraftId)");
  console.log("  - setRequiredLicense(aircraftId, licenseId)");

  console.log("\n⚙️ Configuración actual:");
  console.log("  - Name:", await aircraftNFT.name());
  console.log("  - Symbol:", await aircraftNFT.symbol());
  console.log("  - License Address:", licenseAddress);
}
