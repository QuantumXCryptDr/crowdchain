"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getContract, getReadOnlyContract, formatEther, getSigner, connectWallet, isWalletConnected } from "@/lib/web3"
import { CampaignStatus } from "@/types/campaign"
import { useToast } from "@/hooks/use-toast"
import { getSession } from "next-auth/react"

interface SuccessfulCampaign {
  id: number
  title: string
  goalAmount: string
  raisedAmount: string
  creator: string
  status: CampaignStatus
  isPremium: boolean
  releasedAmount: string
  remainingAmount: string
  platformFee: string
  withdrawableAmount: string
}

export default function CreatorWithdrawalPortal() {
  const [campaigns, setCampaigns] = useState<SuccessfulCampaign[]>([])
  const [userAddress, setUserAddress] = useState("")
  const [selectedCampaign, setSelectedCampaign] = useState<SuccessfulCampaign | null>(null)
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (selectedCampaign) {
      setWithdrawAddress(userAddress)
    }
  }, [selectedCampaign?.id, userAddress])

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      try {
        const connected = await isWalletConnected()
        if (isMounted) {
          setIsConnected(connected)
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error)
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

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        await loadSuccessfulCampaigns()
        await getUserAddress()
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (isConnected) {
      loadData()
    }

    return () => {
      isMounted = false
    }
  }, [isConnected])

  const handleConnectWallet = async () => {
    const session = await getSession()
    if (!session) {
      router.push("/signup")
      return
    }

    const connected = await connectWallet()
    setIsConnected(connected)
    if (connected) {
      toast({
        title: "Success!",
        description: "Wallet connected successfully",
      })
    }
  }

  const getUserAddress = async () => {
    try {
      const signer = await getSigner()
      if (signer) {
        const address = await signer.getAddress()
        setUserAddress(address)
      }
    } catch (error) {
      console.error("Error getting user address:", error)
    }
  }

  const loadSuccessfulCampaigns = async () => {
    try {
      if (typeof window === "undefined") {
        setLoading(false)
        return
      }

      const contract = getReadOnlyContract()
      if (!contract) {
        setCampaigns([])
        setLoading(false)
        return
      }

      const signer = await getSigner()
      if (!signer) {
        setCampaigns([])
        setLoading(false)
        return
      }

      const userAddr = await signer.getAddress()
      const campaignCount = await contract.campaignCounter()

      const campaignPromises = []
      for (let i = 1; i <= Number(campaignCount); i++) {
        campaignPromises.push(contract.getCampaignDetails(i))
      }

      const campaignDetails = await Promise.all(campaignPromises)

      const successfulCampaigns = (
        await Promise.all(
          campaignDetails.map(async (details: any, index: number) => {
            const status = Number(details[8]) as CampaignStatus
            const breakdown = await contract.getCampaignWithdrawalBreakdown(index + 1)

            return {
              id: index + 1,
              title: details[2],
              goalAmount: formatEther(details[5].toString()),
              raisedAmount: formatEther(details[6].toString()),
              creator: details[1],
              status,
              isPremium: details[9],
              releasedAmount: formatEther(breakdown[0].toString()),
              remainingAmount: formatEther(breakdown[1].toString()),
              platformFee: formatEther(breakdown[2].toString()),
              withdrawableAmount: formatEther(breakdown[3].toString()),
              canWithdraw: Boolean(breakdown[4]),
            }
          })
        )
      ).filter(
        (campaign) =>
          campaign.creator.toLowerCase() === userAddr.toLowerCase() &&
          campaign.status === CampaignStatus.Successful &&
          campaign.canWithdraw
      )

      setCampaigns(successfulCampaigns as SuccessfulCampaign[])
      setLoading(false)
    } catch (error) {
      console.error("Error loading campaigns:", error)
      setCampaigns([])
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!selectedCampaign) {
      toast({
        title: "Error",
        description: "Please select a campaign",
        variant: "destructive",
      })
      return
    }

    if (!withdrawAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter the ETH address that should receive the payout",
        variant: "destructive",
      })
      return
    }

    if (!ethers.isAddress(withdrawAddress.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

    setWithdrawing(true)

    try {
      const contract = await getContract()
      if (!contract) {
        throw new Error("Contract not available")
      }

      const tx = await contract.withdrawCampaignFunds(selectedCampaign.id, withdrawAddress.trim())
      
      toast({
        title: "Processing",
        description: "Your withdrawal is being processed on-chain...",
      })

      await tx.wait()

      toast({
        title: "Success!",
        description: `Sent ${selectedCampaign.withdrawableAmount} ETH to ${withdrawAddress.trim()} after automatically routing the ${selectedCampaign.platformFee} ETH platform fee to the owner wallet.`,
      })

      setSelectedCampaign(null)
      setWithdrawAddress(userAddress)
      
      // Reload campaigns
      await loadSuccessfulCampaigns()
    } catch (error: any) {
      console.error("Withdrawal error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      })
    } finally {
      setWithdrawing(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen web3-shell-soft">
        <header className="web3-soft-card sticky top-0 z-50 rounded-b-3xl mx-4 mt-4">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Withdrawal Dashboard</h1>
            <Link href="/">
              <Button variant="ghost" className="web3-outline-soft">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="web3-soft-card">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                You need to connect your wallet to access the withdrawal dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleConnectWallet} className="w-full web3-button">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen web3-shell">
      <header className="web3-header sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="mb-0 web3-accent-text hover:text-cyan-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Creator Withdrawal Portal</h1>
          <Badge variant="outline" className="web3-outline">
            {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <Card className="web3-soft-card">
            <CardContent className="py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Loading your successful campaigns...</p>
              </div>
            </CardContent>
          </Card>
        ) : campaigns.length === 0 ? (
          <Card className="web3-soft-card">
            <CardContent className="py-8">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">You don't have any successful campaigns with withdrawable funds yet</p>
                <Link href="/create">
                  <Button className="mt-4 web3-button">Create a Campaign</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Campaign List */}
            <div className="lg:col-span-2">
              <Card className="web3-soft-card">
                <CardHeader>
                  <CardTitle>Your Successful Campaigns</CardTitle>
                  <CardDescription>
                    Select a campaign to initiate withdrawal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign)}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        selectedCampaign?.id === campaign.id
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-slate-200/70 hover:border-cyan-200 dark:border-slate-700 dark:hover:border-cyan-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                              <p className="text-gray-500">Goal</p>
                              <p className="font-semibold">{campaign.goalAmount} ETH</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Available Now</p>
                              <p className="font-semibold text-emerald-600 dark:text-emerald-300">{campaign.withdrawableAmount} ETH</p>
                            </div>
                          </div>
                          <p className="mt-3 text-xs text-gray-500">
                            Gross remaining: {campaign.remainingAmount} ETH · Fee: {campaign.platformFee} ETH
                          </p>
                        </div>
                        {campaign.isPremium && (
                          <Badge className="bg-yellow-100 text-yellow-800">Premium</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Withdrawal Form */}
            <div>
              <Card className="web3-soft-card">
                <CardHeader>
                  <CardTitle>Withdraw Funds</CardTitle>
                  <CardDescription>
                    Choose where the payout should be sent
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCampaign ? (
                    <>
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          Campaign selected: {selectedCampaign.title}
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label>Creator Payout</Label>
                        <div className="p-3 bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900 rounded-lg">
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                            {selectedCampaign.withdrawableAmount} ETH
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Net amount after the automatic 2% platform fee
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="withdrawAddress">Recipient ETH Address</Label>
                        <Input
                          id="withdrawAddress"
                          value={withdrawAddress}
                          onChange={(event) => setWithdrawAddress(event.target.value)}
                          placeholder="0x..."
                          autoComplete="off"
                        />
                        <p className="text-xs text-gray-500">
                          This address will receive the creator payout in the same transaction.
                        </p>
                      </div>

                      <Alert className="bg-cyan-50 border-cyan-200 dark:bg-cyan-950/20 dark:border-cyan-900">
                        <AlertCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                        <AlertDescription className="text-cyan-900 dark:text-cyan-100">
                          {selectedCampaign.remainingAmount} ETH is still in the contract for this campaign. The platform fee of {selectedCampaign.platformFee} ETH will be sent straight to the owner wallet, and the remaining {selectedCampaign.withdrawableAmount} ETH will be sent to the address above.
                        </AlertDescription>
                      </Alert>

                      <Button
                        onClick={handleWithdraw}
                        disabled={withdrawing}
                        className="w-full web3-button"
                      >
                        {withdrawing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Withdraw Funds"
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Select a campaign to continue</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
