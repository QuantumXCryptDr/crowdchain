import { ethers } from "ethers"

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""

export const CONTRACT_ABI = [
  "error OwnableInvalidOwner(address owner)",
  "error OwnableUnauthorizedAccount(address account)",
  "error ReentrancyGuardReentrantCall()",
  "function createCampaign(string memory _title, string memory _description, string memory _imageUrl, uint256 _goalAmount, uint256 _deadline) external returns (uint256)",
  "function contribute(uint256 _campaignId) external payable",
  "function createMilestone(uint256 _campaignId, string memory _description, uint256 _amount, uint256 _deadline) external",
  "function voteOnMilestone(uint256 _campaignId, uint256 _milestoneId, bool _vote) external",
  "function releaseMilestoneFunds(uint256 _campaignId, uint256 _milestoneId) external",
  "function requestRefund(uint256 _campaignId) external",
  "function enablePremiumFeatures(uint256 _campaignId) external payable",
  "function getCampaignDetails(uint256 _campaignId) external view returns (uint256 id, address creator, string title, string description, string imageUrl, uint256 goalAmount, uint256 raisedAmount, uint256 deadline, uint8 status, bool isPremium, uint256 contributorCount)",
  "function campaignCounter() external view returns (uint256)",
  "function platformFeePercent() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function setPlatformFee(uint256 _newFeePercent) external",
  "function withdrawPlatformFunds() external",
]

// ------------------------------
// RPC
// ------------------------------

const FALLBACK_RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com"

// ------------------------------
// PROVIDER
// ------------------------------

export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }

  return new ethers.JsonRpcProvider(FALLBACK_RPC_URL)
}

// ------------------------------
// CONTRACT CHECK
// ------------------------------

export const isContractDeployed = () => {
  return (
    !!CONTRACT_ADDRESS &&
    CONTRACT_ADDRESS !== "" &&
    CONTRACT_ADDRESS !== "0x..." &&
    CONTRACT_ADDRESS !== "PASTE_YOUR_DEPLOYED_ADDRESS_HERE"
  )
}

// ------------------------------
// WALLET
// ------------------------------

export const connectWallet = async () => {
  if (typeof window === "undefined" || !window.ethereum) return false

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    await provider.send("eth_requestAccounts", [])
    return true
  } catch {
    return false
  }
}

export const isWalletConnected = async () => {
  if (typeof window === "undefined" || !window.ethereum) return false

  const accounts = await window.ethereum.request({ method: "eth_accounts" })
  return accounts && accounts.length > 0
}

// ------------------------------
// CONTRACT (WRITE)
// ------------------------------

export const getContract = async () => {
  if (typeof window === "undefined" || !window.ethereum) return null
  if (!isContractDeployed()) return null

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  } catch {
    return null
  }
}

// ------------------------------
// CONTRACT (READ ONLY)
// ------------------------------

export const getReadOnlyContract = () => {
  if (!isContractDeployed()) return null

  const provider = new ethers.JsonRpcProvider(FALLBACK_RPC_URL)
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
}

// ------------------------------
// ETH HELPERS (FIXED)
// ------------------------------

export const formatEther = (value: string | bigint) => {
  try {
    return ethers.formatEther(value)
  } catch {
    return "0"
  }
}

export const parseEther = (value: string) => {
  try {
    return ethers.parseEther(value)
  } catch {
    return 0n
  }
}

// ------------------------------
// SIGNER
// ------------------------------

export const getSigner = async () => {
  if (typeof window === "undefined" || !window.ethereum) return null

  const provider = new ethers.BrowserProvider(window.ethereum)
  return await provider.getSigner()
}

export const getSignerAddress = async () => {
  const signer = await getSigner()
  return signer ? await signer.getAddress() : null
}

// ------------------------------
// CONTRACT READ HELPERS
// ------------------------------

export const getCampaignCount = async () => {
  const contract = getReadOnlyContract()
  if (!contract) return 0

  const count = await contract.campaignCounter()
  return Number(count)
}

export const getPlatformFeePercent = async () => {
  const contract = getReadOnlyContract()
  if (!contract) return 0

  const fee = await contract.platformFeePercent()
  return Number(fee)
}

export const getContractOwner = async () => {
  const contract = getReadOnlyContract()
  if (!contract) return null

  return await contract.owner()
}

export const getContractBalance = async () => {
  if (!CONTRACT_ADDRESS) return "0"

  const provider = new ethers.JsonRpcProvider(FALLBACK_RPC_URL)
  const balance = await provider.getBalance(CONTRACT_ADDRESS)

  return ethers.formatEther(balance)
}

// ------------------------------
// ADMIN ACTIONS
// ------------------------------

export const setPlatformFeePercent = async (newFee: number) => {
  const contract = await getContract()
  if (!contract) return null

  const tx = await contract.setPlatformFee(newFee)
  return await tx.wait()
}

export const withdrawPlatformFunds = async () => {
  const contract = await getContract()
  if (!contract) return null

  const tx = await contract.withdrawPlatformFunds()
  return await tx.wait()
}

// ------------------------------
// ETHERSCAN
// ------------------------------

const ETHERSCAN_BASE = "https://sepolia.etherscan.io"

export const getEtherscanContractUrl = () => {
  if (!CONTRACT_ADDRESS) return ""
  return `${ETHERSCAN_BASE}/address/${CONTRACT_ADDRESS}`
}

export const getEtherscanTxUrl = (txHash: string) => {
  return `${ETHERSCAN_BASE}/tx/${txHash}`
}