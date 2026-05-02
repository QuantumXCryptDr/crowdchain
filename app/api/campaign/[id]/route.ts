import { NextResponse } from "next/server"
import { formatCampaign } from "@/lib/contract"
import { getReadOnlyContract } from "@/lib/web3"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CampaignRouteContext = {
  params: Promise<{ id?: string | string[] }>
}

const getCampaignId = async (context: CampaignRouteContext) => {
  const id = (await context.params).id
  return Array.isArray(id) ? id[0] : id
}

export async function GET(_request: Request, context: CampaignRouteContext) {
  try {
    const campaignId = await getCampaignId(context)
    if (!campaignId) {
      return NextResponse.json({ success: false, message: "Campaign id is required" }, { status: 400 })
    }

    const contract = getReadOnlyContract()
    if (!contract) {
      return NextResponse.json({ success: false, message: "Contract is not configured" }, { status: 500 })
    }

    const details = await contract.getCampaignDetails(campaignId)
    const campaign = formatCampaign(details)

    if (!campaign.id) {
      return NextResponse.json({ success: false, message: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, campaign })
  } catch (error: any) {
    console.error("GET campaign error", error)
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load campaign" },
      { status: 500 }
    )
  }
}
