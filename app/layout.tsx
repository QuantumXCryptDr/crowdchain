import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Footer } from "@/components/footer"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: "CrowdChain - Decentralized Crowdfunding Platform",
  description: "Transparent, secure, and fee-efficient fundraising powered by blockchain technology",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="web3-shell antialiased" suppressHydrationWarning>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
