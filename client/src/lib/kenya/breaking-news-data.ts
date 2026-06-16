// Breaking News Data - Global Coverage of Kenya
// Aggregates international news outlets covering Kenya and East Africa

export interface NewsSource {
  id: string;
  name: string;
  shortName: string;
  region: 'Europe' | 'Americas' | 'Asia' | 'Middle East' | 'Africa' | 'Oceania';
  country: string;
  type: 'Wire Service' | 'Broadcaster' | 'Newspaper' | 'Digital';
  credibilityScore: number; // 0-100
  logo?: string;
  rssUrl?: string;
  website: string;
  bias: 'left' | 'center-left' | 'center' | 'center-right' | 'right';
}

export interface BreakingNewsArticle {
  id: string;
  sourceId: string;
  headline: string;
  summary: string;
  url: string;
  publishedAt: string;
  updatedAt?: string;
  category: 'Politics' | 'Economy' | 'Security' | 'Diplomacy' | 'Human Rights' | 'Environment' | 'Sports' | 'Culture';
  isBreaking: boolean;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  keywords: string[];
  relatedPoliticians: string[];
  imageUrl?: string;
  readTime: number; // minutes
  engagement: {
    shares: number;
    comments: number;
  };
}

export interface NewsAlert {
  id: string;
  type: 'breaking' | 'developing' | 'update';
  headline: string;
  timestamp: string;
  sourceId: string;
  articleId?: string;
  priority: 'critical' | 'high' | 'medium';
}

