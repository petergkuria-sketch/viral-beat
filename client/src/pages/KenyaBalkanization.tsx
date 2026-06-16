import React, { useState, useMemo } from "react";

import { kenyaRegions, senateMembers } from "@/lib/kenya/political-data";
import { 
  Map, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Download,
  FileText
} from "lucide-react";
import { exportBalkanizationReport, exportToCSV } from "@/lib/kenya/export-utils";
import { 
  PieChart as RechartsPie, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

// County-level support data
const countySupport = [
  // Central - Kenya Kwanza stronghold
  { county: "Kiambu", region: "Central", kkSupport: 82, azimioSupport: 15, independent: 3, population: 2417735, riskLevel: "medium" },
  { county: "Murang'a", region: "Central", kkSupport: 85, azimioSupport: 12, independent: 3, population: 1056640, riskLevel: "low" },
  { county: "Nyeri", region: "Central", kkSupport: 88, azimioSupport: 10, independent: 2, population: 759164, riskLevel: "low" },
  { county: "Kirinyaga", region: "Central", kkSupport: 84, azimioSupport: 13, independent: 3, population: 610411, riskLevel: "low" },
  { county: "Nyandarua", region: "Central", kkSupport: 80, azimioSupport: 16, independent: 4, population: 638289, riskLevel: "low" },
  
  // Rift Valley - Kenya Kwanza stronghold
  { county: "Uasin Gishu", region: "Rift Valley", kkSupport: 90, azimioSupport: 8, independent: 2, population: 1163186, riskLevel: "medium" },
  { county: "Nakuru", region: "Rift Valley", kkSupport: 72, azimioSupport: 25, independent: 3, population: 2162202, riskLevel: "high" },
  { county: "Nandi", region: "Rift Valley", kkSupport: 92, azimioSupport: 6, independent: 2, population: 885711, riskLevel: "low" },
  { county: "Kericho", region: "Rift Valley", kkSupport: 88, azimioSupport: 10, independent: 2, population: 901777, riskLevel: "low" },
  { county: "Bomet", region: "Rift Valley", kkSupport: 85, azimioSupport: 12, independent: 3, population: 875689, riskLevel: "low" },
  { county: "Baringo", region: "Rift Valley", kkSupport: 78, azimioSupport: 18, independent: 4, population: 666763, riskLevel: "medium" },
  { county: "Narok", region: "Rift Valley", kkSupport: 55, azimioSupport: 42, independent: 3, population: 1157873, riskLevel: "high" },
  { county: "Kajiado", region: "Rift Valley", kkSupport: 58, azimioSupport: 38, independent: 4, population: 1117840, riskLevel: "high" },
  
  // Nyanza - Azimio stronghold
  { county: "Kisumu", region: "Nyanza", kkSupport: 8, azimioSupport: 90, independent: 2, population: 1155574, riskLevel: "medium" },
  { county: "Siaya", region: "Nyanza", kkSupport: 5, azimioSupport: 93, independent: 2, population: 993183, riskLevel: "low" },
  { county: "Homa Bay", region: "Nyanza", kkSupport: 6, azimioSupport: 92, independent: 2, population: 1131950, riskLevel: "low" },
  { county: "Migori", region: "Nyanza", kkSupport: 10, azimioSupport: 87, independent: 3, population: 1116436, riskLevel: "medium" },
  { county: "Kisii", region: "Nyanza", kkSupport: 25, azimioSupport: 72, independent: 3, population: 1266860, riskLevel: "medium" },
  { county: "Nyamira", region: "Nyanza", kkSupport: 28, azimioSupport: 68, independent: 4, population: 605576, riskLevel: "medium" },
  
  // Coast - Mixed/Azimio leaning
  { county: "Mombasa", region: "Coastal", kkSupport: 35, azimioSupport: 60, independent: 5, population: 1208333, riskLevel: "high" },
  { county: "Kilifi", region: "Coastal", kkSupport: 30, azimioSupport: 65, independent: 5, population: 1453787, riskLevel: "medium" },
  { county: "Kwale", region: "Coastal", kkSupport: 32, azimioSupport: 63, independent: 5, population: 866820, riskLevel: "medium" },
  
  // Nairobi - Swing/Azimio leaning
  { county: "Nairobi", region: "Nairobi", kkSupport: 42, azimioSupport: 55, independent: 3, population: 4397073, riskLevel: "critical" },
  
  // Western - Mixed
  { county: "Kakamega", region: "Western", kkSupport: 45, azimioSupport: 52, independent: 3, population: 1867579, riskLevel: "high" },
  { county: "Bungoma", region: "Western", kkSupport: 48, azimioSupport: 48, independent: 4, population: 1670570, riskLevel: "high" },
  { county: "Vihiga", region: "Western", kkSupport: 35, azimioSupport: 62, independent: 3, population: 590013, riskLevel: "medium" },
  { county: "Busia", region: "Western", kkSupport: 38, azimioSupport: 58, independent: 4, population: 893681, riskLevel: "medium" },
  
  // Eastern - Mixed/Kenya Kwanza leaning
  { county: "Machakos", region: "Eastern", kkSupport: 35, azimioSupport: 62, independent: 3, population: 1421932, riskLevel: "medium" },
  { county: "Makueni", region: "Eastern", kkSupport: 30, azimioSupport: 67, independent: 3, population: 987653, riskLevel: "low" },
  { county: "Kitui", region: "Eastern", kkSupport: 32, azimioSupport: 65, independent: 3, population: 1136187, riskLevel: "low" },
  { county: "Meru", region: "Eastern", kkSupport: 75, azimioSupport: 22, independent: 3, population: 1545714, riskLevel: "low" },
  { county: "Embu", region: "Eastern", kkSupport: 78, azimioSupport: 19, independent: 3, population: 608599, riskLevel: "low" },
  { county: "Tharaka Nithi", region: "Eastern", kkSupport: 80, azimioSupport: 17, independent: 3, population: 393177, riskLevel: "low" },
];

const COLORS = {
  kenyaKwanza: "#EAB308",
  azimio: "#F97316",
  independent: "#6B7280"
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "critical": return "bg-red-600 text-white";
    case "high": return "bg-red-400 text-white";
    case "medium": return "bg-yellow-500 text-black";
    default: return "bg-green-500 text-white";
  }
};

