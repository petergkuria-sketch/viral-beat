import Parser from 'rss-parser';

// RSS Feed URLs for major Kenya news outlets
export const KENYA_NEWS_FEEDS = {
  nation: {
    name: 'Nation Africa',
    url: 'https://nation.africa/service/rss/kenya/520/feed.rss',
    category: 'general'
  },
  standardHeadlines: {
    name: 'The Standard - Headlines',
    url: 'https://www.standardmedia.co.ke/rss/headlines.php',
    category: 'general'
  },
  standardKenya: {
    name: 'The Standard - Kenya',
    url: 'https://www.standardmedia.co.ke/rss/kenya.php',
    category: 'politics'
  },
  standardPolitics: {
    name: 'The Standard - Politics',
    url: 'https://www.standardmedia.co.ke/rss/politics.php',
    category: 'politics'
  },
  standardBusiness: {
    name: 'The Standard - Business',
    url: 'https://www.standardmedia.co.ke/rss/business.php',
    category: 'business'
  },
  citizenDigital: {
    name: 'Citizen Digital',
    url: 'https://www.citizentv.co.ke/feed/',
    category: 'general'
  }
};

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  url: string;
  source: string;
  sourceUrl: string;
  author: string | null;
  publishedAt: Date;
  category: string;
  imageUrl: string | null;
}

export interface DivisiveAnalysis {
  divisiveScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectedTerms: Array<{
    term: string;
    category: string;
    severity: string;
    translation?: string;
  }>;
  targetedGroups: string[];
  topics: string[];
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface AnalyzedNewsArticle extends NewsArticle {
  analysis: DivisiveAnalysis;
}

// Swahili and Sheng hate speech terms from NCIC Hatelex
const HATE_SPEECH_TERMS: Record<string, { category: string; severity: string; translation: string; targets: string[] }> = {
  // Kikuyu-targeted terms
  'madoadoa': { category: 'dehumanizing', severity: 'critical', translation: 'spots/stains', targets: ['Kikuyu'] },
  'nyakua': { category: 'ethnic_slur', severity: 'high', translation: 'grabbers', targets: ['Kikuyu'] },
  'kabila adui': { category: 'ethnic_slur', severity: 'critical', translation: 'enemy tribe', targets: ['Kikuyu'] },
  'kwekwe': { category: 'ethnic_slur', severity: 'high', translation: 'partridge bird', targets: ['Kikuyu'] },
  'thieves': { category: 'dehumanizing', severity: 'high', translation: '', targets: ['Government', 'Politicians'] },
  
  // Kalenjin-targeted terms
  'wabara': { category: 'ethnic_slur', severity: 'medium', translation: 'outsiders', targets: ['Kalenjin'] },
  'morans': { category: 'ethnic_slur', severity: 'medium', translation: 'warriors', targets: ['Kalenjin', 'Maasai'] },
  
  // Luo-targeted terms
  'kihii': { category: 'ethnic_slur', severity: 'high', translation: 'uncircumcised', targets: ['Luo'] },
  'jaruo': { category: 'ethnic_slur', severity: 'medium', translation: 'derogatory for Luo', targets: ['Luo'] },
  'jang\'o': { category: 'ethnic_slur', severity: 'medium', translation: 'derogatory for Luo', targets: ['Luo'] },
  
  // General inflammatory terms
  'invaders': { category: 'territorial', severity: 'high', translation: '', targets: ['Settlers', 'Migrants'] },
  'go back': { category: 'territorial', severity: 'high', translation: '', targets: ['Settlers', 'Migrants'] },
  'our land': { category: 'territorial', severity: 'medium', translation: '', targets: ['Land disputes'] },
  'revolution': { category: 'incitement', severity: 'high', translation: '', targets: ['Government'] },
  'must go': { category: 'incitement', severity: 'medium', translation: '', targets: ['Politicians'] },
  'betrayal': { category: 'political', severity: 'medium', translation: '', targets: ['Politicians'] },
  'traitor': { category: 'political', severity: 'high', translation: '', targets: ['Politicians'] },
  'tribal': { category: 'ethnic', severity: 'medium', translation: '', targets: ['Various'] },
  'dynasty': { category: 'political', severity: 'medium', translation: '', targets: ['Political families'] },
  'stolen': { category: 'political', severity: 'medium', translation: '', targets: ['Elections'] },
  'liberation': { category: 'political', severity: 'medium', translation: '', targets: ['Political movements'] },
  'impeachment': { category: 'political', severity: 'low', translation: '', targets: ['Politicians'] },
  'finance bill': { category: 'political', severity: 'low', translation: '', targets: ['Government'] },
  'genZ': { category: 'political', severity: 'low', translation: '', targets: ['Youth'] },
  'maandamano': { category: 'political', severity: 'medium', translation: 'protests', targets: ['Government'] },
  'hatupangwingwi': { category: 'political', severity: 'medium', translation: 'we are not controlled', targets: ['Government'] },
  'reject': { category: 'political', severity: 'low', translation: '', targets: ['Government', 'Policies'] },
  
  // Swahili inflammatory
  'wezi': { category: 'dehumanizing', severity: 'high', translation: 'thieves', targets: ['Politicians'] },
  'mafisadi': { category: 'dehumanizing', severity: 'high', translation: 'corrupt people', targets: ['Politicians'] },
  'wasaliti': { category: 'political', severity: 'high', translation: 'traitors', targets: ['Politicians'] },
  'maadui': { category: 'dehumanizing', severity: 'critical', translation: 'enemies', targets: ['Various'] },
  'ondoka': { category: 'territorial', severity: 'high', translation: 'leave/go away', targets: ['Migrants'] },
  'rudi kwenu': { category: 'territorial', severity: 'high', translation: 'go back home', targets: ['Migrants'] },
  'sisi na wao': { category: 'divisive', severity: 'high', translation: 'us vs them', targets: ['Various'] },
  'vita': { category: 'incitement', severity: 'critical', translation: 'war', targets: ['Various'] },
  'mapanga': { category: 'violence', severity: 'critical', translation: 'machetes', targets: ['Various'] },
  'choma': { category: 'violence', severity: 'critical', translation: 'burn', targets: ['Various'] },
  'funga': { category: 'incitement', severity: 'high', translation: 'shut down', targets: ['Government'] }
};

// Political topics to track (current political class)
const POLITICAL_TOPICS = [
  'finance bill',
  'impeachment',
  'kindiki',
  'ruto',
  'kalonzo',
  'wetangula',
  'mudavadi',
  'azimio',
  'kenya kwanza',
  'genZ',
  'maandamano',
  'land',
  'corruption',
  'taxes',
  'cost of living',
  'fuel prices',
  'elections',
  'iebc',
  'police',
  'security',
  'education',
  'healthcare',
  'joho',
  'oparanya'
];

// Ingestion recency gate: only articles published within this window qualify as
// "live". Stale feed items are dropped before entering the pipeline. Undated
// items default to now (treated as fresh).
const SIGNAL_MAX_AGE_DAYS = 7;
const isFreshArticle = (publishedAt: Date): boolean =>
  Number.isFinite(publishedAt.getTime()) &&
  Date.now() - publishedAt.getTime() <= SIGNAL_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Kenya Sentiment Tracker/1.0',
    'Accept': 'application/rss+xml, application/xml, text/xml'
  }
});

