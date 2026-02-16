// @jest-environment node

const hre = require("hardhat")

jest.mock("hardhat", () => ({
  ethers: {
    getSigners: jest.fn(),
    provider: {
      getBalance: jest.fn(),
    },
    formatEther: jest.fn(),
    getContractFactory: jest.fn(),
  },
  network: {
    name: "hardhat",
  },
  run: jest.fn(),
}))

describe("deploy.js main()", () => {
  let consoleLogSpy
  let deployerMock
  let contractFactoryMock
  let crowdfundingPlatformMock

  beforeEach(() => {
    // Arrange
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    deployerMock = { address: "0xDeployer" }
    contractFactoryMock = { deploy: jest.fn() }
    crowdfundingPlatformMock = {
      waitForDeployment: jest.fn(),
      getAddress: jest.fn(),
      deploymentTransaction: jest.fn(),
    }
    hre.ethers.getSigners.mockResolvedValue([deployerMock])
    hre.ethers.provider.getBalance.mockResolvedValue(BigInt("1000000000000000000"))
    hre.ethers.formatEther.mockReturnValue("1.0")
    hre.ethers.getContractFactory.mockResolvedValue(contractFactoryMock)
    contractFactoryMock.deploy.mockResolvedValue(crowdfundingPlatformMock)
    crowdfundingPlatformMock.waitForDeployment.mockResolvedValue()
    crowdfundingPlatformMock.getAddress.mockResolvedValue("0xContract")
    crowdfundingPlatformMock.deploymentTransaction.mockReturnValue({
      wait: jest.fn().mockResolvedValue(),
      hash: "0xTxHash",
    })
    hre.run.mockReset()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // Happy path: hardhat network, no verification
  it("deploys contract and prints summary on hardhat network", async () => {

    // Act
    const main = require("./deploy.js").main || (await import("./deploy.js")).main
    await main()

    // Assert
    expect(hre.ethers.getSigners).toHaveBeenCalled()
    expect(hre.ethers.provider.getBalance).toHaveBeenCalledWith("0xDeployer")
    expect(hre.ethers.getContractFactory).toHaveBeenCalledWith("CrowdfundingPlatform")
    expect(contractFactoryMock.deploy).toHaveBeenCalled()
    expect(crowdfundingPlatformMock.waitForDeployment).toHaveBeenCalled()
    expect(crowdfundingPlatformMock.getAddress).toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith("CrowdfundingPlatform deployed to:", "0xContract")
    expect(consoleLogSpy).toHaveBeenCalledWith("Network:", "hardhat")
    expect(hre.run).not.toHaveBeenCalled()
  })

  // Happy path: localhost network, no verification
  it("skips verification on localhost network", async () => {

    // Arrange
    hre.network.name = "localhost"

    // Act
    const main = require("./deploy.js").main || (await import("./deploy.js")).main
    await main()

    // Assert
    expect(hre.run).not.toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith("Network:", "localhost")
  })

  // Happy path: testnet, verification succeeds
  it("verifies contract on testnet", async () => {

    // Arrange
    hre.network.name = "sepolia"
    hre.run.mockResolvedValue(undefined)
    const waitMock = jest.fn().mockResolvedValue()
    crowdfundingPlatformMock.deploymentTransaction.mockReturnValue({
      wait: waitMock,
      hash: "0xTxHash",
    })

    // Act
    const main = require("./deploy.js").main || (await import("./deploy.js")).main
    await main()

    // Assert
    expect(waitMock).toHaveBeenCalledWith(6)
    expect(hre.run).toHaveBeenCalledWith("verify:verify", {
      address: "0xContract",
      constructorArguments: [],
    })
    expect(consoleLogSpy).toHaveBeenCalledWith("Contract verified successfully!")
  })

  // Error case: verification fails
  it("logs verification failure if hre.run throws", async () => {

    // Arrange
    hre.network.name = "sepolia"
    hre.run.mockImplementation(() => {
      const err = new Error("Etherscan error")
      throw err
    })
    const waitMock = jest.fn().mockResolvedValue()
    crowdfundingPlatformMock.deploymentTransaction.mockReturnValue({
      wait: waitMock,
      hash: "0xTxHash",
    })

    // Act
    const main = require("./deploy.js").main || (await import("./deploy.js")).main
    await main()

    // Assert
    expect(consoleLogSpy).toHaveBeenCalledWith("Verification failed:", "Etherscan error")
  })

  // Edge case: deployer has zero balance
  it("prints zero balance if deployer has no ETH", async () => {

    // Arrange
    hre.ethers.provider.getBalance.mockResolvedValue(BigInt(0))
    hre.ethers.formatEther.mockReturnValue("0.0")

    // Act
    const main = require("./deploy.js").main || (await import("./deploy.js")).main
    await main()

    // Assert
    expect(consoleLogSpy).toHaveBeenCalledWith("Account balance:", "0.0", "ETH")
  })

  // Error case: contract deployment fails
  it("throws if contract deployment fails", async () => {

    // Arrange
    contractFactoryMock.deploy.mockRejectedValue(new Error("Deployment failed"))

    // Act & Assert
    const main = require("./deploy.js").main || (await import("./deploy.js")).main
    await expect(main()).rejects.toThrow("Deployment failed")
  })

  // Error case: getSigners fails
  it("throws if getSigners fails", async () => {

    // Arrange
    hre.ethers.getSigners.mockRejectedValue(new Error("No signers"))

    // Act & Assert
    const main = require("./deploy.js").main || (await import("./deploy.js")).main
    await expect(main()).rejects.toThrow("No signers")
  })

  // Edge case: deploymentTransaction().hash is undefined
  it("prints undefined transaction hash if not available", async () => {

    // Arrange
    crowdfundingPlatformMock.deploymentTransaction.mockReturnValue({
      wait: jest.fn().mockResolvedValue(),
      hash: undefined,
    })

    // Act
    const main = require("./deploy.js").main || (await import("./deploy.js")).main
    await main()

    // Assert
    expect(consoleLogSpy).toHaveBeenCalledWith("Transaction Hash:", undefined)
  })
})
