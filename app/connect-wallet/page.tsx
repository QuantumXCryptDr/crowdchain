"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { connectWallet, isWalletConnected } from "@/lib/web3"
import { useToast } from "@/hooks/use-toast"

export default function ConnectWalletPage() {
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuthAndWallet = async () => {
      const session = await getSession()
      if (session) {
        const walletConnected = await isWalletConnected()
        setConnected(walletConnected)
        if (walletConnected) {
          // Store user data with wallet
          // For now, redirect to dashboard or create
          router.push("/dashboard")
        }
      }
    }
    checkAuthAndWallet()
  }, [router])

  const handleConnectWallet = async () => {
    const session = await getSession()
    if (!session) {
      router.push("/signup")
      return
    }

    setLoading(true)
    try {
      const success = await connectWallet()
      if (success) {
        setConnected(true)
        toast({
          title: "Wallet Connected",
          description: "Your wallet has been connected successfully.",
        })
        // Store in db
        // Redirect
        router.push("/create")
      } else {
        throw new Error("Failed to connect wallet")
      }
    } catch (error: any) {
      console.error("Wallet connection error:", error)
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-green-400 to-blue-600 p-4">
      <Card className="w-full max-w-md glass-morphism">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Connect Wallet</CardTitle>
          <p className="text-white/80">Connect your wallet to start creating campaigns</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!connected ? (
            <Button
              onClick={handleConnectWallet}
              disabled={loading}
              className="w-full bg-white text-gray-800 hover:bg-gray-100"
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <p className="text-center text-white">Wallet connected! Redirecting...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}