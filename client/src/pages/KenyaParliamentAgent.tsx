import React, { useState, useMemo } from "react";
import { Link } from "wouter";

import { parliamentMembers, kenyaRegions, politicalParties } from "@/lib/kenya/political-data";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  Users,
  MapPin,
  Building,
  PieChart,
  ChevronDown,
  ChevronRight
} from "lucide-react";

// Generate full 290 MPs with mock data
const generateFullMPList = () => {
  const constituencies = [
    // Nairobi (17)
    { name: "Westlands", county: "Nairobi" }, { name: "Dagoretti North", county: "Nairobi" },
    { name: "Dagoretti South", county: "Nairobi" }, { name: "Langata", county: "Nairobi" },
    { name: "Kibra", county: "Nairobi" }, { name: "Roysambu", county: "Nairobi" },
    { name: "Kasarani", county: "Nairobi" }, { name: "Ruaraka", county: "Nairobi" },
    { name: "Embakasi South", county: "Nairobi" }, { name: "Embakasi North", county: "Nairobi" },
    { name: "Embakasi Central", county: "Nairobi" }, { name: "Embakasi East", county: "Nairobi" },
    { name: "Embakasi West", county: "Nairobi" }, { name: "Makadara", county: "Nairobi" },
    { name: "Kamukunji", county: "Nairobi" }, { name: "Starehe", county: "Nairobi" },
    { name: "Mathare", county: "Nairobi" },
    // Kiambu (12)
    { name: "Gatundu South", county: "Kiambu" }, { name: "Gatundu North", county: "Kiambu" },
    { name: "Juja", county: "Kiambu" }, { name: "Thika Town", county: "Kiambu" },
    { name: "Ruiru", county: "Kiambu" }, { name: "Githunguri", county: "Kiambu" },
    { name: "Kiambu", county: "Kiambu" }, { name: "Kiambaa", county: "Kiambu" },
    { name: "Kabete", county: "Kiambu" }, { name: "Kikuyu", county: "Kiambu" },
    { name: "Limuru", county: "Kiambu" }, { name: "Lari", county: "Kiambu" },
    // Mombasa (6)
    { name: "Changamwe", county: "Mombasa" }, { name: "Jomvu", county: "Mombasa" },
    { name: "Kisauni", county: "Mombasa" }, { name: "Nyali", county: "Mombasa" },
    { name: "Likoni", county: "Mombasa" }, { name: "Mvita", county: "Mombasa" },
    // Kisumu (7)
    { name: "Kisumu East", county: "Kisumu" }, { name: "Kisumu West", county: "Kisumu" },
    { name: "Kisumu Central", county: "Kisumu" }, { name: "Seme", county: "Kisumu" },
    { name: "Nyando", county: "Kisumu" }, { name: "Muhoroni", county: "Kisumu" },
    { name: "Nyakach", county: "Kisumu" },
    // Nakuru (11)
    { name: "Molo", county: "Nakuru" }, { name: "Njoro", county: "Nakuru" },
    { name: "Naivasha", county: "Nakuru" }, { name: "Gilgil", county: "Nakuru" },
    { name: "Kuresoi South", county: "Nakuru" }, { name: "Kuresoi North", county: "Nakuru" },
    { name: "Subukia", county: "Nakuru" }, { name: "Rongai", county: "Nakuru" },
    { name: "Bahati", county: "Nakuru" }, { name: "Nakuru Town East", county: "Nakuru" },
    { name: "Nakuru Town West", county: "Nakuru" },
    // More constituencies...
    { name: "Ugunja", county: "Siaya" }, { name: "Gem", county: "Siaya" },
    { name: "Bondo", county: "Siaya" }, { name: "Rarieda", county: "Siaya" },
    { name: "Alego Usonga", county: "Siaya" },
    { name: "Suna East", county: "Migori" }, { name: "Suna West", county: "Migori" },
    { name: "Uriri", county: "Migori" }, { name: "Awendo", county: "Migori" },
    { name: "Nyatike", county: "Migori" }, { name: "Kuria East", county: "Migori" },
    { name: "Kuria West", county: "Migori" }, { name: "Rongo", county: "Migori" },
  ];

  const parties = ["UDA", "ODM", "Wiper", "Jubilee", "ANC", "FORD-K", "DAP-K", "KANU"];
  const coalitions: ("Kenya Kwanza" | "Azimio" | "Independent")[] = ["Kenya Kwanza", "Azimio", "Independent"];
  const trends: ("up" | "down" | "stable")[] = ["up", "down", "stable"];
  const firstNames = ["John", "James", "Peter", "Paul", "David", "Michael", "Daniel", "Joseph", "Samuel", "Stephen", "Mary", "Grace", "Faith", "Hope", "Joyce", "Alice", "Sarah", "Ruth", "Esther", "Martha"];
  const lastNames = ["Ochieng", "Wanjiku", "Mwangi", "Kamau", "Otieno", "Kipchoge", "Korir", "Chebet", "Mutua", "Musyoka", "Wekesa", "Barasa", "Omondi", "Achieng", "Nyambura", "Njeri", "Wambui", "Muthoni"];

  return constituencies.map((c, i) => {
    const party = parties[Math.floor(Math.random() * parties.length)];
    const coalition = party === "UDA" || party === "ANC" || party === "FORD-K" ? "Kenya Kwanza" :
                      party === "ODM" || party === "Wiper" || party === "Jubilee" || party === "DAP-K" || party === "KANU" ? "Azimio" : "Independent";
    return {
      id: i + 100,
      name: `Hon. ${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      memberType: "constituency" as const,
      constituency: c.name,
      county: c.county,
      party,
      coalition: coalition as "Kenya Kwanza" | "Azimio" | "Independent",
      sentiment: Math.floor(Math.random() * 40) + 30,
      trend: trends[Math.floor(Math.random() * trends.length)]
    };
  });
};

const allMPs = [...parliamentMembers, ...generateFullMPList()];

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

export default function ParliamentAgent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCoalition, setFilterCoalition] = useState<string>("all");
  const [filterCounty, setFilterCounty] = useState<string>("all");
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "region">("list");

  const filteredMPs = useMemo(() => {
    return allMPs.filter(mp => {
      const matchesSearch = mp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mp.constituency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mp.county.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCoalition = filterCoalition === "all" || mp.coalition === filterCoalition;
      const matchesCounty = filterCounty === "all" || mp.county === filterCounty;
      return matchesSearch && matchesCoalition && matchesCounty;
    });
  }, [searchTerm, filterCoalition, filterCounty]);

  const coalitionStats = useMemo(() => {
    const kk = allMPs.filter(m => m.coalition === "Kenya Kwanza").length;
    const az = allMPs.filter(m => m.coalition === "Azimio").length;
    const ind = allMPs.filter(m => m.coalition === "Independent").length;
    return { kenyaKwanza: kk, azimio: az, independent: ind };
  }, []);

  const avgSentiment = Math.round(
    allMPs.reduce((acc, m) => acc + m.sentiment, 0) / allMPs.length
  );

  const counties = Array.from(new Set(allMPs.map(m => m.county))).sort();

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-slate-400" />
          <div>
            <h1 className="text-xl font-black text-slate-100">Parliament Agent</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Track sentiment for 290 Constituency MPs, 47 Women Representatives, and Nominated Members.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Coalition Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-amber-500/20 rounded-2xl p-5">
            <div className="text-xs text-slate-400 mb-1">Kenya Kwanza</div>
            <div className="text-3xl font-bold text-amber-300">{coalitionStats.kenyaKwanza}</div>
            <div className="text-xs text-slate-400">Members</div>
          </div>
          <div className="bg-card border border-orange-500/20 rounded-2xl p-5">
            <div className="text-xs text-slate-400 mb-1">Azimio</div>
            <div className="text-3xl font-bold text-orange-300">{coalitionStats.azimio}</div>
            <div className="text-xs text-slate-400">Members</div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="text-xs text-slate-400 mb-1">Independent</div>
            <div className="text-3xl font-bold text-slate-200">{coalitionStats.independent}</div>
            <div className="text-xs text-slate-400">Members</div>
          </div>
          <div className={`bg-card border rounded-2xl p-5 ${avgSentiment >= 50 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
            <div className="text-xs text-slate-400 mb-1">Avg Sentiment</div>
            <div className={`text-3xl font-bold ${getSentimentColor(avgSentiment)}`}>{avgSentiment}%</div>
            <div className="text-xs text-slate-400">Overall</div>
          </div>
        </div>

        {/* View Toggle and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                viewMode === "list" ? "bg-white/10 border-white/20 text-slate-100" : "bg-card border-border/50 text-slate-400 hover:bg-white/5"
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode("region")}
              className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                viewMode === "region" ? "bg-white/10 border-white/20 text-slate-100" : "bg-card border-border/50 text-slate-400 hover:bg-white/5"
              }`}
            >
              By Region
            </button>
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search MP, constituency, or county..."
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
            <option value="Independent">Independent</option>
          </select>

          <select
            value={filterCounty}
            onChange={(e) => setFilterCounty(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
          >
            <option value="all">All Counties</option>
            {counties.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
        </div>

        {/* Region View */}
        {viewMode === "region" && (
          <div className="space-y-4">
            {kenyaRegions.map(region => {
              const regionMPs = allMPs.filter(mp => region.counties.includes(mp.county));
              const regionAvg = Math.round(regionMPs.reduce((a, m) => a + m.sentiment, 0) / regionMPs.length) || 0;
              const isExpanded = expandedRegion === region.name;

              return (
                <div key={region.name} className="bg-card border border-border/50 rounded-2xl p-5">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedRegion(isExpanded ? null : region.name)}
                  >
                    <div className="flex items-center gap-4">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <div>
                        <h3 className="font-bold text-slate-100">{region.name} Region</h3>
                        <p className="text-sm text-slate-400">
                          {region.counties.length} counties • {regionMPs.length} MPs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${
                        region.dominantCoalition === "Kenya Kwanza" ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                        region.dominantCoalition === "Azimio" ? "bg-orange-500/10 border-orange-500/20 text-orange-300" :
                        "bg-white/5 border-white/10 text-slate-400"
                      }`}>
                        {region.dominantCoalition}
                      </span>
                      <div className={`text-xl font-bold ${getSentimentColor(regionAvg)}`}>
                        {regionAvg}%
                      </div>
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {regionMPs.slice(0, 12).map(mp => (
                          <div key={mp.id} className="p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold text-slate-200 truncate">{mp.name}</span>
                              <TrendIcon trend={mp.trend} />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">{mp.constituency || mp.county}</span>
                              <span className={`font-bold ${getSentimentColor(mp.sentiment)}`}>{mp.sentiment}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {regionMPs.length > 12 && (
                        <p className="text-center text-sm text-slate-400 mt-4">
                          +{regionMPs.length - 12} more MPs in this region
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-3 text-xs text-slate-400 font-bold">Name</th>
                    <th className="text-left p-3 text-xs text-slate-400 font-bold">Constituency</th>
                    <th className="text-left p-3 text-xs text-slate-400 font-bold">County</th>
                    <th className="text-left p-3 text-xs text-slate-400 font-bold">Party</th>
                    <th className="text-left p-3 text-xs text-slate-400 font-bold">Coalition</th>
                    <th className="text-center p-3 text-xs text-slate-400 font-bold">Sentiment</th>
                    <th className="text-center p-3 text-xs text-slate-400 font-bold">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMPs.slice(0, 50).map((mp, i) => (
                    <tr key={mp.id} className={i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}>
                      <td className="p-3 text-sm text-slate-200">
                        {mp.constituency ? (
                          <Link href={`/kenya/constituency/${mp.constituency.toLowerCase().replace(/\s+/g, "-")}`} className="hover:underline hover:text-emerald-400 transition-colors">{mp.name}</Link>
                        ) : mp.name}
                      </td>
                      <td className="p-3 text-sm text-slate-400">
                        {mp.constituency ? (
                          <Link href={`/kenya/constituency/${mp.constituency.toLowerCase().replace(/\s+/g, "-")}`} className="hover:underline hover:text-emerald-400 transition-colors">{mp.constituency}</Link>
                        ) : "-"}
                      </td>
                      <td className="p-3 text-sm text-slate-200">{mp.county}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs">{mp.party}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${
                          mp.coalition === "Kenya Kwanza" ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                          mp.coalition === "Azimio" ? "bg-orange-500/10 border-orange-500/20 text-orange-300" :
                          "bg-white/5 border-white/10 text-slate-400"
                        }`}>
                          {mp.coalition}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-bold ${getSentimentColor(mp.sentiment)}`}>{mp.sentiment}%</span>
                      </td>
                      <td className="p-3 text-center">
                        <TrendIcon trend={mp.trend} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredMPs.length > 50 && (
              <div className="p-4 text-center border-t border-border/50">
                <p className="text-sm text-slate-400">
                  Showing 50 of {filteredMPs.length} MPs. Use filters to narrow results.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