/**
 * Fetch articles from a single RSS feed
 */
async function fetchFeed(feedKey: string, feedConfig: typeof KENYA_NEWS_FEEDS[keyof typeof KENYA_NEWS_FEEDS]): Promise<NewsArticle[]> {
  try {
    const feed = await parser.parseURL(feedConfig.url);

    return (feed.items || [])
      .map((item, index) => ({
        id: `${feedKey}-${item.guid || item.link || index}-${Date.now()}`,
        title: item.title || 'Untitled',
        content: item.content || item.contentSnippet || item.summary || '',
        summary: item.contentSnippet || item.summary || item.content?.substring(0, 300) || '',
        url: item.link || '',
        source: feedConfig.name,
        sourceUrl: feedConfig.url,
        author: item.creator || item.author || null,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        category: feedConfig.category,
        imageUrl: item.enclosure?.url || extractImageFromContent(item.content || '') || null
      }))
      // Recency gate: drop stale feed items (older than the cutoff) at ingestion.
      .filter(a => isFreshArticle(a.publishedAt));
  } catch (error) {
    console.error(`Error fetching feed ${feedConfig.name}:`, error);
    return [];
  }
}

/**
 * Extract image URL from HTML content
 */
function extractImageFromContent(content: string): string | null {
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

/**
 * Analyze article for divisive content
 */
export function analyzeArticle(article: NewsArticle): DivisiveAnalysis {
  const textToAnalyze = `${article.title} ${article.content}`.toLowerCase();
  
  const detectedTerms: DivisiveAnalysis['detectedTerms'] = [];
  const targetedGroups = new Set<string>();
  const detectedTopics: string[] = [];
  
  // Detect hate speech terms
  for (const [term, info] of Object.entries(HATE_SPEECH_TERMS)) {
    if (textToAnalyze.includes(term.toLowerCase())) {
      detectedTerms.push({
        term,
        category: info.category,
        severity: info.severity,
        translation: info.translation || undefined
      });
      info.targets.forEach(t => targetedGroups.add(t));
    }
  }
  
  // Detect political topics
  for (const topic of POLITICAL_TOPICS) {
    if (textToAnalyze.includes(topic.toLowerCase())) {
      detectedTopics.push(topic);
    }
  }
  
  // Calculate divisive score based on detected terms
  let divisiveScore = 0;
  for (const term of detectedTerms) {
    switch (term.severity) {
      case 'critical': divisiveScore += 25; break;
      case 'high': divisiveScore += 15; break;
      case 'medium': divisiveScore += 8; break;
      case 'low': divisiveScore += 3; break;
    }
  }
  
  // Cap at 100
  divisiveScore = Math.min(100, divisiveScore);
  
  // Determine risk level
  let riskLevel: DivisiveAnalysis['riskLevel'] = 'low';
  if (divisiveScore >= 70) riskLevel = 'critical';
  else if (divisiveScore >= 50) riskLevel = 'high';
  else if (divisiveScore >= 25) riskLevel = 'medium';
  
  // Simple sentiment breakdown (can be enhanced with NLP)
  const negativeWords = ['protest', 'reject', 'angry', 'violence', 'kill', 'hate', 'corrupt', 'steal', 'fail', 'crisis'];
  const positiveWords = ['peace', 'unity', 'success', 'progress', 'development', 'hope', 'agree', 'support', 'celebrate'];
  
  let positive = 0, negative = 0, neutral = 0;
  const words = textToAnalyze.split(/\s+/);
  
  for (const word of words) {
    if (negativeWords.some(nw => word.includes(nw))) negative++;
    else if (positiveWords.some(pw => word.includes(pw))) positive++;
    else neutral++;
  }
  
  const total = positive + negative + neutral || 1;
  
  return {
    divisiveScore,
    riskLevel,
    detectedTerms,
    targetedGroups: Array.from(targetedGroups),
    topics: detectedTopics,
    sentimentBreakdown: {
      positive: Math.round((positive / total) * 100),
      negative: Math.round((negative / total) * 100),
      neutral: Math.round((neutral / total) * 100)
    }
  };
}

/**
 * Fetch all news from all configured feeds
 */
export async function fetchAllNews(): Promise<AnalyzedNewsArticle[]> {
  const allArticles: NewsArticle[] = [];
  
  // Fetch from all feeds in parallel
  const feedPromises = Object.entries(KENYA_NEWS_FEEDS).map(([key, config]) => 
    fetchFeed(key, config)
  );
  
  const results = await Promise.allSettled(feedPromises);
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    }
  }
  
  // Remove duplicates by URL
  const uniqueArticles = Array.from(
    new Map(allArticles.map(a => [a.url, a])).values()
  );
  
  // Analyze each article
  const analyzedArticles: AnalyzedNewsArticle[] = uniqueArticles.map(article => ({
    ...article,
    analysis: analyzeArticle(article)
  }));
  
  // Sort by divisive score (most divisive first)
  analyzedArticles.sort((a, b) => b.analysis.divisiveScore - a.analysis.divisiveScore);
  
  return analyzedArticles;
}

