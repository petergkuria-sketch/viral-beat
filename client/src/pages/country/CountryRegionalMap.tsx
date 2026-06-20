import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { getCountryConfig } from "@shared/countryConfig";
import { ArrowLeft, MapPin, Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RegionData {
  name: string;
  sentiment: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  population: number;
  trend: "up" | "down" | "stable";
}

interface GeoFeature {
  type: string;
  properties: Record<string, string>;
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
}

interface GeoJSON { type: string; features: GeoFeature[] }

// Seed-stable random so values don't flicker on re-render
function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function buildRegionData(names: string[]): Record<string, RegionData> {
  const out: Record<string, RegionData> = {};
  names.forEach((name, i) => {
    const sentiment = Math.round(20 + seededRand(i * 7) * 70);
    const hs = Math.floor(seededRand(i * 13) * 130);
    const riskLevel: RegionData["riskLevel"] =
      hs > 100 ? "critical" : hs > 60 ? "high" : hs > 30 ? "medium" : "low";
    const trend: RegionData["trend"] =
      seededRand(i * 3) > 0.6 ? "up" : seededRand(i * 5) > 0.4 ? "down" : "stable";
    out[name.toUpperCase()] = {
      name,
      sentiment,
      riskLevel,
      population: Math.floor(500_000 + seededRand(i * 11) * 8_000_000),
      trend,
    };
  });
  return out;
}

const RISK_COLOR: Record<string, string> = {
  critical: "#dc2626",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};
const SENTIMENT_COLOR = (s: number) =>
  s >= 70 ? "#22c55e" : s >= 50 ? "#eab308" : s >= 30 ? "#f97316" : "#dc2626";

// Auto-project GeoJSON to SVG viewport
function useProjection(geo: GeoJSON | null, svgW = 500, svgH = 560) {
  return useMemo(() => {
    if (!geo) return null;
    let minLon = 999, maxLon = -999, minLat = 999, maxLat = -999;
    for (const f of geo.features) {
      const rings: number[][][] = f.geometry.type === "MultiPolygon"
        ? (f.geometry.coordinates as number[][][][]).flat()
        : (f.geometry.coordinates as number[][][]);
      for (const ring of rings) {
        for (const [lon, lat] of ring) {
          if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
        }
      }
    }
    const pad = 4;
    return (lon: number, lat: number): [number, number] => {
      const x = pad + ((lon - minLon) / (maxLon - minLon)) * (svgW - pad * 2);
      const y = pad + (1 - (lat - minLat) / (maxLat - minLat)) * (svgH - pad * 2);
      return [x, y];
    };
  }, [geo, svgW, svgH]);
}

function ringsToPath(geometry: GeoFeature["geometry"], project: (lon: number, lat: number) => [number, number]): string {
  const allRings: number[][][] = geometry.type === "MultiPolygon"
    ? (geometry.coordinates as number[][][][]).flat()
    : (geometry.coordinates as number[][][]);
  return allRings.map(ring => {
    const pts = ring.map(([lon, lat]) => {
      const [x, y] = project(lon, lat);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return "M" + pts.join("L") + "Z";
  }).join(" ");
}

// Name key to try from GeoJSON properties (different files use different keys)
const NAME_KEYS = ["NAME", "name", "REGION", "region", "STATE", "state", "PROVINCE", "province", "COUNTY", "county", "ADMIN", "VARNAME_1", "NAME_1"];

function getRegionName(props: Record<string, string>): string {
  for (const k of NAME_KEYS) {
    if (props[k]) return props[k];
  }
  return Object.values(props)[0] ?? "Unknown";
}

export default function CountryRegionalMap() {
  const { code = "ke" } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const country = getCountryConfig(code);
  const [geo, setGeo] = useState<GeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState<"risk" | "sentiment">("risk");
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const project = useProjection(geo);

  useEffect(() => {
    setLoading(true); setError(false); setGeo(null); setSelected(null);
    fetch(`/${code.toLowerCase()}-regions.geojson`)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(data => { setGeo(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [code]);

  const regionNames = useMemo(() =>
    geo ? geo.features.map(f => getRegionName(f.properties)) : [], [geo]);
  const regionData = useMemo(() => buildRegionData(regionNames), [regionNames]);

  const activeKey = (selected || hovered)?.toUpperCase() ?? null;
  const activeData = activeKey ? regionData[activeKey] : null;

  const riskSummary = useMemo(() =>
    Object.values(regionData).reduce((acc, r) => {
      acc[r.riskLevel] = (acc[r.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  [regionData]);

  if (!country) return <div className="p-6 text-muted-foreground">Country not found.</div>;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <button onClick={() => setLocation(`/country/${code}`)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="w-3 h-3" /> {country.name} Overview
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{country.flag}</span>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              {country.name} Regional Map
            </h1>
            <p className="text-xs text-muted-foreground">
              {regionNames.length} regions · click to explore
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-3">
          {(["critical","high","medium","low"] as const).map(level => (
            <div key={level} className="bg-card border border-border/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-black" style={{ color: RISK_COLOR[level] }}>
                {riskSummary[level] || 0}
              </div>
              <div className="text-[10px] text-muted-foreground capitalize">{level}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Map */}
          <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <span className="text-sm font-black">Regional Heatmap</span>
              <div className="flex gap-2">
                {(["risk","sentiment"] as const).map(m => (
                  <button key={m} onClick={() => setViewMode(m)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all capitalize ${viewMode === m ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-primary/40"}`}>
                    {m === "risk" ? "Risk Level" : "Sentiment"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative bg-background/50 p-2">
              {loading && (
                <div className="h-[480px] flex flex-col items-center justify-center gap-3">
                  <Activity className="w-10 h-10 animate-pulse text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading map…</p>
                </div>
              )}
              {error && (
                <div className="h-[480px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                  <p className="text-sm">Map data not available for {country.name}.</p>
                </div>
              )}
              {geo && project && (
                <svg viewBox="0 0 500 560" className="w-full h-auto max-h-[480px]"
                  style={{ background: "transparent" }}>
                  {geo.features.map((feature, i) => {
                    const name = getRegionName(feature.properties);
                    const key = name.toUpperCase();
                    const data = regionData[key];
                    const isActive = activeKey === key;
                    const fill = data
                      ? viewMode === "risk" ? RISK_COLOR[data.riskLevel] : SENTIMENT_COLOR(data.sentiment)
                      : "#334155";
                    return (
                      <path key={i}
                        d={ringsToPath(feature.geometry, project)}
                        fill={fill}
                        stroke={isActive ? "#fff" : "rgba(0,0,0,0.3)"}
                        strokeWidth={isActive ? 1.5 : 0.4}
                        opacity={isActive ? 1 : 0.82}
                        className="cursor-pointer transition-all duration-150"
                        onMouseEnter={() => setHovered(name)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setSelected(selected === name ? null : name)}
                      />
                    );
                  })}
                </svg>
              )}

              {/* Legend */}
              {!loading && !error && (
                <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur border border-border/50 rounded-xl p-3 text-xs space-y-1.5">
                  {viewMode === "risk"
                    ? [["critical","#dc2626"],["high","#f97316"],["medium","#eab308"],["low","#22c55e"]].map(([l,c]) => (
                        <div key={l} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm" style={{ background: c }} />
                          <span className="capitalize text-muted-foreground">{l}</span>
                        </div>
                      ))
                    : [["70+","#22c55e"],["50–69","#eab308"],["30–49","#f97316"],["<30","#dc2626"]].map(([l,c]) => (
                        <div key={l} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm" style={{ background: c }} />
                          <span className="text-muted-foreground">{l}</span>
                        </div>
                      ))
                  }
                </div>
              )}
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <div className="bg-card border border-border/50 rounded-2xl p-4">
              <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" /> Region Details
              </h3>
              {activeData ? (
                <motion.div key={activeData.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div>
                    <div className="text-lg font-black">{activeData.name}</div>
                    <div className="inline-block px-2 py-0.5 rounded text-xs font-semibold mt-1"
                      style={{ background: `${RISK_COLOR[activeData.riskLevel]}20`, color: RISK_COLOR[activeData.riskLevel] }}>
                      {activeData.riskLevel.toUpperCase()} RISK
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background rounded-xl p-3 border border-border/30">
                      <div className="text-[10px] text-muted-foreground uppercase mb-1">Sentiment</div>
                      <div className="text-xl font-black flex items-center gap-1"
                        style={{ color: SENTIMENT_COLOR(activeData.sentiment) }}>
                        {activeData.sentiment}%
                        {activeData.trend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
                        {activeData.trend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
                        {activeData.trend === "stable" && <Minus className="w-3.5 h-3.5 text-yellow-400" />}
                      </div>
                    </div>
                    <div className="bg-background rounded-xl p-3 border border-border/30">
                      <div className="text-[10px] text-muted-foreground uppercase mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Population
                      </div>
                      <div className="text-sm font-black">{(activeData.population / 1_000_000).toFixed(1)}M</div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="w-full text-xs h-7" onClick={() => setSelected(null)}>
                    Clear selection
                  </Button>
                </motion.div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-xs">Hover or click a region</p>
                </div>
              )}
            </div>

            {/* High risk list */}
            <div className="bg-card border border-border/50 rounded-2xl p-4">
              <h3 className="font-black text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" /> High Risk Regions
              </h3>
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                {Object.values(regionData)
                  .filter(r => r.riskLevel === "critical" || r.riskLevel === "high")
                  .sort((a, b) => b.sentiment - a.sentiment)
                  .slice(0, 12)
                  .map(r => (
                    <button key={r.name} onClick={() => setSelected(r.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${selected === r.name ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"}`}>
                      <span className="text-xs font-semibold truncate">{r.name}</span>
                      <span className="text-[10px] font-bold ml-2 shrink-0" style={{ color: RISK_COLOR[r.riskLevel] }}>
                        {r.sentiment}%
                      </span>
                    </button>
                  ))}
                {Object.values(regionData).filter(r => r.riskLevel === "critical" || r.riskLevel === "high").length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">No high-risk regions</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