const getPolarizationLevel = (kkSupport: number, azimioSupport: number) => {
  const diff = Math.abs(kkSupport - azimioSupport);
  if (diff >= 70) return { level: "Extreme", color: "text-red-600" };
  if (diff >= 50) return { level: "High", color: "text-orange-600" };
  if (diff >= 30) return { level: "Moderate", color: "text-yellow-600" };
  return { level: "Low", color: "text-green-600" };
};

export default function Balkanization() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "analysis" | "risk">("map");

  const regionData = useMemo(() => {
    return kenyaRegions.map(region => {
      const counties = countySupport.filter(c => c.region === region.name);
      const totalPop = counties.reduce((a, c) => a + c.population, 0);
      const avgKK = Math.round(counties.reduce((a, c) => a + c.kkSupport * c.population, 0) / totalPop);
      const avgAzimio = Math.round(counties.reduce((a, c) => a + c.azimioSupport * c.population, 0) / totalPop);
      const criticalCounties = counties.filter(c => c.riskLevel === "critical" || c.riskLevel === "high").length;
      
      return {
        name: region.name,
        counties: counties.length,
        population: totalPop,
        kkSupport: avgKK,
        azimioSupport: avgAzimio,
        independent: 100 - avgKK - avgAzimio,
        dominant: avgKK > avgAzimio ? "Kenya Kwanza" : "Azimio",
        criticalCounties,
        polarization: getPolarizationLevel(avgKK, avgAzimio)
      };
    });
  }, []);

  const nationalPieData = useMemo(() => {
    const totalPop = countySupport.reduce((a, c) => a + c.population, 0);
    const kkTotal = Math.round(countySupport.reduce((a, c) => a + c.kkSupport * c.population, 0) / totalPop);
    const azTotal = Math.round(countySupport.reduce((a, c) => a + c.azimioSupport * c.population, 0) / totalPop);
    return [
      { name: "Kenya Kwanza", value: kkTotal },
      { name: "Azimio", value: azTotal },
      { name: "Independent", value: 100 - kkTotal - azTotal }
    ];
  }, []);

  const radarData = regionData.map(r => ({
    region: r.name,
    kenyaKwanza: r.kkSupport,
    azimio: r.azimioSupport
  }));

  const highRiskCounties = countySupport
    .filter(c => c.riskLevel === "critical" || c.riskLevel === "high")
    .sort((a, b) => {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return riskOrder[a.riskLevel as keyof typeof riskOrder] - riskOrder[b.riskLevel as keyof typeof riskOrder];
    });

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b-2 border-border pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8" />
            <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase">Support Balkanization</h2>
          </div>
          <p className="text-muted-foreground font-mono">
            Analyze regional political polarization and ethnic bloc voting patterns across Kenya.
          </p>
        </div>

        {/* National Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="brutalist-card bg-yellow-50 border-yellow-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-yellow-800">Kenya Kwanza</div>
                <div className="text-3xl font-bold text-yellow-900">{nationalPieData[0].value}%</div>
                <div className="text-xs text-yellow-700">National Support</div>
              </div>
            </div>
          </div>
          <div className="brutalist-card bg-orange-50 border-orange-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-orange-800">Azimio</div>
                <div className="text-3xl font-bold text-orange-900">{nationalPieData[1].value}%</div>
                <div className="text-xs text-orange-700">National Support</div>
              </div>
            </div>
          </div>
          <div className="brutalist-card bg-red-50 border-red-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-red-800">High Risk Areas</div>
                <div className="text-3xl font-bold text-red-900">{highRiskCounties.length}</div>
                <div className="text-xs text-red-700">Counties</div>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("map")}
              className={`px-4 py-2 font-mono text-sm border-2 border-border transition-colors ${
                viewMode === "map" ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
              }`}
            >
              Regional Map
            </button>
            <button
              onClick={() => setViewMode("analysis")}
              className={`px-4 py-2 font-mono text-sm border-2 border-border transition-colors ${
                viewMode === "analysis" ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
              }`}
            >
              Polarization Analysis
            </button>
            <button
              onClick={() => setViewMode("risk")}
              className={`px-4 py-2 font-mono text-sm border-2 border-border transition-colors ${
                viewMode === "risk" ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
              }`}
            >
              Risk Assessment
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const exportData = regionData.map(r => ({
                  name: r.name,
                  kk: r.kkSupport,
                  az: r.azimioSupport,
                  risk: r.polarization.level,
                  riskCounties: r.criticalCounties
                }));
                exportBalkanizationReport(exportData);
              }}
              className="px-4 py-2 font-mono text-sm border-2 border-border bg-background hover:bg-secondary transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={() => {
                exportToCSV(countySupport, [
                  { key: "county", header: "County" },
                  { key: "region", header: "Region" },
                  { key: "kkSupport", header: "Kenya Kwanza %" },
                  { key: "azimioSupport", header: "Azimio %" },
                  { key: "population", header: "Population" },
                  { key: "riskLevel", header: "Risk Level" }
                ], "balkanization-data");
              }}
              className="px-4 py-2 font-mono text-sm border-2 border-border bg-background hover:bg-secondary transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Regional Map View */}
        {viewMode === "map" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Regional Support Chart */}
              <div className="brutalist-card bg-background">
                <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Regional Support Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontFamily: 'monospace' }} width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          fontFamily: 'monospace', 
                          fontSize: '11px',
                          border: '2px solid #000',
                          borderRadius: 0
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="kkSupport" name="Kenya Kwanza" fill={COLORS.kenyaKwanza} stackId="a" />
                      <Bar dataKey="azimioSupport" name="Azimio" fill={COLORS.azimio} stackId="a" />
                      <Bar dataKey="independent" name="Independent" fill={COLORS.independent} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* National Pie Chart */}
              <div className="brutalist-card bg-background">
                <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  National Support Split
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={nationalPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill={COLORS.kenyaKwanza} />
                        <Cell fill={COLORS.azimio} />
                        <Cell fill={COLORS.independent} />
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Regional Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {regionData.map(region => (
                <div 
                  key={region.name}
                  className={`brutalist-card cursor-pointer transition-all ${
                    selectedRegion === region.name ? "ring-2 ring-foreground" : ""
                  } ${region.dominant === "Kenya Kwanza" ? "bg-yellow-50" : "bg-orange-50"}`}
                  onClick={() => setSelectedRegion(selectedRegion === region.name ? null : region.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold">{region.name}</h4>
                    <span className={`text-xs font-mono ${region.polarization.color}`}>
                      {region.polarization.level}
                    </span>
                  </div>
                  <div className="flex h-4 mb-2 overflow-hidden">
                    <div 
                      className="bg-yellow-500"
                      style={{ width: `${region.kkSupport}%` }}
                    />
                    <div 
                      className="bg-orange-500"
                      style={{ width: `${region.azimioSupport}%` }}
                    />
                    <div 
                      className="bg-gray-400"
                      style={{ width: `${region.independent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span>KK: {region.kkSupport}%</span>
                    <span>AZ: {region.azimioSupport}%</span>
                  </div>
                  {region.criticalCounties > 0 && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <span className="text-xs text-red-600 font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {region.criticalCounties} high-risk counties
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Polarization Analysis View */}
        {viewMode === "analysis" && (
          <div className="space-y-6">
            {/* Radar Chart */}
            <div className="brutalist-card bg-background">
              <h3 className="font-mono font-bold uppercase mb-4">Regional Polarization Radar</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="region" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Kenya Kwanza" dataKey="kenyaKwanza" stroke={COLORS.kenyaKwanza} fill={COLORS.kenyaKwanza} fillOpacity={0.5} />
                    <Radar name="Azimio" dataKey="azimio" stroke={COLORS.azimio} fill={COLORS.azimio} fillOpacity={0.5} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ethnic Bloc Analysis */}
            <div className="brutalist-card bg-foreground text-background">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Ethnic Bloc Voting Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-mono text-sm mb-3 opacity-70">Kenya Kwanza Strongholds</h4>
                  <div className="space-y-2">
                    {[
                      { bloc: "Kalenjin Belt", support: 88, counties: "Uasin Gishu, Nandi, Kericho, Bomet, Baringo" },
                      { bloc: "Mt. Kenya", support: 84, counties: "Kiambu, Murang'a, Nyeri, Kirinyaga" },
                      { bloc: "Upper Eastern", support: 78, counties: "Meru, Embu, Tharaka Nithi" }
                    ].map((bloc, i) => (
                      <div key={i} className="p-3 bg-white/10">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-sm">{bloc.bloc}</span>
                          <span className="text-yellow-400 font-bold">{bloc.support}%</span>
                        </div>
                        <div className="text-xs opacity-70">{bloc.counties}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-mono text-sm mb-3 opacity-70">Azimio Strongholds</h4>
                  <div className="space-y-2">
                    {[
                      { bloc: "Luo Nyanza", support: 91, counties: "Kisumu, Siaya, Homa Bay, Migori" },
                      { bloc: "Lower Eastern", support: 65, counties: "Machakos, Makueni, Kitui" },
                      { bloc: "Coast", support: 62, counties: "Mombasa, Kilifi, Kwale" }
                    ].map((bloc, i) => (
                      <div key={i} className="p-3 bg-white/10">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-sm">{bloc.bloc}</span>
                          <span className="text-orange-400 font-bold">{bloc.support}%</span>
                        </div>
                        <div className="text-xs opacity-70">{bloc.counties}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Swing Counties */}
            <div className="brutalist-card bg-purple-50 border-purple-500">
              <h3 className="font-mono font-bold uppercase mb-4 text-purple-800 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Swing Counties (Battlegrounds)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {countySupport
                  .filter(c => Math.abs(c.kkSupport - c.azimioSupport) < 20)
                  .slice(0, 6)
                  .map((county, i) => (
                    <div key={i} className="p-3 bg-white">
                      <div className="font-bold">{county.county}</div>
                      <div className="text-xs text-muted-foreground mb-2">{county.region}</div>
                      <div className="flex h-3 mb-1 overflow-hidden">
                        <div className="bg-yellow-500" style={{ width: `${county.kkSupport}%` }} />
                        <div className="bg-orange-500" style={{ width: `${county.azimioSupport}%` }} />
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span>KK: {county.kkSupport}%</span>
                        <span>AZ: {county.azimioSupport}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Risk Assessment View */}
        {viewMode === "risk" && (
          <div className="space-y-6">
            {/* Risk Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="brutalist-card bg-red-600 text-white">
                <div className="text-xs font-mono uppercase opacity-70">Critical Risk</div>
                <div className="text-3xl font-bold">{countySupport.filter(c => c.riskLevel === "critical").length}</div>
                <div className="text-xs opacity-70">Counties</div>
              </div>
              <div className="brutalist-card bg-red-400 text-white">
                <div className="text-xs font-mono uppercase opacity-70">High Risk</div>
                <div className="text-3xl font-bold">{countySupport.filter(c => c.riskLevel === "high").length}</div>
                <div className="text-xs opacity-70">Counties</div>
              </div>
              <div className="brutalist-card bg-yellow-500 text-black">
                <div className="text-xs font-mono uppercase opacity-70">Medium Risk</div>
                <div className="text-3xl font-bold">{countySupport.filter(c => c.riskLevel === "medium").length}</div>
                <div className="text-xs opacity-70">Counties</div>
              </div>
              <div className="brutalist-card bg-green-500 text-white">
                <div className="text-xs font-mono uppercase opacity-70">Low Risk</div>
                <div className="text-3xl font-bold">{countySupport.filter(c => c.riskLevel === "low").length}</div>
                <div className="text-xs opacity-70">Counties</div>
              </div>
            </div>

            {/* High Risk Counties Detail */}
            <div className="brutalist-card bg-background">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                High Risk Counties - Detailed Assessment
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left p-3 font-mono text-xs uppercase">County</th>
                      <th className="text-left p-3 font-mono text-xs uppercase">Region</th>
                      <th className="text-center p-3 font-mono text-xs uppercase">Risk Level</th>
                      <th className="text-center p-3 font-mono text-xs uppercase">KK Support</th>
                      <th className="text-center p-3 font-mono text-xs uppercase">Azimio Support</th>
                      <th className="text-center p-3 font-mono text-xs uppercase">Population</th>
                      <th className="text-left p-3 font-mono text-xs uppercase">Risk Factors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highRiskCounties.map((county, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-secondary/30"}>
                        <td className="p-3 font-mono text-sm font-bold">{county.county}</td>
                        <td className="p-3 font-mono text-sm">{county.region}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 text-xs font-mono ${getRiskColor(county.riskLevel)}`}>
                            {county.riskLevel.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-sm">{county.kkSupport}%</td>
                        <td className="p-3 text-center font-mono text-sm">{county.azimioSupport}%</td>
                        <td className="p-3 text-center font-mono text-sm">{(county.population / 1000000).toFixed(1)}M</td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {county.riskLevel === "critical" && "High population, ethnic diversity, historical tensions"}
                          {county.riskLevel === "high" && "Competitive margins, mixed demographics"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk Mitigation Recommendations */}
            <div className="brutalist-card bg-blue-50 border-blue-500">
              <h3 className="font-mono font-bold uppercase mb-4 text-blue-800">Risk Mitigation Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "Enhanced Monitoring", desc: "Deploy additional observers in Nairobi, Nakuru, and Mombasa counties" },
                  { title: "Early Warning Systems", desc: "Activate hate speech detection in high-risk constituencies" },
                  { title: "Community Dialogues", desc: "Facilitate inter-ethnic peace meetings in swing counties" },
                  { title: "Security Deployment", desc: "Increase security presence in historically volatile areas" }
                ].map((rec, i) => (
                  <div key={i} className="p-4 bg-white">
                    <h4 className="font-bold text-blue-800">{rec.title}</h4>
                    <p className="text-sm text-blue-700 mt-1">{rec.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
