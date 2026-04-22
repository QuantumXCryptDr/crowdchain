// lib/web3.ts
// Barrel file — single source of truth for all web3 imports across the app

// ── Read-only / server-side (no wallet needed) ──────────────────────────────
export {
  getReadOnlyContract,
  getCampaignCount,
  getPlatformFeePercent,
  getContractOwner,
  getContractBalance,
  CONTRACT_ADDRESS,
} from "./web3.server"

// ── Client-side (requires browser wallet / window.ethereum) ─────────────────
export {
  connectWallet,
  getSigner,
  getContract,
} from "./web3.client"

// ── Admin actions (platform fee, withdrawals) ────────────────────────────────
export {
  setPlatformFeePercent,
  withdrawPlatformFunds,
} from "./web3.action"

// ── ethers utilities ─────────────────────────────────────────────────────────
export { formatEther, parseEther } from "ethers"

// ── Helpers used across multiple pages ───────────────────────────────────────

// Checks if a wallet is already connected (no prompt)
export const isWalletConnected = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !window.ethereum) return false
  const accounts = await window.ethereum.request({ method: "eth_accounts" })
  return accounts.length > 0
}

// Returns the connected wallet address
export const getSignerAddress = async (): Promise<string> => {
  if (typeof window === "undefined" || !window.ethereum) return ""
  const accounts = await window.ethereum.request({ method: "eth_accounts" })
  return accounts[0] ?? ""
}

// Etherscan URL helpers (Sepolia testnet)
export const getEtherscanTxUrl = (txHash: string): string =>
  `https://sepolia.etherscan.io/tx/${txHash}`

export const getEtherscanContractUrl = (address: string): string =>
  `https://sepolia.etherscan.io/address/${address}`

// CONTRACT_ABI — minimal ABI used by the community route
export const CONTRACT_ABI = [
  "function campaignCounter() view returns (uint256)",
  "function platformFeePercent() view returns (uint256)",
  "function owner() view returns (address)",
  "function getCampaignDetails(uint256) view returns (uint256,address,string,string,string,uint256,uint256,uint256,uint8,bool,uint256)",
  "function contribute(uint256) external payable",
  "function createCampaign(string,string,string,uint256,uint256) external returns (uint256)",
  "function setPlatformFee(uint256) external",
  "function withdrawPlatformFunds() external",
]