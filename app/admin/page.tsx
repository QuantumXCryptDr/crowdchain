"use client"

import React, { useEffect, useState } from "react"
import {
  connectWallet,
  isWalletConnected,
  getPlatformFeePercent,
  getCampaignCount,
  setPlatformFeePercent,
  withdrawPlatformFunds,
  getEtherscanTxUrl,
  getEtherscanContractUrl,
  getContractOwner,
  getSignerAddress,
  getContractBalance,
  formatEther,
} from "@/lib/web3"
import { getSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const [connected, setConnected] = useState(false)
  const [fee, setFee] = useState<number | null>(null)
  const [campaigns, setCampaigns] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [txMessage, setTxMessage] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [contractUrl, setContractUrl] = useState<string | null>(null)
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null)
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [contractBalance, setContractBalance] = useState<string | null>(null)
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false)
  const [txHistory, setTxHistory] = useState<Array<{hash:string,action:string,ts:number}>>([])
  const [newFee, setNewFee] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      const conn = await isWalletConnected()
      setConnected(conn)
      await refreshStats()
    })()
  }, [])

  const refreshStats = async () => {
    const f = await getPlatformFeePercent()
    const c = await getCampaignCount()
    setFee(f)
    setCampaigns(c)
    try {
      setContractUrl(getEtherscanContractUrl())
    } catch {
      setContractUrl(null)
    }
    let owner: string | null = null
    let user: string | null = null
    try {
      owner = await getContractOwner()
      setOwnerAddress(owner)
    } catch {}
    try {
      user = await getSignerAddress()
      setUserAddress(user)
    } catch {}
    try {
      const bal = await getContractBalance()
      setContractBalance(bal)
    } catch {}
    // owner check (use returned values to avoid stale state)
    if (owner && user) {
      setIsOwner(owner.toLowerCase() === user.toLowerCase())
    } else {
      setIsOwner(false)
    }
    // load tx history from localStorage
    try {
      const raw = localStorage.getItem("adminTxHistory")
      if (raw) setTxHistory(JSON.parse(raw))
    } catch {}
  }

  const handleConnect = async () => {
    const session = await getSession()
    if (!session) {
      router.push("/signup")
      return
    }

    const ok = await connectWallet()
    setConnected(ok)
    if (ok) await refreshStats()
  }

  const handleSetFee = async () => {
    if (!newFee) return
    const parsed = Number(newFee)
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 5) {
      setTxMessage("Fee must be a number between 0 and 5")
      return
    }
    setLoading(true)
    setTxMessage("Sending transaction...")
    const res: any = await setPlatformFeePercent(parsed)
    setLoading(false)
    if (res.success) {
      setTxMessage("Fee updated successfully")
      if (res.txHash) setTxHash(res.txHash)
      if (res.txHash) {
        const record = { hash: res.txHash, action: `setFee:${parsed}`, ts: Date.now() }
        const next = [record, ...txHistory].slice(0, 20)
        setTxHistory(next)
        localStorage.setItem("adminTxHistory", JSON.stringify(next))
      }
      setNewFee("")
      await refreshStats()
    } else {
      setTxMessage(`Failed: ${res.message}`)
    }
  }

  const handleWithdraw = async () => {
    // show confirmation
    setShowWithdrawConfirm(true)
  }

  const confirmWithdraw = async () => {
    setShowWithdrawConfirm(false)
    setLoading(true)
    setTxMessage("Submitting withdraw transaction...")
    const res: any = await withdrawPlatformFunds()
    setLoading(false)
    if (res.success) {
      setTxMessage("Withdraw successful. Funds transferred to owner.")
      if (res.txHash) {
        setTxHash(res.txHash)
        const record = { hash: res.txHash, action: `withdraw`, ts: Date.now() }
        const next = [record, ...txHistory].slice(0, 20)
        setTxHistory(next)
        localStorage.setItem("adminTxHistory", JSON.stringify(next))
      }
      await refreshStats()
    } else {
      setTxMessage(`Withdraw failed: ${res.message}`)
    }
  }

  return (
    <div className="min-h-screen web3-shell-soft">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <p className="text-sm text-slate-600 mb-6">Owner controls: platform fees and withdrawals</p>

        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <strong>Owner:</strong> <span className="font-mono text-xs">{ownerAddress ?? "—"}</span>
          </div>
          <div>
            <span className={`px-2 py-1 rounded text-xs ${isOwner ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}`}>
              {isOwner ? "You are owner" : "Not owner"}
            </span>
          </div>
          <div>
            <strong>Contract Balance:</strong> <span className="font-medium">{contractBalance ? formatEther(contractBalance) : "—"} ETH</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="web3-soft-card p-4 rounded-lg">
            <h3 className="text-sm font-semibold">Platform Fee</h3>
            <div className="mt-3 text-3xl font-bold">{fee ?? "—"}%</div>
            <div className="mt-4">
              <input
                value={newFee}
                onChange={(e) => setNewFee(e.target.value)}
                placeholder="0 - 5"
                className="w-full p-2 border rounded bg-white/80 dark:bg-slate-900/60"
              />
              <button onClick={handleSetFee} disabled={loading || !isOwner} className="mt-2 w-full web3-button py-2 rounded">
                Set Fee
              </button>
            </div>
          </div>

          <div className="web3-soft-card p-4 rounded-lg">
            <h3 className="text-sm font-semibold">Campaign Count</h3>
            <div className="mt-3 text-3xl font-bold">{campaigns}</div>
            <div className="mt-4">
              <button onClick={refreshStats} className="w-full p-2 web3-outline-soft rounded">
                Refresh
              </button>
            </div>
          </div>

          <div className="web3-soft-card p-4 rounded-lg flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold">Platform Funds</h3>
              <p className="mt-2 text-sm text-slate-600">Withdraw all accumulated platform fees to owner address.</p>
            </div>
            <div>
              <button onClick={handleWithdraw} disabled={loading || !isOwner} className="mt-4 w-full web3-button py-2 rounded">
                Withdraw Funds
              </button>
            </div>
          </div>
        </div>

        <div className="web3-soft-card p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Transactions</h3>
          <p className="text-xs text-slate-500">{txMessage ?? "No recent admin transactions"}</p>
          {txHash && (
            <p className="mt-2 text-xs">
              View transaction:{" "}
              <a className="web3-soft-accent" href={getEtherscanTxUrl(txHash)} target="_blank" rel="noreferrer">
                {getEtherscanTxUrl(txHash)}
              </a>
            </p>
          )}
          {contractUrl && (
            <p className="mt-2 text-xs">
              Contract:{" "}
              <a className="web3-soft-accent" href={contractUrl} target="_blank" rel="noreferrer">
                {contractUrl}
              </a>
            </p>
          )}

          {txHistory.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold">Recent Admin Transactions</h4>
              <ul className="text-xs mt-2 space-y-2">
                {txHistory.map((t) => (
                  <li key={t.hash}>
                    <a className="web3-soft-accent" href={getEtherscanTxUrl(t.hash)} target="_blank" rel="noreferrer">
                      {t.hash}
                    </a>
                    <span className="ml-2 text-slate-500">{t.action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {!connected && (
          <div className="mt-6">
            <button onClick={handleConnect} className="px-4 py-2 web3-button rounded">
              Connect Wallet
            </button>
          </div>
        )}
        {showWithdrawConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="web3-soft-card rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold">Confirm Withdraw</h3>
              <p className="mt-2 text-sm">Are you sure you want to withdraw all platform funds to the owner address? This will transfer the contract balance to the owner.</p>
              <div className="mt-4 flex gap-3 justify-end">
                <button onClick={() => setShowWithdrawConfirm(false)} className="px-4 py-2 web3-outline-soft rounded">
                  Cancel
                </button>
                <button onClick={confirmWithdraw} disabled={loading} className="px-4 py-2 web3-button rounded">
                  Confirm Withdraw
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
