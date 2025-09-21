const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy OperatorRegistry
  const OperatorRegistry = await hre.ethers.getContractFactory("OperatorRegistry");
  const operatorRegistry = await OperatorRegistry.deploy(deployer.address);
  await operatorRegistry.waitForDeployment();
  const registryAddress = await operatorRegistry.getAddress();
  console.log(`✅ OperatorRegistry deployed to: ${registryAddress}`);

  // 2. Deploy SSDWipeCertificate
  const SSDWipeCertificate = await hre.ethers.getContractFactory("SSDWipeCertificate");
  const ssdWipeCertificate = await SSDWipeCertificate.deploy(registryAddress, deployer.address);
  await ssdWipeCertificate.waitForDeployment();
  const certificateAddress = await ssdWipeCertificate.getAddress();
  console.log(`✅ SSDWipeCertificate deployed to: ${certificateAddress}`);

  // 3. Add the deployer as an initial operator
  console.log("Adding deployer as an initial operator...");
  const tx = await operatorRegistry.addOperator(deployer.address);
  await tx.wait();
  console.log(`✅ Deployer ${deployer.address} has been added as an operator.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});