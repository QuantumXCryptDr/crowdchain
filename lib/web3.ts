import { ethers } from "ethers"

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""

console.log("WEB3 LOADED")
console.log("CONTRACT_ADDRESS:", CONTRACT_ADDRESS)

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
  "function getUserContribution(uint256 _campaignId, address _user) external view returns (uint256)",
  "function getMilestone(uint256 _campaignId, uint256 _milestoneId) external view returns (string description, uint256 amount, uint256 deadline, uint8 status, uint256 votesFor, uint256 votesAgainst)",
  "function getCampaignMilestoneCount(uint256 _campaignId) external view returns (uint256)",
  "function campaignCounter() external view returns (uint256)",
  "function platformFeePercent() external view returns (uint256)",
  "function campaigns(uint256) external view returns (uint256 id, address creator, string title, string description, string imageUrl, uint256 goalAmount, uint256 raisedAmount, uint256 deadline, uint8 status, bool isPremium, uint256 milestoneCount, uint256 totalMilestoneAmount, uint256 totalReleasedAmount)",
  "function userCampaigns(address, uint256) external view returns (uint256)",
  "function userContributions(address, uint256) external view returns (uint256)",
  "function owner() external view returns (address)",
  "function setPlatformFee(uint256 _newFeePercent) external",
  "function withdrawPlatformFunds() external",
  "function transferOwnership(address newOwner) external",
  "function renounceOwnership() external",
]

const FALLBACK_RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com"

export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    console.log("Using BrowserProvider")
    return new ethers.BrowserProvider(window.ethereum)
  }

  console.log("Using JsonRpcProvider")
  return new ethers.JsonRpcProvider(FALLBACK_RPC_URL)
}

export const isContractDeployed = () => {
  const ok =
    !!CONTRACT_ADDRESS &&
    CONTRACT_ADDRESS !== "" &&
    CONTRACT_ADDRESS !== "0x..." &&
    CONTRACT_ADDRESS !== "PASTE_YOUR_DEPLOYED_ADDRESS_HERE"

  console.log("isContractDeployed:", ok)
  return ok
}

export const isWalletConnected = async () => {
  if (typeof window === "undefined") return false

  try {
    const accounts = await window.ethereum?.request({ method: "eth_accounts" })
    const connected = accounts && accounts.length > 0
    console.log("wallet connected:", connected)
    return connected
  } catch (e) {
    console.error("wallet check error:", e)
    return false
  }
}

export const getContract = async () => {
  try {
    console.log("getContract triggered")

    if (typeof window === "undefined") {
      console.log("SSR blocked")
      return null
    }

    const provider = getProvider()

    if (!(provider instanceof ethers.BrowserProvider)) {
      console.log("Not browser provider")
      return null
    }

    const connected = await isWalletConnected()
    if (!connected) {
      console.log("Wallet not connected")
      return null
    }

    if (!isContractDeployed()) {
      console.log("Contract not deployed")
      return null
    }

    const signer = await provider.getSigner()

    console.log("Contract ready")

    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  } catch (err) {
    console.error("getContract error:", err)
    return null
  }
}