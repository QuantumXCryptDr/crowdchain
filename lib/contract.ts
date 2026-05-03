import { ethers } from "ethers"
import { type Campaign, CampaignStatus } from "@/types/campaign"

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""

export const RPC_URL =
  process.env.SEPOLIA_URL ||
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com"

export const CONTRACT_ABI = [
  "function campaignCounter() view returns (uint256)",
  "function platformFeePercent() view returns (uint256)",
  "function owner() view returns (address)",
  "function getCampaignDetails(uint256) view returns (uint256,address,string,string,string,uint256,uint256,uint256,uint8,bool,uint256)",
  "function getUserContribution(uint256,address) view returns (uint256)",
  "function getCampaignMilestoneCount(uint256) view returns (uint256)",
  "function getMilestone(uint256,uint256) view returns (string,uint256,uint256,uint8,uint256,uint256)",
  "function getCampaignWithdrawalBreakdown(uint256) view returns (uint256,uint256,uint256,uint256,bool)",
  "function contribute(uint256) external payable",
  "function createCampaign(string,string,string,uint256,uint256) external returns (uint256)",
  "function createMilestone(uint256,string,uint256,uint256) external",
  "function voteOnMilestone(uint256,uint256,bool) external",
  "function releaseMilestoneFunds(uint256,uint256) external",
  "function withdrawCampaignFunds(uint256,address) external",
  "function requestRefund(uint256) external",
  "function enablePremiumFeatures(uint256) external payable",
  "function setPlatformFee(uint256) external",
  "function withdrawPlatformFunds() external",
  "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goalAmount)",
]

export const formatCampaign = (details: any): Campaign => ({
  id: Number(details[0]),
  creator: String(details[1]),
  title: String(details[2]),
  description: String(details[3]),
  imageUrl: String(details[4] || ""),
  goalAmount: ethers.formatEther(details[5]),
  raisedAmount: ethers.formatEther(details[6]),
  deadline: Number(details[7]),
  status: Number(details[8]) as CampaignStatus,
  isPremium: Boolean(details[9]),
  contributorCount: Number(details[10]),
})
