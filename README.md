# CrowdChain - Decentralized Crowdfunding Platform

A transparent, secure, and fee-efficient decentralized crowdfunding platform built on blockchain technology. CrowdChain enables creators and communities to fundraise directly with lower fees and complete transparency through smart contracts.

## Features

- **Low Fees**: Only 2% platform fee vs 5%+ on traditional platforms
- **Transparent**: All transactions recorded on blockchain
- **Milestone-Based Releases**: Funds released based on community voting
- **Automatic Refunds**: Smart contract handles refunds for failed campaigns
- **Premium Features**: Enhanced visibility and analytics for campaign creators

## Technology Stack

- **Smart Contracts**: Solidity with OpenZeppelin security standards
- **Frontend**: Next.js 14 with TypeScript
- **Blockchain Interaction**: Ethers.js v6
- **UI Components**: shadcn/ui with Tailwind CSS
- **Development**: Hardhat for smart contract development

## Getting Started

### Prerequisites

- Node.js 18+ 
- MetaMask or compatible Web3 wallet
- Some test ETH for deployment and testing

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd decentralized-crowdfunding
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
# Fill in your private key, RPC URLs, and API keys
\`\`\`

4. Compile smart contracts:
\`\`\`bash
npx hardhat compile
\`\`\`

5. Deploy to testnet (Sepolia):
\`\`\`bash
npx hardhat run scripts/deploy.js --network sepolia
\`\`\`

6. Update the contract address in `lib/web3.ts`

7. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

## Smart Contract Features

### Core Functionality
- Campaign creation with funding goals and deadlines
- Secure contribution handling with automatic refunds
- Milestone-based fund releases with community voting
- Premium features for enhanced campaign visibility

### Security Features
- ReentrancyGuard protection
- Access control for sensitive functions
- Input validation and error handling
- Gas-optimized operations

## Deployment Networks

- **Ethereum Mainnet**: High security, higher gas costs
- **Arbitrum**: Lower gas costs, fast transactions
- **Optimism**: Layer 2 scaling solution
- **Polygon**: Sidechain with very low fees

## Monetization Strategies

1. **Platform Fees**: 2% on successful campaigns
2. **Premium Features**: Enhanced visibility and analytics
3. **Sponsored Campaigns**: Partnership opportunities
4. **Governance Tokens**: Future tokenization potential

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Security Considerations

- All smart contracts use OpenZeppelin standards
- Regular security audits recommended
- Multi-signature wallet for platform funds
- Emergency pause functionality for critical issues

## License

MIT License - see LICENSE file for details
