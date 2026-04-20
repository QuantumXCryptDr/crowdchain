import { getContract } from "./web3.client"

export const setPlatformFeePercent = async (fee: number) => {
  const contract = await getContract()
  const tx = await contract.setPlatformFee(fee)
  return tx.wait()
}

export const withdrawPlatformFunds = async () => {
  const contract = await getContract()
  const tx = await contract.withdrawPlatformFunds()
  return tx.wait()
}