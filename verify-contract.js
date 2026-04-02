const { ethers } = require("ethers");

async function verifyContract() {
  const contractAddress = "0x1D6FB3A2F9928E84d8D0f7E695869b03Ed158816";
  const rpcUrl = "https://rpc.sepolia.org";

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Minimal ABI for campaignCounter
  const abi = ["function campaignCounter() view returns (uint256)"];

  const contract = new ethers.Contract(contractAddress, abi, provider);

  try {
    const counter = await contract.campaignCounter();
    console.log("Contract is deployed at:", contractAddress);
    console.log("Campaign counter:", counter.toString());
  } catch (error) {
    console.log("Contract not found or error:", error.message);
  }
}

verifyContract();