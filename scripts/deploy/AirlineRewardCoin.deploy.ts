import hre from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Script de deploy para AirlineRewardCoin (ERC-20)
 *
 * Uso:
 *   npx hardhat run scripts/deploy/AirlineRewardCoin.deploy.ts --network arbitrum-rinkeby
 *   npx hardhat run scripts/deploy/AirlineRewardCoin.deploy.ts --network localhost
 */

async function main() {
  const net = hre as HardhatRuntimeEnvironment;
  const { ethers } = await net.network.connect();

  console.log("🚀 Deploy de AirlineRewardCoin...");

  const [deployer] = await ethers.getSigners();
  const NAME = "Airline Gas";
  const SYMBOL = "AIRG";

  const AirlineRewardCoinFactory =
    await ethers.getContractFactory("AirlineRewardCoin");
  const airlineRewardCoin = await AirlineRewardCoinFactory.deploy(
    deployer.address,
    NAME,
    SYMBOL,
  );

  await airlineRewardCoin.waitForDeployment();

  console.log(
    "✅ AirlineRewardCoin deployed to:",
    await airlineRewardCoin.getAddress(),
  );

  // Guardar address en archivo
  const fs = require("fs");
  const path = require("path");
  const deployPath = path.join(
    __dirname,
    "../deployment/AirlineRewardCoin.deployed.json",
  );
  fs.writeFileSync(
    deployPath,
    JSON.stringify(
      {
        address: await airlineRewardCoin.getAddress(),
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
  console.log("  - Name:", await airlineRewardCoin.name());
  console.log("  - Symbol:", await airlineRewardCoin.symbol());
  console.log(
    "  - Total Supply:",
    (await airlineRewardCoin.totalSupply()).toString(),
  );
  console.log(
    "  - Deployer Balance:",
    (await airlineRewardCoin.balanceOf(deployer.address)).toString(),
  );
}