// Global News Sources Covering Kenya
export const newsSources: NewsSource[] = [
  // Wire Services
  {
    id: 'reuters',
    name: 'Reuters',
    shortName: 'Reuters',
    region: 'Europe',
    country: 'United Kingdom',
    type: 'Wire Service',
    credibilityScore: 95,
    website: 'https://www.reuters.com',
    rssUrl: 'https://www.reuters.com/world/africa/',
    bias: 'center'
  },
  {
    id: 'ap',
    name: 'Associated Press',
    shortName: 'AP',
    region: 'Americas',
    country: 'United States',
    type: 'Wire Service',
    credibilityScore: 94,
    website: 'https://apnews.com',
    bias: 'center'
  },
  {
    id: 'afp',
    name: 'Agence France-Presse',
    shortName: 'AFP',
    region: 'Europe',
    country: 'France',
    type: 'Wire Service',
    credibilityScore: 93,
    website: 'https://www.afp.com',
    bias: 'center'
  },
  // Broadcasters
  {
    id: 'bbc',
    name: 'BBC News',
    shortName: 'BBC',
    region: 'Europe',
    country: 'United Kingdom',
    type: 'Broadcaster',
    credibilityScore: 92,
    website: 'https://www.bbc.com/news',
    rssUrl: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
    bias: 'center'
  },
  {
    id: 'cnn',
    name: 'CNN International',
    shortName: 'CNN',
    region: 'Americas',
    country: 'United States',
    type: 'Broadcaster',
    credibilityScore: 85,
    website: 'https://www.cnn.com',
    bias: 'center-left'
  },
  {
    id: 'aljazeera',
    name: 'Al Jazeera English',
    shortName: 'Al Jazeera',
    region: 'Middle East',
    country: 'Qatar',
    type: 'Broadcaster',
    credibilityScore: 82,
    website: 'https://www.aljazeera.com',
    bias: 'center'
  },
  {
    id: 'france24',
    name: 'France 24',
    shortName: 'France24',
    region: 'Europe',
    country: 'France',
    type: 'Broadcaster',
    credibilityScore: 88,
    website: 'https://www.france24.com',
    rssUrl: 'https://www.france24.com/en/africa/rss',
    bias: 'center'
  },
  {
    id: 'dw',
    name: 'Deutsche Welle',
    shortName: 'DW',
    region: 'Europe',
    country: 'Germany',
    type: 'Broadcaster',
    credibilityScore: 90,
    website: 'https://www.dw.com',
    bias: 'center'
  },
  {
    id: 'voa',
    name: 'Voice of America',
    shortName: 'VOA',
    region: 'Americas',
    country: 'United States',
    type: 'Broadcaster',
    credibilityScore: 80,
    website: 'https://www.voanews.com',
    bias: 'center'
  },
  // Newspapers
  {
    id: 'guardian',
    name: 'The Guardian',
    shortName: 'Guardian',
    region: 'Europe',
    country: 'United Kingdom',
    type: 'Newspaper',
    credibilityScore: 88,
    website: 'https://www.theguardian.com',
    rssUrl: 'https://www.theguardian.com/world/africa/rss',
    bias: 'center-left'
  },
  {
    id: 'nytimes',
    name: 'The New York Times',
    shortName: 'NYT',
    region: 'Americas',
    country: 'United States',
    type: 'Newspaper',
    credibilityScore: 90,
    website: 'https://www.nytimes.com',
    bias: 'center-left'
  },
  {
    id: 'washpost',
    name: 'The Washington Post',
    shortName: 'WaPo',
    region: 'Americas',
    country: 'United States',
    type: 'Newspaper',
    credibilityScore: 89,
    website: 'https://www.washingtonpost.com',
    bias: 'center-left'
  },
  {
    id: 'telegraph',
    name: 'The Telegraph',
    shortName: 'Telegraph',
    region: 'Europe',
    country: 'United Kingdom',
    type: 'Newspaper',
    credibilityScore: 82,
    website: 'https://www.telegraph.co.uk',
    bias: 'center-right'
  },
  {
    id: 'lemonde',
    name: 'Le Monde',
    shortName: 'Le Monde',
    region: 'Europe',
    country: 'France',
    type: 'Newspaper',
    credibilityScore: 91,
    website: 'https://www.lemonde.fr',
    bias: 'center-left'
  },
  // African Regional
  {
    id: 'theafricareport',
    name: 'The Africa Report',
    shortName: 'Africa Report',
    region: 'Africa',
    country: 'Pan-African',
    type: 'Digital',
    credibilityScore: 85,
    website: 'https://www.theafricareport.com',
    bias: 'center'
  },
  {
    id: 'africanews',
    name: 'Africanews',
    shortName: 'Africanews',
    region: 'Africa',
    country: 'Pan-African',
    type: 'Broadcaster',
    credibilityScore: 84,
    website: 'https://www.africanews.com',
    bias: 'center'
  },
  // Asia-Pacific
  {
    id: 'scmp',
    name: 'South China Morning Post',
    shortName: 'SCMP',
    region: 'Asia',
    country: 'Hong Kong',
    type: 'Newspaper',
    credibilityScore: 83,
    website: 'https://www.scmp.com',
    bias: 'center'
  },
  {
    id: 'abc',
    name: 'ABC News Australia',
    shortName: 'ABC AU',
    region: 'Oceania',
    country: 'Australia',
    type: 'Broadcaster',
    credibilityScore: 89,
    website: 'https://www.abc.net.au/news',
    bias: 'center'
  }
];

