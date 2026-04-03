import hre from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Script de deploy para NativeTokenWrapper (ERC-20)
 *
 * Uso:
 *   npx hardhat run scripts/deploy/NativeTokenWrapper.deploy.ts --network arbitrum-rinkeby
 *   npx hardhat run scripts/deploy/NativeTokenWrapper.deploy.ts --network localhost
 */

async function main() {
  const net = hre as HardhatRuntimeEnvironment;
  const { ethers } = await net.network.connect();

  console.log("🚀 Deploy de NativeTokenWrapper...");

  const [deployer] = await ethers.getSigners();
  const NAME = "Wrapped ETH";
  const SYMBOL = "WETH";

  const NativeTokenWrapperFactory =
    await ethers.getContractFactory("NativeTokenWrapper");
  const nativeTokenWrapper = await NativeTokenWrapperFactory.deploy(
    deployer.address,
    NAME,
    SYMBOL,
  );

  await nativeTokenWrapper.waitForDeployment();

  console.log(
    "✅ NativeTokenWrapper deployed to:",
    await nativeTokenWrapper.getAddress(),
  );

  // Guardar address en archivo
  const fs = require("fs");
  const path = require("path");
  const deployPath = path.join(
    __dirname,
    "../deployment/NativeTokenWrapper.deployed.json",
  );
  fs.writeFileSync(
    deployPath,
    JSON.stringify(
      {
        address: await nativeTokenWrapper.getAddress(),
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
  console.log("  - Name:", await nativeTokenWrapper.name());
  console.log("  - Symbol:", await nativeTokenWrapper.symbol());
  console.log(
    "  - Total Supply:",
    (await nativeTokenWrapper.totalSupply()).toString(),
  );
}
