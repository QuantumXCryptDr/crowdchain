#!/usr/bin/env node

/**
 * Create Sepolia Testnet Wallet
 * Generates a new wallet specifically for Sepolia testing
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

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
  log(colors.bright + colors.blue, "\n🔐 Create Sepolia Testnet Wallet\n");

  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();

  log(colors.green, "✅ New wallet created!\n");

  log(colors.cyan, "📋 Wallet Details:\n");
  log(colors.yellow, "Address:    ", wallet.address);
  log(colors.yellow, "Private Key:", wallet.privateKey);
  log(colors.yellow, "Mnemonic:   ", wallet.mnemonic.phrase);

  log(colors.bright + colors.yellow, "\n⚠️  SECURITY WARNING:\n");
  log(colors.red, "🔒 NEVER share your private key!");
  log(colors.red, "🔒 NEVER commit it to git!");
  log(colors.red, "🔒 Keep it SECRET and SAFE!");

  log(colors.bright + colors.green, "\n✨ Next Steps:\n");
  log(colors.cyan, "1. Copy the address above");
  log(colors.cyan, "2. Get test ETH from faucet (0.5-1.0 ETH is enough):");
  log(colors.green, "   • Alchemy: https://sepoliafaucet.com");
  log(colors.green, "   • QuickNode: https://faucet.quicknode.com/ethereum/sepolia");
  log(colors.green, "   • Infura: https://www.infura.io/faucet/sepolia");

  log(colors.cyan, "\n3. Update your .env file with the new private key:");
  log(colors.yellow, "   PRIVATE_KEY=" + wallet.privateKey);

  log(colors.cyan, "\n4. Check balance (after getting ETH):");
  log(colors.yellow, "   https://sepolia.etherscan.io/address/" + wallet.address);

  log(colors.cyan, "\n5. Deploy contract:");
  log(colors.yellow, "   npx hardhat run scripts/deploy.js --network sepolia\n");

  // Option to save to file
  log(colors.blue, "💾 Saving wallet to testnet-wallet.json (for reference only)...");
  const walletData = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
    createdAt: new Date().toISOString(),
    network: "Sepolia Testnet",
    warning: "DO NOT COMMIT TO GIT OR SHARE",
  };

  fs.writeFileSync(
    path.join(__dirname, "../testnet-wallet.json"),
    JSON.stringify(walletData, null, 2)
  );
  log(colors.green, "✅ Saved to testnet-wallet.json (already in .gitignore)\n");
}

main().catch(console.error);
