// Social Media (X/Twitter) Data for Kenya Political Sentiment Tracker

export interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  verified: boolean;
  blueVerified: boolean;
  profileImage: string;
  followers: number;
  following: number;
  role: string;
  party?: string;
  coalition?: 'Kenya Kwanza' | 'Azimio' | 'Independent';
}

export interface Tweet {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  retweets: number;
  likes: number;
  replies: number;
  quotes: number;
  views: number;
  hashtags: string[];
  mentions: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  hateSpeechScore: number;
  divisiveScore: number;
  isRetweet: boolean;
  isReply: boolean;
  hasMedia: boolean;
  mediaType?: 'image' | 'video' | 'gif';
  engagementRate: number;
  flagged: boolean;
  flagReason?: string;
}

export interface TrendingHashtag {
  tag: string;
  tweetCount: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  politicalRelevance: 'high' | 'medium' | 'low';
  divisiveScore: number;
  topContributors: string[];
}

// Kenyan Political Figures on X/Twitter
export const twitterUsers: TwitterUser[] = [
  {
    id: 'user_1',
    username: 'WilliamsRuto',
    displayName: 'William Samoei Ruto, PhD',
    verified: true,
    blueVerified: true,
    profileImage: '/api/placeholder/48/48',
    followers: 5200000,
    following: 1200,
    role: 'President of Kenya',
    party: 'UDA',
    coalition: 'Kenya Kwanza'
  },
  {
    id: 'user_2',
    username: 'KindikiKithure',
    displayName: 'Prof. Kithure Kindiki',
    verified: true,
    blueVerified: true,
    profileImage: '/api/placeholder/48/48',
    followers: 890000,
    following: 450,
    role: 'Deputy President',
    party: 'UDA',
    coalition: 'Kenya Kwanza'
  },
  {
    id: 'user_3',
    username: 'HonWetangula',
    displayName: 'Moses Wetang\'ula',
    verified: true,
    blueVerified: true,
    profileImage: '/api/placeholder/48/48',
    followers: 420000,
    following: 890,
    role: 'National Assembly Speaker',
    party: 'Ford Kenya',
    coalition: 'Kenya Kwanza'
  },
  {
    id: 'user_4',
    username: 'SKMusyoka',
    displayName: 'Stephen Kalonzo Musyoka',
    verified: true,
    blueVerified: true,
    profileImage: '/api/placeholder/48/48',
    followers: 1800000,
    following: 560,
    role: 'Opposition Leader',
    party: 'Wiper',
    coalition: 'Azimio'
  },
  {
    id: 'user_5',
    username: 'EugeneLWamalwa',
    displayName: 'Eugene Wamalwa',
    verified: true,
    blueVerified: false,
    profileImage: '/api/placeholder/48/48',
    followers: 340000,
    following: 1200,
    role: 'DAP-K Party Leader',
    party: 'DAP-K',
    coalition: 'Azimio'
  },
  {
    id: 'user_6',
    username: 'edikiara',
    displayName: 'Edwin Sifuna',
    verified: true,
    blueVerified: true,
    profileImage: '/api/placeholder/48/48',
    followers: 1200000,
    following: 2300,
    role: 'Senator, Nairobi',
    party: 'ODM',
    coalition: 'Azimio'
  },
  {
    id: 'user_7',
    username: 'OkiyaOmtatah',
    displayName: 'Okiya Omtatah Okoiti',
    verified: true,
    blueVerified: true,
    profileImage: '/api/placeholder/48/48',
    followers: 980000,
    following: 450,
    role: 'Senator, Busia',
    party: 'Independent',
    coalition: 'Azimio'
  },
  {
    id: 'user_8',
    username: 'AaronCheruiyot',
    displayName: 'Sen. Aaron Cheruiyot',
    verified: true,
    blueVerified: true,
    profileImage: '/api/placeholder/48/48',
    followers: 560000,
    following: 890,
    role: 'Senate Majority Leader',
    party: 'UDA',
    coalition: 'Kenya Kwanza'
  },
  {
    id: 'user_9',
    username: 'GladysBoss',
    displayName: 'Gladys Wanga',
    verified: true,
    blueVerified: false,
    profileImage: '/api/placeholder/48/48',
    followers: 280000,
    following: 1100,
    role: 'Governor, Homa Bay',
    party: 'ODM',
    coalition: 'Azimio'
  },
  {
    id: 'user_10',
    username: 'SakajaJohnson',
    displayName: 'Johnson Sakaja',
    verified: true,
    blueVerified: true,
    profileImage: '/api/placeholder/48/48',
    followers: 1500000,
    following: 780,
    role: 'Governor, Nairobi',
    party: 'UDA',
    coalition: 'Kenya Kwanza'
  },
  {
    id: 'user_11',
    username: 'AnneWaiguru',
    displayName: 'Anne Waiguru',
    verified: true,
    blueVerified: true,
    profileImage: '/api/placeholder/48/48',
    followers: 890000,
    following: 340,
    role: 'Governor, Kirinyaga',
    party: 'UDA',
    coalition: 'Kenya Kwanza'
  },
  {
    id: 'user_12',
    username: 'AlfredMutua',
    displayName: 'Dr. Alfred Mutua',
    verified: true,
    blueVerified: true,
    profileImage: '/api/placeholder/48/48',
    followers: 1100000,
    following: 890,
    role: 'Cabinet Secretary',
    party: 'Maendeleo Chap Chap',
    coalition: 'Kenya Kwanza'
  }
];

