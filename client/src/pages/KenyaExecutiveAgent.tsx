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
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b-2 border-border pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8" />
            <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase">Executive Branch Agent</h2>
          </div>
          <p className="text-muted-foreground font-mono">
            Monitor sentiment for President, Deputy President, and {cabinetSecretaries.length} Cabinet Secretaries.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">Total Members</div>
            <div className="text-3xl font-bold">{executiveMembers.length}</div>
            <div className="text-xs font-mono text-muted-foreground">Executive Officials</div>
          </div>
          <div className={`brutalist-card ${avgSentiment >= 50 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-xs font-mono uppercase text-muted-foreground">Avg Sentiment</div>
            <div className={`text-3xl font-bold ${getSentimentColor(avgSentiment)}`}>{avgSentiment}%</div>
            <div className="text-xs font-mono text-muted-foreground">Overall Rating</div>
          </div>
          <div className="brutalist-card bg-green-50">
            <div className="text-xs font-mono uppercase text-green-800">Positive Trend</div>
            <div className="text-3xl font-bold text-green-700">{positiveTrend}</div>
            <div className="text-xs font-mono text-green-600">Members Rising</div>
          </div>
          <div className="brutalist-card bg-red-50">
            <div className="text-xs font-mono uppercase text-red-800">Negative Trend</div>
            <div className="text-3xl font-bold text-red-700">{negativeTrend}</div>
            <div className="text-xs font-mono text-red-600">Members Declining</div>
          </div>
        </div>

        {/* Top Leadership */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* President */}
          {president && (
            <div 
              className="brutalist-card bg-foreground text-background cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedMember(president)}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-background/20 rounded-sm flex items-center justify-center overflow-hidden">
                  {president.imageUrl ? (
                    <img src={president.imageUrl} alt={president.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-background/60" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-mono uppercase opacity-70">President</div>
                  <div className="font-bold">{president.name}</div>
                  <div className="text-sm opacity-70">{president.party}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{president.sentiment}%</div>
                  <TrendIcon trend={president.trend} />
                </div>
              </div>
            </div>
          )}

          {/* Deputy President */}
          {deputyPresident && (
            <div 
              className="brutalist-card bg-secondary cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => setSelectedMember(deputyPresident)}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-sm flex items-center justify-center overflow-hidden">
                  {deputyPresident.imageUrl ? (
                    <img src={deputyPresident.imageUrl} alt={deputyPresident.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-mono uppercase text-muted-foreground">Deputy President</div>
                  <div className="font-bold">{deputyPresident.name}</div>
                  <div className="text-sm text-muted-foreground">{deputyPresident.party}</div>
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
              className="brutalist-card bg-secondary cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => setSelectedMember(primeCS)}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-sm flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-mono uppercase text-muted-foreground">Prime Cabinet Secretary</div>
                  <div className="font-bold">{primeCS.name}</div>
                  <div className="text-sm text-muted-foreground">{primeCS.ministry}</div>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or ministry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="pl-10 pr-8 py-3 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:border-foreground appearance-none cursor-pointer"
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
          <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
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
                  className="brutalist-card bg-background cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-bold text-sm">{member.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{member.ministry}</div>
                    </div>
                    <TrendIcon trend={member.trend} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-secondary px-2 py-1">{member.party}</span>
                      <span className="text-xs font-mono text-muted-foreground">{member.county}</span>
                    </div>
                    <div className={`text-lg font-bold ${getSentimentColor(member.sentiment)}`}>
                      {member.sentiment}%
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-secondary">
                    <div 
                      className={`h-full ${getSentimentBg(member.sentiment)}`}
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedMember(null)}
          >
            <div 
              className="brutalist-card bg-background max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 bg-secondary rounded-sm flex items-center justify-center overflow-hidden">
                  {selectedMember.imageUrl ? (
                    <img src={selectedMember.imageUrl} alt={selectedMember.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-mono uppercase text-muted-foreground">
                    {selectedMember.position.replace(/_/g, " ")}
                  </div>
                  <h3 className="text-xl font-bold">{selectedMember.name}</h3>
                  {selectedMember.ministry && (
                    <p className="text-sm text-muted-foreground">{selectedMember.ministry}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-secondary p-4">
                  <div className="text-xs font-mono uppercase text-muted-foreground">Sentiment Score</div>
                  <div className={`text-3xl font-bold ${getSentimentColor(selectedMember.sentiment)}`}>
                    {selectedMember.sentiment}%
                  </div>
                </div>
                <div className="bg-secondary p-4">
                  <div className="text-xs font-mono uppercase text-muted-foreground">Trend</div>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendIcon trend={selectedMember.trend} />
                    <span className="text-lg font-bold capitalize">{selectedMember.trend}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="font-mono text-sm text-muted-foreground">Party</span>
                  <span className="font-mono text-sm font-bold">{selectedMember.party}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="font-mono text-sm text-muted-foreground">Home County</span>
                  <span className="font-mono text-sm font-bold">{selectedMember.county}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="font-mono text-sm text-muted-foreground">Position</span>
                  <span className="font-mono text-sm font-bold capitalize">
                    {selectedMember.position.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="flex-1 py-3 border-2 border-border font-mono text-sm hover:bg-secondary transition-colors"
                >
                  Close
                </button>
                <button className="flex-1 py-3 bg-foreground text-background font-mono text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
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
