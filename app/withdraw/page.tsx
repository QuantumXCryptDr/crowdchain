"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getContract, formatEther, getSigner, connectWallet, isWalletConnected } from "@/lib/web3"
import { CampaignStatus } from "@/types/campaign"
import { useToast } from "@/hooks/use-toast"

interface SuccessfulCampaign {
  id: number
  title: string
  goalAmount: string
  raisedAmount: string
  creator: string
  isPremium: boolean
  platformFee: string
  withdrawableAmount: string
}

export default function WithdrawalDashboard() {
  const [campaigns, setCampaigns] = useState<SuccessfulCampaign[]>([])
  const [userAddress, setUserAddress] = useState("")
  const [selectedCampaign, setSelectedCampaign] = useState<SuccessfulCampaign | null>(null)
  const [withdrawalAddress, setWithdrawalAddress] = useState("")
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    checkWalletConnection()
  }, [])

  useEffect(() => {
    if (isConnected) {
      loadSuccessfulCampaigns()
      getUserAddress()
    }
  }, [isConnected])

  const checkWalletConnection = async () => {
    if (typeof window === "undefined") return

    const connected = await isWalletConnected()
    setIsConnected(connected)

    if (!connected) {
      setLoading(false)
    }
  }

  const handleConnectWallet = async () => {
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
        setWithdrawalAddress(address)
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

      const contract = await getContract()
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
      const platformFeePercent = await contract.platformFeePercent()

      const campaignPromises = []
      for (let i = 1; i <= Number(campaignCount); i++) {
        campaignPromises.push(contract.getCampaignDetails(i))
      }

      const campaignDetails = await Promise.all(campaignPromises)

      const successfulCampaigns = campaignDetails
        .map((details, index) => {
          const raised = parseFloat(formatEther(details[6].toString()))
          const fee = (raised * Number(platformFeePercent)) / 100
          const withdrawable = raised - fee

          return {
            id: index + 1,
            title: details[2],
            goalAmount: formatEther(details[5].toString()),
            raisedAmount: formatEther(details[6].toString()),
            creator: details[1],
            isPremium: details[9],
            status: details[8],
            platformFee: fee.toFixed(4),
            withdrawableAmount: withdrawable.toFixed(4),
          }
        })
        .filter((c) => c.creator.toLowerCase() === userAddr.toLowerCase() && c.status === CampaignStatus.Successful)

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

    if (!withdrawalAddress) {
      toast({
        title: "Error",
        description: "Please enter a withdrawal address",
        variant: "destructive",
      })
      return
    }

    // Validate Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(withdrawalAddress)) {
      toast({
        title: "Error",
        description: "Invalid Ethereum address format",
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

      // Call releaseMilestoneFunds for the campaign
      const tx = await contract.releaseMilestoneFunds(selectedCampaign.id, 0)
      
      toast({
        title: "Processing",
        description: "Your withdrawal is being processed...",
      })

      await tx.wait()

      toast({
        title: "Success!",
        description: `Withdrawn ${selectedCampaign.withdrawableAmount} ETH from campaign "${selectedCampaign.title}"`,
      })

      setSelectedCampaign(null)
      setWithdrawalAddress("")
      
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Withdrawal Dashboard</h1>
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                You need to connect your wallet to access the withdrawal dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleConnectWallet} className="w-full">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="mb-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Withdrawal Dashboard</h1>
          <Badge variant="outline" className="bg-green-50">
            {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Loading your successful campaigns...</p>
              </div>
            </CardContent>
          </Card>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">You don't have any successful campaigns yet</p>
                <Link href="/create">
                  <Button className="mt-4">Create a Campaign</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Campaign List */}
            <div className="lg:col-span-2">
              <Card>
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
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
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
                              <p className="text-gray-500">Raised</p>
                              <p className="font-semibold text-green-600">{campaign.raisedAmount} ETH</p>
                            </div>
                          </div>
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
              <Card>
                <CardHeader>
                  <CardTitle>Withdraw Funds</CardTitle>
                  <CardDescription>
                    Complete the withdrawal process
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
                        <Label>Withdrawable Amount</Label>
                        <div className="p-3 bg-gray-50 border rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            {selectedCampaign.withdrawableAmount} ETH
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            After {selectedCampaign.platformFee} ETH platform fee
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="withdrawAddress">Withdrawal Address</Label>
                        <Input
                          id="withdrawAddress"
                          placeholder="0x..."
                          value={withdrawalAddress}
                          onChange={(e) => setWithdrawalAddress(e.target.value)}
                          className="font-mono"
                        />
                        <p className="text-xs text-gray-500">
                          Make sure this is a valid Ethereum address
                        </p>
                      </div>

                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-900">
                          Funds will be transferred to the specified address after approval
                        </AlertDescription>
                      </Alert>

                      <Button
                        onClick={handleWithdraw}
                        disabled={withdrawing}
                        className="w-full bg-green-600 hover:bg-green-700"
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
