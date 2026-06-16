import React, { useMemo } from "react";
import { useParams, Link } from "wouter";

import { parliamentMembers, kenyaRegions } from "@/lib/kenya/political-data";
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Users,
  BarChart3,
  Calendar,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Scale
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

// Generate mock historical sentiment data
const generateSentimentHistory = (baseSentiment: number) => {
  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((month, i) => ({
    month,
    sentiment: Math.max(10, Math.min(90, baseSentiment + (Math.random() - 0.5) * 30)),
    positive: Math.floor(Math.random() * 500) + 200,
    negative: Math.floor(Math.random() * 300) + 100,
    neutral: Math.floor(Math.random() * 200) + 100
  }));
};

// Generate mock voting record
const generateVotingRecord = () => {
  return [
    { bill: "Finance Bill 2024", vote: "Yes", date: "2024-06-15", category: "Finance" },
    { bill: "Healthcare Amendment", vote: "No", date: "2024-05-20", category: "Health" },
    { bill: "Education Reform Act", vote: "Yes", date: "2024-04-10", category: "Education" },
    { bill: "Security Enhancement Bill", vote: "Abstain", date: "2024-03-05", category: "Security" },
    { bill: "Agricultural Subsidies", vote: "Yes", date: "2024-02-18", category: "Agriculture" },
    { bill: "Digital Services Tax", vote: "No", date: "2024-01-25", category: "Finance" },
  ];
};

// Generate local issues
const generateLocalIssues = () => {
  return [
    { issue: "Road Infrastructure", concern: 85, trend: "up" },
    { issue: "Water Access", concern: 72, trend: "stable" },
    { issue: "Healthcare Facilities", concern: 68, trend: "up" },
    { issue: "Youth Unemployment", concern: 78, trend: "up" },
    { issue: "Security", concern: 55, trend: "down" },
    { issue: "Education Quality", concern: 62, trend: "stable" },
  ];
};

// Generate constituency demographics
const generateDemographics = () => ({
  population: Math.floor(Math.random() * 200000) + 100000,
  registeredVoters: Math.floor(Math.random() * 100000) + 50000,
  voterTurnout2022: Math.floor(Math.random() * 30) + 55,
  urbanRural: Math.random() > 0.5 ? "Urban" : "Rural",
  majorEthnicity: ["Kikuyu", "Luo", "Kalenjin", "Luhya", "Kamba", "Kisii"][Math.floor(Math.random() * 6)],
  avgIncome: ["Low", "Lower-Middle", "Middle", "Upper-Middle"][Math.floor(Math.random() * 4)]
});

const COLORS = ["#22C55E", "#EF4444", "#6B7280"];

