import React, { useState } from "react";

import { executiveMembers, ExecutiveMember } from "@/lib/kenya/political-data";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  Building2,
  User,
  AlertTriangle,
  BarChart3,
  ChevronRight
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

export default function ExecutiveAgent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<ExecutiveMember | null>(null);

  const president = executiveMembers.find(m => m.position === "president");
  const deputyPresident = executiveMembers.find(m => m.position === "deputy_president");
  const primeCS = executiveMembers.find(m => m.position === "prime_cabinet_secretary");
  const cabinetSecretaries = executiveMembers.filter(m => m.position === "cabinet_secretary");
  const otherOfficials = executiveMembers.filter(m =>
    m.position === "attorney_general" || m.position === "secretary_cabinet"
  );

  const filteredMembers = executiveMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.ministry?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterPosition === "all" || member.position === filterPosition;
    return matchesSearch && matchesFilter;
  });

  const avgSentiment = Math.round(
    executiveMembers.reduce((acc, m) => acc + m.sentiment, 0) / executiveMembers.length
  );

  const positiveTrend = executiveMembers.filter(m => m.trend === "up").length;
  const negativeTrend = executiveMembers.filter(m => m.trend === "down").length;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-slate-400" />
          <div>
            <h1 className="text-xl font-black text-slate-100">Executive Branch Agent</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Monitor sentiment for President, Deputy President, and {cabinetSecretaries.length} Cabinet Secretaries.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="text-xs text-slate-400 mb-1">Total Members</div>
            <div className="text-3xl font-bold text-slate-100">{executiveMembers.length}</div>
            <div className="text-xs text-slate-400">Executive Officials</div>
          </div>
          <div className={`bg-card border rounded-2xl p-5 ${avgSentiment >= 50 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
            <div className="text-xs text-slate-400 mb-1">Avg Sentiment</div>
            <div className={`text-3xl font-bold ${getSentimentColor(avgSentiment)}`}>{avgSentiment}%</div>
            <div className="text-xs text-slate-400">Overall Rating</div>
          </div>
          <div className="bg-card border border-emerald-500/20 rounded-2xl p-5">
            <div className="text-xs text-slate-400 mb-1">Positive Trend</div>
            <div className="text-3xl font-bold" style={{ color: '#34d399' }}>{positiveTrend}</div>
            <div className="text-xs text-slate-400">Members Rising</div>
          </div>
          <div className="bg-card border border-red-500/20 rounded-2xl p-5">
            <div className="text-xs text-slate-400 mb-1">Negative Trend</div>
            <div className="text-3xl font-bold" style={{ color: '#f87171' }}>{negativeTrend}</div>
            <div className="text-xs text-slate-400">Members Declining</div>
          </div>
        </div>

        {/* Top Leadership */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* President */}
          {president && (
            <div
              className="bg-card border border-white/20 rounded-2xl p-5 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setSelectedMember(president)}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                  {president.imageUrl ? (
                    <img src={president.imageUrl} alt={president.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-0.5">President</div>
                  <div className="font-bold text-slate-100">{president.name}</div>
                  <div className="text-sm text-slate-400">{president.party}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-100">{president.sentiment}%</div>
                  <TrendIcon trend={president.trend} />
                </div>
              </div>
            </div>
          )}

          {/* Deputy President */}
          {deputyPresident && (
            <div
              className="bg-card border border-border/50 rounded-2xl p-5 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setSelectedMember(deputyPresident)}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                  {deputyPresident.imageUrl ? (
                    <img src={deputyPresident.imageUrl} alt={deputyPresident.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-0.5">Deputy President</div>
                  <div className="font-bold text-slate-100">{deputyPresident.name}</div>
                  <div className="text-sm text-slate-400">{deputyPresident.party}</div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getSentimentColor(deputyPresident.sentiment)}`}>
                    {deputyPresident.sentiment}%
                  </div>
                  <TrendIcon trend={deputyPresident.trend} />
                </div>
              </div>
            </div>
          )}

          {/* Prime Cabinet Secretary */}
          {primeCS && (
            <div
              className="bg-card border border-border/50 rounded-2xl p-5 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setSelectedMember(primeCS)}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-0.5">Prime Cabinet Secretary</div>
                  <div className="font-bold text-slate-100">{primeCS.name}</div>
                  <div className="text-sm text-slate-400">{primeCS.ministry}</div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getSentimentColor(primeCS.sentiment)}`}>
                    {primeCS.sentiment}%
                  </div>
                  <TrendIcon trend={primeCS.trend} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or ministry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Positions</option>
              <option value="president">President</option>
              <option value="deputy_president">Deputy President</option>
              <option value="prime_cabinet_secretary">Prime CS</option>
              <option value="cabinet_secretary">Cabinet Secretaries</option>
              <option value="attorney_general">Attorney General</option>
            </select>
          </div>
        </div>

        {/* Cabinet Secretaries Grid */}
        <div>
          <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Cabinet Secretaries ({cabinetSecretaries.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers
              .filter(m => m.position === "cabinet_secretary")
              .sort((a, b) => b.sentiment - a.sentiment)
              .map((member) => (
                <div
                  key={member.id}
                  className="bg-card border border-border/50 rounded-2xl p-5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-100">{member.name}</div>
                      <div className="text-xs text-slate-400">{member.ministry}</div>
                    </div>
                    <TrendIcon trend={member.trend} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">{member.party}</span>
                      <span className="text-xs text-slate-400">{member.county}</span>
                    </div>
                    <div className={`text-lg font-bold ${getSentimentColor(member.sentiment)}`}>
                      {member.sentiment}%
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getSentimentBg(member.sentiment)}`}
                      style={{ width: `${member.sentiment}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Selected Member Detail Modal */}
        {selectedMember && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedMember(null)}
          >
            <div
              className="bg-card border border-border/50 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                  {selectedMember.imageUrl ? (
                    <img src={selectedMember.imageUrl} alt={selectedMember.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-1">
                    {selectedMember.position.replace(/_/g, " ")}
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">{selectedMember.name}</h3>
                  {selectedMember.ministry && (
                    <p className="text-sm text-slate-400">{selectedMember.ministry}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-slate-400 mb-1">Sentiment Score</div>
                  <div className={`text-3xl font-bold ${getSentimentColor(selectedMember.sentiment)}`}>
                    {selectedMember.sentiment}%
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-slate-400 mb-1">Trend</div>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendIcon trend={selectedMember.trend} />
                    <span className="text-lg font-bold text-slate-100 capitalize">{selectedMember.trend}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-slate-400">Party</span>
                  <span className="text-sm font-bold text-slate-200">{selectedMember.party}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-slate-400">Home County</span>
                  <span className="text-sm font-bold text-slate-200">{selectedMember.county}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-slate-400">Position</span>
                  <span className="text-sm font-bold text-slate-200 capitalize">
                    {selectedMember.position.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="flex-1 py-3 bg-card border border-border/50 text-slate-200 rounded-xl text-sm hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
                <button className="flex-1 py-3 bg-white/10 border border-white/20 text-slate-100 rounded-xl text-sm hover:bg-white/15 transition-colors flex items-center justify-center gap-2">
                  View Full Analysis
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
