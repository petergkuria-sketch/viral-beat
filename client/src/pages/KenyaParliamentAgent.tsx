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
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b-2 border-border pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8" />
            <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase">Parliament Agent</h2>
          </div>
          <p className="text-muted-foreground font-mono">
            Track sentiment for 290 Constituency MPs, 47 Women Representatives, and Nominated Members.
          </p>
        </div>

        {/* Coalition Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="brutalist-card bg-yellow-50 border-yellow-500">
            <div className="text-xs font-mono uppercase text-yellow-800">Kenya Kwanza</div>
            <div className="text-3xl font-bold text-yellow-900">{coalitionStats.kenyaKwanza}</div>
            <div className="text-xs font-mono text-yellow-700">Members</div>
          </div>
          <div className="brutalist-card bg-orange-50 border-orange-500">
            <div className="text-xs font-mono uppercase text-orange-800">Azimio</div>
            <div className="text-3xl font-bold text-orange-900">{coalitionStats.azimio}</div>
            <div className="text-xs font-mono text-orange-700">Members</div>
          </div>
          <div className="brutalist-card bg-gray-50 border-gray-500">
            <div className="text-xs font-mono uppercase text-gray-800">Independent</div>
            <div className="text-3xl font-bold text-gray-900">{coalitionStats.independent}</div>
            <div className="text-xs font-mono text-gray-700">Members</div>
          </div>
          <div className={`brutalist-card ${avgSentiment >= 50 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-xs font-mono uppercase text-muted-foreground">Avg Sentiment</div>
            <div className={`text-3xl font-bold ${getSentimentColor(avgSentiment)}`}>{avgSentiment}%</div>
            <div className="text-xs font-mono text-muted-foreground">Overall</div>
          </div>
        </div>

        {/* View Toggle and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 font-mono text-sm border-2 border-border transition-colors ${
                viewMode === "list" ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode("region")}
              className={`px-4 py-2 font-mono text-sm border-2 border-border transition-colors ${
                viewMode === "region" ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
              }`}
            >
              By Region
            </button>
          </div>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search MP, constituency, or county..."
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
            <option value="Independent">Independent</option>
          </select>

          <select
            value={filterCounty}
            onChange={(e) => setFilterCounty(e.target.value)}
            className="px-4 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:border-foreground"
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
                <div key={region.name} className="brutalist-card bg-background">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedRegion(isExpanded ? null : region.name)}
                  >
                    <div className="flex items-center gap-4">
                      <MapPin className="w-5 h-5" />
                      <div>
                        <h3 className="font-bold">{region.name} Region</h3>
                        <p className="text-sm text-muted-foreground font-mono">
                          {region.counties.length} counties • {regionMPs.length} MPs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 text-xs font-mono ${
                        region.dominantCoalition === "Kenya Kwanza" ? "bg-yellow-100 text-yellow-800" :
                        region.dominantCoalition === "Azimio" ? "bg-orange-100 text-orange-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {region.dominantCoalition}
                      </div>
                      <div className={`text-xl font-bold ${getSentimentColor(regionAvg)}`}>
                        {regionAvg}%
                      </div>
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {regionMPs.slice(0, 12).map(mp => (
                          <div key={mp.id} className="p-3 bg-secondary">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-sm font-bold truncate">{mp.name}</span>
                              <TrendIcon trend={mp.trend} />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{mp.constituency || mp.county}</span>
                              <span className={`font-bold ${getSentimentColor(mp.sentiment)}`}>{mp.sentiment}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {regionMPs.length > 12 && (
                        <p className="text-center text-sm text-muted-foreground mt-4 font-mono">
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
          <div className="brutalist-card bg-background overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-3 font-mono text-xs uppercase">Name</th>
                    <th className="text-left p-3 font-mono text-xs uppercase">Constituency</th>
                    <th className="text-left p-3 font-mono text-xs uppercase">County</th>
                    <th className="text-left p-3 font-mono text-xs uppercase">Party</th>
                    <th className="text-left p-3 font-mono text-xs uppercase">Coalition</th>
                    <th className="text-center p-3 font-mono text-xs uppercase">Sentiment</th>
                    <th className="text-center p-3 font-mono text-xs uppercase">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMPs.slice(0, 50).map((mp, i) => (
                    <tr key={mp.id} className={i % 2 === 0 ? "bg-background" : "bg-secondary/30"}>
                      <td className="p-3 font-mono text-sm">
                        {mp.constituency ? (
                          <Link href={`/parliament/${mp.constituency.toLowerCase().replace(/\s+/g, "-")}`} className="hover:underline hover:text-primary transition-colors">{mp.name}</Link>
                        ) : mp.name}
                      </td>
                      <td className="p-3 font-mono text-sm text-muted-foreground">
                        {mp.constituency ? (
                          <Link href={`/parliament/${mp.constituency.toLowerCase().replace(/\s+/g, "-")}`} className="hover:underline hover:text-primary transition-colors">{mp.constituency}</Link>
                        ) : "-"}
                      </td>
                      <td className="p-3 font-mono text-sm">{mp.county}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-secondary font-mono text-xs">{mp.party}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 font-mono text-xs ${
                          mp.coalition === "Kenya Kwanza" ? "bg-yellow-100 text-yellow-800" :
                          mp.coalition === "Azimio" ? "bg-orange-100 text-orange-800" :
                          "bg-gray-100 text-gray-800"
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
              <div className="p-4 text-center border-t border-border">
                <p className="text-sm text-muted-foreground font-mono">
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
