"use client"

import { ethers } from "ethers"
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contract"

export const connectWallet = async () => {
  if (typeof window === "undefined" || !window.ethereum) return false

  const provider = new ethers.BrowserProvider(window.ethereum)
  await provider.send("eth_requestAccounts", [])
  return true
}

export const getSigner = async () => {
  if (typeof window === "undefined" || !window.ethereum) return null
  const provider = new ethers.BrowserProvider(window.ethereum)
  return provider.getSigner()
}

export const getContract = async () => {
  if (!CONTRACT_ADDRESS) return null
  const signer = await getSigner()
  if (!signer) return null
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
}
