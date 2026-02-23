import { join } from "path"
import fs from "fs"
import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"

type CommunityData = {
  [campaignId: string]: {
    comments: Array<any>
    polls: Array<any>
    proofs: Array<any>
  }
}

const dir = join(process.cwd(), ".data")
const file = join(dir, "community.json")

// Ensure data directory exists
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const adapter = new JSONFile<CommunityData>(file)
const db = new Low<CommunityData>(adapter, {} as CommunityData)

export const initDb = async () => {
  await db.read()
  db.data ||= {}
  await db.write()
}

export const getCommunity = async (campaignId: string) => {
  await db.read()
  db.data ||= {}
  if (!db.data[campaignId]) db.data[campaignId] = { comments: [], polls: [], proofs: [] }
  return db.data[campaignId]
}

export const saveCommunity = async (campaignId: string, payload: { comments?: any[]; polls?: any[]; proofs?: any[] }) => {
  await db.read()
  db.data ||= {}
  if (!db.data[campaignId]) db.data[campaignId] = { comments: [], polls: [], proofs: [] }
  if (payload.comments) db.data[campaignId].comments = payload.comments
  if (payload.polls) db.data[campaignId].polls = payload.polls
  if (payload.proofs) db.data[campaignId].proofs = payload.proofs
  await db.write()
  return db.data[campaignId]
}

export default db
