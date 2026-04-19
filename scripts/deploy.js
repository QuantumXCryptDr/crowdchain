const hre = require("hardhat");

async function main() {
  const { ethers, network } = hre;

  console.log("deploy script started");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance));

  const Factory = await ethers.getContractFactory("CrowdfundingPlatform");
  const contract = await Factory.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("Deployed to:", address);
  console.log("Network:", network.name);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });