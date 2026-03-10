import { ethers } from "ethers"

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""

export const CONTRACT_ABI = [
  // Add the full ABI here after compilation
  "function createCampaign(string memory _title, string memory _description, string memory _imageUrl, uint256 _goalAmount, uint256 _deadline) external returns (uint256)",
  "function contribute(uint256 _campaignId) external payable",
  "function getCampaignDetails(uint256 _campaignId) external view returns (uint256, address, string, string, string, uint256, uint256, uint256, uint8, bool, uint256)",
  "function getUserContribution(uint256 _campaignId, address _user) external view returns (uint256)",
  "function requestRefund(uint256 _campaignId) external",
  "function createMilestone(uint256 _campaignId, string memory _description, uint256 _amount, uint256 _deadline) external",
  "function voteOnMilestone(uint256 _campaignId, uint256 _milestoneId, bool _vote) external",
  "function releaseMilestoneFunds(uint256 _campaignId, uint256 _milestoneId) external",
  "function enablePremiumFeatures(uint256 _campaignId) external payable",
  "function campaignCounter() external view returns (uint256)",
  "function platformFeePercent() external view returns (uint256)",
  "function withdrawPlatformFunds() external",
  "function setPlatformFee(uint256 _newFeePercent) external",
  "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goalAmount)",
  "event ContributionMade(uint256 indexed campaignId, address indexed contributor, uint256 amount)",
]

export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }
  return null
}

export const getSigner = async () => {
  const provider = getProvider()
  if (provider) {
    return await provider.getSigner()
  }
  return null
}

export const getContract = async () => {
  try {
    // Check if we're in the browser
    if (typeof window === "undefined") {
      return null
    }

    const provider = getProvider()
    if (!provider) {
      return null // Don't throw error, just return null
    }

    // Check if wallet is connected first
    const connected = await isWalletConnected()
    if (!connected) {
      return null // Don't throw error, just return null
    }

    // Request account access if needed
    await provider.send("eth_requestAccounts", [])
    const signer = await provider.getSigner()

    if (!isContractDeployed()) {
      console.warn("Contract not deployed yet")
      return null // Don't throw error, just return null
    }

    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  } catch (error) {
    console.error("Error getting contract:", error)
    return null // Return null instead of throwing
  }
}

export const connectWallet = async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      // Check if we're on the correct network (Sepolia)
      const chainId = await window.ethereum.request({ method: "eth_chainId" })
      const sepoliaChainId = "0xaa36a7" // 11155111 in hex

      if (chainId !== sepoliaChainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: sepoliaChainId }],
          })
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: sepoliaChainId,
                  chainName: "Sepolia Test Network",
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: [
                    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/",
                    "https://1rpc.io/sepolia",
                  ],
                  blockExplorerUrls: ["https://sepolia.etherscan.io/"],
                },
              ],
            })
          }
        }
      }

      return accounts.length > 0
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      return false
    }
  }
  return false
}

export const isWalletConnected = async () => {
  // Check if we're in the browser
  if (typeof window === "undefined") {
    return false
  }

  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" })
      return accounts.length > 0
    } catch (error) {
      console.error("Error checking wallet connection:", error)
      return false
    }
  }
  return false
}

export const formatEther = (value: string | bigint) => {
  return ethers.formatEther(value)
}

export const parseEther = (value: string) => {
  return ethers.parseEther(value)
}

export const isContractDeployed = () => {
  return (
    CONTRACT_ADDRESS &&
    CONTRACT_ADDRESS !== "" &&
    CONTRACT_ADDRESS !== "0x..." &&
    CONTRACT_ADDRESS !== "PASTE_YOUR_DEPLOYED_ADDRESS_HERE"
  )
}

// --- Admin helper functions ---
export const getPlatformFeePercent = async () => {
  try {
    const provider = getProvider()
    if (!provider || !isContractDeployed()) return null
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
    const fee = await contract.platformFeePercent()
    return Number(fee.toString())
  } catch (e) {
    console.error("getPlatformFeePercent error", e)
    return null
  }
}

export const getContractOwner = async () => {
  try {
    const provider = getProvider()
    if (!provider || !isContractDeployed()) return null
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
    return await contract.owner()
  } catch (e) {
    console.error("getContractOwner error", e)
    return null
  }
}

export const getContractBalance = async () => {
  try {
    const provider = getProvider()
    if (!provider || !isContractDeployed()) return "0"
    return (await provider.getBalance(CONTRACT_ADDRESS)).toString()
  } catch (e) {
    console.error("getContractBalance error", e)
    return "0"
  }
}

export const getSignerAddress = async () => {
  try {
    const signer = await getSigner()
    if (!signer) return null
    return await signer.getAddress()
  } catch (e) {
    console.error("getSignerAddress error", e)
    return null
  }
}

export const getCampaignCount = async () => {
  try {
    const provider = getProvider()
    if (!provider || !isContractDeployed()) return 0
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
    return Number((await contract.campaignCounter()).toString())
  } catch (e) {
    console.error("getCampaignCount error", e)
    return 0
  }
}

export const setPlatformFeePercent = async (newFee: number) => {
  try {
    const contract = await getContract()
    if (!contract) return { success: false, message: "Wallet not connected or contract unavailable" }
    const tx = await contract.setPlatformFee(newFee)
    const txHash = tx.hash
    await tx.wait()
    return { success: true, txHash }
  } catch (e: any) {
    console.error("setPlatformFeePercent error", e)
    return { success: false, message: e?.message || String(e) }
  }
}

export const withdrawPlatformFunds = async () => {
  try {
    const contract = await getContract()
    if (!contract) return { success: false, message: "Wallet not connected or contract unavailable" }
    const tx = await contract.withdrawPlatformFunds()
    const txHash = tx.hash
    await tx.wait()
    return { success: true, txHash }
  } catch (e: any) {
    console.error("withdrawPlatformFunds error", e)
    return { success: false, message: e?.message || String(e) }
  }
}

export const getEtherscanTxUrl = (txHash: string) => {
  return `https://sepolia.etherscan.io/tx/${txHash}`
}

export const getEtherscanContractUrl = () => {
  return `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`
}
