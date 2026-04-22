"use client"

import { ethers } from "ethers"

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""

const ABI = [
  "function campaignCounter() view returns (uint256)",
  "function platformFeePercent() view returns (uint256)",
  "function owner() view returns (address)",
  "function getCampaignDetails(uint256) view returns (uint256,address,string,string,string,uint256,uint256,uint256,uint8,bool,uint256)",
  "function contribute(uint256) external payable",
  "function createCampaign(string,string,string,uint256,uint256) external returns (uint256)",
  "function setPlatformFee(uint256) external",
  "function withdrawPlatformFunds() external",
]

export const connectWallet = async () => {
  if (!window.ethereum) return false

  const provider = new ethers.BrowserProvider(window.ethereum)
  await provider.send("eth_requestAccounts", [])
  return true
}

export const getSigner = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum)
  return provider.getSigner()
}

export const getContract = async () => {
  const signer = await getSigner()
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
}