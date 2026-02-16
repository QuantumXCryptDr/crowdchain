const hre = require("hardhat")

async function main() {
  console.log("Deploying CrowdfundingPlatform...")

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners()
  console.log("Deploying contracts with the account:", deployer.address)

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address)
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH")

  // Get the contract factory
  const CrowdfundingPlatform = await hre.ethers.getContractFactory("CrowdfundingPlatform")

  // Deploy the contract
  const crowdfundingPlatform = await CrowdfundingPlatform.deploy()

  // Wait for deployment to complete
  await crowdfundingPlatform.waitForDeployment()

  const address = await crowdfundingPlatform.getAddress()
  console.log("CrowdfundingPlatform deployed to:", address)

  // Verify contract on Etherscan (optional)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...")
    await crowdfundingPlatform.deploymentTransaction().wait(6)

    console.log("Verifying contract...")
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      })
      console.log("Contract verified successfully!")
    } catch (e) {
      console.log("Verification failed:", e.message)
    }
  }

  console.log("\n=== Deployment Summary ===")
  console.log("Contract Address:", address)
  console.log("Network:", hre.network.name)
  console.log("Deployer:", deployer.address)
  console.log("Transaction Hash:", crowdfundingPlatform.deploymentTransaction().hash)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
