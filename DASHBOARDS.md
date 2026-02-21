# CrowdChain Dashboards Documentation

## Overview

CrowdChain includes two powerful dashboards to help manage campaigns and track fund flows:

1. **Fund Flow Dashboard** - Platform-wide analytics
2. **Withdrawal Dashboard** - Campaign-specific fund management

---

## Fund Flow Dashboard

**Route:** `/dashboard`

### Features

- **Real-time Fund Tracking**
  - Total ETH raised across all campaigns
  - Platform fees collected
  - Amount distributed to creators
  - Number of active campaigns

- **Campaign Breakdown Table**
  - View every campaign's financial details
  - See goal vs. raised amounts
  - Track platform fees (2% by default)
  - Monitor creator payouts

- **Visual Analytics**
  - Summary cards with key metrics
  - Campaign status indicators (Active/Successful/Failed)
  - Easy navigation to individual campaigns

### How It Works

```
User connects wallet → Views all campaigns → Analyzes fund flow
         ↓
  Real-time data from smart contract
         ↓
  Platform fees: Raised Amount × platformFeePercent%
  Creator gets: Raised Amount - Platform Fee
```

### Data Displayed

| Metric | Description |
|--------|-------------|
| Total Raised | Sum of all funds raised across all campaigns |
| Platform Fees | Total 2% fees collected (configurable) |
| To Creators | Amount distributed to campaign creators |
| Active Campaigns | Number of currently running campaigns |

---

## Withdrawal Dashboard

**Route:** `/withdraw`

### Features

- **Campaign Selection**
  - View only YOUR successful campaigns
  - See total raised vs. funding goal
  - Check premium status
  - View withdrawable amounts (after fees)

- **Fund Withdrawal**
  - Input custom withdrawal address
  - Confirm withdrawal amounts
  - Process transactions on-chain
  - Real-time transaction tracking

- **Security**
  - Validates Ethereum addresses
  - Prevents invalid withdrawals
  - Requires milestone approval from community
  - Shows clear fee breakdowns

### How It Works

```
Campaign Creator flows:
Campaign Created → Contributors Donate → Campaign Successful
         ↓
   Creator creates milestone with amount
         ↓
   Contributors vote on milestone
         ↓
   If approved: Creator withdraws funds (98%)
              : Platform takes fee (2%)
```

### Withdrawal Process

1. **Connect Wallet**
   - Only campaign creators can access their campaigns
   - System auto-filters campaigns owned by connected wallet

2. **Select Campaign**
   - Choose from your successful campaigns
   - View total raised and platform fees

3. **Enter Withdrawal Address**
   - Can be your wallet or another address
   - System validates Ethereum address format
   - Shows exact amount to be transferred

4. **Confirm & Withdraw**
   - Review withdrawal details
   - Sign transaction in MetaMask
   - Funds transfer to specified address

### Example Withdrawal

```
Campaign raised: 10 ETH
Platform fee (2%): 0.2 ETH
Creator receives: 9.8 ETH
```

---

## Dashboard Integration

Both dashboards are integrated into the main navigation:

```
Home Page Header:
[Dashboard] [Withdraw] [Create Campaign] [Connect Wallet]
```

### Access Points

- **Fund Flow Dashboard**: Public - any connected user can view
- **Withdrawal Dashboard**: Private - only your campaigns visible

---

## Smart Contract Integration

The dashboards interact with these contract functions:

### Fund Flow Dashboard
- `campaignCounter()` - Get total campaigns
- `getCampaignDetails(campaignId)` - Fetch campaign data
- `platformFeePercent()` - Get current fee percentage

### Withdrawal Dashboard
- `getCampaignDetails(campaignId)` - Fetch campaign data
- `releaseMilestoneFunds(campaignId, milestoneId)` - Process withdrawal
- `platformFeePercent()` - Calculate withdrawable amount

---

## Error Handling

### Fund Flow Dashboard
- ✅ Handles wallet disconnection
- ✅ Gracefully loads campaigns
- ✅ Shows loading states
- ✅ Displays error messages if contract unavailable

### Withdrawal Dashboard
- ✅ Validates Ethereum addresses
- ✅ Checks wallet connection
- ✅ Filters campaigns by creator
- ✅ Handles transaction failures
- ✅ Shows real-time transaction status

---

## Best Practices

### For Campaign Creators

1. **Before Withdrawal**
   - Ensure campaign is marked "Successful"
   - Wait for milestone approval from community
   - Prepare withdrawal address

2. **During Withdrawal**
   - Double-check withdrawal address
   - Confirm gas fees in MetaMask
   - Wait for transaction confirmation

3. **After Withdrawal**
   - Verify funds received at destination
   - Keep transaction hash for records

### For Platform Administrators

1. **Monitor Fund Flow**
   - Check Fund Flow Dashboard regularly
   - Verify platform fees are collected
   - Monitor for suspicious patterns

2. **Withdraw Platform Fees**
   - Use `withdrawPlatformFunds()` function
   - Can be called by contract owner only
   - Transfers all accumulated fees to owner wallet

---

## Future Enhancements

Potential improvements for future versions:

- [ ] Export campaign data as CSV
- [ ] Withdrawal history/transaction logs
- [ ] Multi-signature approvals
- [ ] Partial milestone withdrawals
- [ ] Refund dashboard for contributors
- [ ] Tax reporting features
- [ ] Payment splitting (multiple beneficiaries)
- [ ] Scheduled/batched withdrawals

---

## Troubleshooting

### Dashboard Won't Load
- **Solution**: Ensure wallet is connected and contract is deployed
- **Check**: Verify CONTRACT_ADDRESS in `lib/web3.ts`

### Withdrawal Address Invalid
- **Solution**: Use format `0x` followed by 40 hexadecimal characters
- **Example**: `0x1234567890abcdef1234567890abcdef12345678`

### Transaction Fails
- **Check**: Sufficient gas fees
- **Check**: Correct network (Sepolia testnet)
- **Check**: Campaign is actually successful
- **Check**: Milestone approved by community

### Missing Campaigns
- **Solution**: Only successful campaigns appear on withdrawal dashboard
- **Check**: Campaign must have status "Successful"
- **Check**: You must be the campaign creator

---

## Security Considerations

1. **Smart Contract Security**
   - Uses OpenZeppelin contracts (secure, audited)
   - Implements reentrancy protection
   - Follows Solidity best practices

2. **Fund Safety**
   - Funds held in smart contract (not centralized wallet)
   - Withdrawal requires milestone approval
   - Creator must sign transaction

3. **Address Validation**
   - Ethereum addresses validated before withdrawal
   - Prevents funds being sent to invalid addresses
   - Clear confirmation before transaction

---

## Related Documentation

- [Smart Contract README](../../contracts/README.md)
- [Web3 Integration Guide](../../lib/web3.ts)
- [Campaign Types](../../types/campaign.ts)
