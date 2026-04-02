"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Wallet, Plus, TrendingUp, Users, Shield, Search, Filter, Home, Link as LinkIcon, UserPlus } from "lucide-react"
import Link from "next/link"
import { getContract, connectWallet, formatEther } from "@/lib/web3"
import { type Campaign, CampaignStatus } from "@/types/campaign"
import ThreeBackground from "@/components/ThreeBackground"
import { getSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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
  const router = useRouter()

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
    const session = await getSession()
    if (!session) {
      router.push("/signup")
      return
    }

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
    <div className="min-h-screen bg-gradient-to-br from-[#000020] to-[#000080] relative overflow-hidden">
      <ThreeBackground />
      {/* Radial light effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-blue-800/25 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-blue-700/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
      {/* Header */}
      <header className="border-b border-white/30 bg-white/15 backdrop-blur-xl sticky top-0 z-50 rounded-b-2xl mx-4 mt-4 shadow-2xl py-6">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full">
              <LinkIcon className="h-10 w-10 text-white shield-rotate" />
            </div>
            <h1 className="text-3xl font-bold text-white logo-glow">CrowdChain</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:translate-x-1 hover:-translate-y-1 hover:z-10 relative">
                Analytics
              </Button>
            </Link>
            <Link href="/withdraw">
              <Button variant="ghost" className="text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:translate-x-1 hover:-translate-y-1 hover:z-10 relative">
                Withdraw
              </Button>
            </Link>
            <Link href="/create">
              <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 transition-all duration-300 hover:translate-x-1 hover:-translate-y-1 hover:z-10 relative">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
            {!isConnected ? (
              <Button onClick={handleConnectWallet} variant="outline" className="border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:translate-x-1 hover:-translate-y-1 hover:z-10 relative">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:translate-x-1 hover:-translate-y-1 hover:z-10 relative">
                <Wallet className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center relative z-10">
        <div className="container mx-auto px-4">
          <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-white mb-6">Decentralized Crowdfunding</h2>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              Transparent, Secure, And Fee-Efficient Fundraising Powered By Blockchain Technology. Support Causes You
              Believe In With Complete Transparency And Milestone-Based Fund Releases.
            </p>
            <div className="flex justify-center space-x-8 mb-12">
              <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/30 hover:bg-white/20 transition-all duration-300 shadow-xl">
                <TrendingUp className="h-12 w-12 text-white mx-auto mb-2" />
                <h3 className="font-semibold text-white">Low Fees</h3>
                <p className="text-white/70">Only 2% platform fee</p>
              </div>
              <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/30 hover:bg-white/20 transition-all duration-300 shadow-xl">
                <Shield className="h-12 w-12 text-white mx-auto mb-2" />
                <h3 className="font-semibold text-white">Transparent</h3>
                <p className="text-white/70">All transactions on-chain</p>
              </div>
              <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/30 hover:bg-white/20 transition-all duration-300 shadow-xl">
                <Users className="h-12 w-12 text-white mx-auto mb-2" />
                <h3 className="font-semibold text-white">Community Driven</h3>
                <p className="text-white/70">Milestone voting system</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Campaigns */}
      <section className="py-16 pb-24 relative z-10">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold mb-8 text-white text-center">Active Campaigns</h3>

          {/* Search & Filter Bar */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative bg-white/15 backdrop-blur-xl rounded-2xl border border-white/30">
              <Search className="absolute left-3 top-3 h-5 w-5 text-white/70" />
              <Input
                placeholder="Search campaigns by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-transparent border-0 text-white placeholder:text-white/50 focus:ring-0"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white/15 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-xl">
              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-white/70" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 bg-white/10 border border-white/30 text-white rounded-lg text-sm backdrop-blur-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="trending">Most Funded</option>
                  <option value="ending-soon">Ending Soon</option>
                  <option value="most-funded">Highest Progress</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white/70">Status:</span>
                <div className="flex space-x-2">
                  {(["all", "active", "successful", "failed"] as const).map((status) => (
                    <Button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      variant={selectedStatus === status ? "default" : "outline"}
                      className={`text-xs capitalize backdrop-blur-sm transition-all duration-300 ${
                        selectedStatus === status
                          ? "bg-white/20 border-white/40 text-white"
                          : "border-white/30 text-white/70 hover:border-white/50 hover:bg-white/10"
                      }`}
                    >
                      {status === "all" ? "All" : status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Results Count */}
              <div className="ml-auto text-sm text-white/70">
                {filteredCampaigns.length} {filteredCampaigns.length === 1 ? "campaign" : "campaigns"}
              </div>
            </div>
          </div>

          {/* No Results */}
          {!loading && filteredCampaigns.length === 0 && (
            <div className="text-center py-12 bg-white/15 backdrop-blur-xl rounded-3xl p-8 border border-white/30">
              <p className="text-white text-lg mb-4">No campaigns found</p>
              <p className="text-white/70 text-sm mb-6">Try adjusting your search or filters</p>
              <Button onClick={() => { setSearchQuery(""); setSelectedStatus("active"); setSortBy("newest") }} variant="outline" className="border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                Clear Filters
              </Button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/15 backdrop-blur-xl rounded-3xl p-6 border border-white/30 animate-pulse">
                  <div className="h-48 bg-white/20 rounded-2xl mb-4"></div>
                  <div className="h-4 bg-white/20 rounded mb-2"></div>
                  <div className="h-3 bg-white/20 rounded mb-4"></div>
                  <div className="h-2 bg-white/20 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-white/20 rounded w-20"></div>
                    <div className="h-3 bg-white/20 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white/15 backdrop-blur-xl rounded-3xl overflow-hidden hover:bg-white/20 transition-all duration-300 border border-white/30 shadow-xl hover:shadow-2xl hover:scale-105">
                  <div className="h-48 bg-gradient-to-r from-cyan-400 to-blue-500 relative">
                    {campaign.isPremium && <Badge className="absolute top-2 right-2 bg-yellow-400 text-black">Premium</Badge>}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <h4 className="text-white text-lg font-semibold text-center px-4">{campaign.title}</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-white/80 mb-4 line-clamp-2">{campaign.description}</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1 text-white/70">
                          <span>Progress</span>
                          <span>{getProgressPercentage(campaign.raisedAmount, campaign.goalAmount).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div className="bg-cyan-400 h-2 rounded-full" style={{ width: `${getProgressPercentage(campaign.raisedAmount, campaign.goalAmount)}%` }}></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-white">
                        <span className="font-semibold">{campaign.raisedAmount} ETH raised</span>
                        <span className="text-cyan-300">of {campaign.goalAmount} ETH</span>
                      </div>
                      <div className="flex justify-between text-sm text-white/70">
                        <span>{campaign.contributorCount} contributors</span>
                        <span className="text-cyan-300">{formatTimeLeft(campaign.deadline)}</span>
                      </div>
                    </div>
                    <Link href={`/campaign/${campaign.id}`}>
                      <Button className="w-full mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 transition-all duration-300">View Campaign</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/15 backdrop-blur-xl rounded-full px-6 py-3 border border-white/30 shadow-2xl z-50">
        <div className="flex space-x-8">
          <Link href="/" className="flex flex-col items-center text-white/70 hover:text-white transition-colors">
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/create" className="flex flex-col items-center text-white/70 hover:text-white transition-colors">
            <Plus className="h-6 w-6" />
            <span className="text-xs mt-1">Create</span>
          </Link>
          <Link href="/dashboard" className="flex flex-col items-center text-white/70 hover:text-white transition-colors">
            <TrendingUp className="h-6 w-6" />
            <span className="text-xs mt-1">Analytics</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center text-white/70 hover:text-white transition-colors">
            <Users className="h-6 w-6" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
