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
  if (sentiment >= 60) return "text-emerald-400";
  if (sentiment >= 45) return "text-amber-400";
  if (sentiment >= 30) return "text-orange-400";
  return "text-red-400";
};

const getSentimentBg = (sentiment: number): string => {
  if (sentiment >= 60) return "bg-emerald-500";
  if (sentiment >= 45) return "bg-amber-500";
  if (sentiment >= 30) return "bg-orange-500";
  return "bg-red-500";
};

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <TrendingUp className="w-4 h-4" style={{ color: '#34d399' }} />;
  if (trend === "down") return <TrendingDown className="w-4 h-4" style={{ color: '#f87171' }} />;
  return <Minus className="w-4 h-4 text-slate-500" />;
};

const getCoalitionColor = (coalition: string) => {
  if (coalition === "Kenya Kwanza") return "bg-amber-500";
  if (coalition === "Azimio") return "bg-orange-500";
  return "bg-slate-500";
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
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <div className="flex items-center gap-3">
          <Landmark className="w-6 h-6 text-slate-400" />
          <div>
            <h1 className="text-xl font-black text-slate-100">Senate Agent</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Monitor sentiment for 47 elected Senators representing Kenya's counties. Click any senator for detailed profile.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Coalition Balance */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-300 mb-4">Senate Coalition Balance</p>
          <div className="flex h-8 mb-4 overflow-hidden rounded-xl">
            <div
              className="bg-amber-500 flex items-center justify-center text-xs font-bold text-black"
              style={{ width: `${(coalitionStats.kenyaKwanza / 47) * 100}%` }}
            >
              {coalitionStats.kenyaKwanza}
            </div>
            <div
              className="bg-orange-500 flex items-center justify-center text-xs font-bold text-white"
              style={{ width: `${(coalitionStats.azimio / 47) * 100}%` }}
            >
              {coalitionStats.azimio}
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              Kenya Kwanza ({coalitionStats.kenyaKwanza})
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              Azimio ({coalitionStats.azimio})
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="text-xs text-slate-400 mb-1">Total Senators</div>
            <div className="text-3xl font-bold text-slate-100">47</div>
            <div className="text-xs text-slate-400">Elected Members</div>
          </div>
          <div className={`bg-card border rounded-2xl p-5 ${avgSentiment >= 50 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
            <div className="text-xs text-slate-400 mb-1">Avg Sentiment</div>
            <div className={`text-3xl font-bold ${getSentimentColor(avgSentiment)}`}>{avgSentiment}%</div>
            <div className="text-xs text-slate-400">Overall Rating</div>
          </div>
          <div className="bg-card border border-emerald-500/20 rounded-2xl p-5">
            <div className="text-xs text-slate-400 mb-1">Rising</div>
            <div className="text-3xl font-bold" style={{ color: '#34d399' }}>
              {senators.filter(m => m.trend === "up").length}
            </div>
            <div className="text-xs text-slate-400">Positive Trend</div>
          </div>
          <div className="bg-card border border-red-500/20 rounded-2xl p-5">
            <div className="text-xs text-slate-400 mb-1">Declining</div>
            <div className="text-3xl font-bold" style={{ color: '#f87171' }}>
              {senators.filter(m => m.trend === "down").length}
            </div>
            <div className="text-xs text-slate-400">Negative Trend</div>
          </div>
        </div>

        {/* Top and Bottom Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-card border border-emerald-500/20 rounded-2xl p-5">
            <h3 className="font-bold text-sm text-slate-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: '#34d399' }} />
              Top Performers
            </h3>
            <div className="space-y-3">
              {topPerformers.map((senator, i) => (
                <Link key={senator.id} href={`/kenya/senator/${senator.id}`}>
                  <div className="flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-200">{senator.name}</div>
                      <div className="text-xs text-slate-400">{senator.county}</div>
                    </div>
                    <span className="text-lg font-bold" style={{ color: '#34d399' }}>{senator.sentimentScore}%</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-card border border-red-500/20 rounded-2xl p-5">
            <h3 className="font-bold text-sm text-slate-300 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" style={{ color: '#f87171' }} />
              Needs Attention
            </h3>
            <div className="space-y-3">
              {bottomPerformers.map((senator, i) => (
                <Link key={senator.id} href={`/kenya/senator/${senator.id}`}>
                  <div className="flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-200">{senator.name}</div>
                      <div className="text-xs text-slate-400">{senator.county}</div>
                    </div>
                    <span className="text-lg font-bold" style={{ color: '#f87171' }}>{senator.sentimentScore}%</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search senator or county..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          <select
            value={filterCoalition}
            onChange={(e) => setFilterCoalition(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
          >
            <option value="all">All Coalitions</option>
            <option value="Kenya Kwanza">Kenya Kwanza</option>
            <option value="Azimio">Azimio</option>
          </select>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
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
              <div className="bg-card border border-border/50 rounded-2xl p-5 cursor-pointer hover:bg-white/5 hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-bold text-slate-100 flex items-center gap-2">
                      {senator.name}
                      {senator.leadershipPosition && (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-[10px]">
                          {senator.leadershipPosition.split(' ')[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {senator.county}
                    </div>
                  </div>
                  <TrendIcon trend={senator.trend} />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${
                    senator.coalition === "Kenya Kwanza" ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                    "bg-orange-500/10 border-orange-500/20 text-orange-300"
                  }`}>
                    {senator.coalition}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs">{senator.party}</span>
                  <span className="text-xs text-slate-400">{senator.region}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Sentiment Score</span>
                  <span className={`text-xl font-bold ${getSentimentColor(senator.sentimentScore)}`}>
                    {senator.sentimentScore}%
                  </span>
                </div>

                <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getSentimentBg(senator.sentimentScore)}`}
                    style={{ width: `${senator.sentimentScore}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Approval: {senator.approvalRating}%</span>
                  <span className="flex items-center gap-1" style={{ color: '#34d399' }}>
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
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSenator(null)}
          >
            <div
              className="bg-card border border-border/50 rounded-2xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl ${getCoalitionColor(selectedSenator.coalition)} flex items-center justify-center`}>
                  <Landmark className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{selectedSenator.name}</h3>
                  <p className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Senator for {selectedSenator.county} County
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-slate-400 mb-1">Sentiment</div>
                  <div className={`text-3xl font-bold ${getSentimentColor(selectedSenator.sentimentScore)}`}>
                    {selectedSenator.sentimentScore}%
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-slate-400 mb-1">Trend</div>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendIcon trend={selectedSenator.trend} />
                    <span className="text-lg font-bold text-slate-100 capitalize">{selectedSenator.trend}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-slate-400">Party</span>
                  <span className="text-sm font-bold text-slate-200">{selectedSenator.party}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-slate-400">Coalition</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${
                    selectedSenator.coalition === "Kenya Kwanza" ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                    "bg-orange-500/10 border-orange-500/20 text-orange-300"
                  }`}>
                    {selectedSenator.coalition}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-slate-400">Region</span>
                  <span className="text-sm font-bold text-slate-200">{selectedSenator.region}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Link href={`/kenya/senator/${selectedSenator.id}`} className="flex-1">
                  <button className="w-full py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm hover:bg-emerald-500/30 transition-colors">
                    View Full Profile
                  </button>
                </Link>
                <button
                  onClick={() => setSelectedSenator(null)}
                  className="flex-1 py-3 bg-card border border-border/50 text-slate-200 rounded-xl text-sm hover:bg-white/5 transition-colors"
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
