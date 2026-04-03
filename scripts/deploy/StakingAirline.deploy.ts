import hre from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Script de deploy para StakingAirline
 *
 * Requiere que los tokens estén desplegados previamente.
 *
 * Uso:
 *   npx hardhat run scripts/deploy/StakingAirline.deploy.ts --network arbitrum-rinkeby
 *   npx hardhat run scripts/deploy/StakingAirline.deploy.ts --network localhost
 */

async function main() {
  const net = hre as HardhatRuntimeEnvironment;
  const { ethers } = await net.network.connect();

  console.log("🚀 Deploy de StakingAirline...");

  const [deployer] = await ethers.getSigners();

  // Leer addresses de los tokens
  const fs = require("fs");
  const path = require("path");

  const readDeployedAddress = (contractName: string) => {
    const deployPath = path.join(
      __dirname,
      `../deployment/${contractName}.deployed.json`,
    );
    if (fs.existsSync(deployPath)) {
      const data = JSON.parse(fs.readFileSync(deployPath, "utf8"));
      console.log(`📖 ${contractName} address leído de:`, deployPath);
      return data.address;
    } else {
      throw new Error(
        `${contractName} no desplegado. Ejecuta primero ${contractName}.deploy.ts`,
      );
    }
  };

  const stakingTokenAddress = readDeployedAddress("AirlineCoin");
  const rewardTokenAddress = readDeployedAddress("AirlineRewardCoin");
  const nativeTokenWrapperAddress = readDeployedAddress("NativeTokenWrapper");

  // Parámetros del staking
  const TIME_UNIT = 1; // segundos
  const REWARD_RATIO_NUMERATOR = 1;
  const REWARD_RATIO_DENOMINATOR = 100; // 1:100 ratio

  const StakingAirlineFactory =
    await ethers.getContractFactory("StakingAirline");
  const stakingAirline = await StakingAirlineFactory.deploy(
    TIME_UNIT,
    deployer.address,
    REWARD_RATIO_NUMERATOR,
    REWARD_RATIO_DENOMINATOR,
    stakingTokenAddress,
    rewardTokenAddress,
    nativeTokenWrapperAddress,
  );

  await stakingAirline.waitForDeployment();

  console.log(
    "✅ StakingAirline deployed to:",
    await stakingAirline.getAddress(),
  );

  // Guardar address en archivo
  const deployPath = path.join(
    __dirname,
    "../deployment/StakingAirline.deployed.json",
  );
  fs.writeFileSync(
    deployPath,
    JSON.stringify(
      {
        address: await stakingAirline.getAddress(),
        network: process.env.NETWORK || "hardhat",
      },
      null,
      2,
    ),
  );

  console.log("📁 Address guardado en:", deployPath);

  console.log("\n🔑 Deployer:", deployer.address);

  console.log("\n📋 Métodos disponibles:");
  console.log("  - stake(amount)");
  console.log("  - withdraw(amount)");
  console.log("  - claimRewards()");
  console.log("  - depositRewardTokens(amount)");
  console.log("  - getStakeInfo(user)");
  console.log("  - getRewardTokenBalance()");

  console.log("\n⚙️ Configuración actual:");
  console.log("  - Staking Token:", stakingTokenAddress);
  console.log("  - Reward Token:", rewardTokenAddress);
  console.log("  - Native Token Wrapper:", nativeTokenWrapperAddress);
  console.log("  - Time Unit:", TIME_UNIT);
  console.log(
    "  - Reward Ratio:",
    `${REWARD_RATIO_NUMERATOR}:${REWARD_RATIO_DENOMINATOR}`,
  );
  console.log("  - Min Stake Amount: 1e18");
  console.log("  - Max Stake Amount: 1000000e18");
}
