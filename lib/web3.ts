// lib/web3.ts
// Barrel file — syncs all web3 modules so page.tsx and other files can import from a single source

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

// ── ethers utilities re-exported so callers don't need a separate import ─────
export { formatEther, parseEther } from "ethers"