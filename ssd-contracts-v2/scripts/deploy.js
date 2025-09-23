const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);

  // Deploy the new SSDWipeStorage contract
  const SSDWipeStorage = await hre.ethers.getContractFactory("SSDWipeStorage");
  const wipeStorageContract = await SSDWipeStorage.deploy(deployer.address);

  await wipeStorageContract.waitForDeployment();

  console.log(`✅ SSDWipeStorage deployed to: ${await wipeStorageContract.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});