// Mock tweets from political figures
export const tweets: Tweet[] = [
  // President Ruto tweets
  {
    id: 'tweet_1',
    userId: 'user_1',
    text: 'Today we launched the Affordable Housing Programme in Nairobi. This is a key pillar of our Bottom-Up Economic Transformation Agenda. Every Kenyan deserves a dignified home. #AffordableHousing #BottomUpEconomics',
    createdAt: '2026-01-04T10:30:00Z',
    retweets: 4500,
    likes: 12000,
    replies: 890,
    quotes: 340,
    views: 450000,
    hashtags: ['AffordableHousing', 'BottomUpEconomics'],
    mentions: [],
    sentiment: 'positive',
    sentimentScore: 72,
    hateSpeechScore: 0,
    divisiveScore: 15,
    isRetweet: false,
    isReply: false,
    hasMedia: true,
    mediaType: 'image',
    engagementRate: 3.9,
    flagged: false
  },
  {
    id: 'tweet_2',
    userId: 'user_1',
    text: 'The opposition must stop misleading Kenyans. Our economic policies are working. Inflation is down, the shilling is stabilizing, and we are creating jobs. Facts over propaganda. #KenyaKwanza',
    createdAt: '2026-01-03T14:15:00Z',
    retweets: 3200,
    likes: 8900,
    replies: 2100,
    quotes: 890,
    views: 380000,
    hashtags: ['KenyaKwanza'],
    mentions: [],
    sentiment: 'negative',
    sentimentScore: 35,
    hateSpeechScore: 12,
    divisiveScore: 68,
    isRetweet: false,
    isReply: false,
    hasMedia: false,
    engagementRate: 4.0,
    flagged: true,
    flagReason: 'Potentially divisive political rhetoric'
  },
  // Kalonzo tweets
  {
    id: 'tweet_3',
    userId: 'user_4',
    text: 'Kenyans are suffering under this regime. The cost of living is unbearable. Unga, fuel, electricity - everything is expensive. We demand accountability! #AzimioLaUmoja #KenyansFirst',
    createdAt: '2026-01-04T08:45:00Z',
    retweets: 5600,
    likes: 14000,
    replies: 3400,
    quotes: 1200,
    views: 520000,
    hashtags: ['AzimioLaUmoja', 'KenyansFirst'],
    mentions: [],
    sentiment: 'negative',
    sentimentScore: 28,
    hateSpeechScore: 8,
    divisiveScore: 72,
    isRetweet: false,
    isReply: false,
    hasMedia: false,
    engagementRate: 4.6,
    flagged: true,
    flagReason: 'High divisiveness score'
  },
  {
    id: 'tweet_4',
    userId: 'user_4',
    text: 'Met with religious leaders today to discuss peace and national unity. Kenya belongs to all of us. We must work together despite our political differences. #OneKenya',
    createdAt: '2026-01-02T16:20:00Z',
    retweets: 2100,
    likes: 6700,
    replies: 450,
    quotes: 180,
    views: 210000,
    hashtags: ['OneKenya'],
    mentions: [],
    sentiment: 'positive',
    sentimentScore: 78,
    hateSpeechScore: 0,
    divisiveScore: 8,
    isRetweet: false,
    isReply: false,
    hasMedia: true,
    mediaType: 'image',
    engagementRate: 4.5,
    flagged: false
  },
  // Edwin Sifuna tweets
  {
    id: 'tweet_5',
    userId: 'user_6',
    text: 'The Finance Bill 2025 is another attempt to squeeze ordinary Kenyans. We will oppose it in Parliament. Hustlers are being hustled by their own government! #RejectFinanceBill2025',
    createdAt: '2026-01-04T11:00:00Z',
    retweets: 8900,
    likes: 23000,
    replies: 4500,
    quotes: 2100,
    views: 780000,
    hashtags: ['RejectFinanceBill2025'],
    mentions: [],
    sentiment: 'negative',
    sentimentScore: 22,
    hateSpeechScore: 15,
    divisiveScore: 85,
    isRetweet: false,
    isReply: false,
    hasMedia: false,
    engagementRate: 4.9,
    flagged: true,
    flagReason: 'Very high divisiveness, inflammatory language'
  },
  {
    id: 'tweet_6',
    userId: 'user_6',
    text: 'Congratulations to Nairobi youth who completed the skills training program. Employment is the key to prosperity. Keep pushing! #NairobiYouth #SkillsForJobs',
    createdAt: '2026-01-03T09:30:00Z',
    retweets: 1200,
    likes: 4500,
    replies: 230,
    quotes: 89,
    views: 120000,
    hashtags: ['NairobiYouth', 'SkillsForJobs'],
    mentions: [],
    sentiment: 'positive',
    sentimentScore: 82,
    hateSpeechScore: 0,
    divisiveScore: 5,
    isRetweet: false,
    isReply: false,
    hasMedia: true,
    mediaType: 'image',
    engagementRate: 5.0,
    flagged: false
  },
  // Okiya Omtatah tweets
  {
    id: 'tweet_7',
    userId: 'user_7',
    text: 'Filed a petition in court challenging the unconstitutional appointments. The rule of law must prevail. No one is above the Constitution. #ConstitutionalismKE',
    createdAt: '2026-01-04T07:15:00Z',
    retweets: 6700,
    likes: 18000,
    replies: 2300,
    quotes: 890,
    views: 450000,
    hashtags: ['ConstitutionalismKE'],
    mentions: [],
    sentiment: 'neutral',
    sentimentScore: 55,
    hateSpeechScore: 0,
    divisiveScore: 45,
    isRetweet: false,
    isReply: false,
    hasMedia: false,
    engagementRate: 6.2,
    flagged: false
  },
  // Aaron Cheruiyot tweets
  {
    id: 'tweet_8',
    userId: 'user_8',
    text: 'The Senate has passed the County Allocation of Revenue Bill. More resources to counties means better services for wananchi. Devolution is working! #DevolutionKE',
    createdAt: '2026-01-03T18:45:00Z',
    retweets: 1800,
    likes: 5600,
    replies: 340,
    quotes: 120,
    views: 180000,
    hashtags: ['DevolutionKE'],
    mentions: [],
    sentiment: 'positive',
    sentimentScore: 75,
    hateSpeechScore: 0,
    divisiveScore: 12,
    isRetweet: false,
    isReply: false,
    hasMedia: false,
    engagementRate: 4.4,
    flagged: false
  },
  {
    id: 'tweet_9',
    userId: 'user_8',
    text: 'Those opposing everything the government does are enemies of progress. Kenya is moving forward with or without them. #KenyaKwanzaDelivers',
    createdAt: '2026-01-02T12:30:00Z',
    retweets: 2400,
    likes: 6800,
    replies: 1800,
    quotes: 560,
    views: 220000,
    hashtags: ['KenyaKwanzaDelivers'],
    mentions: [],
    sentiment: 'negative',
    sentimentScore: 32,
    hateSpeechScore: 25,
    divisiveScore: 78,
    isRetweet: false,
    isReply: false,
    hasMedia: false,
    engagementRate: 5.3,
    flagged: true,
    flagReason: 'Divisive rhetoric, labeling opponents as enemies'
  },
  // Governor Sakaja tweets
  {
    id: 'tweet_10',
    userId: 'user_10',
    text: 'Nairobi CBD cleanup continues. We have removed illegal structures and restored order. A clean city is a prosperous city. #NairobiNiSisi',
    createdAt: '2026-01-04T06:00:00Z',
    retweets: 3400,
    likes: 9800,
    replies: 1200,
    quotes: 450,
    views: 320000,
    hashtags: ['NairobiNiSisi'],
    mentions: [],
    sentiment: 'positive',
    sentimentScore: 68,
    hateSpeechScore: 0,
    divisiveScore: 22,
    isRetweet: false,
    isReply: false,
    hasMedia: true,
    mediaType: 'image',
    engagementRate: 4.6,
    flagged: false
  },
  // Deputy President Kindiki
  {
    id: 'tweet_11',
    userId: 'user_2',
    text: 'Security operations in North Rift continue. We will not allow criminals to terrorize innocent Kenyans. Peace and security are non-negotiable. #SecureKenya',
    createdAt: '2026-01-03T20:00:00Z',
    retweets: 2800,
    likes: 7600,
    replies: 890,
    quotes: 340,
    views: 280000,
    hashtags: ['SecureKenya'],
    mentions: [],
    sentiment: 'neutral',
    sentimentScore: 52,
    hateSpeechScore: 5,
    divisiveScore: 35,
    isRetweet: false,
    isReply: false,
    hasMedia: false,
    engagementRate: 4.2,
    flagged: false
  },
  // More divisive content
  {
    id: 'tweet_12',
    userId: 'user_6',
    text: 'Watu wa UDA wanafikiria sisi ni wajinga? They steal from us then tell us to tighten belts. Hatutakubali! The revolution is coming. #Mapambano',
    createdAt: '2026-01-04T13:30:00Z',
    retweets: 12000,
    likes: 34000,
    replies: 6700,
    quotes: 3400,
    views: 980000,
    hashtags: ['Mapambano'],
    mentions: [],
    sentiment: 'negative',
    sentimentScore: 15,
    hateSpeechScore: 35,
    divisiveScore: 92,
    isRetweet: false,
    isReply: false,
    hasMedia: false,
    engagementRate: 5.7,
    flagged: true,
    flagReason: 'Extremely divisive, incitement language detected'
  },
  // Waiguru tweet
  {
    id: 'tweet_13',
    userId: 'user_11',
    text: 'Kirinyaga County has achieved 95% immunization coverage. Health is wealth. Proud of our healthcare workers! #KirinyagaRising',
    createdAt: '2026-01-02T10:15:00Z',
    retweets: 890,
    likes: 3400,
    replies: 120,
    quotes: 45,
    views: 89000,
    hashtags: ['KirinyagaRising'],
    mentions: [],
    sentiment: 'positive',
    sentimentScore: 85,
    hateSpeechScore: 0,
    divisiveScore: 3,
    isRetweet: false,
    isReply: false,
    hasMedia: true,
    mediaType: 'image',
    engagementRate: 5.0,
    flagged: false
  },
  // Alfred Mutua
  {
    id: 'tweet_14',
    userId: 'user_12',
    text: 'Kenya\'s tourism sector is recovering strongly. We welcomed 2 million visitors last year. Our beautiful country is open for business! #MagicalKenya',
    createdAt: '2026-01-03T15:00:00Z',
    retweets: 1500,
    likes: 4800,
    replies: 230,
    quotes: 89,
    views: 150000,
    hashtags: ['MagicalKenya'],
    mentions: [],
    sentiment: 'positive',
    sentimentScore: 80,
    hateSpeechScore: 0,
    divisiveScore: 5,
    isRetweet: false,
    isReply: false,
    hasMedia: true,
    mediaType: 'image',
    engagementRate: 4.4,
    flagged: false
  },
  // Gladys Wanga
  {
    id: 'tweet_15',
    userId: 'user_9',
    text: 'Homa Bay County has launched free maternal healthcare. No mother should die giving birth due to lack of money. #HomaBayCares',
    createdAt: '2026-01-04T09:00:00Z',
    retweets: 2100,
    likes: 6700,
    replies: 340,
    quotes: 120,
    views: 180000,
    hashtags: ['HomaBayCares'],
    mentions: [],
    sentiment: 'positive',
    sentimentScore: 88,
    hateSpeechScore: 0,
    divisiveScore: 2,
    isRetweet: false,
    isReply: false,
    hasMedia: true,
    mediaType: 'image',
    engagementRate: 5.1,
    flagged: false
  },
  // More political back-and-forth
  {
    id: 'tweet_16',
    userId: 'user_8',
    text: '@edikiara Your party destroyed Kenya for 10 years. Now you pretend to care about wananchi? Kenyans know the truth. #HypocrisyExposed',
    createdAt: '2026-01-04T14:00:00Z',
    retweets: 4500,
    likes: 11000,
    replies: 3200,
    quotes: 1800,
    views: 420000,
    hashtags: ['HypocrisyExposed'],
    mentions: ['edikiara'],
    sentiment: 'negative',
    sentimentScore: 18,
    hateSpeechScore: 28,
    divisiveScore: 88,
    isRetweet: false,
    isReply: true,
    hasMedia: false,
    engagementRate: 4.9,
    flagged: true,
    flagReason: 'Personal attack, highly divisive'
  },
  // Eugene Wamalwa
  {
    id: 'tweet_17',
    userId: 'user_5',
    text: 'Western Kenya deserves better. Our region has been marginalized for too long. We will fight for our fair share of national resources. #WesternRising',
    createdAt: '2026-01-03T11:30:00Z',
    retweets: 3800,
    likes: 9200,
    replies: 1100,
    quotes: 450,
    views: 280000,
    hashtags: ['WesternRising'],
    mentions: [],
    sentiment: 'neutral',
    sentimentScore: 45,
    hateSpeechScore: 8,
    divisiveScore: 55,
    isRetweet: false,
    isReply: false,
    hasMedia: false,
    engagementRate: 5.2,
    flagged: false
  },
  // Wetangula
  {
    id: 'tweet_18',
    userId: 'user_3',
    text: 'Parliament will not be a rubber stamp. We will scrutinize every bill and hold the Executive accountable. That is our constitutional mandate. #ParliamentaryOversight',
    createdAt: '2026-01-02T14:45:00Z',
    retweets: 1600,
    likes: 5200,
    replies: 340,
    quotes: 120,
    views: 160000,
    hashtags: ['ParliamentaryOversight'],
    mentions: [],
    sentiment: 'neutral',
    sentimentScore: 58,
    hateSpeechScore: 0,
    divisiveScore: 18,
    isRetweet: false,
    isReply: false,
    hasMedia: false,
    engagementRate: 4.6,
    flagged: false
  }
];

