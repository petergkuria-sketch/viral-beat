import React, { useEffect, useState, useRef } from "react";
import { Link } from "wouter";

import { AlertTriangle, TrendingUp, TrendingDown, Minus, MapPin, Activity, Users, ExternalLink, Building2, Vote, Target } from "lucide-react";
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
  properties: {
    COUNTY: string;
    AREA: number;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

interface GeoJSON {
  type: string;
  features: GeoFeature[];
}

// Generate mock sentiment data for all 47 counties
const generateCountyData = (): Record<string, CountyData> => {
  const counties = [
    "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta", "Garissa", "Wajir", "Mandera",
    "Marsabit", "Isiolo", "Meru", "Tharaka Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua",
    "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia",
    "Uasin Gishu", "Elgeyo Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado",
    "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", "Kisumu", "Homa Bay",
    "Migori", "Kisii", "Nyamira", "Nairobi"
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

  // Set some specific high-risk areas for demo
  data["NAIROBI"] = { ...data["NAIROBI"], hateSpeeches: 127, riskLevel: 'critical', sentiment: 42 };
  data["KISUMU"] = { ...data["KISUMU"], hateSpeeches: 89, riskLevel: 'high', sentiment: 38 };
  data["NAKURU"] = { ...data["NAKURU"], hateSpeeches: 76, riskLevel: 'high', sentiment: 45 };
  data["UASIN GISHU"] = { ...data["UASIN GISHU"], hateSpeeches: 68, riskLevel: 'high', sentiment: 51 };

  return data;
};

const getRiskColor = (risk: string): string => {
  switch (risk) {
    case 'critical': return '#dc2626';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
    default: return '#6b7280';
  }
};

const getSentimentColor = (sentiment: number): string => {
  if (sentiment >= 70) return '#22c55e';
  if (sentiment >= 50) return '#eab308';
  if (sentiment >= 30) return '#f97316';
  return '#dc2626';
};

// Helper to get governor for a county
const findGovernorForCounty = (countyName: string): Governor | undefined => {
  // Normalize county name for lookup
  const normalized = countyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return governors.find(g => 
    g.county.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized
  );
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
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Failed to load GeoJSON:', err));
  }, []);

  // Simple projection function for Kenya coordinates
  const projectPoint = (lon: number, lat: number): [number, number] => {
    const minLon = 33.9;
    const maxLon = 42;
    const minLat = -4.7;
    const maxLat = 5.5;
    
    const width = 500;
    const height = 600;
    
    const x = ((lon - minLon) / (maxLon - minLon)) * width;
    const y = height - ((lat - minLat) / (maxLat - minLat)) * height;
    
    return [x, y];
  };

  const createPath = (coordinates: number[][][]): string => {
    return coordinates.map((ring, ringIndex) => {
      const points = ring.map(coord => {
        const [x, y] = projectPoint(coord[0], coord[1]);
        return `${x},${y}`;
      });
      return (ringIndex === 0 ? 'M' : 'M') + points.join(' L') + ' Z';
    }).join(' ');
  };

  const getCountyColor = (countyName: string): string => {
    const data = countyData[countyName.toUpperCase()];
    if (!data) return '#e5e7eb';
    
    if (viewMode === 'risk') {
      return getRiskColor(data.riskLevel);
    } else {
      return getSentimentColor(data.sentiment);
    }
  };

  const activeCounty = selectedCounty || hoveredCounty;
  const activeData = activeCounty ? countyData[activeCounty.toUpperCase()] : null;
  const activeGovernor = activeData ? findGovernorForCounty(activeData.name) : null;

  const riskSummary = Object.values(countyData).reduce((acc, county) => {
    acc[county.riskLevel] = (acc[county.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Generate URL slug for governor detail page
  const getGovernorSlug = (countyName: string): string => {
    return countyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="border-b-2 border-border pb-6">
          <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase">Regional Heatmap</h2>
          <p className="text-muted-foreground font-mono mt-2">Sentiment and hate speech intensity by county. Click a county to view governor profile.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="brutalist-card bg-red-100 border-red-500">
            <div className="text-xs font-mono uppercase text-red-800">Critical Risk</div>
            <div className="text-3xl font-bold text-red-900">{riskSummary.critical || 0}</div>
            <div className="text-xs font-mono text-red-700">Counties</div>
          </div>
          <div className="brutalist-card bg-orange-100 border-orange-500">
            <div className="text-xs font-mono uppercase text-orange-800">High Risk</div>
            <div className="text-3xl font-bold text-orange-900">{riskSummary.high || 0}</div>
            <div className="text-xs font-mono text-orange-700">Counties</div>
          </div>
          <div className="brutalist-card bg-yellow-100 border-yellow-500">
            <div className="text-xs font-mono uppercase text-yellow-800">Medium Risk</div>
            <div className="text-3xl font-bold text-yellow-900">{riskSummary.medium || 0}</div>
            <div className="text-xs font-mono text-yellow-700">Counties</div>
          </div>
          <div className="brutalist-card bg-green-100 border-green-500">
            <div className="text-xs font-mono uppercase text-green-800">Low Risk</div>
            <div className="text-3xl font-bold text-green-900">{riskSummary.low || 0}</div>
            <div className="text-xs font-mono text-green-700">Counties</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 brutalist-card bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono font-bold uppercase">Kenya Counties</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('risk')}
                  className={`px-3 py-1 text-xs font-mono border-2 border-border transition-colors ${
                    viewMode === 'risk' ? 'bg-foreground text-background' : 'bg-background hover:bg-secondary'
                  }`}
                >
                  Risk Level
                </button>
                <button
                  onClick={() => setViewMode('sentiment')}
                  className={`px-3 py-1 text-xs font-mono border-2 border-border transition-colors ${
                    viewMode === 'sentiment' ? 'bg-foreground text-background' : 'bg-background hover:bg-secondary'
                  }`}
                >
                  Sentiment
                </button>
              </div>
            </div>

            <div className="relative bg-gray-50 border-2 border-border p-4">
              {geoData ? (
                <svg
                  ref={svgRef}
                  viewBox="0 0 500 600"
                  className="w-full h-auto max-h-[500px]"
                  style={{ background: '#f8fafc' }}
                >
                  {geoData.features.map((feature, index) => {
                    const countyName = feature.properties.COUNTY;
                    const isActive = activeCounty?.toUpperCase() === countyName?.toUpperCase();
                    
                    return (
                      <path
                        key={index}
                        d={createPath(feature.geometry.coordinates)}
                        fill={getCountyColor(countyName)}
                        stroke={isActive ? '#000' : '#fff'}
                        strokeWidth={isActive ? 2 : 0.5}
                        opacity={isActive ? 1 : 0.85}
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredCounty(countyName)}
                        onMouseLeave={() => setHoveredCounty(null)}
                        onClick={() => setSelectedCounty(countyName === selectedCounty ? null : countyName)}
                      />
                    );
                  })}
                </svg>
              ) : (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-4 animate-pulse text-muted-foreground" />
                    <p className="font-mono text-sm text-muted-foreground">Loading map data...</p>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white border-2 border-border p-3">
                <div className="text-xs font-mono font-bold mb-2 uppercase">
                  {viewMode === 'risk' ? 'Risk Level' : 'Sentiment'}
                </div>
                {viewMode === 'risk' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-600"></div>
                      <span className="text-xs font-mono">Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500"></div>
                      <span className="text-xs font-mono">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500"></div>
                      <span className="text-xs font-mono">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500"></div>
                      <span className="text-xs font-mono">Low</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500"></div>
                      <span className="text-xs font-mono">Positive (70+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500"></div>
                      <span className="text-xs font-mono">Neutral (50-69)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500"></div>
                      <span className="text-xs font-mono">Negative (30-49)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-600"></div>
                      <span className="text-xs font-mono">Critical (&lt;30)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* County Details Panel */}
          <div className="space-y-4">
            <div className="brutalist-card bg-white">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                County Details
              </h3>
              
              {activeData ? (
                <div className="space-y-4">
                  <div className="border-b-2 border-border pb-3">
                    <div className="text-2xl font-bold uppercase">{activeData.name}</div>
                    <div className={`inline-block px-2 py-1 text-xs font-mono font-bold mt-2 ${
                      activeData.riskLevel === 'critical' ? 'bg-red-200 text-red-900' :
                      activeData.riskLevel === 'high' ? 'bg-orange-200 text-orange-900' :
                      activeData.riskLevel === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                      'bg-green-200 text-green-900'
                    }`}>
                      {activeData.riskLevel.toUpperCase()} RISK
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary p-3 border border-border">
                      <div className="text-xs font-mono text-muted-foreground uppercase">Sentiment</div>
                      <div className="text-2xl font-bold flex items-center gap-1">
                        {activeData.sentiment}%
                        {activeData.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                        {activeData.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                        {activeData.trend === 'stable' && <Minus className="w-4 h-4 text-gray-600" />}
                      </div>
                    </div>
                    <div className="bg-secondary p-3 border border-border">
                      <div className="text-xs font-mono text-muted-foreground uppercase">Hate Speeches</div>
                      <div className="text-2xl font-bold flex items-center gap-1">
                        {activeData.hateSpeeches}
                        <AlertTriangle className={`w-4 h-4 ${
                          activeData.hateSpeeches > 80 ? 'text-red-600' : 'text-orange-500'
                        }`} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary p-3 border border-border">
                    <div className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-1">
                      <Users className="w-3 h-3" /> Population
                    </div>
                    <div className="text-xl font-bold">
                      {activeData.population.toLocaleString()}
                    </div>
                  </div>

                  {/* Governor Info Section */}
                  {activeGovernor && (
                    <div className="border-t-2 border-border pt-4 mt-4">
                      <h4 className="font-mono font-bold uppercase text-sm mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        County Governor
                      </h4>
                      
                      <div className="bg-secondary p-4 border-2 border-border">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-foreground/10 border border-border flex items-center justify-center">
                            <span className="text-lg font-bold font-mono">
                              {activeGovernor.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate">{activeGovernor.name}</div>
                            <div className="text-xs font-mono text-muted-foreground">{activeGovernor.party}</div>
                            <div className={`inline-block mt-1 px-1.5 py-0.5 text-xs font-mono ${
                              activeGovernor.coalition === 'Kenya Kwanza' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {activeGovernor.coalition}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="text-center p-2 bg-background border border-border">
                            <div className="text-xs font-mono text-muted-foreground uppercase">Approval</div>
                            <div className="text-lg font-bold">{activeGovernor.approvalRating}%</div>
                          </div>
                          <div className="text-center p-2 bg-background border border-border">
                            <div className="text-xs font-mono text-muted-foreground uppercase">Sentiment</div>
                            <div className="text-lg font-bold flex items-center justify-center gap-1">
                              {activeGovernor.sentiment}%
                              {activeGovernor.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-600" />}
                              {activeGovernor.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-600" />}
                              {activeGovernor.trend === 'stable' && <Minus className="w-3 h-3 text-gray-600" />}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="text-xs font-mono text-muted-foreground uppercase mb-1 flex items-center gap-1">
                            <Target className="w-3 h-3" /> Key Issues
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {activeGovernor.keyIssues.slice(0, 3).map((issue, i) => (
                              <span key={i} className="text-xs font-mono bg-background px-1.5 py-0.5 border border-border">
                                {issue}
                              </span>
                            ))}
                          </div>
                        </div>

                        <Link
                          href={`/kenya/governor/${getGovernorSlug(activeGovernor.county)}`}
                          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-foreground text-background font-mono text-xs uppercase hover:bg-foreground/90 transition-colors"
                        >
                          View Full Profile
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-mono text-sm">Hover or click on a county to view details</p>
                  <p className="font-mono text-xs mt-2 text-muted-foreground/70">Including governor profile and regional sentiment</p>
                </div>
              )}
            </div>

            {/* High Risk Counties List */}
            <div className="brutalist-card bg-white">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                High Risk Areas
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {Object.values(countyData)
                  .filter(c => c.riskLevel === 'critical' || c.riskLevel === 'high')
                  .sort((a, b) => b.hateSpeeches - a.hateSpeeches)
                  .map(county => {
                    const governor = findGovernorForCounty(county.name);
                    return (
                      <div
                        key={county.name}
                        className={`p-2 border border-border cursor-pointer transition-colors ${
                          activeCounty?.toUpperCase() === county.name.toUpperCase() 
                            ? 'bg-secondary' 
                            : 'hover:bg-secondary/50'
                        }`}
                        onClick={() => setSelectedCounty(county.name.toUpperCase())}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-mono text-sm font-bold">{county.name}</span>
                            {governor && (
                              <span className="text-xs font-mono text-muted-foreground ml-2">
                                Gov. {governor.name.split(' ').pop()}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-mono px-1.5 py-0.5 ${
                            county.riskLevel === 'critical' 
                              ? 'bg-red-200 text-red-900' 
                              : 'bg-orange-200 text-orange-900'
                          }`}>
                            {county.hateSpeeches} incidents
                          </span>
                        </div>
                      </div>
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
