import React, { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, MapPin, Activity, Users, ExternalLink, Building2, Target } from "lucide-react";
import { governors, getGovernorByCounty, Governor } from "@/lib/kenya/governors-data";

interface CountyData {
  name: string;
  sentiment: number;
  hateSpeeches: number;
  population: number;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface GeoFeature {
  type: string;
  properties: { COUNTY: string; AREA: number };
  geometry: { type: string; coordinates: number[][][] };
}

interface GeoJSON {
  type: string;
  features: GeoFeature[];
}

const generateCountyData = (): Record<string, CountyData> => {
  const counties = [
    "Mombasa","Kwale","Kilifi","Tana River","Lamu","Taita Taveta","Garissa","Wajir","Mandera",
    "Marsabit","Isiolo","Meru","Tharaka Nithi","Embu","Kitui","Machakos","Makueni","Nyandarua",
    "Nyeri","Kirinyaga","Murang'a","Kiambu","Turkana","West Pokot","Samburu","Trans Nzoia",
    "Uasin Gishu","Elgeyo Marakwet","Nandi","Baringo","Laikipia","Nakuru","Narok","Kajiado",
    "Kericho","Bomet","Kakamega","Vihiga","Bungoma","Busia","Siaya","Kisumu","Homa Bay",
    "Migori","Kisii","Nyamira","Nairobi"
  ];
  const data: Record<string, CountyData> = {};
  counties.forEach(county => {
    const sentiment = Math.random() * 100;
    const hateSpeeches = Math.floor(Math.random() * 150);
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (hateSpeeches > 100) riskLevel = 'critical';
    else if (hateSpeeches > 60) riskLevel = 'high';
    else if (hateSpeeches > 30) riskLevel = 'medium';
    else riskLevel = 'low';
    data[county.toUpperCase()] = {
      name: county,
      sentiment: Math.round(sentiment),
      hateSpeeches,
      population: Math.floor(Math.random() * 2000000) + 100000,
      trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable',
      riskLevel
    };
  });
  data["NAIROBI"]    = { ...data["NAIROBI"],    hateSpeeches: 127, riskLevel: 'critical', sentiment: 42 };
  data["KISUMU"]     = { ...data["KISUMU"],      hateSpeeches: 89,  riskLevel: 'high',     sentiment: 38 };
  data["NAKURU"]     = { ...data["NAKURU"],      hateSpeeches: 76,  riskLevel: 'high',     sentiment: 45 };
  data["UASIN GISHU"]= { ...data["UASIN GISHU"],hateSpeeches: 68,  riskLevel: 'high',     sentiment: 51 };
  return data;
};

const RISK_COLOR: Record<string, string> = {
  critical: '#dc2626', high: '#f97316', medium: '#eab308', low: '#22c55e',
};
const RISK_ACCENT: Record<string, string> = {
  critical: 'border-red-500/30 text-red-400',
  high:     'border-orange-500/30 text-orange-400',
  medium:   'border-amber-500/30 text-amber-400',
  low:      'border-emerald-500/30 text-emerald-400',
};

const getSentimentColor = (s: number) =>
  s >= 70 ? '#22c55e' : s >= 50 ? '#eab308' : s >= 30 ? '#f97316' : '#dc2626';

const findGovernorForCounty = (name: string): Governor | undefined => {
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return governors.find(g => g.county.toLowerCase().replace(/[^a-z0-9]/g, '') === n);
};

export default function RegionalMap() {
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [countyData] = useState<Record<string, CountyData>>(generateCountyData);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'risk' | 'sentiment'>('risk');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch('/kenya-counties.geojson')
      .then(r => r.json())
      .then(setGeoData)
      .catch(err => console.error('Failed to load GeoJSON:', err));
  }, []);

  const projectPoint = (lon: number, lat: number): [number, number] => {
    const x = ((lon - 33.9) / (42 - 33.9)) * 500;
    const y = 600 - ((lat - -4.7) / (5.5 - -4.7)) * 600;
    return [x, y];
  };

  const createPath = (coordinates: number[][][]): string =>
    coordinates.map(ring => 'M' + ring.map(c => projectPoint(c[0], c[1]).join(',')).join(' L') + ' Z').join(' ');

  const getCountyColor = (name: string): string => {
    const d = countyData[name.toUpperCase()];
    if (!d) return '#1e293b';
    return viewMode === 'risk' ? RISK_COLOR[d.riskLevel] : getSentimentColor(d.sentiment);
  };

  const activeCounty = selectedCounty || hoveredCounty;
  const activeData = activeCounty ? countyData[activeCounty.toUpperCase()] : null;
  const activeGovernor = activeData ? findGovernorForCounty(activeData.name) : null;

  const riskSummary = Object.values(countyData).reduce((acc, c) => {
    acc[c.riskLevel] = (acc[c.riskLevel] || 0) + 1; return acc;
  }, {} as Record<string, number>);

  const getGovernorSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-cyan-400" />
          Regional Heatmap
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Sentiment and hate speech intensity by county. Click a county to view governor profile.</p>
      </div>

      <div className="p-4 sm:p-6 space-y-5">

        {/* Risk summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Critical Risk', key: 'critical', color: '#dc2626', border: 'border-red-500/20' },
            { label: 'High Risk',     key: 'high',     color: '#f97316', border: 'border-orange-500/20' },
            { label: 'Medium Risk',   key: 'medium',   color: '#eab308', border: 'border-amber-500/20' },
            { label: 'Low Risk',      key: 'low',      color: '#22c55e', border: 'border-emerald-500/20' },
          ].map(({ label, key, color, border }) => (
            <div key={key} className={`bg-card border ${border} rounded-2xl p-5`}>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color }}>{label}</div>
              <div className="text-3xl font-black text-slate-100">{riskSummary[key] || 0}</div>
              <div className="text-xs text-slate-400 mt-0.5">Counties</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Map */}
          <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-300">Kenya Counties</h3>
              <div className="flex gap-2">
                {(['risk', 'sentiment'] as const).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all capitalize ${
                      viewMode === mode
                        ? 'bg-white/10 border-white/20 text-slate-100'
                        : 'bg-transparent border-border/50 text-slate-400 hover:bg-white/5'
                    }`}>
                    {mode === 'risk' ? 'Risk Level' : 'Sentiment'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative bg-[#0a1628] rounded-xl p-3">
              {geoData ? (
                <svg ref={svgRef} viewBox="0 0 500 600" className="w-full h-auto max-h-[500px]"
                  style={{ background: 'transparent' }}>
                  {geoData.features.map((feature, i) => {
                    const name = feature.properties.COUNTY;
                    const isActive = activeCounty?.toUpperCase() === name?.toUpperCase();
                    return (
                      <path key={i}
                        d={createPath(feature.geometry.coordinates)}
                        fill={getCountyColor(name)}
                        stroke={isActive ? '#fff' : 'rgba(255,255,255,0.15)'}
                        strokeWidth={isActive ? 1.5 : 0.5}
                        opacity={isActive ? 1 : 0.85}
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredCounty(name)}
                        onMouseLeave={() => setHoveredCounty(null)}
                        onClick={() => setSelectedCounty(name === selectedCounty ? null : name)}
                      />
                    );
                  })}
                </svg>
              ) : (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-10 h-10 mx-auto mb-3 animate-pulse text-slate-600" />
                    <p className="text-sm text-slate-500">Loading map data…</p>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="absolute bottom-5 left-5 bg-[#080d1a]/90 border border-white/10 rounded-xl p-3 backdrop-blur">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  {viewMode === 'risk' ? 'Risk Level' : 'Sentiment'}
                </div>
                <div className="space-y-1.5">
                  {(viewMode === 'risk' ? [
                    { label: 'Critical', color: '#dc2626' },
                    { label: 'High',     color: '#f97316' },
                    { label: 'Medium',   color: '#eab308' },
                    { label: 'Low',      color: '#22c55e' },
                  ] : [
                    { label: 'Positive (70+)',   color: '#22c55e' },
                    { label: 'Neutral (50-69)',  color: '#eab308' },
                    { label: 'Negative (30-49)', color: '#f97316' },
                    { label: 'Critical (<30)',   color: '#dc2626' },
                  ]).map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: color }} />
                      <span className="text-[10px] text-slate-300">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            {/* County detail */}
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" /> County Details
              </h3>

              {activeData ? (
                <div className="space-y-4">
                  <div className="pb-3 border-b border-border/50">
                    <div className="text-xl font-black text-slate-100">{activeData.name}</div>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold uppercase ${RISK_ACCENT[activeData.riskLevel]}`}
                      style={{ background: `${RISK_COLOR[activeData.riskLevel]}15` }}>
                      {activeData.riskLevel} Risk
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Sentiment</div>
                      <div className="text-2xl font-black flex items-center gap-1"
                        style={{ color: getSentimentColor(activeData.sentiment) }}>
                        {activeData.sentiment}%
                        {activeData.trend === 'up'     && <TrendingUp   className="w-4 h-4" />}
                        {activeData.trend === 'down'   && <TrendingDown  className="w-4 h-4" />}
                        {activeData.trend === 'stable' && <Minus         className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Incidents</div>
                      <div className="text-2xl font-black text-slate-100 flex items-center gap-1">
                        {activeData.hateSpeeches}
                        <AlertTriangle className="w-4 h-4"
                          style={{ color: activeData.hateSpeeches > 80 ? '#dc2626' : '#f97316' }} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Population</div>
                      <div className="text-lg font-black text-slate-200">{activeData.population.toLocaleString()}</div>
                    </div>
                  </div>

                  {activeGovernor && (
                    <div className="border-t border-border/50 pt-4">
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> County Governor
                      </h4>
                      <div className="bg-white/5 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-black text-slate-200">
                              {activeGovernor.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-100 truncate">{activeGovernor.name}</div>
                            <div className="text-xs text-slate-400 truncate">{activeGovernor.party}</div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
                              style={{
                                background: activeGovernor.coalition === 'Kenya Kwanza' ? '#fbbf2420' : '#f9731620',
                                color:      activeGovernor.coalition === 'Kenya Kwanza' ? '#fbbf24'   : '#f97316',
                              }}>
                              {activeGovernor.coalition}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center bg-white/5 rounded-lg p-2">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Approval</div>
                            <div className="text-lg font-black text-slate-100">{activeGovernor.approvalRating}%</div>
                          </div>
                          <div className="text-center bg-white/5 rounded-lg p-2">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Sentiment</div>
                            <div className="text-lg font-black" style={{ color: getSentimentColor(activeGovernor.sentiment) }}>
                              {activeGovernor.sentiment}%
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Target className="w-3 h-3" /> Key Issues
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {activeGovernor.keyIssues.slice(0, 3).map((issue, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300">
                                {issue}
                              </span>
                            ))}
                          </div>
                        </div>

                        <Link href={`/kenya/governor/${getGovernorSlug(activeGovernor.county)}`}
                          className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-colors">
                          View Full Profile <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <MapPin className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                  <p className="text-sm text-slate-500">Hover or click a county</p>
                  <p className="text-xs text-slate-600 mt-1">View sentiment, risk level and governor profile</p>
                </div>
              )}
            </div>

            {/* High risk list */}
            <div className="bg-card border border-red-500/20 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" /> High Risk Areas
              </h3>
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {Object.values(countyData)
                  .filter(c => c.riskLevel === 'critical' || c.riskLevel === 'high')
                  .sort((a, b) => b.hateSpeeches - a.hateSpeeches)
                  .map(county => {
                    const gov = findGovernorForCounty(county.name);
                    const isActive = activeCounty?.toUpperCase() === county.name.toUpperCase();
                    return (
                      <button key={county.name}
                        onClick={() => setSelectedCounty(county.name.toUpperCase())}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                          isActive ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5'
                        }`}>
                        <div>
                          <div className="text-sm font-semibold text-slate-200">{county.name}</div>
                          {gov && <div className="text-[10px] text-slate-500">Gov. {gov.name.split(' ').pop()}</div>}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: `${RISK_COLOR[county.riskLevel]}20`,
                            color: RISK_COLOR[county.riskLevel],
                          }}>
                          {county.hateSpeeches} incidents
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
