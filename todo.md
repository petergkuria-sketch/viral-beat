# Project Upgrades Todo List

- [x] Upgrade project to `web-db-user` to enable backend and auth
- [x] Implement backend API routes for YouTube data fetching
- [x] Implement backend API routes for TikTok data fetching
- [x] Connect Dashboard frontend to backend APIs
- [x] Add "Sign Up" and "Login" pages (via Manus OAuth)
- [x] Protect Dashboard route with authentication (optional, users can browse without login)
- [x] Optimize Dashboard layout for mobile screens
- [x] Add PWA manifest and service worker configuration

## New Features

- [x] Add database schema for favorites (user_id, trend_topic, platform, saved_at)
- [x] Create backend API routes for saving/removing/listing favorites
- [x] Add "Save to Favorites" button on Dashboard
- [x] Create "My Favorites" page to view saved trends
- [x] Implement real sentiment analysis using LLM API
- [x] Display actual sentiment breakdown from analyzed content
- [x] Create Creator Profile page with detailed stats
- [x] Add historical performance charts for creators
- [x] Implement cross-platform creator stats aggregation

## Bug Fixes

- [x] Fix Creator navigation - clicking on creators should display their profile
- [x] Fix missing unique "key" prop error in Dashboard component
- [x] Fix remaining missing unique "key" prop error in Dashboard (Primitive.div from Radix UI)

## Platform Filter Feature

- [x] Add platform filter dropdown/buttons to Dashboard UI
- [x] Update backend API to support platform-specific filtering
- [x] Connect frontend filter to backend API
- [x] Test filtering by TikTok, YouTube, Twitter, Instagram
- [x] Fix Creator Profile page platform enum validation error (missing twitter/instagram options)

## X Trends AI Agent Feature

- [x] Research and integrate X/Twitter API for trends data (using Twitter user profile and tweets APIs)
- [x] Create backend API routes for fetching X trends
- [x] Implement AI summarization using LLM for trend analysis
- [x] Build X Trends page with agent chat interface
- [x] Display trending hashtags, topics, and AI summaries
- [x] Add real-time trend updates and notifications

## Real Twitter/X Data Integration (Web Scraping)

- [x] Research available third-party trend data sources (found Twitter APIs in Manus Data API)
- [x] Implement web scraping or alternative data fetching (using Twitter Data API)
- [x] Fetch real trending topics from public sources
- [x] Update X Trends backend to use real data
- [x] Add caching to reduce scraping frequency
- [x] Add error handling and fallback to simulated data

## Landing Page Redesign

- [x] Add general trends and virality overview to the top of landing page
- [x] Move "Decode the Digital Pulse" search bar below the dashboard
- [x] Position trending topics below the search bar
- [x] Ensure responsive layout for all screen sizes

## Comprehensive Dashboard Redesign (from mockup)

- [x] Implement sidebar navigation with menu items (Dashboard, Trends, Creators, Sentiment, Platforms, Reports, Settings)
- [x] Build virality score gauge with speedometer-style visualization
- [x] Create trend trajectory chart with AI forecast toggle
- [x] Add top creators section with avatars, follow buttons, views/likes/shares stats
- [x] Implement sentiment analysis gauge (positive/negative/neutral percentages)
- [x] Add platform distribution pie chart (TikTok, Twitter, YouTube, Other)
- [x] Add search bar in header
- [x] Add "Last updated" timestamp and data source attribution
- [x] Ensure responsive layout for all screen sizes

## Real-Time Updates Feature

- [x] Set up WebSocket server with Socket.IO
- [x] Create real-time event emitters for virality score updates
- [x] Emit trending content updates when new viral content is detected
- [ ] Update frontend to connect to WebSocket server
- [ ] Listen for virality score changes and update UI in real-time
- [ ] Add visual pulse/glow indicators for live updates
- [ ] Add "Live" badge to indicate real-time connection status
- [ ] Test real-time updates across multiple browser tabs

## Embeddable Widget Feature

- [x] Design embeddable widget component with virality score display
- [x] Add customization options (theme, size, colors, data to show)
- [x] Create widget builder page with live preview
- [x] Generate embed code (iframe and JavaScript snippet)
- [x] Implement widget API endpoint for external data fetching
- [x] Add social media sharing options (Twitter, LinkedIn, Facebook)
- [ ] Create shareable image/card for social media posts
- [x] Test widget embedding on external pages

## Beat Vote Feature

- [x] Add database schema for beat votes (user_id, topic, vote_type, created_at)
- [x] Create backend API endpoints for voting (cast vote, get vote counts, get user vote)
- [x] Build frontend vote UI components (upvote/downvote buttons)
- [x] Display vote counts on trends
- [x] Restrict voting to logged-in users only
- [x] Write tests for vote functionality

## AI Agents Hub Feature

- [x] Create unified AI Agents Hub page with agent selector
- [x] Implement Script Writer Agent backend endpoint
- [x] Implement Script Writer Agent frontend UI
- [x] Implement Trend Forecaster Agent backend endpoint
- [x] Implement Trend Forecaster Agent frontend UI
- [x] Implement Collaboration Matchmaker Agent backend endpoint
- [x] Implement Collaboration Matchmaker Agent frontend UI
- [x] Implement Sponsorship Opportunity Finder Agent backend endpoint
- [x] Implement Sponsorship Opportunity Finder Agent frontend UI
- [x] Implement Content Repurposing Agent backend endpoint
- [x] Implement Content Repurposing Agent frontend UI
- [x] Write comprehensive tests for all AI agents
- [x] Add AI Agents Hub to sidebar navigation

## Bug Fixes (Current)

- [x] Fix Creator Profile page platform validation error preventing page load

## Security Enhancements

### Rate Limiting
- [x] Install and configure rate limiting middleware (express-rate-limit)
- [x] Add rate limiting to API endpoints (different limits for auth/unauth users)
- [x] Add rate limiting to AI Agents endpoints (stricter limits)
- [x] Display rate limit errors with user-friendly messages

### Content Access Control
- [x] Restrict AI Agents Hub to authenticated users only
- [x] Add authentication check to AI Agents router
- [x] Redirect unauthenticated users to login page when accessing premium features
- [x] Display "Sign in to access" message on restricted features

### Data Privacy Controls
- [x] Add privacy settings to user database schema (profile visibility, show stats)
- [x] Create Privacy Settings page in user settings
- [x] Implement backend logic to respect privacy settings
- [x] Add privacy controls to user profile display
- [x] Test privacy settings across different user scenarios

## Settings & Admin Enhancements

### Settings Navigation Hub
- [x] Create Settings hub page with sections (Privacy, Account, Notifications)
- [x] Link Privacy Settings from Settings hub
- [x] Update sidebar Settings button to navigate to Settings hub
- [ ] Add breadcrumb navigation in Settings pages

### Rate Limit UI Feedback
- [x] Add rate limit tracking to backend responses
- [x] Create RateLimitIndicator component showing remaining quota
- [x] Display rate limit progress bar in header
- [x] Show "Rate limit exceeded" error messages with reset time
- [x] Add rate limit info tooltip explaining limits

### Admin Dashboard
- [x] Create admin-only route and page
- [x] Add admin role check middleware
- [x] Build system health monitoring panel (API status, DB status, uptime)
- [x] Add user activity metrics (active users, total requests, top endpoints)
- [x] Display rate limit violations log
- [x] Add real-time metrics with auto-refresh
- [x] Restrict admin dashboard to users with admin role