// Mock Breaking News Articles about Kenya
export const breakingNewsArticles: BreakingNewsArticle[] = [
  {
    id: 'article_1',
    sourceId: 'reuters',
    headline: 'Kenya Central Bank Holds Interest Rate Steady Amid Inflation Concerns',
    summary: 'The Central Bank of Kenya maintained its benchmark lending rate at 12.75% as policymakers balance economic growth against persistent inflation pressures. The decision comes as the shilling shows signs of stabilization against major currencies.',
    url: 'https://www.reuters.com/world/africa/kenya-central-bank-rate',
    publishedAt: '2026-01-11T08:30:00Z',
    category: 'Economy',
    isBreaking: true,
    urgency: 'high',
    sentiment: 'neutral',
    sentimentScore: 52,
    keywords: ['Central Bank', 'Interest Rate', 'Inflation', 'Economy'],
    relatedPoliticians: ['William Ruto'],
    readTime: 4,
    engagement: { shares: 1200, comments: 89 }
  },
  {
    id: 'article_2',
    sourceId: 'bbc',
    headline: 'Kenya-Somalia Border Tensions Ease After Diplomatic Talks',
    summary: 'Diplomatic efforts between Kenya and Somalia have yielded positive results, with both nations agreeing to resume normal border operations. The breakthrough follows weeks of heightened tensions over maritime boundary disputes.',
    url: 'https://www.bbc.com/news/world-africa/kenya-somalia',
    publishedAt: '2026-01-11T06:15:00Z',
    category: 'Diplomacy',
    isBreaking: true,
    urgency: 'high',
    sentiment: 'positive',
    sentimentScore: 72,
    keywords: ['Somalia', 'Border', 'Diplomacy', 'Maritime'],
    relatedPoliticians: ['William Ruto', 'Kithure Kindiki'],
    readTime: 5,
    engagement: { shares: 3400, comments: 256 }
  },
  {
    id: 'article_3',
    sourceId: 'aljazeera',
    headline: 'Opposition Leaders Call for Nationwide Protests Over Finance Bill',
    summary: 'Kenyan opposition coalition Azimio has announced plans for nationwide demonstrations against the proposed Finance Bill 2025, which critics say will increase the tax burden on ordinary citizens. Security forces are on high alert.',
    url: 'https://www.aljazeera.com/news/kenya-protests-finance-bill',
    publishedAt: '2026-01-11T05:00:00Z',
    category: 'Politics',
    isBreaking: true,
    urgency: 'critical',
    sentiment: 'negative',
    sentimentScore: 28,
    keywords: ['Protests', 'Finance Bill', 'Opposition', 'Azimio'],
    relatedPoliticians: ['Kalonzo Musyoka', 'Edwin Sifuna'],
    readTime: 6,
    engagement: { shares: 8900, comments: 1200 }
  },
  {
    id: 'article_4',
    sourceId: 'cnn',
    headline: 'Kenya\'s Tech Sector Attracts Record Foreign Investment',
    summary: 'Kenya\'s technology sector has attracted over $500 million in foreign direct investment in the first quarter of 2026, cementing Nairobi\'s position as Africa\'s Silicon Savannah. Major investments came from US, European, and Asian venture capital firms.',
    url: 'https://www.cnn.com/africa/kenya-tech-investment',
    publishedAt: '2026-01-10T18:45:00Z',
    category: 'Economy',
    isBreaking: false,
    urgency: 'medium',
    sentiment: 'positive',
    sentimentScore: 85,
    keywords: ['Technology', 'Investment', 'Silicon Savannah', 'Startups'],
    relatedPoliticians: [],
    readTime: 7,
    engagement: { shares: 2100, comments: 145 }
  },
  {
    id: 'article_5',
    sourceId: 'france24',
    headline: 'UN Warns of Humanitarian Crisis in Northern Kenya Amid Drought',
    summary: 'The United Nations has issued an urgent appeal for humanitarian assistance as severe drought conditions threaten millions in northern Kenya. The World Food Programme estimates 4.5 million people face acute food insecurity.',
    url: 'https://www.france24.com/en/africa/kenya-drought-crisis',
    publishedAt: '2026-01-10T14:20:00Z',
    category: 'Human Rights',
    isBreaking: true,
    urgency: 'critical',
    sentiment: 'negative',
    sentimentScore: 18,
    keywords: ['Drought', 'Humanitarian', 'UN', 'Food Security'],
    relatedPoliticians: ['William Ruto'],
    readTime: 5,
    engagement: { shares: 4500, comments: 320 }
  },
  {
    id: 'article_6',
    sourceId: 'guardian',
    headline: 'Kenya\'s Anti-Corruption Drive Sees High-Profile Arrests',
    summary: 'Kenyan authorities have arrested several senior government officials in connection with a multi-billion shilling procurement scandal. The arrests signal an intensification of President Ruto\'s anti-corruption campaign.',
    url: 'https://www.theguardian.com/world/kenya-corruption-arrests',
    publishedAt: '2026-01-10T12:00:00Z',
    category: 'Politics',
    isBreaking: true,
    urgency: 'high',
    sentiment: 'neutral',
    sentimentScore: 55,
    keywords: ['Corruption', 'Arrests', 'Procurement', 'Government'],
    relatedPoliticians: ['William Ruto'],
    readTime: 6,
    engagement: { shares: 5600, comments: 890 }
  },
  {
    id: 'article_7',
    sourceId: 'dw',
    headline: 'Germany Pledges €200 Million for Kenya\'s Green Energy Transition',
    summary: 'Germany has announced a major investment package to support Kenya\'s transition to renewable energy. The funding will support geothermal, solar, and wind projects as Kenya aims to achieve 100% clean energy by 2030.',
    url: 'https://www.dw.com/en/kenya-germany-green-energy',
    publishedAt: '2026-01-10T10:30:00Z',
    category: 'Environment',
    isBreaking: false,
    urgency: 'medium',
    sentiment: 'positive',
    sentimentScore: 82,
    keywords: ['Green Energy', 'Germany', 'Investment', 'Renewable'],
    relatedPoliticians: [],
    readTime: 4,
    engagement: { shares: 1800, comments: 95 }
  },
  {
    id: 'article_8',
    sourceId: 'ap',
    headline: 'Kenya Deploys Additional Troops to Haiti Peacekeeping Mission',
    summary: 'Kenya has announced the deployment of 500 additional police officers to Haiti as part of the UN-backed multinational security mission. The deployment follows requests from the UN Security Council for increased support.',
    url: 'https://apnews.com/article/kenya-haiti-peacekeeping',
    publishedAt: '2026-01-10T08:00:00Z',
    category: 'Security',
    isBreaking: false,
    urgency: 'medium',
    sentiment: 'neutral',
    sentimentScore: 50,
    keywords: ['Haiti', 'Peacekeeping', 'Police', 'UN'],
    relatedPoliticians: ['Kithure Kindiki'],
    readTime: 5,
    engagement: { shares: 2300, comments: 178 }
  },
  {
    id: 'article_9',
    sourceId: 'nytimes',
    headline: 'Inside Kenya\'s Bold Experiment with Digital ID and Financial Inclusion',
    summary: 'Kenya\'s Huduma Namba digital identity system is transforming how millions access government services and financial products. Critics raise privacy concerns while supporters hail it as a model for Africa.',
    url: 'https://www.nytimes.com/2026/01/10/world/africa/kenya-digital-id',
    publishedAt: '2026-01-09T22:00:00Z',
    category: 'Politics',
    isBreaking: false,
    urgency: 'low',
    sentiment: 'neutral',
    sentimentScore: 58,
    keywords: ['Digital ID', 'Huduma Namba', 'Financial Inclusion', 'Privacy'],
    relatedPoliticians: [],
    readTime: 12,
    engagement: { shares: 3200, comments: 245 }
  },
  {
    id: 'article_10',
    sourceId: 'africanews',
    headline: 'East African Community Summit to Address Regional Trade Barriers',
    summary: 'Leaders from Kenya, Uganda, Tanzania, Rwanda, and other EAC member states will convene in Nairobi to address persistent non-tariff barriers hampering intra-regional trade. Kenya\'s President Ruto will chair the summit.',
    url: 'https://www.africanews.com/eac-summit-trade',
    publishedAt: '2026-01-09T16:30:00Z',
    category: 'Diplomacy',
    isBreaking: false,
    urgency: 'medium',
    sentiment: 'positive',
    sentimentScore: 68,
    keywords: ['EAC', 'Trade', 'Regional Integration', 'Summit'],
    relatedPoliticians: ['William Ruto'],
    readTime: 5,
    engagement: { shares: 890, comments: 56 }
  },
  {
    id: 'article_11',
    sourceId: 'theafricareport',
    headline: 'Kenya Airways Announces Major Fleet Expansion Plan',
    summary: 'Kenya Airways has unveiled plans to acquire 20 new aircraft over the next five years as part of an ambitious expansion strategy. The national carrier aims to restore profitability and expand its African network.',
    url: 'https://www.theafricareport.com/kenya-airways-expansion',
    publishedAt: '2026-01-09T14:00:00Z',
    category: 'Economy',
    isBreaking: false,
    urgency: 'low',
    sentiment: 'positive',
    sentimentScore: 75,
    keywords: ['Kenya Airways', 'Aviation', 'Expansion', 'Fleet'],
    relatedPoliticians: [],
    readTime: 4,
    engagement: { shares: 1100, comments: 78 }
  },
  {
    id: 'article_12',
    sourceId: 'voa',
    headline: 'Kenyan Human Rights Groups Condemn Police Brutality During Protests',
    summary: 'Human rights organizations have documented multiple cases of excessive force by Kenyan police during recent anti-government demonstrations. International observers call for independent investigations.',
    url: 'https://www.voanews.com/kenya-police-brutality',
    publishedAt: '2026-01-09T11:00:00Z',
    category: 'Human Rights',
    isBreaking: false,
    urgency: 'high',
    sentiment: 'negative',
    sentimentScore: 22,
    keywords: ['Human Rights', 'Police', 'Protests', 'Brutality'],
    relatedPoliticians: ['Kithure Kindiki'],
    readTime: 6,
    engagement: { shares: 6700, comments: 890 }
  },
  {
    id: 'article_13',
    sourceId: 'scmp',
    headline: 'China Deepens Kenya Infrastructure Ties with New Railway Extension',
    summary: 'China has agreed to finance the extension of Kenya\'s Standard Gauge Railway to the Uganda border, strengthening Beijing\'s infrastructure footprint in East Africa. The $3 billion project will create thousands of jobs.',
    url: 'https://www.scmp.com/kenya-china-railway',
    publishedAt: '2026-01-08T20:00:00Z',
    category: 'Economy',
    isBreaking: false,
    urgency: 'medium',
    sentiment: 'neutral',
    sentimentScore: 55,
    keywords: ['China', 'SGR', 'Infrastructure', 'Railway'],
    relatedPoliticians: ['William Ruto'],
    readTime: 7,
    engagement: { shares: 2400, comments: 312 }
  },
  {
    id: 'article_14',
    sourceId: 'telegraph',
    headline: 'British Tourists Flock to Kenya as Safari Bookings Hit Record High',
    summary: 'Kenya\'s tourism sector is experiencing a remarkable recovery with British visitor numbers reaching pre-pandemic levels. The Maasai Mara and coastal resorts report near-full occupancy for the peak season.',
    url: 'https://www.telegraph.co.uk/travel/kenya-tourism-boom',
    publishedAt: '2026-01-08T15:30:00Z',
    category: 'Economy',
    isBreaking: false,
    urgency: 'low',
    sentiment: 'positive',
    sentimentScore: 88,
    keywords: ['Tourism', 'Safari', 'British', 'Maasai Mara'],
    relatedPoliticians: [],
    readTime: 5,
    engagement: { shares: 1500, comments: 67 }
  },
  {
    id: 'article_15',
    sourceId: 'afp',
    headline: 'Kenya Launches Africa\'s First Carbon Credit Trading Platform',
    summary: 'Kenya has launched the continent\'s first regulated carbon credit trading platform, positioning itself as a leader in climate finance. The initiative is expected to attract billions in green investments.',
    url: 'https://www.afp.com/kenya-carbon-trading',
    publishedAt: '2026-01-08T12:00:00Z',
    category: 'Environment',
    isBreaking: false,
    urgency: 'medium',
    sentiment: 'positive',
    sentimentScore: 78,
    keywords: ['Carbon Credits', 'Climate', 'Trading', 'Green Finance'],
    relatedPoliticians: ['William Ruto'],
    readTime: 5,
    engagement: { shares: 1900, comments: 134 }
  }
];

