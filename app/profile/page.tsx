"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Loader, AlertCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getContract, connectWallet, isWalletConnected, formatEther, getSigner } from "@/lib/web3"

interface Campaign {
  id: number
  title: string
  description: string
  imageUrl: string
  goalAmount: string
  raisedAmount: string
  deadline: number
  status: number
  isPremium: boolean
}

interface Contribution {
  campaignId: number
  title: string
  amount: string
  imageUrl: string
  raisedAmount: string
  goalAmount: string
  status: number
}

export default function ProfilePage() {
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [createdCampaigns, setCreatedCampaigns] = useState<Campaign[]>([])
  const [contributedCampaigns, setContributedCampaigns] = useState<Contribution[]>([])
  const [totalContributed, setTotalContributed] = useState("0")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const campaignStatusLabels: Record<number, string> = {
    0: "Active",
    1: "Successful",
    2: "Failed",
    3: "Cancelled",
  }

  const campaignStatusColors: Record<number, string> = {
    0: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    1: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    2: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    3: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
  }

  const loadUserData = async (isMounted?: boolean) => {
    try {
      setLoading(true)
      setError(null)

      const connected = await isWalletConnected()
      if (!connected) {
        if (isMounted !== false) {
          setError("Please connect your wallet to view your profile")
          setLoading(false)
        }
        return
      }

      const contract = await getContract()
      if (!contract) {
        if (isMounted !== false) {
          setError("Failed to connect to contract")
          setLoading(false)
        }
        return
      }

      const signer = await getSigner()
      if (!signer) {
        if (isMounted !== false) {
          setError("Could not get signer")
          setLoading(false)
        }
        return
      }

      const address = await signer.getAddress()
      
      if (isMounted === false) return

      setUserAddress(address)

      // Get campaign counter
      const counter = await contract.campaignCounter()
      const totalCampaigns = Number(counter)

      // Load created campaigns and contributions
      const created: Campaign[] = []
      const contributed: Contribution[] = []
      let totalContrib = BigInt(0)

      for (let i = 1; i <= totalCampaigns; i++) {
        if (!isMounted) return
        
        try {
          const campaignData = await contract.getCampaignDetails(i)
          const [
            id,
            creator,
            title,
            description,
            imageUrl,
            goalAmount,
            raisedAmount,
            deadline,
            status,
            isPremium,
            milestoneCount,
          ] = campaignData

          // Check if user is creator
          if (creator.toLowerCase() === address.toLowerCase()) {
            created.push({
              id: Number(id),
              title,
              description,
              imageUrl,
              goalAmount: formatEther(goalAmount),
              raisedAmount: formatEther(raisedAmount),
              deadline: Number(deadline),
              status: Number(status),
              isPremium,
            })
          }

          // Check if user contributed
          const userContribution = await contract.getUserContribution(i, address)
          if (userContribution > BigInt(0)) {
            const contribAmount = formatEther(userContribution)
            contributed.push({
              campaignId: Number(id),
              title,
              amount: contribAmount,
              imageUrl,
              raisedAmount: formatEther(raisedAmount),
              goalAmount: formatEther(goalAmount),
              status: Number(status),
            })
            totalContrib += userContribution
          }
        } catch (err) {
          console.error(`Error loading campaign ${i}:`, err)
        }
      }

      if (isMounted) {
        setCreatedCampaigns(created)
        setContributedCampaigns(contributed)
        setTotalContributed(formatEther(totalContrib))
      }
    } catch (err) {
      console.error("Error loading profile:", err)
      if (isMounted) {
        setError("Failed to load profile data. Please try again.")
      }
    } finally {
      if (isMounted) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      try {
        await loadUserData(isMounted)
      } catch (error) {
        console.error("Error initializing profile:", error)
        if (isMounted) {
          setError("Failed to load profile. Please try again.")
        }
      }
    }

    initialize()

    // Listen for wallet account changes
    const handleAccountsChanged = async () => {
      if (isMounted) {
        await loadUserData(isMounted)
      }
    }

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
    }

    // Cleanup
    return () => {
      isMounted = false
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [])

  const handleConnect = async () => {
    try {
      await connectWallet()
      await loadUserData()
    } catch (err) {
      setError("Failed to connect wallet")
    }
  }

  if (!userAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Your Profile</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">Connect your wallet to view your campaigns and contributions</p>
            <Button onClick={handleConnect} size="lg" className="bg-purple-600 hover:bg-purple-700">
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Your Profile</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Wallet: <span className="font-mono text-sm">{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</span>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600 dark:text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Campaigns Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{createdCampaigns.length}</div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Total created campaigns</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Contributed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{parseFloat(totalContributed).toFixed(2)} ETH</div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Across {contributedCampaigns.length} campaigns</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {contributedCampaigns.filter(c => c.status === 0).length}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Ongoing campaigns you support</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Created Section */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <>
            {/* Created Campaigns */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Campaigns You Created</h2>
                <Link href="/create">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </Link>
              </div>

              {createdCampaigns.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardContent className="pt-12 pb-12 text-center">
                    <p className="text-slate-600 dark:text-slate-400 mb-4">You haven't created any campaigns yet</p>
                    <Link href="/create">
                      <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                        Create Your First Campaign
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {createdCampaigns.map((campaign) => (
                    <Card key={campaign.id} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition overflow-hidden">
                      <div className="relative h-40 bg-slate-200 dark:bg-slate-700">
                        {campaign.imageUrl && campaign.imageUrl !== "" ? (
                          <Image
                            src={campaign.imageUrl}
                            alt={campaign.title}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600" />
                        )}
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${campaignStatusColors[campaign.status]}`}>
                          {campaignStatusLabels[campaign.status]}
                        </div>
                      </div>
                      <CardContent className="pt-4">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{campaign.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{campaign.description}</p>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Progress</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {((parseFloat(campaign.raisedAmount) / parseFloat(campaign.goalAmount)) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min((parseFloat(campaign.raisedAmount) / parseFloat(campaign.goalAmount)) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500">
                            <span>{parseFloat(campaign.raisedAmount).toFixed(2)} ETH</span>
                            <span>{parseFloat(campaign.goalAmount).toFixed(2)} ETH</span>
                          </div>
                        </div>

                        <Link href={`/campaign/${campaign.id}`}>
                          <Button variant="outline" className="w-full border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                            View Details
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Contributed Campaigns */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Campaigns You Support</h2>

              {contributedCampaigns.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardContent className="pt-12 pb-12 text-center">
                    <p className="text-slate-600 dark:text-slate-400 mb-4">You haven't contributed to any campaigns yet</p>
                    <Link href="/">
                      <Button className="bg-purple-600 hover:bg-purple-700">Explore Campaigns</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contributedCampaigns.map((contribution) => (
                    <Card key={contribution.campaignId} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition overflow-hidden">
                      <div className="relative h-40 bg-slate-200 dark:bg-slate-700">
                        {contribution.imageUrl && contribution.imageUrl !== "" ? (
                          <Image
                            src={contribution.imageUrl}
                            alt={contribution.title}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600" />
                        )}
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${campaignStatusColors[contribution.status]}`}>
                          {campaignStatusLabels[contribution.status]}
                        </div>
                      </div>
                      <CardContent className="pt-4">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{contribution.title}</h3>

                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Your Contribution</span>
                            <span className="font-bold text-purple-600">{parseFloat(contribution.amount).toFixed(4)} ETH</span>
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-sm mb-2">
                              <span className="text-slate-600 dark:text-slate-400">Campaign Progress</span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {((parseFloat(contribution.raisedAmount) / parseFloat(contribution.goalAmount)) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                                style={{
                                  width: `${Math.min((parseFloat(contribution.raisedAmount) / parseFloat(contribution.goalAmount)) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <Link href={`/campaign/${contribution.campaignId}`}>
                          <Button variant="outline" className="w-full border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                            View Campaign
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