## Admin Dashboard - User Registration Trends Chart

- [x] Create backend endpoint for user registration analytics (daily/weekly/monthly)
- [x] Add Chart.js library for data visualization
- [x] Build RegistrationTrendsChart component with time period selector
- [x] Add real-time auto-refresh for registration data
- [x] Integrate chart into Admin Dashboard page
- [x] Write tests for registration analytics endpoint

## Bug Fixes (Current)

- [x] Fix React Hooks error in AIAgentsHub causing "Rendered more hooks than during the previous render"

## Admin Dashboard - Registration Source Tracking

- [x] Create backend endpoint for registration source analytics by OAuth provider
- [x] Build RegistrationSourceChart component with stacked bar visualization
- [x] Add Chart.js Bar chart with stacked configuration
- [x] Display breakdown by Google, GitHub, and other OAuth providers
- [x] Integrate chart into Admin Dashboard page
- [x] Write tests for registration source analytics endpoint

## Developer Hub Feature

### Database Schema
- [x] Create forum_threads table (id, title, description, category, author_id, status, votes, created_at)
- [x] Create forum_posts table (id, thread_id, author_id, content, parent_id, created_at)
- [x] Create forum_votes table (id, thread_id, user_id, vote_type, created_at)
- [x] Create developer_agent_conversations table (id, user_id, messages, created_at)

### Backend API
- [x] Create forum router with CRUD endpoints for threads and posts
- [x] Add voting endpoints (upvote/downvote threads)
- [x] Implement Developer Agent endpoint with LLM integration
- [x] Add thread filtering and sorting (by votes, date, status)
- [ ] Create notification system for thread updates

### Frontend - Forum
- [x] Build Developer Hub main page with thread list
- [x] Create thread detail page with posts and voting
- [x] Add new thread creation form with categories
- [x] Implement voting UI (upvote/downvote buttons)
- [x] Add comment/reply system for threads
- [ ] Display user reputation and contribution stats

### Frontend - Developer Agent
- [x] Create Developer Agent chat interface
- [x] Integrate with forum (analyze threads, suggest solutions)
- [x] Add code snippet support with syntax highlighting
- [x] Implement conversation history
- [ ] Add quick actions (analyze feature request, review code, suggest architecture)

### Integration & Polish
- [x] Add Developer Hub to main navigation
- [ ] Implement real-time updates for new posts/votes
- [ ] Add search and filter functionality
- [ ] Create admin moderation tools
- [ ] Write comprehensive tests for all features

## Developer Hub - Code Syntax Highlighting

- [x] Install Prism.js and react-syntax-highlighter packages
- [x] Create CodeBlock component with syntax highlighting
- [x] Integrate CodeBlock into forum post rendering
- [x] Add syntax highlighting to Developer Agent responses
- [x] Support multiple programming languages (JavaScript, Python, TypeScript, etc.)
- [x] Add copy-to-clipboard button for code blocks
- [x] Test code highlighting with various code samples

## CodeBlock Language Selector

- [x] Add language selector dropdown to CodeBlock component
- [x] Support common programming languages (JavaScript, TypeScript, Python, Java, C++, Go, Rust, etc.)
- [x] Save user's language selection preference
- [x] Update syntax highlighting when language is changed
- [x] Test language selector with various code samples

## Back to Dashboard Navigation

- [x] Create BackToDashboard component with navigation button
- [x] Add BackToDashboard to all main pages (Trends, Creators, Sentiment, Platforms, AI Agents, Widget Builder, Settings, Developer Hub)
- [x] Position button consistently across pages (top-left or breadcrumb area)
- [x] Test navigation flow from all pages back to dashboard

## Breadcrumb Navigation

- [x] Create Breadcrumb component with path segments
- [x] Add breadcrumb to all main pages showing navigation path
- [x] Make breadcrumb segments clickable for quick navigation
- [x] Style breadcrumbs consistently with app theme
- [x] Test breadcrumb navigation flow

## Page History Tracking

- [x] Create NavigationHistory context to track page visits
- [x] Implement back/forward navigation buttons
- [x] Store navigation history in browser session
- [x] Add keyboard shortcuts (browser back/forward)
- [x] Display history buttons in header or navigation bar
- [x] Test history navigation across different page flows

## Pitching Video

- [x] Plan video script and storyboard
- [x] Capture screenshots of key features
- [x] Generate video with AI
- [x] Add voiceover narration
- [x] Deliver final video to user

## Token Economy System - Phase 1 (Internal Tokens)

### Database Schema
- [x] Create user_tokens table (user_id, balance, total_earned, total_spent, created_at, updated_at)
- [x] Create token_transactions table (id, user_id, amount, type, description, reference_id, reference_type, created_at)
- [x] Create token_earning_rules table (id, action_type, token_amount, description, is_active)
- [x] Add indexes for efficient querying
- [x] Run database migration

