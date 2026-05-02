import { ethers } from "ethers"
import { CONTRACT_ABI, CONTRACT_ADDRESS, RPC_URL } from "./contract"

let provider: ethers.JsonRpcProvider | null = null

const getProvider = () => {
  provider ??= new ethers.JsonRpcProvider(RPC_URL)
  return provider
}

export const getCampaignCount = async () => {
  const contract = getReadOnlyContract()
  if (!contract) return 0
  return Number(await contract.campaignCounter())
}

export const getPlatformFeePercent = async () => {
  const contract = getReadOnlyContract()
  if (!contract) return 0
  return Number(await contract.platformFeePercent())
}

export const getContractOwner = async () => {
  const contract = getReadOnlyContract()
  if (!contract) return ""
  return contract.owner()
}

export const getContractBalance = async () => {
  if (!CONTRACT_ADDRESS) return "0"
  const bal = await getProvider().getBalance(CONTRACT_ADDRESS)
  return ethers.formatEther(bal)
}

export const getReadOnlyContract = () => {
  if (!CONTRACT_ADDRESS) return null
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, getProvider())
}
