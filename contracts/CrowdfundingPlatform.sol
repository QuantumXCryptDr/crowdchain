// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CrowdfundingPlatform is ReentrancyGuard, Ownable {
    uint256 public platformFeePercent = 2; // 2% platform fee
    uint256 public campaignCounter = 0;
    
    enum CampaignStatus { Active, Successful, Failed, Cancelled }
    enum MilestoneStatus { Pending, Approved, Rejected }
    
    struct Milestone {
        string description;
        uint256 amount;
        uint256 deadline;
        MilestoneStatus status;
        uint256 votesFor;
        uint256 votesAgainst;
        mapping(address => bool) hasVoted;
    }
    
    struct Campaign {
        uint256 id;
        address payable creator;
        string title;
        string description;
        string imageUrl;
        uint256 goalAmount;
        uint256 raisedAmount;
        uint256 deadline;
        CampaignStatus status;
        bool isPremium;
        uint256 milestoneCount;
        uint256 totalMilestoneAmount;
        uint256 totalReleasedAmount;
        mapping(uint256 => Milestone) milestones;
        mapping(address => uint256) contributions;
        address[] contributors;
    }
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(address => uint256[]) public userCampaigns;
    mapping(address => uint256[]) public userContributions;
    
    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goalAmount);
    event ContributionMade(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event MilestoneCreated(uint256 indexed campaignId, uint256 indexed milestoneId, string description, uint256 amount);
    event MilestoneVoted(uint256 indexed campaignId, uint256 indexed milestoneId, address indexed voter, bool vote);
    event FundsReleased(uint256 indexed campaignId, uint256 indexed milestoneId, uint256 amount);
    event RefundIssued(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event PremiumActivated(uint256 indexed campaignId);
    
    constructor() Ownable(msg.sender) {}
    
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _imageUrl,
        uint256 _goalAmount,
        uint256 _deadline
    ) external returns (uint256) {
        require(_goalAmount > 0, "Goal amount must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_title).length <= 200, "Title too long");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_description).length <= 5000, "Description too long");
        
        campaignCounter++;
        uint256 campaignId = campaignCounter;
        
        Campaign storage newCampaign = campaigns[campaignId];
        newCampaign.id = campaignId;
        newCampaign.creator = payable(msg.sender);
        newCampaign.title = _title;
        newCampaign.description = _description;
        newCampaign.imageUrl = _imageUrl;
        newCampaign.goalAmount = _goalAmount;
        newCampaign.deadline = _deadline;
        newCampaign.status = CampaignStatus.Active;
        
        userCampaigns[msg.sender].push(campaignId);
        
        emit CampaignCreated(campaignId, msg.sender, _title, _goalAmount);
        return campaignId;
    }
    
    function contribute(uint256 _campaignId) external payable nonReentrant {
        require(msg.value > 0, "Contribution must be greater than 0");
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.status == CampaignStatus.Active, "Campaign is not active");
        require(block.timestamp < campaign.deadline, "Campaign deadline has passed");
        
        if (campaign.contributions[msg.sender] == 0) {
            campaign.contributors.push(msg.sender);
            userContributions[msg.sender].push(_campaignId);
        }
        
        campaign.contributions[msg.sender] += msg.value;
        campaign.raisedAmount += msg.value;
        
        if (campaign.raisedAmount >= campaign.goalAmount) {
            campaign.status = CampaignStatus.Successful;
        }
        
        emit ContributionMade(_campaignId, msg.sender, msg.value);
    }
    
    function createMilestone(
        uint256 _campaignId,
        string memory _description,
        uint256 _amount,
        uint256 _deadline
    ) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Only campaign creator can create milestones");
        require(campaign.status == CampaignStatus.Successful, "Campaign must be successful");
        require(_amount > 0, "Milestone amount must be greater than 0");
        require(_deadline > block.timestamp, "Milestone deadline must be in the future");
        require(
            campaign.totalMilestoneAmount + _amount <= campaign.raisedAmount,
            "Milestones cannot exceed raised amount"
        );
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_description).length <= 1000, "Description too long");
        
        uint256 milestoneId = campaign.milestoneCount;
        Milestone storage milestone = campaign.milestones[milestoneId];
        milestone.description = _description;
        milestone.amount = _amount;
        milestone.deadline = _deadline;
        milestone.status = MilestoneStatus.Pending;
        
        campaign.milestoneCount++;
        campaign.totalMilestoneAmount += _amount;
        
        emit MilestoneCreated(_campaignId, milestoneId, _description, _amount);
    }
    
    function voteOnMilestone(uint256 _campaignId, uint256 _milestoneId, bool _vote) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.contributions[msg.sender] > 0, "Only contributors can vote");
        
        Milestone storage milestone = campaign.milestones[_milestoneId];
        require(milestone.status == MilestoneStatus.Pending, "Milestone is not pending");
        require(!milestone.hasVoted[msg.sender], "Already voted");
        
        milestone.hasVoted[msg.sender] = true;
        
        if (_vote) {
            milestone.votesFor++;
        } else {
            milestone.votesAgainst++;
        }
        
        emit MilestoneVoted(_campaignId, _milestoneId, msg.sender, _vote);
    }
    
    function releaseMilestoneFunds(uint256 _campaignId, uint256 _milestoneId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Only campaign creator can release funds");
        
        Milestone storage milestone = campaign.milestones[_milestoneId];
        require(milestone.status == MilestoneStatus.Pending, "Milestone is not pending");
        require(milestone.votesFor > milestone.votesAgainst, "Milestone not approved by majority");
        require(
            campaign.totalReleasedAmount + milestone.amount <= campaign.raisedAmount,
            "Insufficient campaign balance"
        );
        
        milestone.status = MilestoneStatus.Approved;
        campaign.totalReleasedAmount += milestone.amount;
        
        uint256 platformFee = (milestone.amount * platformFeePercent) / 100;
        uint256 creatorAmount = milestone.amount - platformFee;
        
        (bool platformSuccess, ) = payable(owner()).call{value: platformFee}("");
        require(platformSuccess, "Platform fee transfer failed");
        
        (bool creatorSuccess, ) = campaign.creator.call{value: creatorAmount}("");
        require(creatorSuccess, "Creator payment failed");
        
        emit FundsReleased(_campaignId, _milestoneId, creatorAmount);
    }
    
    function requestRefund(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.contributions[msg.sender] > 0, "No contribution found");
        require(
            campaign.status == CampaignStatus.Failed || 
            (block.timestamp > campaign.deadline && campaign.raisedAmount < campaign.goalAmount),
            "Refund not available"
        );
        
        uint256 contributionAmount = campaign.contributions[msg.sender];
        campaign.contributions[msg.sender] = 0;
        campaign.raisedAmount -= contributionAmount;
        
        (bool success, ) = payable(msg.sender).call{value: contributionAmount}("");
        require(success, "Refund transfer failed");
        
        emit RefundIssued(_campaignId, msg.sender, contributionAmount);
    }
    
    function enablePremiumFeatures(uint256 _campaignId) external payable {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Only campaign creator can enable premium");
        require(msg.value >= 0.01 ether, "Insufficient payment for premium features");
        
        campaign.isPremium = true;
        
        (bool success, ) = payable(owner()).call{value: msg.value}("");
        require(success, "Premium payment transfer failed");
        
        emit PremiumActivated(_campaignId);
    }
    
    function getCampaignDetails(uint256 _campaignId) external view returns (
        uint256 id,
        address creator,
        string memory title,
        string memory description,
        string memory imageUrl,
        uint256 goalAmount,
        uint256 raisedAmount,
        uint256 deadline,
        CampaignStatus status,
        bool isPremium,
        uint256 contributorCount
    ) {
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.id,
            campaign.creator,
            campaign.title,
            campaign.description,
            campaign.imageUrl,
            campaign.goalAmount,
            campaign.raisedAmount,
            campaign.deadline,
            campaign.status,
            campaign.isPremium,
            campaign.contributors.length
        );
    }
    
    function getUserContribution(uint256 _campaignId, address _user) external view returns (uint256) {
        return campaigns[_campaignId].contributions[_user];
    }
    
    function getMilestone(uint256 _campaignId, uint256 _milestoneId) external view returns (
        string memory description,
        uint256 amount,
        uint256 deadline,
        MilestoneStatus status,
        uint256 votesFor,
        uint256 votesAgainst
    ) {
        Milestone storage milestone = campaigns[_campaignId].milestones[_milestoneId];
        return (
            milestone.description,
            milestone.amount,
            milestone.deadline,
            milestone.status,
            milestone.votesFor,
            milestone.votesAgainst
        );
    }

    function getCampaignMilestoneCount(uint256 _campaignId) external view returns (uint256) {
        return campaigns[_campaignId].milestoneCount;
    }
    
    function setPlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 5, "Fee cannot exceed 5%");
        platformFeePercent = _newFeePercent;
    }
    
    function withdrawPlatformFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}