// Breaking News Alerts
export const newsAlerts: NewsAlert[] = [
  {
    id: 'alert_1',
    type: 'breaking',
    headline: 'Opposition announces nationwide protests for January 15',
    timestamp: '2026-01-11T05:00:00Z',
    sourceId: 'aljazeera',
    articleId: 'article_3',
    priority: 'critical'
  },
  {
    id: 'alert_2',
    type: 'breaking',
    headline: 'Central Bank holds interest rate at 12.75%',
    timestamp: '2026-01-11T08:30:00Z',
    sourceId: 'reuters',
    articleId: 'article_1',
    priority: 'high'
  },
  {
    id: 'alert_3',
    type: 'developing',
    headline: 'Kenya-Somalia border tensions ease after talks',
    timestamp: '2026-01-11T06:15:00Z',
    sourceId: 'bbc',
    articleId: 'article_2',
    priority: 'high'
  },
  {
    id: 'alert_4',
    type: 'update',
    headline: 'UN raises humanitarian alert level for northern Kenya',
    timestamp: '2026-01-10T14:20:00Z',
    sourceId: 'france24',
    articleId: 'article_5',
    priority: 'critical'
  }
];

// Helper Functions
export function getSourceById(sourceId: string): NewsSource | undefined {
  return newsSources.find(s => s.id === sourceId);
}