/**
 * Fetch news from a specific feed
 */
export async function fetchNewsBySource(sourceKey: keyof typeof KENYA_NEWS_FEEDS): Promise<AnalyzedNewsArticle[]> {
  const config = KENYA_NEWS_FEEDS[sourceKey];
  if (!config) {
    throw new Error(`Unknown source: ${sourceKey}`);
  }
  
  const articles = await fetchFeed(sourceKey, config);
  
  return articles.map(article => ({
    ...article,
    analysis: analyzeArticle(article)
  }));
}

/**
 * Get trending divisive topics from recent articles
 */
export function getTrendingTopics(articles: AnalyzedNewsArticle[]): Array<{
  topic: string;
  count: number;
  avgDivisiveScore: number;
  riskLevel: string;
}> {
  const topicStats: Record<string, { count: number; totalScore: number }> = {};
  
  for (const article of articles) {
    for (const topic of article.analysis.topics) {
      if (!topicStats[topic]) {
        topicStats[topic] = { count: 0, totalScore: 0 };
      }
      topicStats[topic].count++;
      topicStats[topic].totalScore += article.analysis.divisiveScore;
    }
  }
  
  return Object.entries(topicStats)
    .map(([topic, stats]) => {
      const avgScore = stats.totalScore / stats.count;
      let riskLevel = 'low';
      if (avgScore >= 70) riskLevel = 'critical';
      else if (avgScore >= 50) riskLevel = 'high';
      else if (avgScore >= 25) riskLevel = 'medium';
      
      return {
        topic,
        count: stats.count,
        avgDivisiveScore: Math.round(avgScore),
        riskLevel
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Get statistics summary
 */
export function getNewsSummary(articles: AnalyzedNewsArticle[]): {
  totalArticles: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  avgDivisiveScore: number;
  topSources: Array<{ source: string; count: number }>;
} {
  const sourceCount: Record<string, number> = {};
  let totalScore = 0;
  let criticalCount = 0, highCount = 0, mediumCount = 0, lowCount = 0;
  
  for (const article of articles) {
    sourceCount[article.source] = (sourceCount[article.source] || 0) + 1;
    totalScore += article.analysis.divisiveScore;
    
    switch (article.analysis.riskLevel) {
      case 'critical': criticalCount++; break;
      case 'high': highCount++; break;
      case 'medium': mediumCount++; break;
      case 'low': lowCount++; break;
    }
  }
  
  return {
    totalArticles: articles.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    avgDivisiveScore: articles.length > 0 ? Math.round(totalScore / articles.length) : 0,
    topSources: Object.entries(sourceCount)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
  };
}
