#!/usr/bin/env node

/**
 * Open Sepolia Faucet in Browser
 * Opens faucet website directly for manual ETH request
 */

const open = require("open");
require("dotenv").config();
const { ethers } = require("ethers");

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(color, ...msg) {
  console.log(color, ...msg, colors.reset);
}

async function main() {
  log(colors.bright + colors.blue, "\nSepolia Test ETH Faucet\n");

  // Get address from command line or .env
  let address = process.argv[2];

  if (!address) {
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
      const wallet = new ethers.Wallet(privateKey);
      address = wallet.address;
      log(colors.green, "Using wallet from PRIVATE_KEY");
      log(colors.cyan, "Address:", address);
    }
  }

  if (!address) {
    log(colors.red, "Error: No address provided");
    log(colors.yellow, "Usage: node scripts/open-faucet.js <address>");
    process.exit(1);
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    log(colors.red, "Invalid Ethereum address:", address);
    process.exit(1);
  }

  log(colors.cyan, "\nAvailable Faucets:\n");

  const faucets = [
    {
      name: "Alchemy Sepolia Faucet (Recommended)",
      url: "https://sepoliafaucet.com",
      amount: "0.5 ETH",
      speed: "1-2 minutes",
    },
    {
      name: "QuickNode Faucet",
      url: "https://faucet.quicknode.com/ethereum/sepolia",
      amount: "1.0 ETH",
      speed: "2-5 minutes",
    },
    {
      name: "Infura Faucet",
      url: "https://www.infura.io/faucet/sepolia",
      amount: "Variable",
      speed: "1-3 minutes",
    },
  ];

  faucets.forEach((f, i) => {
    log(colors.yellow, `${i + 1}. ${f.name}`);
    log(colors.cyan, `   Amount: ${f.amount}`);
    log(colors.cyan, `   Speed: ${f.speed}`);
    log(colors.cyan, `   URL: ${f.url}\n`);
  });

  log(colors.bright + colors.green, "Instructions:\n");
  log(colors.green, "1. The browser will open automatically");
  log(colors.green, "2. Paste this address: " + colors.yellow + address);
  log(colors.green, "3. Follow the faucet's instructions");
  log(colors.green, "4. Wait for confirmation");
  log(colors.green, "5. Check your balance: https://sepolia.etherscan.io/address/" + address);
  log(colors.green, "\n");

  // Try to open browser with Alchemy faucet (most reliable)
  log(colors.yellow, "⏳ Opening Alchemy Faucet in browser...\n");

  try {
    await open("https://sepoliafaucet.com");
    log(colors.green, "✅ Browser opened! Follow the instructions above.");
    log(colors.yellow, "\nNote: Copy and paste your wallet address:");
    log(colors.cyan, address);
  } catch (error) {
    log(colors.yellow, "Could not open browser automatically");
    log(colors.yellow, "\nManually visit one of these faucets:");
    faucets.forEach((f) => {
      log(colors.cyan, f.url);
    });
  }
}

main().catch(console.error);
