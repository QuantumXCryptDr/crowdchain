import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"
import { initDb, getCommunity, saveCommunity } from "@/lib/server/db"
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/web3"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CommunityRouteContext = {
  params: Promise<{ id?: string | string[] }>
}

const WEB3_TOKEN = process.env.WEB3_STORAGE_TOKEN || ""
const RPC_URL =
  process.env.SEPOLIA_URL ||
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com"

const getAnonymousId = (req: NextRequest) => {
  const forwardedFor = req.headers.get("x-forwarded-for") || "unknown-ip"
  const userAgent = req.headers.get("user-agent") || "unknown-agent"
  return createHash("sha256").update(`${forwardedFor}:${userAgent}`).digest("hex").slice(0, 16)
}

const getReadOnlyContract = () => {
  if (!CONTRACT_ADDRESS) return null
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, new ethers.JsonRpcProvider(RPC_URL))
}

const resolveIdentity = (req: NextRequest, walletAddress?: string | null, signature?: string | null, message?: string | null) => {
  if (walletAddress && signature && message) {
    const recovered = ethers.verifyMessage(message, signature)
    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error("Wallet signature did not match the submitted address")
    }
    return { id: walletAddress.toLowerCase(), label: walletAddress }
  }

  const anonymousId = getAnonymousId(req)
  return { id: `anon:${anonymousId}`, label: `anon:${anonymousId}` }
}

const assertCreator = async (campaignId: string, walletAddress?: string | null) => {
  if (!walletAddress) {
    throw new Error("Creator actions require a signed wallet")
  }

  const contract = getReadOnlyContract()
  if (!contract) {
    throw new Error("Contract is not configured")
  }

  const [, creator] = await contract.getCampaignDetails(campaignId)
  if (String(creator).toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error("Only the on-chain campaign creator can perform this action")
  }
}

const getCampaignId = async (context: CommunityRouteContext) => {
  const id = (await context.params).id
  return Array.isArray(id) ? id[0] : id
}

export async function GET(req: NextRequest, context: CommunityRouteContext) {
  try {
    void req
    await initDb()
    const campaignId = await getCampaignId(context)
    if (!campaignId) {
      return new NextResponse(null, { status: 204 })
    }
    const data = await getCommunity(campaignId)
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error("GET community error", e)
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: CommunityRouteContext) {
  try {
    await initDb()
    const campaignId = await getCampaignId(context)
    if (!campaignId) {
      return NextResponse.json({ success: false, message: "Campaign id is required" }, { status: 400 })
    }
    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      const file = form.get("file") as File | null
      const caption = (form.get("caption") as string) || ""
      const walletAddress = (form.get("walletAddress") as string) || ""
      const signature = (form.get("signature") as string) || ""
      const message = (form.get("message") as string) || ""

      if (!file) return NextResponse.json({ success: false, message: "File required" }, { status: 400 })
      const identity = resolveIdentity(req, walletAddress, signature, message)
      await assertCreator(campaignId, walletAddress)

      if (!WEB3_TOKEN) {
        return NextResponse.json({ success: false, message: "WEB3_STORAGE_TOKEN not configured" }, { status: 500 })
      }

      // Robust upload via Web3.Storage HTTP API to avoid File/Blob runtime issues
      const filename = (file as any).name || `proof-${Date.now()}.png`
      const buffer = await file.arrayBuffer()

      const uploadRes = await fetch("https://api.web3.storage/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WEB3_TOKEN}`,
          "Content-Type": "application/octet-stream",
          "X-NAME": filename,
        },
        body: Buffer.from(buffer),
      })

      const uploadJson = await uploadRes.json().catch(() => ({}))
      if (!uploadRes.ok) {
        console.error("Web3.Storage upload failed", uploadJson)
        return NextResponse.json({ success: false, message: uploadJson?.message || "upload failed" }, { status: 500 })
      }
      const cid = uploadJson.cid
      const url = `https://${cid}.ipfs.dweb.link/${encodeURIComponent(filename)}`

      const community = await getCommunity(campaignId)
      const entry = { id: `${Date.now()}-${Math.random()}`, url, caption, uploader: identity.label, createdAt: Date.now() }
      const nextProofs = [entry, ...community.proofs]
      await saveCommunity(campaignId, { proofs: nextProofs })
      return NextResponse.json({ success: true, proof: entry })
    }

    const body = await req.json()
    const { type, walletAddress, signature, message } = body
    const identity = resolveIdentity(req, walletAddress, signature, message)
    const community = await getCommunity(campaignId)

    if (type === "comment") {
      const entry = { id: `${Date.now()}-${Math.random()}`, author: identity.label, text: body.text || "", createdAt: Date.now() }
      const next = [entry, ...community.comments]
      await saveCommunity(campaignId, { comments: next })
      return NextResponse.json({ success: true, comment: entry })
    }

    if (type === "poll") {
      await assertCreator(campaignId, walletAddress)
      const poll = {
        id: `${Date.now()}-${Math.random()}`,
        question: body.question,
        options: (body.options || []).map((o: string, i: number) => ({ id: `opt-${i}`, text: o, votes: 0 })),
        createdBy: identity.label,
        createdAt: Date.now(),
        voters: [],
      }
      const next = [poll, ...community.polls]
      await saveCommunity(campaignId, { polls: next })
      return NextResponse.json({ success: true, poll })
    }

    if (type === "vote") {
      const { pollId, optionId } = body
      const nextPolls = community.polls.map((pl: any) => {
        if (pl.id !== pollId) return pl
        if (pl.voters?.includes(identity.id)) return pl
        return {
          ...pl,
          options: pl.options.map((o: any) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)),
          voters: [...(pl.voters || []), identity.id],
        }
      })
      await saveCommunity(campaignId, { polls: nextPolls })
      return NextResponse.json({ success: true, polls: nextPolls })
    }

    return NextResponse.json({ success: false, message: "Unknown type" }, { status: 400 })
  } catch (e: any) {
    console.error("POST community error", e)
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 })
  }
}
