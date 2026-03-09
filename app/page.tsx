"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Wallet, Plus, TrendingUp, Users, Shield, Search, Filter } from "lucide-react"
import Link from "next/link"
import { getContract, connectWallet, formatEther } from "@/lib/web3"
import { type Campaign, CampaignStatus } from "@/types/campaign"

declare global {
  interface Window {
    ethereum?: any
  }
}

type SortOption = "newest" | "trending" | "ending-soon" | "most-funded"

export default function HomePage() {
  const [isConnected, setIsConnected] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "successful" | "failed">("active")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      let isMounted = true

      const initialize = async () => {
        try {
          await checkWalletConnection()
          if (isMounted) {
            await loadCampaigns()
          }
        } catch (error) {
          console.error("Error initializing app:", error)
          if (isMounted) {
            setLoading(false)
          }
        }
      }

      initialize()

      // Listen for wallet connection changes
      const handleAccountsChanged = () => {
        if (isMounted) {
          checkWalletConnection()
        }
      }

      if (window.ethereum) {
        window.ethereum.on("accountsChanged", handleAccountsChanged)
      }

      // Cleanup
      return () => {
        isMounted = false
        if (window.ethereum) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        }
      }
    } else {
      setLoading(false)
    }
  }, [])

  // Filter and sort campaigns
  useEffect(() => {
    let result = [...campaigns]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (selectedStatus !== "all") {
      result = result.filter(
        (c) =>
          (selectedStatus === "active" && c.status === CampaignStatus.Active) ||
          (selectedStatus === "successful" && c.status === CampaignStatus.Successful) ||
          (selectedStatus === "failed" && c.status === CampaignStatus.Failed)
      )
    }

    // Apply sorting
    result = result.sort((a, b) => {
      switch (sortBy) {
        case "trending":
          return Number(b.raisedAmount) - Number(a.raisedAmount)
        case "ending-soon":
          return a.deadline - b.deadline
        case "most-funded":
          const percentA = (Number(a.raisedAmount) / Number(a.goalAmount)) * 100
          const percentB = (Number(b.raisedAmount) / Number(b.goalAmount)) * 100
          return percentB - percentA
        case "newest":
        default:
          return b.id - a.id
      }
    })

    setFilteredCampaigns(result)
  }, [campaigns, searchQuery, selectedStatus, sortBy])

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

  const loadCampaigns = async () => {
    try {
      // Check if we're in the browser
      if (typeof window === "undefined") {
        setLoading(false)
        return
      }

      const contract = await getContract()
      if (!contract) {
        console.log("Contract not available - wallet not connected or contract not deployed")
        setCampaigns([])
        setLoading(false)
        return
      }

      const campaignCount = await contract.campaignCounter()
      const campaignPromises = []

      for (let i = 1; i <= Number(campaignCount); i++) {
        campaignPromises.push(contract.getCampaignDetails(i))
      }

      const campaignDetails = await Promise.all(campaignPromises)
      const formattedCampaigns = campaignDetails.map((details, index) => ({
        id: index + 1,
        creator: details[1],
        title: details[2],
        description: details[3],
        imageUrl: details[4],
        goalAmount: formatEther(details[5].toString()),
        raisedAmount: formatEther(details[6].toString()),
        deadline: Number(details[7]),
        status: details[8] as CampaignStatus,
        isPremium: details[9],
        contributorCount: Number(details[10]),
      }))

      setCampaigns(formattedCampaigns.filter((c) => c.status === CampaignStatus.Active))
    } catch (error) {
      console.error("Error loading campaigns:", error)
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  const getProgressPercentage = (raised: string, goal: string) => {
    const raisedNum = Number.parseFloat(raised)
    const goalNum = Number.parseFloat(goal)
    return goalNum > 0 ? Math.min((raisedNum / goalNum) * 100, 100) : 0
  }

  const formatTimeLeft = (deadline: number) => {
  const now = Math.floor(Date.now() / 1000)
  const timeLeft = deadline - now

  if (timeLeft <= 0) {
    return "Ended"
  }

  const days = Math.floor(timeLeft / 86400)
  const hours = Math.floor((timeLeft % 86400) / 3600)

  if (days > 0) {
    return `${days} days left`
  }

  return `${hours} hours left`
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">CrowdChain</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                Analytics
              </Button>
            </Link>
            <Link href="/withdraw">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                Withdraw
              </Button>
            </Link>
            <Link href="/create">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
            {!isConnected ? (
              <Button onClick={handleConnectWallet} variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-900/20">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <Badge variant="secondary" className="bg-purple-600 text-white">
                <Wallet className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-bold text-white mb-6">Decentralized Crowdfunding</h2>
          <p className="text-xl text-purple-200 mb-8 max-w-3xl mx-auto">
            Transparent, Secure, And Fee-Efficient Fundraising Powered By Blockchain Technology. Support Causes You
            Believe In With Complete Transparency And Milestone-Based Fund Releases.
          </p>
          <div className="flex justify-center space-x-8 mb-12">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Low Fees</h3>
              <p className="text-purple-300">Only 2% platform fee</p>
            </div>
            <div className="text-center">
              <Shield className="h-12 w-12 text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Transparent</h3>
              <p className="text-purple-300">All transactions on-chain</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Community Driven</h3>
              <p className="text-purple-300">Milestone voting system</p>
            </div>
          </div>
        </div>
      </section>

      {/* Active Campaigns */}
      <section className="py-16 bg-slate-800/50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold mb-8 text-white">Active Campaigns</h3>

          {/* Search & Filter Bar */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-purple-400" />
              <Input
                placeholder="Search campaigns by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700 border-purple-600/30 text-white placeholder:text-purple-300"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-purple-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 bg-slate-700 border border-purple-600/30 text-white rounded text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="trending">Most Funded</option>
                  <option value="ending-soon">Ending Soon</option>
                  <option value="most-funded">Highest Progress</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-purple-300">Status:</span>
                <div className="flex space-x-2">
                  {(["all", "active", "successful", "failed"] as const).map((status) => (
                    <Button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      variant={selectedStatus === status ? "default" : "outline"}
                      className={`text-xs capitalize ${
                        selectedStatus === status
                          ? "bg-purple-600 border-purple-600"
                          : "border-purple-400/30 text-purple-300 hover:border-purple-400"
                      }`}
                    >
                      {status === "all" ? "All" : status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Results Count */}
              <div className="ml-auto text-sm text-purple-300">
                {filteredCampaigns.length} {filteredCampaigns.length === 1 ? "campaign" : "campaigns"}
              </div>
            </div>
          </div>

          {/* No Results */}
          {!loading && filteredCampaigns.length === 0 && (
            <div className="text-center py-12">
              <p className="text-purple-300 text-lg mb-4">No campaigns found</p>
              <p className="text-purple-400 text-sm mb-6">Try adjusting your search or filters</p>
              <Button onClick={() => { setSearchQuery(""); setSelectedStatus("active"); setSortBy("newest") }} variant="outline" className="border-purple-400 text-purple-400">
                Clear Filters
              </Button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-2 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-shadow bg-slate-700 border-slate-600">
                  <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-500 relative">
                    {campaign.isPremium && <Badge className="absolute top-2 right-2 bg-yellow-500">Premium</Badge>}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <h4 className="text-white text-lg font-semibold text-center px-4">{campaign.title}</h4>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-purple-200 mb-4 line-clamp-2">{campaign.description}</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1 text-purple-300">
                          <span>Progress</span>
                          <span>{getProgressPercentage(campaign.raisedAmount, campaign.goalAmount).toFixed(1)}%</span>
                        </div>
                        <Progress value={getProgressPercentage(campaign.raisedAmount, campaign.goalAmount)} className="bg-slate-600" />
                      </div>
                      <div className="flex justify-between text-sm text-white">
                        <span className="font-semibold">{campaign.raisedAmount} ETH raised</span>
                        <span className="text-purple-400">of {campaign.goalAmount} ETH</span>
                      </div>
                      <div className="flex justify-between text-sm text-purple-300">
                        <span>{campaign.contributorCount} contributors</span>
                        <span className="text-purple-400">{formatTimeLeft(campaign.deadline)}</span>
                      </div>
                    </div>
                    <Link href={`/campaign/${campaign.id}`}>
                      <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">View Campaign</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
