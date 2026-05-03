import { NextResponse } from "next/server"
import { formatCampaign } from "@/lib/contract"
import { getReadOnlyContract } from "@/lib/web3"
import { CampaignStatus } from "@/types/campaign"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const matchesStatus = (status: CampaignStatus, filter: string) => {
  switch (filter) {
    case "active":
      return status === CampaignStatus.Active
    case "successful":
      return status === CampaignStatus.Successful
    case "failed":
      return status === CampaignStatus.Failed
    case "cancelled":
      return status === CampaignStatus.Cancelled
    case "all":
    default:
      return true
  }
}

export async function GET(request: Request) {
  try {
    const statusFilter = new URL(request.url).searchParams.get("status") || "all"
    const contract = getReadOnlyContract()

    if (!contract) {
      return NextResponse.json(
        { success: false, message: "Contract is not configured" },
        { status: 500 }
      )
    }

    const campaignCount = Number(await contract.campaignCounter())
    const campaignDetails = await Promise.all(
      Array.from({ length: campaignCount }, (_, index) => contract.getCampaignDetails(index + 1))
    )

    const campaigns = campaignDetails
      .map((details) => formatCampaign(details))
      .filter((campaign) => matchesStatus(campaign.status, statusFilter))
      .sort((a, b) => b.id - a.id)

    return NextResponse.json({ success: true, campaigns })
  } catch (error: any) {
    console.error("GET campaigns error", error)
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load campaigns" },
      { status: 500 }
    )
  }
}
