"use client"

import { getContract } from "./web3.client"

export const setPlatformFeePercent = async (fee: number) => {
  const contract = await getContract()
  if (!contract) return null

  const tx = await contract.setPlatformFee(fee)
  return await tx.wait()
}

export const withdrawPlatformFunds = async () => {
  const contract = await getContract()
  if (!contract) return null

  const tx = await contract.withdrawPlatformFunds()
  return await tx.wait()
}