export function getArticlesBySource(sourceId: string): BreakingNewsArticle[] {
  return breakingNewsArticles.filter(a => a.sourceId === sourceId);
}

export function getArticlesByCategory(category: BreakingNewsArticle['category']): BreakingNewsArticle[] {
  return breakingNewsArticles.filter(a => a.category === category);
}

export function getBreakingNews(): BreakingNewsArticle[] {
  return breakingNewsArticles.filter(a => a.isBreaking);
}

export function getArticlesByUrgency(urgency: BreakingNewsArticle['urgency']): BreakingNewsArticle[] {
  return breakingNewsArticles.filter(a => a.urgency === urgency);
}

export function getArticlesBySentiment(sentiment: BreakingNewsArticle['sentiment']): BreakingNewsArticle[] {
  return breakingNewsArticles.filter(a => a.sentiment === sentiment);
}

export function getSourcesByRegion(region: NewsSource['region']): NewsSource[] {
  return newsSources.filter(s => s.region === region);
}

export function getSourcesByType(type: NewsSource['type']): NewsSource[] {
  return newsSources.filter(s => s.type === type);
}

export function getHighCredibilitySources(minScore: number = 85): NewsSource[] {
  return newsSources.filter(s => s.credibilityScore >= minScore);
}

export function getArticlesWithPolitician(politician: string): BreakingNewsArticle[] {
  return breakingNewsArticles.filter(a => 
    a.relatedPoliticians.some(p => p.toLowerCase().includes(politician.toLowerCase()))
  );
}

