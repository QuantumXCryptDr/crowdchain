import React from "react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">CrowdChain</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Decentralized crowdfunding powered by blockchain technology. Transparent, secure, and efficient.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition">
                  Home
                </a>
              </li>
              <li>
                <a href="/create" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition">
                  Create Campaign
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition">
                  Analytics Dashboard
                </a>
              </li>
              <li>
                <a href="/withdraw" className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition">
                  Withdrawal Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Collaborators */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Collaborators & Funders</h4>
            <div className="flex flex-col space-y-4">
              <a 
                href="https://cyreneai.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Image 
                  src="/placeholder-logo.png" 
                  alt="Cyrene AI Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">Cyrene AI</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Project Funder</span>
                </div>
              </a>
              <a 
                href="https://solana.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Image 
                  src="/placeholder-logo.png" 
                  alt="Solana Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">Solana</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Blockchain Partner</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mt-8">
          {/* Watermark/Copyright with Large Logos */}
          <div className="flex flex-col items-center justify-center gap-6 bg-gradient-to-r from-purple-50 to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-lg p-6">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center">
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
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 text-center">CYRENE AI</span>
              </div>
              <div className="text-3xl text-slate-300 dark:text-slate-600">&</div>
              <div className="flex flex-col items-center gap-2">
                <Image 
                  src="/placeholder-logo.png" 
                  alt="Solana"
                  width={64}
                  height={64}
                  className="w-16 h-16 drop-shadow-lg"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 text-center">SOLANA</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
              Building the future of decentralized fundraising on blockchain technology
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