// Trending hashtags
export const trendingHashtags: TrendingHashtag[] = [
  {
    tag: 'RejectFinanceBill2025',
    tweetCount: 145000,
    sentiment: 'negative',
    politicalRelevance: 'high',
    divisiveScore: 82,
    topContributors: ['edikiara', 'OkiyaOmtatah', 'SKMusyoka']
  },
  {
    tag: 'KenyaKwanzaDelivers',
    tweetCount: 89000,
    sentiment: 'positive',
    politicalRelevance: 'high',
    divisiveScore: 45,
    topContributors: ['WilliamsRuto', 'AaronCheruiyot', 'SakajaJohnson']
  },
  {
    tag: 'AzimioLaUmoja',
    tweetCount: 67000,
    sentiment: 'mixed',
    politicalRelevance: 'high',
    divisiveScore: 55,
    topContributors: ['SKMusyoka', 'edikiara', 'GladysBoss']
  },
  {
    tag: 'AffordableHousing',
    tweetCount: 45000,
    sentiment: 'mixed',
    politicalRelevance: 'high',
    divisiveScore: 38,
    topContributors: ['WilliamsRuto', 'SakajaJohnson', 'AnneWaiguru']
  },
  {
    tag: 'Mapambano',
    tweetCount: 120000,
    sentiment: 'negative',
    politicalRelevance: 'high',
    divisiveScore: 88,
    topContributors: ['edikiara', 'OkiyaOmtatah', 'EugeneLWamalwa']
  },
  {
    tag: 'SecureKenya',
    tweetCount: 34000,
    sentiment: 'neutral',
    politicalRelevance: 'medium',
    divisiveScore: 25,
    topContributors: ['KindikiKithure', 'WilliamsRuto']
  },
  {
    tag: 'DevolutionKE',
    tweetCount: 28000,
    sentiment: 'positive',
    politicalRelevance: 'medium',
    divisiveScore: 15,
    topContributors: ['AaronCheruiyot', 'GladysBoss', 'AnneWaiguru']
  },
  {
    tag: 'MagicalKenya',
    tweetCount: 56000,
    sentiment: 'positive',
    politicalRelevance: 'low',
    divisiveScore: 5,
    topContributors: ['AlfredMutua', 'SakajaJohnson']
  },
  {
    tag: 'ConstitutionalismKE',
    tweetCount: 42000,
    sentiment: 'neutral',
    politicalRelevance: 'high',
    divisiveScore: 35,
    topContributors: ['OkiyaOmtatah', 'edikiara']
  },
  {
    tag: 'NairobiNiSisi',
    tweetCount: 31000,
    sentiment: 'positive',
    politicalRelevance: 'medium',
    divisiveScore: 20,
    topContributors: ['SakajaJohnson', 'edikiara']
  }
];

