#!/usr/bin/env node

/**
 * CrowdChain Backend Integration Test
 * Supports Sepolia & Hardhat local network automatically
 */

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
  log(colors.bright + colors.blue, "\nCrowdChain Integration Test\n");

  try {
    const CONTRACT_ADDRESS = process.env.LOCAL_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    // ==============================
    // 1. Detect Network
    // ==============================
    let provider;
    let privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) throw new Error("PRIVATE_KEY missing in .env");

    // Prefer Sepolia if URL exists, else default to localhost
    const rpcUrl = process.env.SEPOLIA_URL || "http://127.0.0.1:8545";
    provider = new ethers.JsonRpcProvider(rpcUrl);

    const network = await provider.getNetwork();
    log(colors.green, "Connected Chain ID:", network.chainId.toString());

    if (network.chainId === 1337) {
      log(colors.yellow, "Hardhat local network detected");
    } else if (network.chainId === 11155111) {
      log(colors.green, "Sepolia Testnet detected");
    } else {
      throw new Error("Unsupported network. Connect to Sepolia or Hardhat local.");
    }

    // ==============================
    // 2. Contract Deployment Check
    // ==============================
    log(colors.blue, "\n Test 1: Contract Deployment Status");
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x") throw new Error(`Contract not deployed at ${CONTRACT_ADDRESS}`);
    log(colors.green, "Contract deployed at:", CONTRACT_ADDRESS);

    // ==============================
    // 3. Wallet Setup
    // ==============================
    log(colors.blue, "\n Test 2: Wallet Connection");
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = await wallet.getAddress();
    log(colors.green, "Wallet connected:", address);

    const balance = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);
    log(colors.green, `Account Balance: ${balanceEth} ETH`);

    if (parseFloat(balanceEth) < 0.01) {
      log(colors.yellow, "Low balance. Fund wallet before write operations.");
    }

    // ==============================
    // 4. Contract Interface
    // ==============================
    log(colors.blue, "\n Test 3: ABI & Contract Binding");
    const CONTRACT_ABI = [
      "function campaignCounter() external view returns (uint256)",
      "function createCampaign(string memory,string memory,string memory,uint256,uint256) external returns (uint256)",
      "function contribute(uint256) external payable",
      "function getCampaignDetails(uint256) external view returns (uint256,address,string,string,string,uint256,uint256,uint256,uint8,bool,uint256)",
      "function getUserContribution(uint256,address) external view returns (uint256)",
      "function platformFeePercent() external view returns (uint256)",
      "event CampaignCreated(uint256 indexed campaignId, address indexed creator)"
    ];

    const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const writeContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    log(colors.green, "Read + Write contracts initialized");

    // ==============================
    // 5. Read Functions Test
    // ==============================
    log(colors.blue, "\n Test 4: Read Functions");
    const campaignCount = await readContract.campaignCounter();
    log(colors.green, "campaignCounter():", campaignCount.toString());
    const platformFee = await readContract.platformFeePercent();
    log(colors.green, "platformFeePercent():", platformFee.toString() + "%");

    // ==============================
    // 6. Gas Simulation
    // ==============================
    log(colors.blue, "\n Test 5: Campaign Creation Gas Simulation");
    const title = "Integration Test " + Date.now();
    const description = "Backend verification campaign";
    const imageUrl = "https://via.placeholder.com/400x300";
    const goalAmount = ethers.parseEther("1.0");
    const deadline = Math.floor(Date.now() / 1000) + 86400 * 7;

    const gasEstimate = await writeContract.createCampaign.estimateGas(
      title,
      description,
      imageUrl,
      goalAmount,
      deadline
    );
    log(colors.green, "Estimated Gas:", gasEstimate.toString());

    // ==============================
    // 7. Event Listener
    // ==============================
    log(colors.blue, "\n Test 6: Event Listener Setup");
    readContract.on("CampaignCreated", (campaignId, creator) => {
      log(colors.yellow, `Event Detected → CampaignCreated | ID: ${campaignId.toString()} | Creator: ${creator}`);
    });
    log(colors.green, "CampaignCreated event listener attached");

    // ==============================
    // 8. Integration Mapping
    // ==============================
    log(colors.blue, "\n Test 7: Frontend Integration Points");
    const integrationPoints = [
      { page: "Home Page", functions: ["loadCampaigns()", "checkWalletConnection()"] },
      { page: "Create Campaign", functions: ["createCampaign()", "connectWallet()"] },
      { page: "Campaign Detail", functions: ["contribute()", "getCampaignDetails()"] },
      { page: "Analytics Dashboard", functions: ["campaignCounter()", "platformFeePercent()"] },
      { page: "Creator Withdrawal", functions: ["releaseMilestoneFunds()", "getUserContribution()"] },
    ];

    integrationPoints.forEach((point) => {
      log(colors.green, ` ${point.page}`);
      point.functions.forEach((func) => log(colors.green, `   ├─ ${func}`));
    });

    log(colors.bright + colors.green, "\nIntegration Summary Complete\n");

  } catch (error) {
    log(colors.red, "\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);