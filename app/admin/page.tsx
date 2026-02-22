"use client"

import React, { useEffect, useState } from "react"
import { connectWallet, isWalletConnected, getPlatformFeePercent, getCampaignCount, setPlatformFeePercent, withdrawPlatformFunds } from "@/lib/web3"

export default function AdminPage() {
  const [connected, setConnected] = useState(false)
  const [fee, setFee] = useState<number | null>(null)
  const [campaigns, setCampaigns] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [txMessage, setTxMessage] = useState<string | null>(null)
  const [newFee, setNewFee] = useState<string>("")

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
  }

  const handleConnect = async () => {
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
    const res = await setPlatformFeePercent(parsed)
    setLoading(false)
    if (res.success) {
      setTxMessage("Fee updated successfully")
      setNewFee("")
      await refreshStats()
    } else {
      setTxMessage(`Failed: ${res.message}`)
    }
  }

  const handleWithdraw = async () => {
    setLoading(true)
    setTxMessage("Submitting withdraw transaction...")
    const res = await withdrawPlatformFunds()
    setLoading(false)
    if (res.success) {
      setTxMessage("Withdraw successful. Funds transferred to owner.")
    } else {
      setTxMessage(`Withdraw failed: ${res.message}`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <p className="text-sm text-slate-600 mb-6">Owner controls: platform fees and withdrawals</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="p-4 border rounded-lg">
          <h3 className="text-sm font-semibold">Platform Fee</h3>
          <div className="mt-3 text-3xl font-bold">{fee ?? "—"}%</div>
          <div className="mt-4">
            <input value={newFee} onChange={(e) => setNewFee(e.target.value)} placeholder="0 - 5" className="w-full p-2 border rounded" />
            <button onClick={handleSetFee} disabled={loading} className="mt-2 w-full bg-purple-600 text-white py-2 rounded">Set Fee</button>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="text-sm font-semibold">Campaign Count</h3>
          <div className="mt-3 text-3xl font-bold">{campaigns}</div>
          <div className="mt-4">
            <button onClick={refreshStats} className="w-full p-2 border rounded">Refresh</button>
          </div>
        </div>

        <div className="p-4 border rounded-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold">Platform Funds</h3>
            <p className="mt-2 text-sm text-slate-600">Withdraw all accumulated platform fees to owner address.</p>
          </div>
          <div>
            <button onClick={handleWithdraw} disabled={loading} className="mt-4 w-full bg-emerald-600 text-white py-2 rounded">Withdraw Funds</button>
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Transactions</h3>
        <p className="text-xs text-slate-500">{txMessage ?? "No recent admin transactions"}</p>
      </div>

      {!connected && (
        <div className="mt-6">
          <button onClick={handleConnect} className="px-4 py-2 bg-indigo-600 text-white rounded">Connect Wallet</button>
        </div>
      )}
    </div>
  )
}
