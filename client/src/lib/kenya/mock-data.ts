import { subDays, format } from "date-fns";

export interface SentimentDataPoint {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface Politician {
  id: string;
  name: string;
  role: string;
  party: string;
  image: string;
  currentSentiment: number; // -100 to 100
  trend: "up" | "down" | "stable";
  history: SentimentDataPoint[];
}

export const generateHistory = (days: number): SentimentDataPoint[] => {
  const data: SentimentDataPoint[] = [];
  for (let i = days; i >= 0; i--) {
    const date = format(subDays(new Date(), i), "MMM dd");
    // Generate somewhat random but continuous data
    const base = 30 + Math.random() * 40;
    const positive = Math.floor(base + (Math.random() * 20 - 10));
    const negative = Math.floor((100 - positive) * (0.3 + Math.random() * 0.4));
    const neutral = 100 - positive - negative;
    
    data.push({
      date,
      positive,
      neutral,
      negative
    });
  }
  return data;
};

export const politicians: Politician[] = [
  {
    id: "ruto",
    name: "William Ruto",
    role: "President",
    party: "UDA / Kenya Kwanza",
    image: "/images/ruto.jpg",
    currentSentiment: 45,
    trend: "down",
    history: generateHistory(30)
  },
  {
    id: "kindiki",
    name: "Kithure Kindiki",
    role: "Deputy President",
    party: "UDA / Kenya Kwanza",
    image: "/images/kindiki.jpg",
    currentSentiment: 52,
    trend: "up",
    history: generateHistory(30)
  },
  {
    id: "kalonzo",
    name: "Kalonzo Musyoka",
    role: "Opposition Leader",
    party: "Wiper / Azimio",
    image: "/images/kalonzo.jpg",
    currentSentiment: 48,
    trend: "stable",
    history: generateHistory(30)
  },
  {
    id: "wetangula",
    name: "Moses Wetang'ula",
    role: "National Assembly Speaker",
    party: "Ford Kenya / Kenya Kwanza",
    image: "/images/wetangula.jpg",
    currentSentiment: 42,
    trend: "stable",
    history: generateHistory(30)
  }
];

export const recentAlerts = [
  {
    id: 1,
    severity: "high",
    message: "Spike in negative sentiment detected in Nairobi region regarding 'Finance Bill'.",
    timestamp: "2 hours ago"
  },
  {
    id: 2,
    severity: "critical",
    message: "Potential hate speech patterns detected in online discourse related to land issues in Rift Valley.",
    timestamp: "5 hours ago"
  },
  {
    id: 3,
    severity: "low",
    message: "Neutral sentiment trend observed for new infrastructure projects.",
    timestamp: "1 day ago"
  }
];
