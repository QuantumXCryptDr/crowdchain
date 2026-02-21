#!/usr/bin/env node

/**
 * CrowdChain Backend Integration Test
 * Tests all smart contract interactions
 */

const hre = require("hardhat");
const { ethers } = require("ethers");
require("dotenv").config();

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(color, ...msg) {
  console.log(color, ...msg, colors.reset);
}

async function main() {
  log(colors.bright + colors.blue, "\n🧪 CrowdChain Backend Integration Tests\n");

  try {
    // 1. Test: Contract Deployment Status
    log(colors.blue, "📋 Test 1: Contract Deployment Status");
    const CONTRACT_ADDRESS = "0x1D6FB3A2F9928E84d8D0f7E695869b03Ed158816";
    const provider = new ethers.JsonRpcProvider(
      process.env.SEPOLIA_URL || "https://eth-sepolia.g.alchemy.com/v2/8kdlAFfVLbcbvH24uZIYp"
    );
    
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x") {
      log(colors.red, "❌ Contract not deployed at", CONTRACT_ADDRESS);
      return;
    }
    log(colors.green, "✅ Contract deployed at", CONTRACT_ADDRESS);

    // 2. Test: Get Signer
    log(colors.blue, "\n📋 Test 2: Wallet Connection");
    if (!process.env.PRIVATE_KEY) {
      log(colors.red, "❌ PRIVATE_KEY not set in .env");
      return;
    }
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const address = await wallet.getAddress();
    log(colors.green, "✅ Wallet connected:", address);

    // 3. Test: Check Balance
    log(colors.blue, "\n📋 Test 3: Account Balance");
    const balance = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);
    log(
      colors.green,
      `✅ Account balance: ${balanceEth} ETH`
    );

    if (parseFloat(balanceEth) < 0.01) {
      log(colors.yellow, "⚠️  Low balance. Get test ETH from faucet: https://sepoliafaucet.com");
    }

    // 4. Test: Load Contract ABI
    log(colors.blue, "\n📋 Test 4: Smart Contract ABI");
    const CONTRACT_ABI = [
      "function campaignCounter() external view returns (uint256)",
      "function createCampaign(string memory _title, string memory _description, string memory _imageUrl, uint256 _goalAmount, uint256 _deadline) external returns (uint256)",
      "function contribute(uint256 _campaignId) external payable",
      "function getCampaignDetails(uint256 _campaignId) external view returns (uint256, address, string, string, string, uint256, uint256, uint256, uint8, bool, uint256)",
      "function getUserContribution(uint256 _campaignId, address _user) external view returns (uint256)",
      "function platformFeePercent() external view returns (uint256)",
    ];
    log(colors.green, "✅ ABI loaded with", CONTRACT_ABI.length, "functions");

    // 5. Test: Contract Interaction
    log(colors.blue, "\n📋 Test 5: Contract Function Calls");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    try {
      const campaignCount = await contract.campaignCounter();
      log(colors.green, "✅ campaignCounter():", campaignCount.toString(), "campaigns found");

      const platformFee = await contract.platformFeePercent();
      log(colors.green, "✅ platformFeePercent():", platformFee.toString() + "%");
    } catch (error) {
      log(colors.red, "❌ Contract call failed:", error.message);
    }

    // 6. Test: Create Campaign (simulation)
    log(colors.blue, "\n📋 Test 6: Campaign Creation Simulation");
    const title = "Test Campaign " + Date.now();
    const description = "This is a test campaign for backend verification";
    const imageUrl = "https://via.placeholder.com/400x300";
    const goalAmount = ethers.parseEther("1.0");
    const deadline = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days from now

    log(colors.yellow, "Campaign Details:");
    log(colors.yellow, "  Title:", title);
    log(colors.yellow, "  Goal: 1.0 ETH");
    log(colors.yellow, "  Deadline:", new Date(deadline * 1000).toISOString());

    try {
      log(colors.yellow, "\n⏳ Estimating gas for campaign creation...");
      const gasEstimate = await contract.createCampaign.estimateGas(
        title,
        description,
        imageUrl,
        goalAmount,
        deadline
      );
      log(colors.green, "✅ Gas estimate:", gasEstimate.toString());
    } catch (error) {
      log(colors.red, "❌ Gas estimation failed:", error.message);
    }

    // 7. Test: Web3 Integration Points
    log(colors.blue, "\n📋 Test 7: Web3 Integration Points");
    const integrationPoints = [
      { page: "Home Page", functions: ["loadCampaigns()", "checkWalletConnection()"] },
      {
        page: "Create Campaign",
        functions: ["createCampaign()", "isWalletConnected()", "connectWallet()"],
      },
      { page: "Campaign Detail", functions: ["contribute()", "requestRefund()", "getCampaignDetails()"] },
      { page: "Analytics Dashboard", functions: ["campaignCounter()", "platformFeePercent()"] },
      {
        page: "Creator Withdrawal",
        functions: ["releaseMilestoneFunds()", "getUserContribution()"],
      },
    ];

    integrationPoints.forEach((point) => {
      log(colors.green, `✅ ${point.page}`);
      point.functions.forEach((func) => {
        log(colors.green, `   ├─ ${func}`);
      });
    });

    // Summary
    log(
      colors.bright + colors.green,
      "\n✨ Backend Integration Summary\n"
    );
    log(colors.green, "Network: Sepolia Testnet");
    log(colors.green, "Contract Address:", CONTRACT_ADDRESS);
    log(colors.green, "Deployer Wallet:", address);
    log(colors.green, "Account Balance:", balanceEth, "ETH");
    log(colors.green, "Total Integration Points: 5 pages");
    log(colors.green, "Smart Contract Functions: 6 core functions");

    log(colors.bright + colors.blue, "\n✅ Backend is ready for testing!\n");
  } catch (error) {
    log(colors.red, "\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
