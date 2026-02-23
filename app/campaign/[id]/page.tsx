"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Users, Clock, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getContract, formatEther, parseEther, getSigner } from "@/lib/web3"
import { type Campaign, CampaignStatus, type Milestone } from "@/types/campaign"
import { useToast } from "@/hooks/use-toast"
import { marked } from "marked"
import DOMPurify from "dompurify"
import { format as timeagoFormat } from "timeago.js"

export default function CampaignDetailPage() {
  const params = useParams()
  const campaignId = params.id as string
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [userContribution, setUserContribution] = useState("0")
  const [userAddress, setUserAddress] = useState("")
  const [contributionAmount, setContributionAmount] = useState("")
  const [loading, setLoading] = useState(true)
  const [contributing, setContributing] = useState(false)
  const [comments, setComments] = useState<Array<{id: string; author: string; text: string; createdAt: number}>>([])
  const [newComment, setNewComment] = useState("")
  const [polls, setPolls] = useState<
    Array<{
      id: string
      question: string
      options: Array<{ id: string; text: string; votes: number }>
      createdBy: string
      createdAt: number
      voters: string[]
    }>
  >([])
  const [pollQuestion, setPollQuestion] = useState("")
  const [pollOptionsText, setPollOptionsText] = useState("")
  const [proofs, setProofs] = useState<Array<{id: string; url: string; caption: string; uploader: string; createdAt: number}>>([])
  const { toast } = useToast()

  useEffect(() => {
    if (campaignId) {
      loadCampaignData()
      getUserAddress()
      loadCommunityData()
    }
  }, [campaignId])

  const storageKey = (suffix: string) => `campaign:${campaignId}:community:${suffix}`

  const loadCommunityData = async () => {
    try {
      // Try server first
      const res = await fetch(`/api/campaign/${campaignId}/community`)
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setComments(json.data.comments || [])
          setPolls(json.data.polls || [])
          setProofs(json.data.proofs || [])
          return
        }
      }

      // Fallback to localStorage if server unavailable
      const c = localStorage.getItem(storageKey("comments"))
      const p = localStorage.getItem(storageKey("polls"))
      const pr = localStorage.getItem(storageKey("proofs"))
      if (c) setComments(JSON.parse(c))
      if (p) setPolls(JSON.parse(p))
      if (pr) setProofs(JSON.parse(pr))
    } catch (e) {
      console.error("Failed to load community data:", e)
    }
  }

  const saveComments = (next: typeof comments) => {
    setComments(next)
    try {
      localStorage.setItem(storageKey("comments"), JSON.stringify(next))
    } catch (e) {
      console.error("Failed to save comments:", e)
    }
  }

  const savePolls = (next: typeof polls) => {
    setPolls(next)
    try {
      localStorage.setItem(storageKey("polls"), JSON.stringify(next))
    } catch (e) {
      console.error("Failed to save polls:", e)
    }
  }

  const saveProofs = (next: typeof proofs) => {
    setProofs(next)
    try {
      localStorage.setItem(storageKey("proofs"), JSON.stringify(next))
    } catch (e) {
      console.error("Failed to save proofs:", e)
    }
  }

  const isCreator = () => {
    if (!campaign || !userAddress) return false
    return campaign.creator.toLowerCase() === userAddress.toLowerCase()
  }

  const addComment = async () => {
    if (!newComment || newComment.trim().length === 0) return
    const author = userAddress || "anonymous"
    const body = { type: "comment", author, text: newComment.trim() }
    try {
      const res = await fetch(`/api/campaign/${campaignId}/community`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          const next = [json.comment, ...comments]
          saveComments(next)
          setNewComment("")
          toast({ title: "Comment added" })
          return
        }
      }
    } catch (e) {
      console.error("addComment error", e)
    }

    // Fallback locally
    const entry = { id: `${Date.now()}-${Math.random()}`, author, text: newComment.trim(), createdAt: Date.now() }
    const next = [entry, ...comments]
    saveComments(next)
    setNewComment("")
    toast({ title: "Comment added (local)" })
  }

  const createPoll = async () => {
    if (!pollQuestion || pollQuestion.trim().length === 0) return
    const opts = pollOptionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6)
    if (opts.length < 2) {
      toast({ title: "Error", description: "Provide at least two options", variant: "destructive" })
      return
    }
    const body = { type: "poll", question: pollQuestion.trim(), options: opts, createdBy: userAddress || "anonymous" }
    try {
      const res = await fetch(`/api/campaign/${campaignId}/community`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          const next = [json.poll, ...polls]
          savePolls(next)
          setPollQuestion("")
          setPollOptionsText("")
          toast({ title: "Poll created" })
          return
        }
      }
    } catch (e) {
      console.error("createPoll error", e)
    }

    // fallback local
    const poll = {
      id: `${Date.now()}-${Math.random()}`,
      question: pollQuestion.trim(),
      options: opts.map((o, i) => ({ id: `opt-${i}`, text: o, votes: 0 })),
      createdBy: userAddress || "anonymous",
      createdAt: Date.now(),
      voters: [],
    }
    const next = [poll, ...polls]
    savePolls(next)
    setPollQuestion("")
    setPollOptionsText("")
    toast({ title: "Poll created (local)" })
  }

  const votePoll = async (pollId: string, optionId: string) => {
    const voter = userAddress || localStorage.getItem(`campaign:${campaignId}:anonVoterId`) || `anon-${Math.random()}`
    if (!userAddress) localStorage.setItem(`campaign:${campaignId}:anonVoterId`, voter)
    try {
      const res = await fetch(`/api/campaign/${campaignId}/community`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vote", pollId, optionId, voter }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          savePolls(json.polls)
          toast({ title: "Vote recorded" })
          return
        }
      }
    } catch (e) {
      console.error("votePoll error", e)
    }

    // fallback local update
    const next = polls.map((pl) => {
      if (pl.id !== pollId) return pl
      if (pl.voters.includes(voter)) return pl
      return {
        ...pl,
        options: pl.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)),
        voters: [...pl.voters, voter],
      }
    })
    savePolls(next)
    toast({ title: "Vote recorded (local)" })
  }

  const uploadProof = async (file: File, caption: string) => {
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("caption", caption)
      form.append("uploader", userAddress || "anonymous")

      const res = await fetch(`/api/campaign/${campaignId}/community`, { method: "POST", body: form })
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          const next = [json.proof, ...proofs]
          saveProofs(next)
          toast({ title: "Proof uploaded" })
          return
        }
      }
    } catch (e) {
      console.error("uploadProof error", e)
    }

    // fallback to local encoder
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result)
      const entry = { id: `${Date.now()}-${Math.random()}`, url, caption, uploader: userAddress || "anonymous", createdAt: Date.now() }
      const next = [entry, ...proofs]
      saveProofs(next)
      toast({ title: "Proof uploaded (local)" })
    }
    reader.readAsDataURL(file)
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

  const loadCampaignData = async () => {
    try {
      const contract = await getContract()
      if (contract) {
        // Load campaign details
        const details = await contract.getCampaignDetails(campaignId)
        const campaignData: Campaign = {
          id: Number(campaignId),
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
        }
        setCampaign(campaignData)

        // Load user contribution if connected
        const signer = await getSigner()
        if (signer) {
          const address = await signer.getAddress()
          const contribution = await contract.getUserContribution(campaignId, address)
          setUserContribution(formatEther(contribution.toString()))
        }
      }
    } catch (error) {
      console.error("Error loading campaign data:", error)
      toast({
        title: "Error",
        description: "Failed to load campaign data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleContribute = async () => {
    if (!contributionAmount || Number.parseFloat(contributionAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid contribution amount",
        variant: "destructive",
      })
      return
    }

    setContributing(true)
    try {
      const contract = await getContract()
      if (!contract) {
        throw new Error("Please connect your wallet first")
      }

      const tx = await contract.contribute(campaignId, {
        value: parseEther(contributionAmount),
      })

      await tx.wait()

      toast({
        title: "Success!",
        description: "Your contribution has been recorded",
      })

      // Reload campaign data
      await loadCampaignData()
      setContributionAmount("")
    } catch (error: any) {
      console.error("Error contributing:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to contribute",
        variant: "destructive",
      })
    } finally {
      setContributing(false)
    }
  }

  const handleRefund = async () => {
    try {
      const contract = await getContract()
      if (!contract) {
        throw new Error("Please connect your wallet first")
      }

      const tx = await contract.requestRefund(campaignId)
      await tx.wait()

      toast({
        title: "Success!",
        description: "Your refund has been processed",
      })

      await loadCampaignData()
    } catch (error: any) {
      console.error("Error requesting refund:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to request refund",
        variant: "destructive",
      })
    }
  }

  const getProgressPercentage = () => {
    if (!campaign) return 0
    const raised = Number.parseFloat(campaign.raisedAmount)
    const goal = Number.parseFloat(campaign.goalAmount)
    return goal > 0 ? Math.min((raised / goal) * 100, 100) : 0
  }

  const formatTimeLeft = (deadline: number) => {
    const now = Math.floor(Date.now() / 1000)
    const timeLeft = deadline - now

    if (timeLeft <= 0) return "Campaign Ended"

    const days = Math.floor(timeLeft / 86400)
    const hours = Math.floor((timeLeft % 86400) / 3600)
    const minutes = Math.floor((timeLeft % 3600) / 60)

    if (days > 0) return `${days} days, ${hours} hours left`
    if (hours > 0) return `${hours} hours, ${minutes} minutes left`
    return `${minutes} minutes left`
  }

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.Active:
        return <Badge className="bg-green-500">Active</Badge>
      case CampaignStatus.Successful:
        return <Badge className="bg-blue-500">Successful</Badge>
      case CampaignStatus.Failed:
        return <Badge variant="destructive">Failed</Badge>
      case CampaignStatus.Cancelled:
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h1>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
        </div>

        {/* Campaign Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{campaign.title}</h1>
            {getStatusBadge(campaign.status)}
            {campaign.isPremium && <Badge className="bg-yellow-500">Premium</Badge>}
          </div>

          <div className="h-64 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-2xl font-bold mb-2">{campaign.title}</h2>
                <p className="text-lg opacity-90">Blockchain-Powered Crowdfunding</p>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Funding Progress</span>
                      <span>{getProgressPercentage().toFixed(1)}%</span>
                    </div>
                    <Progress value={getProgressPercentage()} className="h-3" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{campaign.raisedAmount} ETH</p>
                      <p className="text-gray-600">raised of {campaign.goalAmount} ETH goal</p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-2xl font-bold">{campaign.contributorCount}</span>
                  </div>
                  <p className="text-gray-600">Contributors</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-gray-500 mr-2" />
                  </div>
                  <p className="font-semibold">{formatTimeLeft(campaign.deadline)}</p>
                  <p className="text-gray-600 text-sm">
                    Ends {new Date(campaign.deadline * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="community">Community</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{campaign.description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Creator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {campaign.creator.slice(2, 4).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{campaign.creator}</p>
                        <p className="text-sm text-gray-600">Campaign Creator</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="updates">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Updates</CardTitle>
                    <CardDescription>Latest news and updates from the campaign creator</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">No updates available yet.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="milestones">
                <Card>
                  <CardHeader>
                    <CardTitle>Funding Milestones</CardTitle>
                    <CardDescription>Milestone-based fund releases for transparency</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {campaign.status === CampaignStatus.Successful ? (
                      <p className="text-gray-600">
                        Milestones will be available once the campaign creator sets them up.
                      </p>
                    ) : (
                      <p className="text-gray-600">
                        Milestones will be available after the campaign reaches its funding goal.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="community">
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>Community Discussion</CardTitle>
                    <CardDescription>Comments, polls, and creator proof uploads</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>New Comment</Label>
                        <div className="flex items-start gap-2 mt-2">
                          <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a supportive message or question..." />
                          <Button onClick={addComment} className="whitespace-nowrap">Comment</Button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Recent Comments</h4>
                        {comments.length === 0 ? (
                          <p className="text-gray-600">No comments yet — be the first to engage.</p>
                        ) : (
                          <div className="space-y-3">
                            {comments.map((c) => (
                              <div key={c.id} className="p-3 bg-gray-50 rounded">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-full bg-slate-700 text-white flex items-center justify-center font-medium">
                                      {String(c.author || "anon").slice(2, 6).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{c.author}</p>
                                      <div className="text-sm text-gray-700 mt-1" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(c.text || "")) }} />
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500">{timeagoFormat(c.createdAt)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>Polls</CardTitle>
                    <CardDescription>Create or vote on polls</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isCreator() && (
                      <div className="mb-4">
                        <Label>Poll Question</Label>
                        <Input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Example: Which feature should we prioritize?" />
                        <Label className="mt-2">Options (one per line, max 6)</Label>
                        <textarea value={pollOptionsText} onChange={(e) => setPollOptionsText(e.target.value)} className="w-full rounded border p-2 mt-1" rows={4} />
                        <div className="mt-2">
                          <Button onClick={createPoll}>Create Poll</Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {polls.length === 0 && <p className="text-gray-600">No polls yet.</p>}
                      {polls.map((pl) => (
                        <div key={pl.id} className="p-3 bg-gray-50 rounded">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-semibold">{pl.question}</p>
                              <p className="text-xs text-gray-500">by {pl.createdBy}</p>
                            </div>
                            <div className="text-xs text-gray-500">{timeagoFormat(pl.createdAt)}</div>
                          </div>
                          <div className="mt-2 space-y-2">
                            {pl.options.map((o) => (
                              <div key={o.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Button size="sm" onClick={() => votePoll(pl.id, o.id)} disabled={pl.voters.includes(userAddress || localStorage.getItem(`campaign:${campaignId}:anonVoterId`) || "")}>
                                    Vote
                                  </Button>
                                  <div>{o.text}</div>
                                </div>
                                <div className="text-sm text-gray-600">{o.votes} votes</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Creator Proofs</CardTitle>
                    <CardDescription>Creators can upload image proof of fund use</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isCreator() && (
                      <div className="mb-4">
                        <Label>Upload Proof Image</Label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (!f) return
                            const cap = prompt("Caption for this proof image (optional)") || ""
                            uploadProof(f, cap)
                            e.currentTarget.value = ""
                          }}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {proofs.length === 0 && <p className="text-gray-600">No proof images yet.</p>}
                      {proofs.map((pr) => (
                        <div key={pr.id} className="border rounded overflow-hidden">
                          <img src={pr.url} alt={pr.caption} className="w-full h-48 object-cover" />
                          <div className="p-2">
                            <p className="text-sm font-medium">{pr.caption}</p>
                            <p className="text-xs text-gray-500">Uploaded by {pr.uploader} · {timeagoFormat(pr.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contribution Card */}
            <Card>
              <CardHeader>
                <CardTitle>Support This Campaign</CardTitle>
                <CardDescription>
                  {campaign.status === CampaignStatus.Active
                    ? "Contribute to help reach the funding goal"
                    : "This campaign is no longer accepting contributions"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaign.status === CampaignStatus.Active && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="contribution">Contribution Amount (ETH)</Label>
                      <Input
                        id="contribution"
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="0.1"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleContribute} className="w-full" disabled={contributing || !userAddress}>
                      {contributing ? "Contributing..." : "Contribute Now"}
                    </Button>
                  </>
                )}

                {Number.parseFloat(userContribution) > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Your contribution:</strong> {userContribution} ETH
                    </p>
                    {(campaign.status === CampaignStatus.Failed ||
                      (campaign.status === CampaignStatus.Active &&
                        Date.now() / 1000 > campaign.deadline &&
                        Number.parseFloat(campaign.raisedAmount) < Number.parseFloat(campaign.goalAmount))) && (
                      <Button onClick={handleRefund} variant="outline" size="sm" className="mt-2 w-full bg-transparent">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Request Refund
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campaign Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Goal Amount:</span>
                  <span className="font-semibold">{campaign.goalAmount} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Raised Amount:</span>
                  <span className="font-semibold">{campaign.raisedAmount} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contributors:</span>
                  <span className="font-semibold">{campaign.contributorCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee:</span>
                  <span className="font-semibold">2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-semibold">
                    {new Date(campaign.deadline * 1000 - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
