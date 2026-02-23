import { NextResponse } from "next/server"
import { initDb, getCommunity, saveCommunity } from "@/lib/server/db2"

initDb()

const WEB3_TOKEN = process.env.WEB3_STORAGE_TOKEN || ""

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id
    const data = await getCommunity(campaignId)
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error("GET community error", e)
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id
    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      const file = form.get("file") as File | null
      const caption = (form.get("caption") as string) || ""
      const uploader = (form.get("uploader") as string) || "anonymous"

      if (!file) return NextResponse.json({ success: false, message: "File required" }, { status: 400 })

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
      const entry = { id: `${Date.now()}-${Math.random()}`, url, caption, uploader, createdAt: Date.now() }
      const nextProofs = [entry, ...community.proofs]
      await saveCommunity(campaignId, { proofs: nextProofs })
      return NextResponse.json({ success: true, proof: entry })
    }

    const body = await req.json()
    const { type } = body
    const community = await getCommunity(params.id)

    if (type === "comment") {
      const entry = { id: `${Date.now()}-${Math.random()}`, author: body.author || "anonymous", text: body.text || "", createdAt: Date.now() }
      const next = [entry, ...community.comments]
      await saveCommunity(params.id, { comments: next })
      return NextResponse.json({ success: true, comment: entry })
    }

    if (type === "poll") {
      const poll = {
        id: `${Date.now()}-${Math.random()}`,
        question: body.question,
        options: (body.options || []).map((o: string, i: number) => ({ id: `opt-${i}`, text: o, votes: 0 })),
        createdBy: body.createdBy || "anonymous",
        createdAt: Date.now(),
        voters: [],
      }
      const next = [poll, ...community.polls]
      await saveCommunity(params.id, { polls: next })
      return NextResponse.json({ success: true, poll })
    }

    if (type === "vote") {
      const { pollId, optionId, voter } = body
      const nextPolls = community.polls.map((pl: any) => {
        if (pl.id !== pollId) return pl
        if (pl.voters?.includes(voter)) return pl
        return {
          ...pl,
          options: pl.options.map((o: any) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)),
          voters: [...(pl.voters || []), voter],
        }
      })
      await saveCommunity(params.id, { polls: nextPolls })
      return NextResponse.json({ success: true, polls: nextPolls })
    }

    return NextResponse.json({ success: false, message: "Unknown type" }, { status: 400 })
  } catch (e: any) {
    console.error("POST community error", e)
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 })
  }
}
