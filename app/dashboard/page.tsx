"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react"
import Link from "next/link"
import { getContract, formatEther, connectWallet } from "@/lib/web3"
import { CampaignStatus } from "@/types/campaign"
import { getSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface CampaignFund {
  id: number
  title: string
  creator: string
  goalAmount: string
  raisedAmount: string
  status: CampaignStatus
  isPremium: boolean
  platformFee: string
  creatorAmount: string
}

export default function AnalyticsDashboard() {
  const [campaigns, setCampaigns] = useState<CampaignFund[]>([])
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [totalRaised, setTotalRaised] = useState("0")
  const [totalFees, setTotalFees] = useState("0")
  const [totalCreators, setTotalCreators] = useState("0")
  const [platformFeePercent, setPlatformFeePercent] = useState(2)
  const [hasMetaMask, setHasMetaMask] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      try {
        // Check if MetaMask is installed
        if (typeof window !== "undefined") {
          setHasMetaMask(!!window.ethereum)
        }

        const connected = await checkWalletConnection()
        if (isMounted && connected) {
          await loadCampaignFunds()
        }
      } catch (error) {
        console.error("Error initializing dashboard:", error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initialize()

    // Listen for wallet connection changes
    const handleAccountsChanged = () => {
      if (isMounted) {
        initialize()
      }
    }

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
    }

    return () => {
      isMounted = false
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [])

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        const connected = accounts.length > 0
        setIsConnected(connected)
        return connected
      } catch (error) {
        console.error("Error checking wallet connection:", error)
        setIsConnected(false)
        return false
      }
    }
    return false
  }

  const handleConnectWallet = async () => {
    const session = await getSession()
    if (!session) {
      router.push("/signup")
      return
    }

    const connected = await connectWallet()
    setIsConnected(connected)
  }

  const loadCampaignFunds = async () => {
    try {
      if (typeof window === "undefined") {
        setLoading(false)
        return
      }

      const contract = await getContract()
      if (!contract) {
        setCampaigns([])
        setLoading(false)
        return
      }

      const campaignCount = await contract.campaignCounter()
      const platformFee = await contract.platformFeePercent()
      setPlatformFeePercent(Number(platformFee))

      const campaignPromises = []
      for (let i = 1; i <= Number(campaignCount); i++) {
        campaignPromises.push(contract.getCampaignDetails(i))
      }

      const campaignDetails = await Promise.all(campaignPromises)
      
      let totalRaisedAmount = 0
      let totalFeesAmount = 0
      let totalCreatorAmount = 0

      const formattedCampaigns = campaignDetails.map((details, index) => {
        const raised = parseFloat(formatEther(details[6].toString()))
        const goal = parseFloat(formatEther(details[5].toString()))
        const fee = (raised * Number(platformFee)) / 100
        const creator = raised - fee

        totalRaisedAmount += raised
        totalFeesAmount += fee
        totalCreatorAmount += creator

        return {
          id: index + 1,
          title: details[2],
          creator: details[1],
          goalAmount: formatEther(details[5].toString()),
          raisedAmount: formatEther(details[6].toString()),
          status: details[8] as CampaignStatus,
          isPremium: details[9],
          platformFee: fee.toFixed(4),
          creatorAmount: creator.toFixed(4),
        }
      })

      setCampaigns(formattedCampaigns)
      setTotalRaised(totalRaisedAmount.toFixed(4))
      setTotalFees(totalFeesAmount.toFixed(4))
      setTotalCreators(totalCreatorAmount.toFixed(4))
      setLoading(false)
    } catch (error) {
      console.error("Error loading campaign funds:", error)
      setCampaigns([])
      setLoading(false)
    }
  }

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.Active:
        return "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
      case CampaignStatus.Successful:
        return "bg-green-500/20 text-green-300 border border-green-400/30"
      case CampaignStatus.Failed:
        return "bg-red-500/20 text-red-300 border border-red-400/30"
      default:
        return "bg-gray-500/20 text-gray-300 border border-gray-400/30"
    }
  }

  const getStatusLabel = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.Active:
        return "Active"
      case CampaignStatus.Successful:
        return "Successful"
      case CampaignStatus.Failed:
        return "Failed"
      case CampaignStatus.Cancelled:
        return "Cancelled"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000080] to-[#87CEEB] relative overflow-hidden">
      {/* Radial light effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-blue-400/25 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-cyan-300/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
      <header className="border-b border-white/30 bg-white/15 backdrop-blur-xl sticky top-0 z-50 rounded-b-2xl mx-4 mt-4 shadow-2xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="mb-0 text-white hover:bg-white/20 backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Analytics & Fund Flow</h1>
          {!hasMetaMask ? (
            <p className="text-sm text-white/70">Please install MetaMask to connect your wallet.</p>
          ) : !isConnected ? (
            <Button onClick={handleConnectWallet} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30">
              Connect Wallet
            </Button>
          ) : (
            <Badge variant="outline" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              Connected
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Raised</CardTitle>
              <DollarSign className="h-4 w-4 text-cyan-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalRaised} ETH</div>
              <p className="text-xs text-white/70">Across all campaigns</p>
            </CardContent>
          </div>

          <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Platform Fees</CardTitle>
              <TrendingDown className="h-4 w-4 text-blue-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalFees} ETH</div>
              <p className="text-xs text-white/70">{platformFeePercent}% from all funds</p>
            </CardContent>
          </div>

          <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">To Creators</CardTitle>
              <TrendingUp className="h-4 w-4 text-teal-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalCreators} ETH</div>
              <p className="text-xs text-white/70">After fees</p>
            </CardContent>
          </div>

          <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Campaigns</CardTitle>
              <Target className="h-4 w-4 text-cyan-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{campaigns.filter(c => c.status === CampaignStatus.Active).length}</div>
              <p className="text-xs text-white/70">Currently running</p>
            </CardContent>
          </div>
        </div>

        {/* Detailed Campaigns Table */}
        <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">Campaign Fund Breakdown</CardTitle>
            <CardDescription className="text-white/70">
              Detailed view of all campaigns and their fund flows
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-white">Loading campaigns...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white">No campaigns found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/30">
                      <th className="text-left py-3 px-4 font-semibold text-white">Campaign</th>
                      <th className="text-right py-3 px-4 font-semibold text-white">Goal</th>
                      <th className="text-right py-3 px-4 font-semibold text-white">Raised</th>
                      <th className="text-right py-3 px-4 font-semibold text-white">Platform Fee</th>
                      <th className="text-right py-3 px-4 font-semibold text-white">To Creator</th>
                      <th className="text-center py-3 px-4 font-semibold text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b border-white/15 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <Link href={`/campaign/${campaign.id}`}>
                            <button className="text-cyan-300 hover:text-cyan-200 transition-colors truncate max-w-xs">
                              {campaign.title}
                            </button>
                          </Link>
                        </td>
                        <td className="text-right py-3 px-4 text-white">{campaign.goalAmount} ETH</td>
                        <td className="text-right py-3 px-4 font-semibold text-white">{campaign.raisedAmount} ETH</td>
                        <td className="text-right py-3 px-4 text-blue-300">{campaign.platformFee} ETH</td>
                        <td className="text-right py-3 px-4 text-teal-300 font-semibold">{campaign.creatorAmount} ETH</td>
                        <td className="text-center py-3 px-4">
                          <Badge className={`${getStatusColor(campaign.status)} text-white`}>
                            {getStatusLabel(campaign.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </div>
      </main>
    </div>
  )
}
