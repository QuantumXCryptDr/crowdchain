import React from "react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="w-full bg-[#000020] border-t border-white/30 py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-white mb-2">CrowdChain</h3>
            <p className="text-sm text-white/70">
              Decentralized Crowdfunding Powered By Blockchain Technology. Transparent, Secure, and Efficient.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-white/70 hover:text-cyan-300 transition">
                  Home
                </a>
              </li>
              <li>
                <a href="/create" className="text-white/70 hover:text-cyan-300 transition">
                  Create Campaign
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-white/70 hover:text-cyan-300 transition">
                  Analytics Dashboard
                </a>
              </li>
              <li>
                <a href="/withdraw" className="text-white/70 hover:text-cyan-300 transition">
                  Withdrawal Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Collaborators */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Collaborators & Funders</h4>
            <div className="flex flex-col space-y-4">
              <a 
                href="https://cyreneai.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 p-2 rounded-lg hover:bg-white/15 transition backdrop-blur-sm"
              >
                <Image 
                  src="/placeholder-logo.png" 
                  alt="Cyrene AI Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-white text-sm">Cyrene AI</span>
                  <span className="text-xs text-white/70">Project Funder</span>
                </div>
              </a>
              <a 
                href="https://solana.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 p-2 rounded-lg hover:bg-white/15 transition backdrop-blur-sm"
              >
                <Image 
                  src="/placeholder-logo.png" 
                  alt="Solana Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-white text-sm">Solana</span>
                  <span className="text-xs text-white/70">Blockchain Partner</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/30 pt-8 mt-8">
          {/* Watermark/Copyright with Large Logos */}
          <div className="flex flex-col items-center justify-center gap-6 bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/30">
            <p className="text-sm font-semibold text-white text-center">
              © 2026 CrowdChain. Proudly Powered By
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <Image 
                  src="/placeholder-logo.png" 
                  alt="Cyrene AI"
                  width={64}
                  height={64}
                  className="w-16 h-16 drop-shadow-lg"
                />
                <span className="text-xs font-bold text-white/70 text-center">CYRENE AI</span>
              </div>
              <div className="text-3xl text-white/50">&</div>
              <div className="flex flex-col items-center gap-2">
                <Image 
                  src="/placeholder-logo.png" 
                  alt="Solana"
                  width={64}
                  height={64}
                  className="w-16 h-16 drop-shadow-lg"
                />
                <span className="text-xs font-bold text-white/70 text-center">SOLANA</span>
              </div>
            </div>
            <p className="text-xs text-white/50 text-center">
              Building The Future Of Decentralized Fundraising On Blockchain Technology
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