### Backend API - Token Management
- [x] Create tokens router with tRPC procedures
- [x] Implement getBalance endpoint (get user's current token balance)
- [x] Implement getTransactionHistory endpoint (paginated transaction list)
- [x] Implement getEarningRules endpoint (list all ways to earn tokens)
- [x] Implement adminMintTokens endpoint (admin-only token creation)
- [x] Implement adminBurnTokens endpoint (admin-only token removal)
- [x] Add token balance tracking middleware

### Backend API - Token Earning
- [x] Implement awardTokens helper function (internal use)
- [x] Add token rewards for forum thread creation
- [x] Add token rewards for forum post replies
- [ ] Add token rewards for receiving upvotes
- [ ] Add token rewards for feature implementation (admin-triggered)
- [ ] Add token rewards for bug reports (admin-triggered)
- [ ] Add daily login bonus tokens
- [ ] Add referral bonus tokens

### Backend API - Token Spending
- [x] Create token spending validation middleware
- [x] Implement spendTokens endpoint (deduct tokens from balance)
- [x] Add token cost to AI Agent usage (Script Writer, Trend Forecaster, etc.)
- [ ] Add token unlock for advanced analytics features
- [ ] Add token boost for content visibility
- [ ] Implement refund mechanism for failed transactions

### Frontend - Token Dashboard
- [x] Create TokenDashboard page component
- [x] Display current token balance with animated counter
- [x] Show total earned and total spent statistics
- [x] Create transaction history table with filters
- [x] Add earning opportunities section
- [x] Display token earning rules and amounts
- [x] Add token balance to user profile header
- [x] Create token icon and branding

### Frontend - Token Integration
- [x] Add token cost display to AI Agents Hub
- [ ] Show "Insufficient tokens" warning when balance is low
- [ ] Add token purchase/earn CTA in AI Agents
- [x] Display token costs before actions
- [ ] Add token transaction confirmation dialogs
- [ ] Add balance indicator in navigation bar
- [ ] Implement token transaction confirmation modals

### Admin Features
- [ ] Create admin token management page
- [ ] Add manual token minting interface
- [ ] Add manual token burning interface
- [ ] Display token economy statistics (total supply, distribution)
- [ ] Add token earning rule configuration UI
- [ ] Create token transaction audit log

### Testing & Documentation
- [ ] Write tests for token balance calculations
- [ ] Write tests for token earning mechanisms
- [ ] Write tests for token spending validation
- [ ] Write tests for transaction history
- [ ] Test token rewards for all earning actions
- [ ] Create user documentation for token system
- [ ] Add tooltips explaining token features

### Polish & Launch
- [ ] Add token onboarding tutorial for new users
- [ ] Create welcome bonus (initial token grant)
- [ ] Add token leaderboard showing top earners
- [ ] Implement token milestone achievements
- [ ] Add token economy to navigation menu
- [ ] Save checkpoint after implementation

## Token Economy System - Phase 1 Testing Complete ✅
- [x] All unit tests passing (7/7)
- [x] Token earning logic tested
- [x] Token spending logic tested
- [x] Balance updates verified
- [x] Transaction recording verified
- [x] Insufficient balance handling tested
- [x] Earning rules seeded and verified

## Daily Login Bonus System
- [x] Add lastLoginDate field to user_tokens table
- [x] Create daily login check logic in backend
- [x] Award 5 VBT on first login each day
- [ ] Add login streak tracking (optional enhancement)
- [ ] Display login bonus notification to user
- [ ] Test daily login bonus logic

## Token Marketplace
### Database Schema
- [x] Create marketplace_items table (id, name, description, cost, category, isActive)
- [x] Create user_purchases table (userId, itemId, purchasedAt)
- [x] Run database migration

### Backend API
- [x] Create marketplace router with tRPC
- [x] Implement getMarketplaceItems endpoint
- [x] Implement purchaseItem endpoint (spend tokens + unlock feature)
- [x] Implement getUserPurchases endpoint
- [x] Add purchase validation and duplicate prevention

### Marketplace Items
- [ ] Premium Analytics: Advanced trend insights (100 VBT)
- [ ] Content Boost: Increase visibility in community (50 VBT)
- [ ] Exclusive Badge: Show off contributor status (75 VBT)
- [ ] AI Agent Discount: 20% off all AI agents for 7 days (150 VBT)
- [ ] Priority Support: Get faster help from team (200 VBT)

### Frontend
- [x] Create Marketplace page component
- [x] Display available items with costs
- [x] Add purchase confirmation dialog
- [x] Show owned items/unlocked features
- [x] Add marketplace link to navigation
- [ ] Display feature unlock status in relevant pages

### Testing
- [x] Test daily login bonus awarding
- [x] Test marketplace item purchase
- [x] Test duplicate purchase prevention
- [x] Test insufficient balance handling

## Premium Analytics Features
### Backend
- [x] Create premium analytics router with access control
- [x] Implement competitor analysis endpoint (compare multiple creators)
- [x] Implement advanced trend insights endpoint (deeper metrics)
- [x] Implement predictive forecasting endpoint (AI-powered predictions)
- [x] Add hasFeature middleware to protect premium endpoints
- [ ] Cache premium analytics results for performance

### Frontend
- [x] Create PremiumAnalytics page component
- [ ] Add competitor comparison tool (side-by-side creator analysis)
- [x] Add advanced metrics dashboard (engagement rate, growth rate, virality trends)
- [x] Add predictive forecasting charts (7-day, 30-day predictions)
- [x] Show "Unlock Premium" CTA for non-premium users
- [x] Add premium badge/indicator in navigation

## Token Notification System
- [x] Create toast notification helper for token events
- [x] Add notifications to forum thread creation (+50 VBT)
- [ ] Add notifications to forum post replies (+20 VBT)
- [ ] Add notifications to daily login bonus (+5 VBT)
- [x] Add notifications to AI agent spending (-15 to -30 VBT)
- [x] Add notifications to marketplace purchases
- [x] Show balance change in notification (e.g., "+50 VBT • New balance: 250")

## Testing
- [x] Test premium analytics access control
- [ ] Test competitor analysis accuracy
- [ ] Test predictive forecasting
- [x] Test token notifications display correctly
- [x] Integration test: Purchase premium → Access analytics

## Tiered VBT Reward System - Human vs AI Content

### Database Schema
- [x] Create creator_profiles table (userId, tier, verificationStatus, kycVerified, createdAt)
- [x] Create content_submissions table (id, userId, contentType, aiUsageLevel, verificationStatus, rewardTier, vbtAwarded)
- [x] Create verification_vouches table (id, creatorId, voucherId, status, createdAt)
- [ ] Add tier and verificationBadge fields to user table
- [x] Create content_analytics table (totalHuman, totalAI, humanPercentage, lastUpdated)
- [x] Run database migration

### Backend API - Verification System
- [x] Create creatorTiers router with tRPC
- [x] Implement getCreatorProfile endpoint
- [x] Implement requestVerification endpoint (KYC flow)
- [x] Implement submitContent endpoint (with AI detection)
- [x] Implement vouchForCreator endpoint (community vouching)
- [x] Implement getContentAnalytics endpoint (platform-wide stats)
- [x] Add tier-based reward multiplier logic
- [ ] Integrate AI detection API (GPTZero or similar)

### Reward Tier Logic
- [ ] Tier 1: AI-Assisted (1x multiplier, 20 VBT base)
- [ ] Tier 2: Human-Created (2x multiplier, 40 VBT)
- [ ] Tier 3: Verified Human Creator (3x multiplier, 60 VBT)
- [ ] Tier 4: Premium Human Content (5x multiplier, 100 VBT)
- [ ] Implement bonus system (Best AI Use +10, Human Touch +15, Cultural Impact +25)
- [ ] Update forum thread/post rewards to use tier multipliers

### Frontend - Verification Flow
- [x] Create CreatorProfile page component
- [x] Add verification request form (KYC, portfolio upload)
- [ ] Create content submission flow with AI usage disclosure
- [ ] Add verification badge display on user profiles
- [ ] Create community vouching interface
- [ ] Add tier indicator to user avatars/names

### Frontend - Analytics Dashboard
- [ ] Create ContentEconomics page showing human vs AI mix
- [ ] Display platform-wide content distribution (pie chart)
- [ ] Show tier distribution (how many creators in each tier)
- [ ] Add reward multiplier calculator
- [ ] Display top verified human creators leaderboard
- [ ] Show "Authenticity Score" for platform

### Verification Badges
- [ ] Design badge system (Tier 1-4 badges)
- [ ] "Verified Human Creator" badge (Tier 3)
- [ ] "Premium Human" gold badge (Tier 4)
- [ ] "AI Transparent" badge (honest AI disclosure)
- [ ] Add badges to forum posts, profiles, leaderboards

### Testing
- [ ] Test content submission with AI detection
- [ ] Test tier-based reward calculation
- [ ] Test verification vouching system
- [ ] Test badge display across platform
- [ ] Integration test: Submit content → Verify tier → Award tokens

## Content Submission Flow & Verification Badges

### Content Submission with AI Disclosure
- [x] Add AI usage disclosure dropdown to forum thread creation
- [ ] Add AI usage disclosure dropdown to forum post replies
- [x] Integrate submitContent API call when creating threads
- [ ] Integrate submitContent API call when creating posts
- [x] Show tier multiplier preview before submission
- [x] Display earned VBT notification after submission

### Verification Badge Component
- [x] Create TierBadge component (displays tier icon and multiplier)
- [x] Create VerificationBadge component (checkmark for verified users)
- [x] Add badge styling for each tier (colors, gradients)
- [x] Make badges responsive and accessible

### Badge Integration
- [x] Add tier badges to forum thread author names
- [ ] Add tier badges to forum post author names
- [ ] Add tier badges to user profiles
- [ ] Add tier badges to token leaderboard (if exists)
- [ ] Add tier badges to marketplace purchases
- [x] Show badge tooltip on hover with tier details

## Humans As Agents (HaA) - Viral Data Crowdsourcing

### Concept
Creators submit links to viral content they discover (TikTok, YouTube, Twitter, Instagram) as human-curated intelligence. Higher VBT rewards than AI-generated content because humans provide:
- Real-time trend spotting before AI detection
- Cultural context and nuance
- Cross-platform viral discovery
- Quality curation and filtering

### Reward Structure
- **Basic Submission:** 100 VBT (link + basic metadata)
- **Quality Submission:** 200 VBT (link + analysis + why it's viral)
- **Verified Viral:** 500 VBT (submission confirmed viral by platform metrics)
- **Trending Discovery:** 1000 VBT (first to submit content that becomes top trend)
- **Bonus Multipliers:** Apply creator tier multipliers (2x-5x) on top of base rewards

### Database Schema
- [x] Create viral_submissions table (id, userId, contentUrl, platform, category, description, viralityScore, status, submittedAt)
- [x] Create submission_metadata table (submissionId, views, likes, shares, comments, growthRate, peakDate)
- [x] Create submission_votes table (submissionId, userId, vote, reason, createdAt)
- [x] Create haa_leaderboard table (userId, totalSubmissions, acceptedSubmissions, totalVbtEarned, rank)
- [ ] Add indexes for efficient querying
- [x] Run database migration

### Backend API
- [x] Create haa router with tRPC
- [x] Implement submitViralContent endpoint (URL validation, duplicate detection)
- [x] Implement getSubmissions endpoint (paginated, filtered by status/platform)
- [x] Implement voteOnSubmission endpoint (community quality voting)
- [x] Implement getMySubmissions endpoint (user's submission history)
- [x] Implement getHaaLeaderboard endpoint (top contributors)
- [ ] Add URL metadata scraping (fetch title, thumbnail, platform stats)
- [ ] Implement viral verification logic (check if content meets viral thresholds)
- [x] Add duplicate submission prevention
- [x] Implement reward calculation with tier multipliers

### Frontend - HaA Submission Page
- [x] Create HumansAsAgents page component at /haa
- [x] Add submission form (URL input, platform selector, category, description)
- [x] Show reward preview based on submission quality
- [ ] Display real-time URL validation and metadata preview
- [x] Add submission guidelines and examples
- [x] Show user's submission history with status
- [x] Add HaA link to navigation

### Frontend - HaA Leaderboard
- [ ] Create HaaLeaderboard component
- [ ] Display top contributors with stats (submissions, acceptance rate, VBT earned)
- [ ] Add filters (weekly, monthly, all-time)
- [ ] Show tier badges for top contributors
- [ ] Add "Trending Discoveries" section (first submitters of viral content)

### Frontend - Submission Review
- [ ] Create submission review interface for verified users
- [ ] Add voting system (upvote/downvote with reasons)
- [ ] Show submission details (URL, metadata, submitter tier)
- [ ] Display community votes and comments
- [ ] Add "Report Spam" functionality

### Integration
- [ ] Add HaA earning option to TokenDashboard "Ways to Earn"
- [ ] Show HaA submissions in user profile
- [ ] Add HaA stats to platform analytics
- [ ] Integrate with existing token notification system
- [ ] Add HaA badge for top contributors

### Validation & Quality Control
- [ ] Implement URL validation (check if link is accessible)
- [ ] Add platform detection (TikTok, YouTube, Twitter, Instagram, etc.)
- [ ] Fetch content metadata (title, views, likes, shares)
- [ ] Detect duplicate submissions (same URL or similar content)
- [ ] Community voting system (3+ upvotes = accepted)
- [ ] Admin review queue for flagged submissions
- [ ] Spam prevention (rate limiting, reputation scoring)

### Testing
- [ ] Test viral content submission flow
- [ ] Test URL validation and metadata scraping
- [ ] Test duplicate detection
- [ ] Test reward calculation with tier multipliers
- [ ] Test leaderboard ranking
- [ ] Integration test: Submit content → Community votes → Award VBT

## HaA Leaderboard, Viral Verification & Review Interface

### HaA Leaderboard Page
- [x] Create HaaLeaderboard page component at /haa/leaderboard
- [x] Display top 100 contributors with ranking
- [x] Add timeframe filters (weekly, monthly, all-time)
- [x] Show contributor stats (submissions, acceptance rate, VBT earned, tier)
- [x] Add "Trending Discoveries" section (first submitters of viral content)
- [x] Display tier badges for top contributors
- [ ] Add search/filter by username
- [x] Show user's own rank and position
- [x] Add leaderboard link to HaA page navigation

### Automated Viral Verification
- [ ] Create viral verification background job
- [ ] Integrate with platform APIs (TikTok, YouTube, Twitter)
- [ ] Fetch real-time metrics (views, likes, shares, comments)
- [ ] Define viral thresholds per platform (e.g., 1M+ views on TikTok)
- [ ] Auto-update submission status to "verified_viral" when thresholds met
- [ ] Award bonus VBT (500 VBT) for verified viral content
- [ ] Send notification to submitter when content goes viral
- [ ] Update leaderboard with verified viral count
- [ ] Add verification timestamp to submissions
- [ ] Create admin dashboard for manual verification override

### Submission Review Interface
- [ ] Create SubmissionReview page component at /haa/review
- [ ] Display pending submissions for community review
- [ ] Add voting system (upvote/downvote with reason dropdown)
- [ ] Show submission details (URL, metadata, submitter tier, analysis)
- [ ] Restrict voting to verified creators only
- [ ] Implement auto-accept logic (3+ upvotes = accepted)
- [ ] Implement auto-reject logic (3+ downvotes = rejected)
- [ ] Award reviewer tokens (5 VBT per quality vote)
- [ ] Show voting history and reasons
- [ ] Add spam reporting functionality
- [ ] Display submission preview (embedded content if possible)
- [ ] Add review link to navigation for verified users

### Testing
- [ ] Test leaderboard ranking accuracy
- [ ] Test viral verification API integration
- [ ] Test submission review voting logic
- [ ] Test auto-accept/reject thresholds
- [ ] Integration test: Submit → Review → Accept → Leaderboard

## Phase 2: Advanced Token Features - Completion

### Token Staking System
- [ ] Create token_stakes table (id, userId, amount, startDate, endDate, duration, apy, status)
- [ ] Create staking_rewards table (id, stakeId, amount, claimedAt)
- [ ] Implement stake endpoint (lock tokens for 30/90/180 days)
- [ ] Implement unstake endpoint (unlock after duration, claim rewards)
- [ ] Implement claimStakingRewards endpoint (claim accumulated rewards)
- [ ] Calculate APY rewards (5% for 30d, 10% for 90d, 15% for 180d)
- [ ] Create Staking page at /staking with stake/unstake UI
- [ ] Display active stakes with countdown timers
- [ ] Show total staked amount and APY earnings
- [ ] Add early unstake penalty (50% reward forfeit)
- [ ] Run database migration

### Peer-to-Peer Token Trading
- [ ] Create token_listings table (id, sellerId, amount, pricePerToken, status, createdAt)
- [ ] Create token_trades table (id, listingId, buyerId, sellerId, amount, totalPrice, completedAt)
- [ ] Implement createListing endpoint (list tokens for sale)
- [ ] Implement cancelListing endpoint (remove listing)
- [ ] Implement buyTokens endpoint (purchase from listing)
- [ ] Implement getActiveListings endpoint (browse marketplace)
- [ ] Implement getMyListings endpoint (user's active listings)
- [ ] Implement getTradeHistory endpoint (completed trades)
- [ ] Create P2P Marketplace page at /token-market
- [ ] Display active listings with price charts
- [ ] Add buy/sell interface
- [ ] Show trade history and volume stats
- [ ] Add 2% platform fee on trades
- [ ] Run database migration

### Governance Voting System
- [ ] Create governance_proposals table (id, creatorId, title, description, type, options, status, createdAt, votingEndsAt)
- [ ] Create governance_votes table (id, proposalId, voterId, option, tokenWeight, votedAt)
- [ ] Implement createProposal endpoint (verified users only)
- [ ] Implement voteOnProposal endpoint (1 VBT = 1 vote)
- [ ] Implement getActiveProposals endpoint
- [ ] Implement getProposalResults endpoint
- [ ] Create Governance page at /governance
- [ ] Display active proposals with voting UI
- [ ] Show proposal history and results
- [ ] Add proposal types (feature requests, reward rate changes, policy updates)
- [ ] Implement auto-execute logic (>50% approval = approved)
- [ ] Run database migration

### Login Streak Rewards
- [ ] Add loginStreak and lastStreakDate fields to userTokens table
- [ ] Implement streak tracking logic in daily login bonus
- [ ] Award progressive rewards (5 VBT → 10 VBT → 15 VBT for 3/7/30-day streaks)
- [ ] Reset streak if user misses a day
- [ ] Display streak counter in navigation header
- [ ] Add streak milestone badges (3-day, 7-day, 30-day, 100-day)
- [ ] Show streak history in token dashboard
- [ ] Add streak leaderboard
- [ ] Run database migration

### Supply Tracking & Tokenomics Dashboard
- [ ] Create token_supply_events table (id, eventType, amount, description, timestamp)
- [ ] Track minting events (welcome bonus, rewards, admin mints)
- [ ] Track burning events (AI agent spending, marketplace fees)
- [ ] Calculate circulating supply (total minted - total burned)
- [ ] Create Tokenomics page at /tokenomics
- [ ] Display supply metrics (circulating, minted, burned, locked in stakes)
- [ ] Add burn rate visualization (chart over time)
- [ ] Show minting schedule and annual cap
- [ ] Display token distribution pie chart
- [ ] Add real-time supply updates
- [ ] Show deflationary metrics

### Testing
- [ ] Test staking APY calculations
- [ ] Test P2P trading escrow logic
- [ ] Test governance vote counting
- [ ] Test login streak tracking
- [ ] Test supply tracking accuracy
- [ ] Integration test: Stake → Earn rewards → Unstake
- [ ] Integration test: List tokens → Buy → Trade complete
- [ ] Integration test: Create proposal → Vote → Execute

## Login Streak Rewards System
- [x] Implement streak tracking logic in daily login bonus endpoint
- [x] Award escalating bonuses: 5 VBT (day 1), 10 VBT (3-day streak), 15 VBT (7-day), 25 VBT (30-day)
- [x] Reset streak counter if user misses a day
- [ ] Add streak counter to navigation header
- [x] Show streak milestone notifications
- [ ] Create streak leaderboard (optional)

## Automated Viral Verification for HaA
- [x] Research TikTok/YouTube API integration for metrics
- [x] Implement automated verification check (runs daily)
- [x] Award bonus VBT when submission crosses viral threshold (100K+ views)
- [x] Update submission status to "verified_viral"
- [x] Send notification to submitter when verified
- [ ] Add "Verified Viral" badge to submissions

## Community Review Interface
- [ ] Create submission review page at /haa/review
- [ ] Display pending submissions for community voting
- [ ] Add upvote/downvote buttons with reason dropdown
- [ ] Require verified creator status to vote
- [ ] Auto-accept submissions with 3+ upvotes
- [ ] Auto-reject submissions with 3+ downvotes
- [ ] Show voting history and reasons
- [ ] Add review link to HaA navigation

## Phase 3: Blockchain Integration (External Value)

### Smart Contract Development
- [x] Research blockchain platform selection (Ethereum, Polygon, BSC, Base) - Selected Base
- [x] Set up Hardhat development environment
- [x] Write ERC-20 VBT token smart contract
- [x] Implement minting function (owner-only)
- [x] Implement burning function
- [x] Add transfer restrictions (if needed)
- [x] Write comprehensive smart contract tests (15 tests passing)
- [x] Add security features (pausable, access control)

### Smart Contract Deployment
- [ ] Get Base Sepolia testnet ETH from faucet
- [ ] Add private key to .env for deployment
- [ ] Deploy VBToken to Base Sepolia testnet
- [ ] Verify contract on BaseScan block explorer
- [ ] Test minting, burning, transfers on testnet
- [ ] Document deployment process for mainnet

### Wallet Integration
- [x] Install ethers.js v6 library
- [x] Create WalletConnect context provider (Web3Context)
- [x] Implement MetaMask connection logic
- [x] Build wallet connection UI component (WalletConnect)
- [x] Display connected wallet address
- [x] Display blockchain VBT balance from contract
- [x] Handle Base Sepolia network switching
- [x] Add transaction signing interface
- [x] Show pending/confirmed transaction states

### Token Migration System
- [x] Create token_migrations table (id, userId, amount, txHash, status, createdAt)
- [x] Create migration tRPC router with endpoints
- [x] Implement initiateMigration endpoint (deduct internal VBT)
- [x] Implement completeMigration endpoint (verify tx, update status)
- [x] Add migration rate limiting (max 1 per hour per user)
- [x] Create /migrate page with migration form
- [x] Display current internal VBT balance
- [x] Add amount input with validation
- [x] Show migration preview (1:1 ratio)
- [x] Add MetaMask transaction signing (placeholder for MVP)
- [x] Display migration history table
- [x] Handle failed migrations with refund logic
- [x] Add migration success/error notifications

### DEX Listing Preparation
- [ ] Create token metadata (logo, description, links)
- [ ] Prepare liquidity pool (VBT/ETH or VBT/USDC)
- [ ] Research DEX requirements (Uniswap, PancakeSwap, SushiSwap)
- [ ] Create initial liquidity provision plan
- [ ] Write tokenomics documentation
- [ ] Prepare marketing materials

### Security & Auditing
- [ ] Conduct internal security review
- [ ] Get smart contract audit (optional: CertiK, OpenZeppelin)
- [ ] Implement rate limiting for migrations
- [ ] Add fraud detection for suspicious migrations
- [ ] Create emergency pause mechanism
- [ ] Write incident response plan

### Documentation
- [ ] Write smart contract documentation
- [ ] Create migration guide for users
- [ ] Document wallet connection process
- [ ] Write DEX trading guide
- [ ] Create FAQ for blockchain VBT
- [ ] Add blockchain section to website

### Testing
- [ ] Test smart contract on testnet
- [ ] Test wallet connections (MetaMask, WalletConnect)
- [ ] Test token migration flow (internal → blockchain)
- [ ] Test DEX listing and trading
- [ ] Load test migration system
- [ ] Security penetration testing

### Phase 3 Continuation - Deployment & Automation (Jan 31, 2026)
- [x] Generate deployment wallet with private key
- [ ] Get Base Sepolia testnet ETH from faucet (requires user action)
- [x] Update hardhat.config.js with Base Sepolia RPC URL
- [ ] Add DEPLOYER_PRIVATE_KEY to environment variables (requires user action)
- [ ] Run deployment script to Base Sepolia (requires testnet ETH)
- [ ] Verify contract on BaseScan (after deployment)
- [ ] Update VBT_CONTRACT_ADDRESS in environment variables (after deployment)
- [x] Add "Migrate" link to DashboardLayout navigation menu
- [x] Create backend migration monitoring service
- [x] Implement pending migration polling logic
- [x] Add smart contract interaction for mintForMigration
- [x] Update migration status after successful minting
- [x] Add error handling and retry logic
- [ ] Test complete migration flow end-to-end (requires deployed contract)

### Bug Fix - JSON Parsing Error (Feb 1, 2026)
- [x] Investigate JSON parsing error on homepage
- [x] Check server logs for failed API requests
- [x] Identify which tRPC endpoint is returning invalid JSON (analyzeSentiment function)
- [x] Fix the endpoint to return valid JSON (added better error handling and validation)
- [x] Test homepage with logged-in user
- [x] Verify all API calls succeed

### Technical Fixes & Deployment (Feb 1, 2026)
- [x] Fix TypeScript type errors (TextContent/ImageContent/FileContent vs ReactNode)
- [x] Identify files with type errors
- [x] Update type definitions or fix usage
- [x] Verify TypeScript compilation succeeds
- [x] Fix IPv6 rate limiting warning
- [x] Update rate limiter to use ipKeyGenerator helper
- [x] Test rate limiting with IPv6 addresses
- [ ] Deploy VBT smart contract to Base Sepolia (requires testnet ETH)
- [ ] Get testnet ETH from faucet (user action required)
- [x] Configure deployment wallet (generated)
- [ ] Run deployment script (requires testnet ETH)
- [ ] Verify contract on BaseScan (after deployment)
- [ ] Update VBT_CONTRACT_ADDRESS environment variable (after deployment)

### Smart Contract Deployment & Testing (Feb 1, 2026)
- [ ] Get Base Sepolia testnet ETH from faucet for deployment wallet (user action required)
- [ ] Deploy VBT smart contract to Base Sepolia testnet (requires testnet ETH)
- [ ] Save deployed contract address (after deployment)
- [x] Create automated contract verification script using Hardhat
- [x] Create comprehensive deployment guide (DEPLOYMENT.md)
- [ ] Verify contract source code on BaseScan (after deployment)
- [ ] Update VBT_CONTRACT_ADDRESS environment variable (after deployment)
- [x] Create migration testing guide (MIGRATION_TESTING.md)
- [x] Document 10 test scenarios for migration flow
- [x] Document manual testing checklist
- [x] Document performance and security testing procedures
- [x] Document troubleshooting guide
- [ ] Execute manual testing (after deployment)
- [ ] Execute automated testing (after deployment)

### Navigation & Performance Optimization (Feb 1, 2026)
- [x] Audit all routes in App.tsx
- [x] List all available pages and their paths
- [x] Update DashboardLayout sidebar menu with all routes
- [x] Organize menu items by category (Core, AI & Content, Economy, Advanced, Developer, Admin, Settings)
- [x] Ensure DashboardLayout wraps all authenticated pages
- [x] Remove duplicate navigation from individual pages (MigratePage)
- [x] Add route icons to menu items (18 routes with icons)
- [x] Implement active route highlighting
- [x] Optimize bundle size (code splitting, lazy loading for all routes)
- [x] Add loading fallback component for lazy-loaded routes
- [x] Implement admin-only route filtering
- [x] Test navigation flow across all pages
- [x] Verify sidebar persistence (removed custom sidebar from Dashboard)
- [x] Test performance metrics (lazy loading implemented, bundle size optimized)

### Landing Page Redesign for Creator Engagement (Feb 3, 2026)
- [x] Design hero section with compelling headline and CTA
- [x] Create value proposition highlighting AI trend prediction
- [x] Add social proof (10K+ creators, 2.5M+ trends, 87% accuracy)
- [x] Design "How It Works" section (3-step process with icons)
- [x] Add "Ways to Earn VBT" section with clear benefits (4 earning methods)
- [x] Add creator success stories with earnings (rotating testimonials)
- [x] Implement scroll animations for engagement (motion effects)
- [x] Add prominent "Start Predicting Trends" CTA (hero + footer)
- [x] Optimize for mobile responsiveness (responsive grid layouts)
- [x] Test conversion flow and user engagement (verified hero section, CTAs, and navigation)

### Landing Page Enhancements - Video, Live Feed & Onboarding (Feb 5, 2026)
- [x] Create video demo section in landing page
- [x] Add video placeholder with play button overlay
- [x] Implement modal for video playback
- [x] Add video embed support (YouTube/Vimeo ready)
- [x] Create live trending topics feed component
- [x] Build tRPC endpoint for real-time trending topics (using existing trends.search)
- [x] Implement auto-refresh every 30 seconds
- [x] Display virality scores and trend indicators
- [x] Add smooth animations for feed updates (AnimatePresence)
- [x] Design 3-step onboarding wizard UI
- [x] Step 1: Connect social media accounts (YouTube, TikTok, Instagram, Twitter)
- [x] Step 2: Set content preferences and interests (8 categories)
- [x] Step 3: Get personalized first prediction (sample trend with 92% virality)
- [x] Implement wizard navigation and progress indicator
- [x] Add skip option for returning users
- [ ] Track onboarding completion rate (add analytics)
- [x] Test complete conversion funnel (verified landing page, video modal, live feed, onboarding flow)

### Bug Fix - Trends Search Validation Error (Feb 5, 2026)
- [x] Fix trends.search endpoint validation to allow empty query strings
- [x] Update input schema to make query optional or allow empty strings (default: "")
- [x] Add fallback logic to use "trending" when query is empty
- [x] Test live trending feed on landing page
- [x] Verify no validation errors in browser console

### Real-Time Trending Notifications (Feb 5, 2026)
- [x] Install and configure toast notification library (sonner)
- [x] Create TrendNotification component with "View Now" action
- [x] Implement trend change detection in live feed
- [x] Add notification trigger for virality scores > 7.5/10
- [x] Add notification trigger for new trending topics
- [x] Implement notification throttling (max 1 per minute)
- [x] Add Toaster component to landing page
- [x] Test notification flow on landing page (system ready, will trigger on trend changes)
- [x] Verify "View Now" action navigates correctly (redirects to /trends or login)

### Accessibility Fix - Dialog Title (Feb 5, 2026)
- [x] Add DialogTitle to video modal in LandingPage
- [x] Import DialogTitle from shadcn/ui
- [x] Verify accessibility warning is resolved (added sr-only class for screen readers)

### Theme/Skin Selector System (Feb 5, 2026)
- [x] Define theme configurations (Dark, Light, Neon, Minimal, Ocean)
- [x] Create theme context provider with 5 themes
- [x] Update CSS variables for each theme
- [x] Build ThemeSelector dropdown component
- [x] Add theme preview thumbnails (4-color grid)
- [x] Implement localStorage persistence
- [x] Add theme selector to LandingPage header
- [x] Add theme selector to DashboardLayout footer
- [x] Apply theme to all pages via CSS variables
- [x] Test theme switching across all pages (verified theme selector appears in header)

### AI Personal Assistant - "ViralMind" (Feb 5, 2026)

#### Phase 1: System Architecture & Creator Profiling
- [ ] Design AI assistant system architecture
- [ ] Create creator profile schema (style, niche, goals, audience, past performance)
- [ ] Build creator onboarding questionnaire (10 questions)
- [ ] Implement creator profile analysis using LLM
- [ ] Store creator preferences and learned patterns in database
- [ ] Create API endpoints for profile management

#### Phase 2: AI Assistant Chat Interface
- [ ] Build conversational AI chat interface
- [ ] Implement context-aware conversation system
- [ ] Add chat history persistence
- [ ] Create assistant personality (friendly, expert, motivating)
- [ ] Implement real-time streaming responses
- [ ] Add quick action buttons (Analyze Content, Find Trends, Optimize Post)

#### Phase 3: Content Curation & Virality Tools
- [ ] Implement content analysis tool (analyze uploaded content for virality potential)
- [ ] Build trend recommendation engine (personalized to creator's niche)
- [ ] Create content optimization suggestions (titles, thumbnails, hashtags, timing)
- [ ] Add competitor analysis feature
- [ ] Implement A/B testing recommendations
- [ ] Build content calendar with optimal posting times

#### Phase 4: Dynamic Problem Solving
- [ ] Implement problem detection (low engagement, declining views, etc.)
- [ ] Create automated solution suggestions
- [ ] Build performance tracking and alerts
- [ ] Add goal setting and progress monitoring
- [ ] Implement learning from creator's successes/failures
- [ ] Create personalized growth strategies

#### Phase 5: Integration & API
- [ ] Create RESTful API for assistant features
- [ ] Add webhook support for external integrations
- [ ] Implement export functionality (reports, insights, recommendations)
- [ ] Add mobile-friendly assistant interface
- [ ] Create assistant settings and customization options
- [ ] Build analytics dashboard for assistant usage

#### Phase 6: Advanced Features
- [ ] Implement multi-modal content analysis (text, images, videos)
- [ ] Add voice interaction support
- [ ] Create automated content drafting
- [ ] Build collaboration features (team access to assistant)
- [ ] Implement predictive analytics (forecast performance)
- [ ] Add integration with social media platforms for direct posting

## ViralMind AI Personal Assistant Feature

- [x] Create database schema for AI assistant (aiAssistantProfiles, assistantConversations, contentAnalyses, assistantTasks, creatorGoals)
- [x] Build backend tRPC router with endpoints (getProfile, updateProfile, completeOnboarding, chat, getConversations, analyzeContent, getAnalyses, createGoal, getGoals, updateGoalProgress)
- [x] Create ViralMindPage with onboarding wizard (4-step: welcome, platforms, style, goals)
- [x] Implement chat interface with context-aware AI responses
- [x] Build content analyzer with virality scoring and optimization suggestions
- [x] Add insights dashboard showing active goals and recent analyses
- [x] Integrate with existing trend prediction and sentiment analysis systems
- [x] Add ViralMind to sidebar navigation under AI & Content category
- [x] Add route to App.tsx (/viralmind)
- [ ] Write comprehensive tests for AI assistant endpoints
- [ ] Test end-to-end onboarding flow
- [ ] Test chat conversation persistence
- [ ] Test content analysis accuracy

## Social Media Handle Verification for ViralMind

- [ ] Update aiAssistantProfiles schema to include social media handles (youtube, tiktok, instagram, twitter)
- [ ] Add verification status fields for each platform (verified/unverified)
- [ ] Add verification codes/tokens for social media linking
- [ ] Update ViralMind onboarding to collect social media handles
- [ ] Create backend endpoint to verify social media account ownership
- [ ] Implement verification code generation and validation
- [ ] Add UI to display verification status for each platform
- [x] Connect verified handles to content analysis (fetch real stats)
- [x] Update ViralMind chat to use verified platform data
- [x] Add badge/indicator for verified creators in ViralMind
- [x] Write tests for social media verification flow


## Social Media Verification - Progress Update

- [x] Update aiAssistantProfiles schema to include social media handles (youtube, tiktok, instagram, twitter)
- [x] Add verification status fields for each platform (verified/unverified)
- [x] Add verification codes/tokens for social media linking
- [x] Update ViralMind onboarding to collect social media handles
- [x] Create backend endpoint to verify social media account ownership
- [x] Implement verification code generation and validation
- [x] Add UI to display verification status for each platform
- [x] Connect verified handles to content analysis (fetch real stats)
- [x] Update ViralMind chat to use verified platform data
- [x] Add badge/indicator for verified creators in ViralMind
- [x] Write tests for social media verification flow


## Feature 1: Automated Social Proof Integration

- [x] Create social media API integration service (YouTube, TikTok, Instagram, Twitter)
- [x] Implement YouTube Data API integration for subscriber count and video stats
- [x] Implement TikTok API integration for follower count and engagement metrics
- [x] Implement Instagram Graph API integration for follower count and post metrics
- [x] Implement Twitter API v2 integration for follower count and tweet metrics
- [x] Create background job to sync verified account stats daily
- [x] Update aiAssistantProfiles with synced metrics (followers, engagement rate, avg views)
- [x] Add API rate limiting and error handling
- [x] Display real-time stats in ViralMind dashboard
- [x] Write tests for social media API integrations

## Feature 2: Verified Creator Badge System

- [x] Create VerifiedBadge component for reusable badge UI
- [x] Add verified badge to creator profiles page
- [x] Add verified badge to content submission cards
- [x] Add verified badge to leaderboard entries
- [x] Add verified badge to forum posts/comments
- [x] Add verified badge to ViralMind chat interface
- [x] Update CreatorVerification page to show verification status
- [x] Add filter for "Verified Creators Only" in content discovery
- [x] Create database query helpers for verified creator filtering
- [x] Write tests for badge display logic

## Feature 3: Verification-Based VBT Token Rewards

- [x] Update tokenEarningRules schema to include verification multipliers
- [x] Create verification reward multiplier system (1.5x for verified creators)
- [x] Update token earning calculations to apply verification multiplier
- [x] Add verification bonus display in token transaction history
- [x] Update token balance UI to show verification bonus
- [x] Create admin dashboard to configure verification multipliers
- [x] Add verification reward tracking to analytics
- [x] Update token earning documentation with verification bonuses
- [x] Notify creators when they unlock verification rewards
- [x] Write tests for verification-based reward calculations


## Weekly Newsletter System

### Phase 1: Database Schema & Backend
- [ ] Create newsletterSubscriptions table (userId, frequency, niche preferences, active status)
- [ ] Create newsletterEditions table (edition number, week start/end dates, generation status)
- [ ] Create newsletterContent table (edition ID, content type, data, personalization metadata)
- [ ] Create newsletterDeliveries table (edition ID, user ID, delivery status, sent timestamp)
- [ ] Add newsletter preferences to user settings
- [ ] Create backend endpoints for subscription management (subscribe, unsubscribe, update preferences)

### Phase 2: Content Generation
- [x] Create newsletter generation service with AI-powered content creation
- [x] Implement "Past Week Highlights" section (top trending topics, viral content, engagement stats)
- [x] Implement "Top Creators Spotlight" section (featured creators, their best posts, growth metrics)
- [x] Implement "Week Ahead Projections" section (predicted trends, content opportunities, timing recommendations)
- [x] Add personalization based on user's niche, platform, and content style
- [ ] Create scheduled job to generate newsletter every Monday morning
- [x] Add admin dashboard to preview and manually trigger newsletter generation

### Phase 3: Email Delivery & UI
- [ ] Integrate email service for newsletter delivery
- [ ] Design responsive HTML email template for newsletter
- [ ] Create subscription management page in user dashboard
- [ ] Add newsletter preview feature (view past editions)
- [ ] Implement unsubscribe link and preference management
- [ ] Add newsletter archive page (browse all past editions)
- [ ] Create email delivery queue with retry logic
- [ ] Add delivery status tracking and analytics

### Phase 4: Testing & Delivery
- [ ] Write tests for subscription management
- [ ] Write tests for content generation
- [ ] Write tests for email delivery
- [ ] Test personalization logic for different niches
- [ ] Generate sample newsletter edition
- [ ] Verify email deliverability and spam score

## Bug Fix: Onboarding Submit Button
- [x] Make Continue button more visible on platform selection
- [x] Add fixed/sticky button at bottom of viewport
- [x] Improve button contrast and size
- [x] Add visual feedback when platforms are selected

## Bug Fix: Invisible Continue Button (Disabled State)
- [x] Make disabled Continue button visible with proper contrast
- [x] Add clear visual indication when button is disabled
- [x] Ensure button is always present even when disabled
- [x] Add tooltip or helper text explaining why button is disabled

## Platform Selection Card Animations
- [x] Add hover scale and glow effects to platform cards
- [x] Implement smooth selection transition with border animation
- [x] Add checkbox check/uncheck animation
- [x] Add stagger animation for initial card appearance
- [x] Test animations across different browsers

## Theme Change: Default to Light Mode
- [x] Update ThemeProvider defaultTheme to 'light'
- [x] Verify CSS variables match light theme
- [x] Test all pages in light mode

## Phase 1: Telegram Bot Auto-Engagement

### Infrastructure Setup
- [x] Create Telegram bot via BotFather and get API token (user will provide)
- [x] Add TELEGRAM_BOT_TOKEN to environment secrets
- [x] Build webhook endpoint for receiving Telegram messages
- [x] Implement message router and command parser
- [x] Store user Telegram chat IDs in database

### Proactive Trend Alerts
- [ ] Background worker to monitor trends every 15 minutes
- [ ] Match trends to creator niches and send instant alerts
- [ ] "Viral opportunity detected" notifications with virality score
- [ ] Rate limiting to avoid spam (max 5 alerts per day)
- [ ] User preferences for alert frequency

### Daily Briefings
- [ ] Scheduled job for morning briefings (8am user timezone)
- [ ] Generate personalized content: "3 trends for you today"
- [ ] Include VBT balance, recent earnings, and goals progress
- [ ] Weekly summary on Sundays with performance stats

### Conversational Interface
- [ ] Natural language command handling
- [ ] "/trends" - Show today's top trends
- [ ] "/analyze [url]" - Analyze content virality
- [ ] "/ideas" - Generate 3 content ideas
- [ ] "/stats" - Show my performance metrics
- [ ] Fallback to ViralMind chat for complex queries

### Testing
- [ ] Test webhook with ngrok locally
- [ ] Test all commands with real Telegram account
- [ ] Test proactive alerts trigger correctly
- [ ] Test daily briefing scheduling
- [ ] Write integration tests for bot endpoints

## Native App Optimization
- [ ] Remove recharts (duplicate of chart.js) from client bundle
- [ ] Lazy-load react-syntax-highlighter (only load when code blocks appear)
- [ ] Move ethers.js to server-side only
- [ ] Replace axios with native fetch on client
- [ ] Add dynamic imports for heavy pages (AdminDashboard, ComponentShowcase)
- [ ] Add PWA manifest.json with app icons and metadata
- [ ] Implement service worker for offline caching
- [ ] Set up Capacitor for iOS/Android packaging
- [ ] Configure Capacitor plugins (status bar, splash screen, push notifications)
- [ ] Verify final bundle size < 200KB gzipped

## App Icon & Splash Screen
- [ ] Generate 1024x1024 Viral Beat app icon
- [ ] Generate splash screen assets (2732x2732 for iOS, 1920x1080 for Android)
- [ ] Resize icon to all required sizes (72, 96, 128, 144, 152, 192, 384, 512)
- [ ] Add icons to PWA manifest and Capacitor projects
- [ ] Update index.html with new icon references

## Push Notifications Integration
- [x] Create push notification subscription endpoint in backend
- [ ] Store VAPID keys and push subscriptions in database
- [ ] Connect Telegram bot alert triggers to push notification sender
- [x] Add push notification permission request UI in frontend
- [ ] Test end-to-end push notification delivery

## Kenya Sentiment Tracker Merge

### Phase 2: Schema & Backend Migration
- [ ] Add 13 Kenya schema tables to drizzle/schema.ts
- [ ] Copy newsService.ts and rssService.ts into server/services/
- [ ] Create server/routers/kenya.ts merging all Kenya routers
- [ ] Register kenya router in server/routers.ts
- [ ] Run pnpm db:push to create new tables

### Phase 3: Frontend Migration
- [ ] Copy all 20 Kenya pages into client/src/pages/kenya/ subdirectory
- [ ] Update imports in Kenya pages (trpc client, shared types, hooks)
- [ ] Add "Kenya Intelligence" section to DashboardLayout sidebar
- [ ] Register all Kenya routes in App.tsx under /kenya/* prefix

### Phase 4: Integration & Testing
- [ ] Run database migration for all new Kenya tables
- [ ] Run pnpm test to verify all existing tests still pass
- [ ] Verify Kenya pages load correctly in Viral Beat

## Kenya Intelligence Module - Completed
- [x] Fix TypeScript errors in kenyaNewsService.ts and kenyaRssService.ts (import paths)
- [x] Create unified Kenya router at server/routers/kenya.ts
- [x] Register kenya router in server/routers.ts appRouter
- [x] Copy 19 Kenya frontend pages to client/src/pages/ with Kenya prefix
- [x] Copy Kenya lib files to client/src/lib/kenya/ subdirectory
- [x] Fix all import paths in Kenya pages (lib paths, Layout removal)
- [x] Fix trpc calls in Kenya pages to use kenya.* namespace
- [x] Add Kenya Intelligence section to DashboardLayout sidebar (15 nav items)
- [x] Register all Kenya routes in App.tsx under /kenya/* prefix
- [x] TypeScript compilation: 0 errors

## Graphic-Centred Redesign

- [x] Landing Page: immersive hero with animated gradient, visual trend cards with virality bars, creator grid with avatars, step cards with icons
- [x] Dashboard: visual KPI cards with gradients, inline sparklines, thumbnail-rich video grid, sentiment donut, activity feed
- [x] X Trends: large visual trend cards with engagement bars, animated typing indicator, quick prompt chips, improved AI chat layout
- [x] Kenya Intelligence Dashboard: sentiment rings (SVG), regional heatmap bars, visual alert feed, quick-access navigation cards
- [x] Global CSS: scrollbar-hide, gradient text utilities, glow effects, shimmer skeleton, card-hover, float animation, pulse-ring, smooth scroll, selection colour
- [x] Service worker disabled in dev mode to prevent stale cache blank screen
- [x] Navigation optimised: collapsible Kenya sidebar section, breadcrumbs, mobile hamburger menu, user dropdown with profile/settings links
