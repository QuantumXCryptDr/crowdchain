#!/usr/bin/env node

/**
 * Sepolia Faucet Request Script
 * Requests test ETH directly from Alchemy Sepolia Faucet
 */

const https = require("https");
require("dotenv").config();

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

async function requestFromAlchemyFaucet(address) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.sepoliafaucet.com",
      port: 443,
      path: "/api/sendCoin",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          if (response.requestId) {
            resolve(response);
          } else {
            reject(new Error(response.message || "Unknown error"));
          }
        } catch (e) {
          reject(new Error("Invalid response from faucet"));
        }
      });
    });

    req.on("error", reject);

    req.write(
      JSON.stringify({
        to: address,
      })
    );
    req.end();
  });
}

async function requestFromQuickNodeFaucet(address) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "faucet.quicknode.com",
      port: 443,
      path: "/ethereum/sepolia",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error("Invalid response from faucet"));
        }
      });
    });

    req.on("error", reject);

    req.write(
      JSON.stringify({
        recipient: address,
      })
    );
    req.end();
  });
}

async function main() {
  log(colors.bright + colors.blue, "\n💰 Sepolia Test ETH Faucet Request\n");

  // Get address from command line or .env
  let address = process.argv[2];

  if (!address) {
    // Try to extract from .env PRIVATE_KEY
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
      const ethers = require("ethers");
      const wallet = new ethers.Wallet(privateKey);
      address = wallet.address;
      log(colors.cyan, "Using wallet from PRIVATE_KEY:", address);
    }
  }

  if (!address) {
    log(colors.red, "❌ Error: No address provided");
    log(colors.yellow, "Usage: node scripts/request-faucet.js <address>");
    log(colors.yellow, "Or set PRIVATE_KEY in .env file");
    process.exit(1);
  }

  // Validate Ethereum address
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    log(colors.red, "❌ Invalid Ethereum address:", address);
    process.exit(1);
  }

  log(colors.cyan, "Requesting ETH for:", address);
  log(colors.yellow, "Attempting multiple faucets...\n");

  // Try Alchemy Faucet
  log(colors.blue, "📍 Trying Alchemy Sepolia Faucet...");
  try {
    const response = await requestFromAlchemyFaucet(address);
    if (response.requestId) {
      log(colors.green, "✅ Request successful!");
      log(colors.green, "Transaction ID:", response.txHash || response.requestId);
      log(colors.green, "Amount: 0.5 ETH");
      log(colors.yellow, "\n⏳ ETH will arrive in 1-2 minutes");
      log(colors.yellow, "Check: https://sepolia.etherscan.io/address/" + address);
      process.exit(0);
    }
  } catch (error) {
    log(colors.yellow, "⚠️  Alchemy faucet failed:", error.message);
  }

  // Try QuickNode Faucet
  log(colors.blue, "\n📍 Trying QuickNode Faucet...");
  try {
    const response = await requestFromQuickNodeFaucet(address);
    if (response.success || response.result) {
      log(colors.green, "✅ Request successful!");
      log(colors.green, "Amount: 1.0 ETH");
      log(colors.yellow, "\n⏳ ETH will arrive in 2-5 minutes");
      log(colors.yellow, "Check: https://sepolia.etherscan.io/address/" + address);
      process.exit(0);
    }
  } catch (error) {
    log(colors.yellow, "⚠️  QuickNode faucet failed:", error.message);
  }

  log(colors.red, "\n❌ All faucets failed. Try manually:");
  log(colors.yellow, "1. Alchemy Faucet: https://sepoliafaucet.com");
  log(colors.yellow, "2. QuickNode Faucet: https://faucet.quicknode.com/ethereum/sepolia");
  log(colors.yellow, "3. Infura Faucet: https://www.infura.io/faucet/sepolia");
  process.exit(1);
}

main().catch(console.error);