export function getRecentArticles(hours: number = 24): BreakingNewsArticle[] {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);
  return breakingNewsArticles.filter(a => new Date(a.publishedAt) >= cutoff);
}

export function getMostEngagedArticles(limit: number = 5): BreakingNewsArticle[] {
  return [...breakingNewsArticles]
    .sort((a, b) => (b.engagement.shares + b.engagement.comments) - (a.engagement.shares + a.engagement.comments))
    .slice(0, limit);
}

export function getAverageSentimentByRegion(): { region: string; avgSentiment: number; articleCount: number }[] {
  const regions = ['Europe', 'Americas', 'Asia', 'Middle East', 'Africa', 'Oceania'] as const;
  return regions.map(region => {
    const regionSources = getSourcesByRegion(region);
    const sourceIds = regionSources.map(s => s.id);
    const regionArticles = breakingNewsArticles.filter(a => sourceIds.includes(a.sourceId));
    const avgSentiment = regionArticles.length > 0
      ? Math.round(regionArticles.reduce((acc, a) => acc + a.sentimentScore, 0) / regionArticles.length)
      : 0;
    return { region, avgSentiment, articleCount: regionArticles.length };
  });
}

export function getCategoryDistribution(): { category: string; count: number; percentage: number }[] {
  const categories = ['Politics', 'Economy', 'Security', 'Diplomacy', 'Human Rights', 'Environment', 'Sports', 'Culture'] as const;
  const total = breakingNewsArticles.length;
  return categories.map(category => {
    const count = getArticlesByCategory(category).length;
    return {
      category,
      count,
      percentage: Math.round((count / total) * 100)
    };
  }).filter(c => c.count > 0);
}

export function getActiveAlerts(): NewsAlert[] {
  return newsAlerts.filter(a => {
    const alertTime = new Date(a.timestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - alertTime.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24; // Active within last 24 hours
  });
}

export function getCriticalAlerts(): NewsAlert[] {
  return newsAlerts.filter(a => a.priority === 'critical');
}
