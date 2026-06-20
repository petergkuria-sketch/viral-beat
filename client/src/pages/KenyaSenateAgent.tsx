import React, { useState, useMemo } from "react";
import { Link } from "wouter";

import { senators, getAllRegions, Senator } from "@/lib/kenya/senators-data";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  Landmark,
  MapPin,
  AlertTriangle,
  ChevronRight,
  ExternalLink
} from "lucide-react";

const getSentimentColor = (sentiment: number): string => {
  if (sentiment >= 60) return "text-green-500";
  if (sentiment >= 45) return "text-yellow-500";
  if (sentiment >= 30) return "text-orange-500";
  return "text-red-500";
};

const getSentimentBg = (sentiment: number): string => {
  if (sentiment >= 60) return "bg-green-500";
  if (sentiment >= 45) return "bg-yellow-500";
  if (sentiment >= 30) return "bg-orange-500";
  return "bg-red-500";
};

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-500" />;
};

const getCoalitionColor = (coalition: string) => {
  if (coalition === "Kenya Kwanza") return "bg-yellow-500";
  if (coalition === "Azimio") return "bg-orange-500";
  return "bg-gray-500";
};

export default function SenateAgent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCoalition, setFilterCoalition] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [selectedSenator, setSelectedSenator] = useState<Senator | null>(null);

  const filteredSenators = useMemo(() => {
    return senators.filter(senator => {
      const matchesSearch = senator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        senator.county.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCoalition = filterCoalition === "all" || senator.coalition === filterCoalition;
      const matchesRegion = filterRegion === "all" || senator.region === filterRegion;
      return matchesSearch && matchesCoalition && matchesRegion;
    });
  }, [searchTerm, filterCoalition, filterRegion]);

  const coalitionStats = useMemo(() => {
    const kk = senators.filter(m => m.coalition === "Kenya Kwanza").length;
    const az = senators.filter(m => m.coalition === "Azimio").length;
    return { kenyaKwanza: kk, azimio: az };
  }, []);

  const avgSentiment = Math.round(
    senators.reduce((acc, m) => acc + m.sentimentScore, 0) / senators.length
  );

  const topPerformers = useMemo(() => 
    [...senators].sort((a, b) => b.sentimentScore - a.sentimentScore).slice(0, 5),
    []
  );

  const bottomPerformers = useMemo(() => 
    [...senators].sort((a, b) => a.sentimentScore - b.sentimentScore).slice(0, 5),
    []
  );

  const regions = getAllRegions();

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b-2 border-border pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Landmark className="w-8 h-8" />
            <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase">Senate Agent</h2>
          </div>
          <p className="text-muted-foreground font-mono">
            Monitor sentiment for 47 elected Senators representing Kenya's counties. Click any senator for detailed profile.
          </p>
        </div>

        {/* Coalition Balance */}
        <div className="brutalist-card bg-foreground text-background">
          <h3 className="font-mono text-sm uppercase mb-4 opacity-70">Senate Coalition Balance</h3>
          <div className="flex h-8 mb-4 overflow-hidden">
            <div 
              className="bg-yellow-500 flex items-center justify-center text-xs font-mono font-bold text-black"
              style={{ width: `${(coalitionStats.kenyaKwanza / 47) * 100}%` }}
            >
              {coalitionStats.kenyaKwanza}
            </div>
            <div 
              className="bg-orange-500 flex items-center justify-center text-xs font-mono font-bold text-white"
              style={{ width: `${(coalitionStats.azimio / 47) * 100}%` }}
            >
              {coalitionStats.azimio}
            </div>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500"></span>
              Kenya Kwanza ({coalitionStats.kenyaKwanza})
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-500"></span>
              Azimio ({coalitionStats.azimio})
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">Total Senators</div>
            <div className="text-3xl font-bold">47</div>
            <div className="text-xs font-mono text-muted-foreground">Elected Members</div>
          </div>
          <div className={`brutalist-card ${avgSentiment >= 50 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-xs font-mono uppercase text-muted-foreground">Avg Sentiment</div>
            <div className={`text-3xl font-bold ${getSentimentColor(avgSentiment)}`}>{avgSentiment}%</div>
            <div className="text-xs font-mono text-muted-foreground">Overall Rating</div>
          </div>
          <div className="brutalist-card bg-green-50">
            <div className="text-xs font-mono uppercase text-green-800">Rising</div>
            <div className="text-3xl font-bold text-green-700">
              {senators.filter(m => m.trend === "up").length}
            </div>
            <div className="text-xs font-mono text-green-600">Positive Trend</div>
          </div>
          <div className="brutalist-card bg-red-50">
            <div className="text-xs font-mono uppercase text-red-800">Declining</div>
            <div className="text-3xl font-bold text-red-700">
              {senators.filter(m => m.trend === "down").length}
            </div>
            <div className="text-xs font-mono text-red-600">Negative Trend</div>
          </div>
        </div>

        {/* Top and Bottom Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="brutalist-card bg-green-50">
            <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2 text-green-800">
              <TrendingUp className="w-5 h-5" />
              Top Performers
            </h3>
            <div className="space-y-3">
              {topPerformers.map((senator, i) => (
                <Link key={senator.id} href={`/kenya/senator/${senator.id}`}>
                  <div className="flex items-center gap-3 p-2 bg-white hover:bg-green-100 cursor-pointer transition-colors">
                    <span className="w-6 h-6 bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-mono text-sm font-bold">{senator.name}</div>
                      <div className="text-xs text-muted-foreground">{senator.county}</div>
                    </div>
                    <span className="text-lg font-bold text-green-600">{senator.sentimentScore}%</span>
                    <ChevronRight className="w-4 h-4 text-green-500" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="brutalist-card bg-red-50">
            <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              Needs Attention
            </h3>
            <div className="space-y-3">
              {bottomPerformers.map((senator, i) => (
                <Link key={senator.id} href={`/kenya/senator/${senator.id}`}>
                  <div className="flex items-center gap-3 p-2 bg-white hover:bg-red-100 cursor-pointer transition-colors">
                    <span className="w-6 h-6 bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-mono text-sm font-bold">{senator.name}</div>
                      <div className="text-xs text-muted-foreground">{senator.county}</div>
                    </div>
                    <span className="text-lg font-bold text-red-600">{senator.sentimentScore}%</span>
                    <ChevronRight className="w-4 h-4 text-red-500" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search senator or county..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          <select
            value={filterCoalition}
            onChange={(e) => setFilterCoalition(e.target.value)}
            className="px-4 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:border-foreground"
          >
            <option value="all">All Coalitions</option>
            <option value="Kenya Kwanza">Kenya Kwanza</option>
            <option value="Azimio">Azimio</option>
          </select>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="px-4 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:border-foreground"
          >
            <option value="all">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {/* Senators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSenators.map(senator => (
            <Link key={senator.id} href={`/kenya/senator/${senator.id}`}>
              <div
                className="brutalist-card bg-background cursor-pointer hover:bg-secondary/50 hover:border-[#dc2626] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-bold flex items-center gap-2">
                      {senator.name}
                      {senator.leadershipPosition && (
                        <span className="px-1.5 py-0.5 bg-[#dc2626] text-white text-[10px] font-mono">
                          {senator.leadershipPosition.split(' ')[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {senator.county}
                    </div>
                  </div>
                  <TrendIcon trend={senator.trend} />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 text-xs font-mono ${
                    senator.coalition === "Kenya Kwanza" ? "bg-yellow-100 text-yellow-800" :
                    "bg-orange-100 text-orange-800"
                  }`}>
                    {senator.coalition}
                  </span>
                  <span className="px-2 py-1 bg-secondary text-xs font-mono">{senator.party}</span>
                  <span className="text-xs text-muted-foreground">{senator.region}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">Sentiment Score</span>
                  <span className={`text-xl font-bold ${getSentimentColor(senator.sentimentScore)}`}>
                    {senator.sentimentScore}%
                  </span>
                </div>

                <div className="mt-2 h-2 bg-secondary">
                  <div 
                    className={`h-full ${getSentimentBg(senator.sentimentScore)}`}
                    style={{ width: `${senator.sentimentScore}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Approval: {senator.approvalRating}%</span>
                  <span className="flex items-center gap-1 text-[#dc2626]">
                    View Profile <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Selected Senator Modal */}
        {selectedSenator && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSenator(null)}
          >
            <div 
              className="brutalist-card bg-background max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 ${getCoalitionColor(selectedSenator.coalition)} flex items-center justify-center`}>
                  <Landmark className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedSenator.name}</h3>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Senator for {selectedSenator.county} County
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-secondary p-4">
                  <div className="text-xs font-mono uppercase text-muted-foreground">Sentiment</div>
                  <div className={`text-3xl font-bold ${getSentimentColor(selectedSenator.sentimentScore)}`}>
                    {selectedSenator.sentimentScore}%
                  </div>
                </div>
                <div className="bg-secondary p-4">
                  <div className="text-xs font-mono uppercase text-muted-foreground">Trend</div>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendIcon trend={selectedSenator.trend} />
                    <span className="text-lg font-bold capitalize">{selectedSenator.trend}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="font-mono text-sm text-muted-foreground">Party</span>
                  <span className="font-mono text-sm font-bold">{selectedSenator.party}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="font-mono text-sm text-muted-foreground">Coalition</span>
                  <span className={`px-2 py-1 text-xs font-mono ${
                    selectedSenator.coalition === "Kenya Kwanza" ? "bg-yellow-100 text-yellow-800" :
                    "bg-orange-100 text-orange-800"
                  }`}>
                    {selectedSenator.coalition}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="font-mono text-sm text-muted-foreground">Region</span>
                  <span className="font-mono text-sm font-bold">
                    {selectedSenator.region}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Link href={`/kenya/senator/${selectedSenator.id}`} className="flex-1">
                  <button className="w-full py-3 bg-[#dc2626] text-white font-mono text-sm hover:bg-[#b91c1c] transition-colors">
                    View Full Profile
                  </button>
                </Link>
                <button
                  onClick={() => setSelectedSenator(null)}
                  className="flex-1 py-3 border-2 border-border font-mono text-sm hover:bg-secondary transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