export default function ConstituencyDetail() {
  const { id } = useParams<{ id: string }>();
  
  // Find the MP by constituency name (URL-encoded)
  const mp = useMemo(() => {
    const decodedId = decodeURIComponent(id || "");
    return parliamentMembers.find(m => 
      m.constituency?.toLowerCase().replace(/\s+/g, "-") === decodedId.toLowerCase() ||
      m.name.toLowerCase().replace(/\s+/g, "-") === decodedId.toLowerCase()
    );
  }, [id]);

  const sentimentHistory = useMemo(() => generateSentimentHistory(mp?.sentiment || 50), [mp]);
  const votingRecord = useMemo(() => generateVotingRecord(), []);
  const localIssues = useMemo(() => generateLocalIssues(), []);
  const demographics = useMemo(() => generateDemographics(), []);

  const sentimentBreakdown = useMemo(() => {
    const latest = sentimentHistory[sentimentHistory.length - 1];
    return [
      { name: "Positive", value: latest.positive },
      { name: "Negative", value: latest.negative },
      { name: "Neutral", value: latest.neutral }
    ];
  }, [sentimentHistory]);

  const votingSummary = useMemo(() => {
    const yes = votingRecord.filter(v => v.vote === "Yes").length;
    const no = votingRecord.filter(v => v.vote === "No").length;
    const abstain = votingRecord.filter(v => v.vote === "Abstain").length;
    return { yes, no, abstain, total: votingRecord.length };
  }, [votingRecord]);

  if (!mp) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-mono font-bold mb-4">Constituency Not Found</h2>
          <Link href="/parliament">
            <a className="text-primary hover:underline">← Back to Parliament</a>
          </Link>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "down": return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getVoteColor = (vote: string) => {
    switch (vote) {
      case "Yes": return "bg-green-100 text-green-800";
      case "No": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Back Navigation */}
        <Link href="/parliament">
          <a className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-mono text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Parliament
          </a>
        </Link>

        {/* Header */}
        <div className="brutalist-card bg-foreground text-background">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-24 h-24 bg-background/20 flex items-center justify-center text-4xl font-bold">
              {mp.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-mono font-bold">{mp.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm opacity-80">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {mp.constituency || "Women Rep"} • {mp.county}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {mp.party}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <span className={`px-3 py-1 text-sm font-mono ${
                  mp.coalition === "Kenya Kwanza" ? "bg-yellow-500 text-black" : "bg-orange-500 text-white"
                }`}>
                  {mp.coalition}
                </span>
                <span className="text-2xl font-bold">{mp.sentiment}%</span>
                <span className="text-sm opacity-70">Current Sentiment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">Population</div>
            <div className="text-2xl font-bold">{demographics.population.toLocaleString()}</div>
          </div>
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">Registered Voters</div>
            <div className="text-2xl font-bold">{demographics.registeredVoters.toLocaleString()}</div>
          </div>
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">2022 Turnout</div>
            <div className="text-2xl font-bold">{demographics.voterTurnout2022}%</div>
          </div>
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">Area Type</div>
            <div className="text-2xl font-bold">{demographics.urbanRural}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment History Chart */}
          <div className="brutalist-card bg-background">
            <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sentiment History (6 Months)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                  <Tooltip 
                    contentStyle={{ 
                      fontFamily: 'monospace', 
                      fontSize: '12px',
                      border: '2px solid #000',
                      borderRadius: 0
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sentiment" 
                    stroke="#000" 
                    strokeWidth={2}
                    dot={{ fill: '#000' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sentiment Breakdown */}
          <div className="brutalist-card bg-background">
            <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Sentiment Breakdown
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sentimentBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Voting Record */}
        <div className="brutalist-card bg-background">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono font-bold uppercase flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Voting Record
            </h3>
            <div className="flex gap-4 text-sm font-mono">
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4 text-green-600" />
                Yes: {votingSummary.yes}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="w-4 h-4 text-red-600" />
                No: {votingSummary.no}
              </span>
              <span className="text-muted-foreground">
                Abstain: {votingSummary.abstain}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left p-3 font-mono text-xs uppercase">Bill</th>
                  <th className="text-left p-3 font-mono text-xs uppercase">Category</th>
                  <th className="text-center p-3 font-mono text-xs uppercase">Vote</th>
                  <th className="text-left p-3 font-mono text-xs uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {votingRecord.map((record, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-secondary/30"}>
                    <td className="p-3 font-mono text-sm">{record.bill}</td>
                    <td className="p-3 font-mono text-sm text-muted-foreground">{record.category}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 text-xs font-mono ${getVoteColor(record.vote)}`}>
                        {record.vote}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-sm text-muted-foreground">{record.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Local Issues */}
        <div className="brutalist-card bg-background">
          <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Key Local Issues Driving Sentiment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localIssues.map((item, i) => (
              <div key={i} className="p-4 bg-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold">{item.issue}</span>
                  {getTrendIcon(item.trend)}
                </div>
                <div className="h-3 bg-background">
                  <div 
                    className={`h-full ${item.concern >= 70 ? "bg-red-500" : item.concern >= 50 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${item.concern}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">{item.concern}% concern level</div>
              </div>
            ))}
          </div>
        </div>

        {/* Demographics */}
        <div className="brutalist-card bg-secondary">
          <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Constituency Demographics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-mono uppercase text-muted-foreground">Major Ethnicity</div>
              <div className="font-bold">{demographics.majorEthnicity}</div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase text-muted-foreground">Income Level</div>
              <div className="font-bold">{demographics.avgIncome}</div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase text-muted-foreground">Area Classification</div>
              <div className="font-bold">{demographics.urbanRural}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