// Helper functions
export function getUserById(userId: string): TwitterUser | undefined {
  return twitterUsers.find(u => u.id === userId);
}

export function getUserByUsername(username: string): TwitterUser | undefined {
  return twitterUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function getTweetsByUser(userId: string): Tweet[] {
  return tweets.filter(t => t.userId === userId);
}

export function getFlaggedTweets(): Tweet[] {
  return tweets.filter(t => t.flagged);
}

export function getTweetsByHashtag(hashtag: string): Tweet[] {
  return tweets.filter(t => 
    t.hashtags.some(h => h.toLowerCase() === hashtag.toLowerCase())
  );
}

export function getHighDivisiveTweets(threshold: number = 70): Tweet[] {
  return tweets.filter(t => t.divisiveScore >= threshold);
}

export function getHateSpeechTweets(threshold: number = 20): Tweet[] {
  return tweets.filter(t => t.hateSpeechScore >= threshold);
}

export function getTweetsByCoalition(coalition: 'Kenya Kwanza' | 'Azimio' | 'Independent'): Tweet[] {
  const userIds = twitterUsers
    .filter(u => u.coalition === coalition)
    .map(u => u.id);
  return tweets.filter(t => userIds.includes(t.userId));
}

export function getAverageSentimentByCoalition(): { coalition: string; avgSentiment: number }[] {
  const coalitions: ('Kenya Kwanza' | 'Azimio' | 'Independent')[] = ['Kenya Kwanza', 'Azimio', 'Independent'];
  return coalitions.map(coalition => {
    const coalitionTweets = getTweetsByCoalition(coalition);
    const avgSentiment = coalitionTweets.length > 0
      ? Math.round(coalitionTweets.reduce((acc, t) => acc + t.sentimentScore, 0) / coalitionTweets.length)
      : 0;
    return { coalition, avgSentiment };
  });
}

export function getTotalEngagement(): number {
  return tweets.reduce((acc, t) => acc + t.likes + t.retweets + t.replies + t.quotes, 0);
}

export function getMostEngagedTweets(limit: number = 5): Tweet[] {
  return [...tweets]
    .sort((a, b) => (b.likes + b.retweets + b.replies) - (a.likes + a.retweets + a.replies))
    .slice(0, limit);
}

export function getMostDivisiveTweets(limit: number = 5): Tweet[] {
  return [...tweets]
    .sort((a, b) => b.divisiveScore - a.divisiveScore)
    .slice(0, limit);
}

export function getRecentTweets(hours: number = 24): Tweet[] {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);
  return tweets.filter(t => new Date(t.createdAt) >= cutoff);
}
