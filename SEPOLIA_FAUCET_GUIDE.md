# 🚀 Sepolia Test ETH - Quick Guide

## Your Testnet Wallet
**Address:** `0x8b3dfD81484530B484964fdFBD490530edE324e3`  
**Private Key:** `0x26f7d4e301245338855266999abfa9f4cb2b4f2f64490f01a40f3579d3ae636f`

---

## ⚡ **FASTEST Method (Alchemy Faucet - 1-2 minutes)**

1. Open: https://sepoliafaucet.com
2. **Paste your address:** `0x8b3dfD81484530B484964fdFBD490530edE324e3`
3. Click "Send Me 0.5 ETH"
4. Wait 1-2 minutes
5. Check balance: https://sepolia.etherscan.io/address/0x8b3dfD81484530B484964fdFBD490530edE324e3

**Success Rate:** 95% ✅

---

## 🔄 **Backup Methods (if Alchemy is slow)**

### Method 2: QuickNode Faucet (2-5 min)
- Link: https://faucet.quicknode.com/ethereum/sepolia
- Paste address, request 0.1 ETH
- Works reliably

### Method 3: Infura Faucet
- Link: https://www.infura.io/faucet/sepolia
- Requires login but very reliable
- Request 0.5 ETH

### Method 4: Official Ethereum Faucet
- Link: https://www.ethereum-ecosystem.com/faucets/ethereum-sepolia
- Sometimes slower but always works

---

## ✅ How to Verify You Got ETH

1. Open Etherscan: https://sepolia.etherscan.io/address/0x8b3dfD81484530B484964fdFBD490530edE324e3
2. Look for "Balance" - should show 0.5+ ETH
3. Or run in terminal:
```bash
# Check balance using curl
curl -X POST https://sepolia.infura.io/v3/YOUR_INFURA_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x8b3dfD81484530B484964fdFBD490530edE324e3","latest"],"id":1}'
```

---

## 🚨 Troubleshooting

**Q: "You already got ETH in the last 24 hours"**
- Wait 24 hours, or use a different address/email
- Try a different faucet

**Q: "Address not valid"**
- Make sure you copied the full address: `0x8b3dfD81484530B484964fdFBD490530edE324e3`
- No spaces or typos

**Q: Faucet is down**
- Try another method above
- Check https://sepoliafaucet.com/status (if available)

**Q: Still no ETH after 10 minutes**
- Faucets can be congested. Try again in 5 minutes
- Try a different faucet from the list above

---

## 🎯 Once You Have ETH

Run the deployment:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

This will:
1. Deploy your contract to Sepolia
2. Print the new contract address
3. You'll update `lib/web3.ts` with that address

---

## 📱 Quick Copy-Paste Commands

### Add to your .env (if you have one):
```
SEPOLIA_WALLET_ADDRESS=0x8b3dfD81484530B484964fdFBD490530edE324e3
SEPOLIA_PRIVATE_KEY=0x26f7d4e301245338855266999abfa9f4cb2b4f2f64490f01a40f3579d3ae636f
```

### Check MetaMask is on Sepolia:
1. Open MetaMask
2. Top right network selector
3. Make sure it says "Sepolia" (not Mainnet!)
4. Add the wallet with the private key above

---

## 🔗 Useful Links

| Service | Link |
|---------|------|
| **Alchemy Faucet** | https://sepoliafaucet.com |
| **QuickNode Faucet** | https://faucet.quicknode.com/ethereum/sepolia |
| **Infura Faucet** | https://www.infura.io/faucet/sepolia |
| **Etherscan (Check Balance)** | https://sepolia.etherscan.io |
| **Sepolia Testnet Info** | https://sepolia.etherscan.io/chart/networkutilization |

---

**Recommended:** Start with Alchemy (sepoliafaucet.com) - it's the most reliable! ✨
