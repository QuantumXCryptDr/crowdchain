"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react"
import Link from "next/link"
import { getContract, formatEther, connectWallet } from "@/lib/web3"
import { CampaignStatus } from "@/types/campaign"

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

  useEffect(() => {
    checkWalletConnection()
    loadCampaignFunds()
  }, [])

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_accounts" })
      setIsConnected(accounts.length > 0)
    }
  }

  const handleConnectWallet = async () => {
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
        return "bg-blue-100 text-blue-800"
      case CampaignStatus.Successful:
        return "bg-green-100 text-green-800"
      case CampaignStatus.Failed:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="border-b border-purple-800/30 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="mb-0 text-purple-400 hover:text-purple-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Analytics & Fund Flow</h1>
          {!isConnected ? (
            <Button onClick={handleConnectWallet} className="bg-purple-600 hover:bg-purple-700">
              Connect Wallet
            </Button>
          ) : (
            <Badge variant="outline" className="bg-purple-600 text-white border-purple-400">
              Connected
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRaised} ETH</div>
              <p className="text-xs text-gray-500">Across all campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFees} ETH</div>
              <p className="text-xs text-gray-500">{platformFeePercent}% from all funds</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To Creators</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCreators} ETH</div>
              <p className="text-xs text-gray-500">After fees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaigns.filter(c => c.status === CampaignStatus.Active).length}</div>
              <p className="text-xs text-gray-500">Currently running</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Campaigns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Fund Breakdown</CardTitle>
            <CardDescription>
              Detailed view of all campaigns and their fund flows
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading campaigns...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No campaigns found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Campaign</th>
                      <th className="text-right py-3 px-4 font-semibold">Goal</th>
                      <th className="text-right py-3 px-4 font-semibold">Raised</th>
                      <th className="text-right py-3 px-4 font-semibold">Platform Fee</th>
                      <th className="text-right py-3 px-4 font-semibold">To Creator</th>
                      <th className="text-center py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link href={`/campaign/${campaign.id}`}>
                            <button className="text-blue-600 hover:underline truncate max-w-xs">
                              {campaign.title}
                            </button>
                          </Link>
                        </td>
                        <td className="text-right py-3 px-4">{campaign.goalAmount} ETH</td>
                        <td className="text-right py-3 px-4 font-semibold">{campaign.raisedAmount} ETH</td>
                        <td className="text-right py-3 px-4 text-orange-600">{campaign.platformFee} ETH</td>
                        <td className="text-right py-3 px-4 text-green-600 font-semibold">{campaign.creatorAmount} ETH</td>
                        <td className="text-center py-3 px-4">
                          <Badge className={getStatusColor(campaign.status)}>
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
        </Card>
      </main>
    </div>
  )
}
