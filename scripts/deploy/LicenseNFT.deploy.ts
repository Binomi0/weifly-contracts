import { ethers } from "hardhat";
import { LicenseNFT } from "../../typechain-types";
import { parseUnits } from "ethers";

/**
 * Script de deploy para LicenseNFT (ERC-721)
 * 
 * Uso:
 *   npx hardhat run scripts/deploy/LicenseNFT.deploy.ts --network arbitrum-rinkeby
 *   npx hardhat run scripts/deploy/LicenseNFT.deploy.ts --network localhost
 */

async function main() {
  console.log("🚀 Deploy de LicenseNFT...");
  
  const NAME = "WeiFly Pilot License";
  const SYMBOL = "WLICE";
  
  const LicenseNFT = await ethers.getContractFactory("LicenseNFT");
  const licenseNFT = await LicenseNFT.deploy(NAME, SYMBOL);
  
  await licenseNFT.waitForDeployment();
  
  console.log("✅ LicenseNFT deployed to:", await licenseNFT.getAddress());
  
  // Guardar address en archivo
  const fs = require("fs");
  const path = require("path");
  const deployPath = path.join(__dirname, "../deployment/LicenseNFT.deployed.json");
  fs.writeFileSync(
    deployPath,
    JSON.stringify({ address: await licenseNFT.getAddress(), network: process.env.NETWORK || "hardhat" }, null, 2)
  );
  
  console.log("📁 Address guardado en:", deployPath);
  
  // Ejemplo de mint para testing
  const [deployer] = await ethers.getSigners();
  console.log("\n🔑 Deployer:", deployer.address);
  
  console.log("\n📋 Métodos disponibles:");
  console.log("  - mintLicense(pilot, type, metadata)");
  console.log("  - burnLicense(tokenId, reason)");
  console.log("  - getLicenseInfo(tokenId)");
  console.log("  - getAllLicenses()");
  
  console.log("\n⚙️ Configuración actual:");
  console.log("  - Name:", await licenseNFT.name());
  console.log("  - Symbol:", await licenseNFT.symbol());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
