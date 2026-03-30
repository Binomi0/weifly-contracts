import { ethers, constants } from "hardhat";
import { LicenseNFT } from "../../typechain-types";

/**
 * Script de mint de prueba para LicenseNFT
 * 
 * Uso:
 *   npx hardhat run scripts/mint/LicenseNFT.mint.ts --network localhost
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deployer:", deployer.address);
  
  // Importar contrato ya deployado
  const fs = require("fs");
  const path = require("path");
  
  let licenseNFT: LicenseNFT;
  
  // Cargar contrato deployado desde deployment directory
  const network = process.env.NETWORK || "localhost";
  const deployFile = path.join(__dirname, `../deployment/${network}.json`);
  
  if (fs.existsSync(deployFile)) {
    const deployed = JSON.parse(fs.readFileSync(deployFile, "utf8"));
    const contract = await ethers.getContractAt("LicenseNFT", deployed.address);
    licenseNFT = contract as LicenseNFT;
    console.log("✅ Contrato cargado:", deployed.address);
  } else {
    console.error("❌ No encontrado archivo de deployment:", deployFile);
    process.exit(1);
  }
  
  // Ejemplo de mint
  console.log("\n🎯 Ejecutando mint de prueba...");
  
  const pilot = "0x70997970C51812dc3A010C7d01b50e0d17777d48"; // Address de ejemplo (Sepolia faucet)
  const licenseType = "N1";
  const metadata = {
    name: `WeiFly License N1 - ${pilot.slice(0, 8)}...`,
    description: "Licencia de piloto N1 - WeiFly",
    image: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nmtYkFgnCT917v7cc7fM137",
    attributes: [
      { trait_type: "License Type", value: "N1" },
      { trait_type: "Level", value: "1" },
      { trait_type: "Flight Hours", value: "0" },
      { trait_type: "Verified", value: "true" }
    ]
  };
  
  const metadataURI = JSON.stringify(metadata);
  
  try {
    // Mint de licencia
    const tx = await licenseNFT.mintLicense(pilot, licenseType, metadataURI);
    console.log("📝 Transaction hash:", tx.hash);
    
    // Esperar confirmación
    const receipt = await tx.wait();
    console.log("✅ Confirmaciones:", receipt.confirmations);
    
    // Verificar mint
    const licenseInfo = await licenseNFT.getLicenseInfo(1);
    console.log("\n📋 Licencia minteada:");
    console.log("  - Token ID:", 1);
    console.log("  - Pilot:", licenseInfo.pilot);
    console.log("  - Type:", licenseInfo.type);
    console.log("  - Level:", licenseInfo.level);
    console.log("  - Mint Time:", new Date(licenseInfo.mintTime * 1000).toLocaleString());
    
    // Obtener todas las licencias
    const allLicenses = await licenseNFT.getAllLicenses();
    console.log("\n📂 Todas las licencias:", allLicenses.length);
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.code === 3 && error.data?.reason) {
      console.log("📝 Reason:", error.data.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
