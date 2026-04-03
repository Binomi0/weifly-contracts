import hre from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Script de deploy para AirlineCoin (ERC-20)
 *
 * Uso:
 *   npx hardhat run scripts/deploy/AirlineCoin.deploy.ts --network arbitrum-rinkeby
 *   npx hardhat run scripts/deploy/AirlineCoin.deploy.ts --network localhost
 */

async function main() {
  const net = hre as HardhatRuntimeEnvironment;
  const { ethers } = await net.network.connect();

  console.log("🚀 Deploy de AirlineCoin...");

  const [deployer] = await ethers.getSigners();
  const NAME = "Airline Coin";
  const SYMBOL = "AIRL";

  const AirlineCoinFactory = await ethers.getContractFactory("AirlineCoin");
  const airlineCoin = await AirlineCoinFactory.deploy(
    deployer.address,
    NAME,
    SYMBOL,
  );

  await airlineCoin.waitForDeployment();

  console.log("✅ AirlineCoin deployed to:", await airlineCoin.getAddress());

  // Guardar address en archivo
  const fs = require("fs");
  const path = require("path");
  const deployPath = path.join(
    __dirname,
    "../deployment/AirlineCoin.deployed.json",
  );
  fs.writeFileSync(
    deployPath,
    JSON.stringify(
      {
        address: await airlineCoin.getAddress(),
        network: process.env.NETWORK || "hardhat",
      },
      null,
      2,
    ),
  );

  console.log("📁 Address guardado en:", deployPath);

  console.log("\n🔑 Deployer:", deployer.address);

  console.log("\n📋 Métodos disponibles:");
  console.log("  - transfer(to, amount)");
  console.log("  - approve(spender, amount)");
  console.log("  - mintTo(to, amount)");
  console.log("  - burnFrom(from, amount)");

  console.log("\n⚙️ Configuración actual:");
  console.log("  - Name:", await airlineCoin.name());
  console.log("  - Symbol:", await airlineCoin.symbol());
  console.log(
    "  - Total Supply:",
    (await airlineCoin.totalSupply()).toString(),
  );
  console.log(
    "  - Deployer Balance:",
    (await airlineCoin.balanceOf(deployer.address)).toString(),
  );
}
