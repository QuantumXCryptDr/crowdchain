// lib/web3.ts - Single source of truth for all web3 imports

export {
  getReadOnlyContract,
  getCampaignCount,
  getPlatformFeePercent,
  getContractOwner,
  getContractBalance,
  CONTRACT_ADDRESS,
} from "./web3.server"

export {
  connectWallet,
  getSigner,
  getContract,
} from "./web3.client"

export {
  setPlatformFeePercent,
  withdrawPlatformFunds,
} from "./web3.action"

export { formatEther, parseEther } from "ethers"

export const isWalletConnected = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !window.ethereum) return false
  const accounts = await window.ethereum.request({ method: "eth_accounts" })
  return accounts.length > 0
}

export const getSignerAddress = async (): Promise<string> => {
  if (typeof window === "undefined" || !window.ethereum) return ""
  const accounts = await window.ethereum.request({ method: "eth_accounts" })
  return accounts[0] ?? ""
}

export const getEtherscanTxUrl = (txHash: string): string =>
  `https://sepolia.etherscan.io/tx/${txHash}`

export const getEtherscanContractUrl = (address: string): string =>
  `https://sepolia.etherscan.io/address/${address}`

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
