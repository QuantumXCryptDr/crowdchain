#!/usr/bin/env node

/**
 * Check Sepolia Wallet Balance
 * Verifies you received test ETH and shows how much you have
 */

const https = require("https");

const WALLET_ADDRESS = "0x8b3dfD81484530B484964fdFBD490530edE324e3";
const ETHERSCAN_API = "https://api-sepolia.etherscan.io/api";

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

async function checkBalance() {
  log(colors.bright + colors.blue, "\nChecking Sepolia Balance...\n");

  try {
    const url = `${ETHERSCAN_API}?module=account&action=balance&address=${WALLET_ADDRESS}&tag=latest&apikey=YourApiKeyToken`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "1") {
      const balanceWei = BigInt(data.result);
      const balanceEth = Number(balanceWei) / 1e18;

      if (balanceEth > 0) {
        log(colors.green, "SUCCESS! You have test ETH!\n");
        log(colors.yellow, `Address:  ${WALLET_ADDRESS}`);
        log(colors.green, `Balance:  ${balanceEth.toFixed(6)} ETH`);
        log(colors.blue, `Wei:      ${balanceWei.toString()}`);
        log(colors.green, "\nYou're ready to deploy!\n");
        log(colors.cyan, "Run: npx hardhat run scripts/deploy.js --network sepolia\n");
      } else {
        log(colors.red, "No ETH found yet. Balance: 0 ETH\n");
        log(colors.yellow, "💧 Visit a faucet to request test ETH:");
        log(colors.cyan, "   https://sepoliafaucet.com\n");
      }
    } else {
      log(colors.red, "API Error:", data.message);
      log(colors.yellow, "\n📍 Check manually at:");
      log(
        colors.cyan,
        `https://sepolia.etherscan.io/address/${WALLET_ADDRESS}\n`
      );
    }
  } catch (error) {
    log(colors.red, "Error:", error.message);
    log(colors.yellow, "\n📍 Check manually at:");
    log(
      colors.cyan,
      `https://sepolia.etherscan.io/address/${WALLET_ADDRESS}\n`
    );
  }
}

checkBalance();
