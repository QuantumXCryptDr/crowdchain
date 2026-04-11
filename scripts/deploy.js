const hre = require("hardhat");
require("dotenv").config();
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const CrowdfundingPlatform = await hre.ethers.getContractFactory("CrowdfundingPlatform");
  const crowdfunding = await CrowdfundingPlatform.deploy();

  await crowdfunding.waitForDeployment();
  const contractAddress = await crowdfunding.getAddress();

  console.log("CrowdfundingPlatform deployed to:", contractAddress);

  // Determine if it's a local network
  const isLocal = hre.network.name === "localhost" || hre.network.name === "hardhat";

  const envFile = `WEB3_STORAGE_TOKEN=${process.env.WEB3_STORAGE_TOKEN}
NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}
NEXT_PUBLIC_SEPOLIA_RPC_URL=${process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL}
SEPOLIA_URL=${process.env.SEPOLIA_URL}
PRIVATE_KEY=${process.env.PRIVATE_KEY}
ALCHEMY_API_KEY=${process.env.ALCHEMY_API_KEY}
ETHERSCAN_API_KEY=${process.env.ETHERSCAN_API_KEY}
LOCAL_CONTRACT=${isLocal ? contractAddress : process.env.LOCAL_CONTRACT}
`;

  fs.writeFileSync(".env.local", envFile);
  console.log(".env.local updated with new contract address!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});