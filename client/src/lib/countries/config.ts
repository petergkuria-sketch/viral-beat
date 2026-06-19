export type GovernmentType = "presidential" | "semi-presidential" | "parliamentary";

export type CountryModule =
  | "tracker"
  | "regional-map"
  | "parliament"
  | "senate"
  | "governors"
  | "women-reps"
  | "newsfeed"
  | "breaking-news"
  | "social-media"
  | "election-phases"
  | "movements"
  | "alerts"
  | "reports"
  | "icc-agent"
  | "balkanization"
  | "executive";

export interface CountryConfig {
  code: string;           // ISO 3166-1 alpha-2
  name: string;
  flag: string;           // emoji
  capital: string;
  region: string;
  government: GovernmentType;
  population: number;     // millions
  currency: string;
  languages: string[];
  electionYear?: number;
  nextElection?: string;  // ISO date
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  stabilityScore: number; // 0-100
  modules: CountryModule[];
  rssFeeds: RssFeed[];
  legislature: {
    lowerHouse?: string;  // e.g. "National Assembly"
    upperHouse?: string;  // e.g. "Senate"
    seats?: number;
  };
  // Kenya-specific deep path — legacy support
  legacyPath?: string;
}

export interface RssFeed {
  name: string;
  url: string;
  category: "politics" | "business" | "general" | "enterprise";
  language: string;
}

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  ke: {
    code: "ke",
    name: "Kenya",
    flag: "🇰🇪",
    capital: "Nairobi",
    region: "East Africa",
    government: "presidential",
    population: 55,
    currency: "KES",
    languages: ["English", "Swahili"],
    nextElection: "2027-08-01",
    riskLevel: "Moderate",
    stabilityScore: 58,
    legacyPath: "/kenya",
    modules: [
      "tracker", "regional-map", "parliament", "senate", "governors",
      "women-reps", "newsfeed", "breaking-news", "social-media",
      "election-phases", "movements", "alerts", "reports", "icc-agent",
      "balkanization", "executive",
    ],
    legislature: {
      lowerHouse: "National Assembly",
      upperHouse: "Senate",
      seats: 350,
    },
    rssFeeds: [
      { name: "Daily Nation", url: "https://nation.africa/kenya/rss.xml", category: "general", language: "en" },
      { name: "The Standard", url: "https://www.standardmedia.co.ke/rss/headlines.php", category: "general", language: "en" },
      { name: "Business Daily", url: "https://businessdailyafrica.com/rss/", category: "business", language: "en" },
      { name: "Capital FM", url: "https://www.capitalfm.co.ke/news/feed/", category: "general", language: "en" },
      { name: "Citizen Digital", url: "https://www.citizen.digital/feed", category: "general", language: "en" },
    ],
  },

  ng: {
    code: "ng",
    name: "Nigeria",
    flag: "🇳🇬",
    capital: "Abuja",
    region: "West Africa",
    government: "presidential",
    population: 220,
    currency: "NGN",
    languages: ["English", "Hausa", "Yoruba", "Igbo"],
    nextElection: "2027-02-01",
    riskLevel: "High",
    stabilityScore: 42,
    modules: [
      "tracker", "parliament", "senate", "newsfeed", "breaking-news",
      "social-media", "election-phases", "movements", "alerts", "reports", "executive",
    ],
    legislature: {
      lowerHouse: "House of Representatives",
      upperHouse: "Senate",
      seats: 360,
    },
    rssFeeds: [
      { name: "Punch Nigeria", url: "https://punchng.com/feed/", category: "general", language: "en" },
      { name: "Vanguard", url: "https://www.vanguardngr.com/feed/", category: "general", language: "en" },
      { name: "ThisDay", url: "https://www.thisdaylive.com/index.php/feed/", category: "general", language: "en" },
      { name: "BusinessDay NG", url: "https://businessday.ng/feed/", category: "business", language: "en" },
      { name: "Premium Times", url: "https://www.premiumtimesng.com/feed", category: "politics", language: "en" },
      { name: "Guardian Nigeria", url: "https://guardian.ng/feed/", category: "general", language: "en" },
    ],
  },

  za: {
    code: "za",
    name: "South Africa",
    flag: "🇿🇦",
    capital: "Pretoria",
    region: "Southern Africa",
    government: "parliamentary",
    population: 60,
    currency: "ZAR",
    languages: ["Zulu", "Xhosa", "Afrikaans", "English"],
    nextElection: "2029-05-01",
    riskLevel: "Moderate",
    stabilityScore: 55,
    modules: [
      "tracker", "parliament", "newsfeed", "breaking-news",
      "social-media", "election-phases", "movements", "alerts", "reports", "executive",
    ],
    legislature: {
      lowerHouse: "National Assembly",
      upperHouse: "National Council of Provinces",
      seats: 400,
    },
    rssFeeds: [
      { name: "Daily Maverick", url: "https://www.dailymaverick.co.za/dmrss/", category: "politics", language: "en" },
      { name: "Mail & Guardian", url: "https://mg.co.za/feed/", category: "general", language: "en" },
      { name: "Business Tech", url: "https://businesstech.co.za/news/feed/", category: "business", language: "en" },
      { name: "News24", url: "https://feeds.news24.com/articles/news24/TopStories/rss", category: "general", language: "en" },
      { name: "Fin24", url: "https://www.news24.com/fin24/rss", category: "business", language: "en" },
    ],
  },

  gh: {
    code: "gh",
    name: "Ghana",
    flag: "🇬🇭",
    capital: "Accra",
    region: "West Africa",
    government: "presidential",
    population: 33,
    currency: "GHS",
    languages: ["English", "Akan", "Ewe"],
    nextElection: "2028-12-01",
    riskLevel: "Low",
    stabilityScore: 72,
    modules: [
      "tracker", "parliament", "newsfeed", "breaking-news",
      "social-media", "election-phases", "alerts", "reports", "executive",
    ],
    legislature: {
      lowerHouse: "Parliament of Ghana",
      seats: 275,
    },
    rssFeeds: [
      { name: "GhanaWeb", url: "https://www.ghanaweb.com/GhanaHomePage/rss/news.xml", category: "general", language: "en" },
      { name: "MyJoyOnline", url: "https://www.myjoyonline.com/feed/", category: "general", language: "en" },
      { name: "Citinewsroom", url: "https://citinewsroom.com/feed/", category: "general", language: "en" },
      { name: "B&FT Online", url: "https://thebftonline.com/feed/", category: "business", language: "en" },
    ],
  },

  et: {
    code: "et",
    name: "Ethiopia",
    flag: "🇪🇹",
    capital: "Addis Ababa",
    region: "East Africa",
    government: "parliamentary",
    population: 126,
    currency: "ETB",
    languages: ["Amharic", "Oromo", "Tigrinya", "Somali"],
    nextElection: "2026-06-01",
    riskLevel: "High",
    stabilityScore: 35,
    modules: [
      "tracker", "parliament", "newsfeed", "breaking-news",
      "social-media", "election-phases", "movements", "alerts", "reports", "executive",
    ],
    legislature: {
      lowerHouse: "House of Peoples' Representatives",
      upperHouse: "House of the Federation",
      seats: 547,
    },
    rssFeeds: [
      { name: "Addis Standard", url: "https://addisstandard.com/feed/", category: "general", language: "en" },
      { name: "The Reporter Ethiopia", url: "https://www.thereporterethiopia.com/rss.xml", category: "general", language: "en" },
      { name: "Ethiopian Monitor", url: "https://ethiopianmonitor.com/feed/", category: "business", language: "en" },
    ],
  },

  sn: {
    code: "sn",
    name: "Senegal",
    flag: "🇸🇳",
    capital: "Dakar",
    region: "West Africa",
    government: "presidential",
    population: 17,
    currency: "XOF",
    languages: ["French", "Wolof", "Pulaar"],
    nextElection: "2029-02-01",
    riskLevel: "Moderate",
    stabilityScore: 62,
    modules: [
      "tracker", "parliament", "newsfeed", "breaking-news",
      "election-phases", "alerts", "reports", "executive",
    ],
    legislature: {
      lowerHouse: "National Assembly",
      seats: 165,
    },
    rssFeeds: [
      { name: "Seneweb", url: "https://www.seneweb.com/news/rss.php", category: "general", language: "fr" },
      { name: "Dakar Actu", url: "https://www.dakaractu.com/spip.php?page=backend", category: "general", language: "fr" },
      { name: "Leral", url: "https://www.leral.net/spip.php?page=backend", category: "politics", language: "fr" },
    ],
  },

  tz: {
    code: "tz",
    name: "Tanzania",
    flag: "🇹🇿",
    capital: "Dodoma",
    region: "East Africa",
    government: "presidential",
    population: 63,
    currency: "TZS",
    languages: ["Swahili", "English"],
    nextElection: "2025-10-01",
    riskLevel: "Moderate",
    stabilityScore: 54,
    modules: [
      "tracker", "parliament", "newsfeed", "breaking-news",
      "election-phases", "alerts", "reports", "executive",
    ],
    legislature: {
      lowerHouse: "National Assembly",
      seats: 393,
    },
    rssFeeds: [
      { name: "The Citizen Tanzania", url: "https://www.thecitizen.co.tz/tanzania/rss.xml", category: "general", language: "en" },
      { name: "Daily News Tanzania", url: "https://www.dailynews.co.tz/rss.xml", category: "general", language: "en" },
      { name: "IPP Media", url: "https://www.ippmedia.com/rss/all", category: "general", language: "en" },
    ],
  },

  ci: {
    code: "ci",
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    capital: "Yamoussoukro",
    region: "West Africa",
    government: "presidential",
    population: 27,
    currency: "XOF",
    languages: ["French", "Dioula"],
    nextElection: "2025-10-01",
    riskLevel: "Moderate",
    stabilityScore: 58,
    modules: [
      "tracker", "parliament", "newsfeed", "breaking-news",
      "election-phases", "alerts", "reports", "executive",
    ],
    legislature: {
      lowerHouse: "National Assembly",
      upperHouse: "Senate",
      seats: 255,
    },
    rssFeeds: [
      { name: "Fraternité Matin", url: "https://www.fratmat.info/rss.xml", category: "general", language: "fr" },
      { name: "Abidjan.net", url: "https://news.abidjan.net/rss/", category: "general", language: "fr" },
      { name: "Connectionivoirienne", url: "https://www.connectionivoirienne.net/feed", category: "politics", language: "fr" },
    ],
  },

  eg: {
    code: "eg",
    name: "Egypt",
    flag: "🇪🇬",
    capital: "Cairo",
    region: "North Africa",
    government: "presidential",
    population: 104,
    currency: "EGP",
    languages: ["Arabic"],
    nextElection: "2030-05-01",
    riskLevel: "Moderate",
    stabilityScore: 50,
    modules: [
      "tracker", "parliament", "newsfeed", "breaking-news",
      "social-media", "alerts", "reports", "executive",
    ],
    legislature: {
      lowerHouse: "House of Representatives",
      upperHouse: "Senate",
      seats: 596,
    },
    rssFeeds: [
      { name: "Egypt Independent", url: "https://egyptindependent.com/feed/", category: "general", language: "en" },
      { name: "Al-Monitor Egypt", url: "https://www.al-monitor.com/rss/egypt.xml", category: "politics", language: "en" },
      { name: "Ahram Online", url: "https://english.ahram.org.eg/rss.aspx", category: "general", language: "en" },
      { name: "Daily News Egypt", url: "https://dailynewsegypt.com/feed/", category: "business", language: "en" },
    ],
  },

  rw: {
    code: "rw",
    name: "Rwanda",
    flag: "🇷🇼",
    capital: "Kigali",
    region: "East Africa",
    government: "presidential",
    population: 14,
    currency: "RWF",
    languages: ["Kinyarwanda", "English", "French"],
    nextElection: "2029-08-01",
    riskLevel: "Low",
    stabilityScore: 75,
    modules: [
      "tracker", "parliament", "newsfeed", "breaking-news",
      "election-phases", "alerts", "reports", "executive",
    ],
    legislature: {
      lowerHouse: "Chamber of Deputies",
      upperHouse: "Senate",
      seats: 80,
    },
    rssFeeds: [
      { name: "The New Times Rwanda", url: "https://www.newtimes.co.rw/feed", category: "general", language: "en" },
      { name: "KT Press", url: "https://www.ktpress.rw/feed", category: "general", language: "en" },
    ],
  },
};

export function getCountryConfig(code: string): CountryConfig | undefined {
  return COUNTRY_CONFIGS[code.toLowerCase()];
}

export function hasModule(code: string, module: CountryModule): boolean {
  return COUNTRY_CONFIGS[code.toLowerCase()]?.modules.includes(module) ?? false;
}

export const ACTIVE_COUNTRIES = Object.values(COUNTRY_CONFIGS);
