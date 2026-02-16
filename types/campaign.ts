export interface Campaign {
  id: number
  creator: string
  title: string
  description: string
  imageUrl: string
  goalAmount: string
  raisedAmount: string
  deadline: number
  status: CampaignStatus
  isPremium: boolean
  contributorCount: number
}

export enum CampaignStatus {
  Active = 0,
  Successful = 1,
  Failed = 2,
  Cancelled = 3,
}

export interface Milestone {
  description: string
  amount: string
  deadline: number
  status: MilestoneStatus
  votesFor: number
  votesAgainst: number
}

export enum MilestoneStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}
