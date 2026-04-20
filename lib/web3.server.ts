import { ethers } from "ethers"

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""

const RPC =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com"

const provider = new ethers.JsonRpcProvider(RPC)

const ABI = [
  "function campaignCounter() view returns (uint256)",
  "function platformFeePercent() view returns (uint256)",
  "function owner() view returns (address)",
  "function getCampaignDetails(uint256) view returns (uint256,address,string,string,string,uint256,uint256,uint256,uint8,bool,uint256)"
]

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

export const getCampaignCount = async () =>
  Number(await contract.campaignCounter())

export const getPlatformFeePercent = async () =>
  Number(await contract.platformFeePercent())

export const getContractOwner = async () =>
  await contract.owner()

export const getContractBalance = async () => {
  const bal = await provider.getBalance(CONTRACT_ADDRESS)
  return ethers.formatEther(bal)
}

export const getReadOnlyContract = () => contract