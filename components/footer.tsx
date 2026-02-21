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
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Collaborators</h4>
            <div className="flex flex-col space-y-3">
              <a 
                href="https://cyreneai.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
              >
                <Image 
                  src="/logos/cyrene-ai-logo.png" 
                  alt="Cyrene AI Logo"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium">Cyrene AI</span>
              </a>
              <a 
                href="https://solana.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
              >
                <Image 
                  src="/logos/solana-logo.png" 
                  alt="Solana Logo"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium">Solana</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
          {/* Watermark/Copyright with Logos */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-500">
              © 2026 CrowdChain. All rights reserved. Built with blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex items-center space-x-2">
                <Image 
                  src="/logos/cyrene-ai-logo.png" 
                  alt="Cyrene AI"
                  width={20}
                  height={20}
                  className="w-5 h-5 opacity-70 rounded-full"
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Cyrene AI</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">&</span>
              <div className="flex items-center space-x-2">
                <Image 
                  src="/logos/solana-logo.png" 
                  alt="Solana"
                  width={20}
                  height={20}
                  className="w-5 h-5 opacity-70 rounded-full"
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Solana</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
