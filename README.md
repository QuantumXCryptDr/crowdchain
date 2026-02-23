# CrowdChain - Decentralized Crowdfunding Platform

A transparent, secure, and fee-efficient decentralized crowdfunding platform built on blockchain technology. CrowdChain enables creators and communities to fundraise directly with lower fees and complete transparency through smart contracts.

## Features

- **Low Fees**: Only 2% platform fee vs 5%+ on traditional platforms
- **Transparent**: All transactions recorded on blockchain
- **Milestone-Based Releases**: Funds released based on community voting
- **Automatic Refunds**: Smart contract handles refunds for failed campaigns
- **Premium Features**: Enhanced visibility and analytics for campaign creators
- **Community Engagement**: Comments, polls, and creator proof images per campaign
- **IPFS Storage**: Proof images persisted to IPFS via Web3.Storage

## Technology Stack

- **Smart Contracts**: Solidity with OpenZeppelin security standards
- **Frontend**: Next.js 14 with TypeScript
- **Blockchain Interaction**: Ethers.js v6
- **UI Components**: shadcn/ui with Tailwind CSS
- **Development**: Hardhat for smart contract development
- **Community Data**: lowdb JSON store + Web3.Storage for IPFS uploads
- **Markdown Support**: Sanitized markdown rendering in comments
- **Relative Timestamps**: timeago.js for human-friendly time display

## Getting Started

### Prerequisites

- Node.js 18+ 
- MetaMask or compatible Web3 wallet
- Some test ETH for deployment and testing
- (Optional) Web3.Storage API token for IPFS uploads

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd decentralized-crowdfunding
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Fill in your private key, RPC URLs, and API keys
```

**For IPFS proof image uploads** (optional), get a free Web3.Storage API token:
- Visit [https://web3.storage](https://web3.storage)
- Sign up and generate an API token
- Add it to `.env.local`:
  ```
  WEB3_STORAGE_TOKEN=your_token_here
  ```

4. Compile smart contracts:
```bash
npx hardhat compile
```

5. Deploy to testnet (Sepolia):
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

6. Update the contract address in `lib/web3.ts`

7. Start the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

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

## Community Features

### Comments & Discussion
- Any user can comment on campaigns (with connected wallet or anonymously)
- Comments support **Markdown formatting** (bold, italics, links, etc.)
- Each comment shows creator avatar, timestamp, and content
- Persistent storage via lowdb JSON database

### Polls
- Campaign creators can create polls with up to 6 options
- Any user can vote on polls (one vote per user tracked by address or anon ID)
- Vote counts updated in real-time and persisted

### Creator Proof Images
- Campaign creators can upload images as proof of fund usage
- Images are stored as Data URLs locally or uploaded to **IPFS via Web3.Storage**
- Gallery view with captions and uploader metadata
- Transparent auditing of campaign fund allocation

### API Endpoints

The community data is managed via Next.js API routes:

```
GET  /api/campaign/[id]/community
     → Returns comments, polls, and proofs for a campaign

POST /api/campaign/[id]/community
     → Create comment: { type: "comment", author, text }
     → Create poll: { type: "poll", question, options: string[], createdBy }
     → Vote on poll: { type: "vote", pollId, optionId, voter }
     → Upload proof: multipart/form-data with file, caption, uploader
```

All data is persisted to `.data/community.json` on the server and synced with the frontend.

## Deployment Networks

- **Ethereum Mainnet**: High security, higher gas costs
- **Arbitrum**: Lower gas costs, fast transactions
- **Optimism**: Layer 2 scaling solution
- **Polygon**: Sidechain with very low fees
- **Sepolia Testnet**: For development and testing

See [SEPOLIA_FAUCET_GUIDE.md](./SEPOLIA_FAUCET_GUIDE.md) for testnet setup.

## Project Structure

```
app/
  ├── page.tsx                 # Home page (campaign list)
  ├── create/page.tsx          # Create campaign form
  ├── campaign/[id]/page.tsx   # Campaign detail with community features
  ├── admin/page.tsx           # Admin panel for platform management
  ├── dashboard/page.tsx       # User analytics dashboard
  ├── withdraw/page.tsx        # Creator fund withdrawal
  ├── profile/page.tsx         # User profile
  ├── api/campaign/[id]/community/route.ts  # Community API endpoint
  └── layout.tsx               # Root layout with header/footer

lib/
  ├── web3.ts                  # Ethers.js helpers and contract interface
  └── server/db.ts             # lowdb JSON database for community data

components/
  ├── ui/                      # shadcn/ui component library
  ├── footer.tsx               # Footer with branding
  └── theme-provider.tsx       # Dark theme wrapper

contracts/
  └── CrowdfundingPlatform.sol # Main smart contract

styles/
  └── globals.css              # Tailwind CSS configuration

types/
  └── campaign.ts              # TypeScript type definitions
```

## Admin Panel Features

Accessible at `/admin` (owner-only):

- **Platform Fee Management**: View and update the 2% platform fee (max 5%)
- **Contract Balance**: Display current ETH held by contract
- **Withdraw Funds**: Owner can withdraw accumulated platform fees
- **Campaign Stats**: Total number of campaigns created
- **Etherscan Links**: Quick links to contract and transaction verification
- **Transaction History**: Local record of recent admin actions with confirmation modal

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
- Community data (comments, polls) stored server-side with lightweight validation

## Troubleshooting

### No test ETH on Sepolia?
See [SEPOLIA_FAUCET_GUIDE.md](./SEPOLIA_FAUCET_GUIDE.md) for testnet ETH sources.

### IPFS uploads fail?
Ensure `WEB3_STORAGE_TOKEN` is set in `.env.local`. Without it, proof images will use local Data URL storage as a fallback.

### Build or TypeScript errors?
Run `npm run build` to see full error details. Ensure all dependencies are installed: `npm install`

## Monetization Strategies

1. **Platform Fees**: 2% on successful campaigns
2. **Premium Features**: Enhanced visibility and analytics
3. **Sponsored Campaigns**: Partnership opportunities
4. **Governance Tokens**: Future tokenization potential

## License

MIT License - see LICENSE file for details
