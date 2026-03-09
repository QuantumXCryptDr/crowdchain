"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getContract, parseEther } from "@/lib/web3"
import { useToast } from "@/hooks/use-toast"
import { connectWallet, isWalletConnected } from "@/lib/web3"

export default function CreateCampaignPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    goalAmount: "",
    deadline: undefined as Date | undefined,
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [isConnected, setIsConnected] = useState(false)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)

  useEffect(() => {
    checkWalletConnection()
  }, [])

  const checkWalletConnection = async () => {
    setIsCheckingConnection(true)
    try {
      const connected = await isWalletConnected()
      setIsConnected(connected)
    } catch (error) {
      console.error("Error checking wallet connection:", error)
      setIsConnected(false)
    } finally {
      setIsCheckingConnection(false)
    }
  }

  const handleConnectWallet = async () => {
    try {
      const connected = await connectWallet()
      setIsConnected(connected)
      if (connected) {
        toast({
          title: "Success!",
          description: "Wallet connected successfully",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check wallet connection first
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (!formData.title || !formData.description || !formData.goalAmount || !formData.deadline) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Additional validations
    if (formData.title.length > 200) {
      toast({
        title: "Error",
        description: "Title must be less than 200 characters",
        variant: "destructive",
      })
      return
    }

    if (formData.description.length > 5000) {
      toast({
        title: "Error",
        description: "Description must be less than 5000 characters",
        variant: "destructive",
      })
      return
    }

    const goalAmount = parseFloat(formData.goalAmount)
    if (isNaN(goalAmount) || goalAmount <= 0) {
      toast({
        title: "Error",
        description: "Goal amount must be a positive number",
        variant: "destructive",
      })
      return
    }

    const deadlineTime = formData.deadline.getTime()
    const now = new Date().getTime()
    const minDeadlineMs = 24 * 60 * 60 * 1000 // 24 hours

    if (deadlineTime - now < minDeadlineMs) {
      toast({
        title: "Error",
        description: "Deadline must be at least 24 hours in the future",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const contract = await getContract()
      if (!contract) {
        throw new Error("Failed to get contract instance")
      }

      const goalAmountWei = parseEther(formData.goalAmount)
      const deadlineTimestamp = Math.floor(formData.deadline.getTime() / 1000)

      const tx = await contract.createCampaign(
        formData.title,
        formData.description,
        formData.imageUrl || `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(formData.title)}`,
        goalAmountWei,
        deadlineTimestamp,
      )

      await tx.wait()

      toast({
        title: "Success!",
        description: "Your campaign has been created successfully",
      })

      router.push("/")
    } catch (error: any) {
      console.error("Error creating campaign:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-purple-400 hover:text-purple-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Create New Campaign</h1>
          <p className="text-purple-300 mt-2">Launch your crowdfunding campaign on the blockchain</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Fill in the information about your campaign. All fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isConnected && (
                <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-yellow-300">Wallet Not Connected</h3>
                      <p className="text-sm text-yellow-200">You need to connect your wallet to create a campaign</p>
                    </div>
                    <Button onClick={handleConnectWallet} disabled={isCheckingConnection} className="bg-purple-600 hover:bg-purple-700">
                      {isCheckingConnection ? "Checking..." : "Connect Wallet"}
                    </Button>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Campaign Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter a compelling title for your campaign"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your campaign, what you're raising funds for, and how the money will be used..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Add an image to make your campaign more appealing. If left empty, a placeholder will be generated.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goalAmount">Funding Goal (ETH) *</Label>
                  <Input
                    id="goalAmount"
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="1.0"
                    value={formData.goalAmount}
                    onChange={(e) => handleInputChange("goalAmount", e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Set a realistic funding goal in ETH. Remember, contributors can see this amount.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Campaign Deadline *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.deadline ? format(formData.deadline, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.deadline}
                        onSelect={(date) => setFormData((prev) => ({ ...prev, deadline: date }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-sm text-gray-500">
                    Choose when your campaign should end. Contributors can request refunds if the goal isn't met by this
                    date.
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Platform Information</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Platform fee: 2% of funds raised (only charged on successful campaigns)</li>
                    <li>• Milestone-based fund release available after campaign success</li>
                    <li>• Contributors can vote on milestone approvals</li>
                    <li>• Automatic refunds available if campaign fails to meet goal</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" disabled={loading || !isConnected}>
                  {loading ? "Creating Campaign..." : !isConnected ? "Connect Wallet First" : "Create Campaign"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
