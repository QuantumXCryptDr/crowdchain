"use client"

import { signIn, getSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push("/connect-wallet")
      }
    }
    checkSession()
  }, [router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    await signIn("google", { callbackUrl: "/connect-wallet" })
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-green-400 to-blue-600 p-4">
      <Card className="w-full max-w-md glass-morphism">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Sign Up</CardTitle>
          <p className="text-white/80">Connect with your account to get started</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-gray-800 hover:bg-gray-100"
          >
            Continue with Google
          </Button>
          <p className="text-center text-white/60 text-sm">
            By signing up, you agree to connect your wallet to create campaigns.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}