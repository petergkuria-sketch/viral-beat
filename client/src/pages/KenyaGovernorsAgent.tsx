import React, { useState, useMemo } from "react";
import { Link } from "wouter";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  governors, 
  Governor, 
  regionStats, 
  coalitionStats, 
  partyBreakdown,
  getFemaleGovernors 
} from "@/lib/kenya/governors-data";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Search, 
  Filter,
  MapPin,
  Users,
  TrendingUp,
  TrendingDown,
  Building2,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

type FilterType = 'all' | 'region' | 'coalition' | 'party' | 'gender' | 'trend';

export default function GovernorsAgent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCoalition, setSelectedCoalition] = useState<string>('all');
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedTrend, setSelectedTrend] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const parties = useMemo(() => partyBreakdown(), []);
  const coalition = useMemo(() => coalitionStats(), []);
  const femaleCount = useMemo(() => getFemaleGovernors().length, []);

  const filteredGovernors = useMemo(() => {
    return governors.filter(gov => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        gov.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gov.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gov.party.toLowerCase().includes(searchTerm.toLowerCase());

      // Region filter
      const matchesRegion = selectedRegion === 'all' || gov.region === selectedRegion;

      // Coalition filter
      const matchesCoalition = selectedCoalition === 'all' || gov.coalition === selectedCoalition;

      // Party filter
      const matchesParty = selectedParty === 'all' || gov.party === selectedParty;

      // Gender filter
      const matchesGender = selectedGender === 'all' || gov.gender === selectedGender;

      // Trend filter
      const matchesTrend = selectedTrend === 'all' || gov.trend === selectedTrend;

      return matchesSearch && matchesRegion && matchesCoalition && matchesParty && matchesGender && matchesTrend;
    });
  }, [searchTerm, selectedRegion, selectedCoalition, selectedParty, selectedGender, selectedTrend]);

  // Chart data
  const coalitionData = [
    { name: 'Kenya Kwanza', value: coalition['Kenya Kwanza'], color: '#FBBF24' },
    { name: 'Azimio', value: coalition['Azimio'], color: '#3B82F6' },
    { name: 'Independent', value: coalition['Independent'] || 0, color: '#6B7280' }
  ].filter(d => d.value > 0);

  const regionData = Object.entries(regionStats).map(([region, stats]) => ({
    name: region,
    counties: stats.counties,
    color: stats.color
  }));

  const partyData = parties.slice(0, 8);

  const getTrendIcon = (trend: Governor['trend']) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'down': return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 60) return 'bg-green-500';
    if (sentiment >= 45) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRegion('all');
    setSelectedCoalition('all');
    setSelectedParty('all');
    setSelectedGender('all');
    setSelectedTrend('all');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-border pb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase">County Governors</h2>
            <p className="text-muted-foreground font-mono mt-2">Tracking sentiment for all 47 county governors.</p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-amber-100 border-2 border-amber-600 text-amber-800 font-mono text-xs font-bold uppercase">
              Kenya Kwanza: {coalition['Kenya Kwanza']}
            </div>
            <div className="px-3 py-1 bg-blue-100 border-2 border-blue-600 text-blue-800 font-mono text-xs font-bold uppercase">
              Azimio: {coalition['Azimio']}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="brutalist-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold font-mono">47</p>
                  <p className="text-xs font-mono text-muted-foreground uppercase">Total Counties</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="brutalist-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold font-mono">{femaleCount}</p>
                  <p className="text-xs font-mono text-muted-foreground uppercase">Female Governors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="brutalist-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold font-mono">{governors.filter(g => g.trend === 'up').length}</p>
                  <p className="text-xs font-mono text-muted-foreground uppercase">Trending Up</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="brutalist-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold font-mono">{governors.filter(g => g.trend === 'down').length}</p>
                  <p className="text-xs font-mono text-muted-foreground uppercase">Trending Down</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coalition Distribution */}
          <Card className="brutalist-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-sm uppercase">Coalition Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={coalitionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {coalitionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Regional Distribution */}
          <Card className="brutalist-card lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-sm uppercase">Regional Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={regionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="counties" fill="#1a1a1a">
                    {regionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="brutalist-card p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, county, or party..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Region Filter */}
            <div className="relative">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Regions</option>
                {Object.keys(regionStats).map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>

            {/* Coalition Filter */}
            <div className="relative">
              <select
                value={selectedCoalition}
                onChange={(e) => setSelectedCoalition(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Coalitions</option>
                <option value="Kenya Kwanza">Kenya Kwanza</option>
                <option value="Azimio">Azimio</option>
                <option value="Independent">Independent</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>

            {/* Party Filter */}
            <div className="relative">
              <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Parties</option>
                {parties.map(p => (
                  <option key={p.party} value={p.party}>{p.party} ({p.count})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>

            {/* Gender Filter */}
            <div className="relative">
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>

            {/* Trend Filter */}
            <div className="relative">
              <select
                value={selectedTrend}
                onChange={(e) => setSelectedTrend(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Trends</option>
                <option value="up">Trending Up</option>
                <option value="down">Trending Down</option>
                <option value="stable">Stable</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="px-4 py-2 border-2 border-border bg-secondary font-mono text-sm hover:bg-secondary/80 transition-colors"
            >
              Clear
            </button>

            {/* View Toggle */}
            <div className="flex border-2 border-border">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "px-3 py-2 font-mono text-xs uppercase",
                  viewMode === 'grid' ? "bg-primary text-primary-foreground" : "bg-background"
                )}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  "px-3 py-2 font-mono text-xs uppercase border-l-2 border-border",
                  viewMode === 'table' ? "bg-primary text-primary-foreground" : "bg-background"
                )}
              >
                Table
              </button>
            </div>
          </div>

          <div className="text-sm font-mono text-muted-foreground">
            Showing {filteredGovernors.length} of 47 governors
          </div>
        </div>

        {/* Governors Grid/Table */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredGovernors.map((gov) => (
              <Link 
                key={gov.id} 
                href={`/kenya/governor/${gov.county.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                className="brutalist-card group hover:bg-secondary transition-colors cursor-pointer block"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={cn(
                    "px-2 py-1 text-xs font-bold border-2 border-border font-mono",
                    gov.coalition === 'Kenya Kwanza' ? "bg-amber-100 text-amber-900" : 
                    gov.coalition === 'Azimio' ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-900"
                  )}>
                    {gov.coalition}
                  </div>
                  <div className={cn(
                    "px-2 py-1 text-xs font-bold border-2 border-border font-mono flex items-center gap-1",
                    gov.trend === 'up' ? "bg-green-100 text-green-900" : 
                    gov.trend === 'down' ? "bg-red-100 text-red-900" : "bg-gray-100 text-gray-900"
                  )}>
                    {getTrendIcon(gov.trend)}
                  </div>
                </div>

                <h3 className="font-bold text-base uppercase leading-tight mb-1">{gov.name}</h3>
                <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground mb-1">
                  <MapPin className="w-3 h-3" />
                  {gov.county} County
                </div>
                <p className="text-xs font-mono text-muted-foreground mb-3">{gov.party} • {gov.region}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span>SENTIMENT</span>
                    <span>{gov.sentiment}%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-200 border-2 border-border relative">
                    <div 
                      className={cn("h-full absolute top-0 left-0", getSentimentColor(gov.sentiment))} 
                      style={{ width: `${gov.sentiment}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {gov.keyIssues.slice(0, 2).map((issue, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-mono">
                      {issue}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="brutalist-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-3 font-mono text-xs uppercase">County</th>
                  <th className="text-left p-3 font-mono text-xs uppercase">Governor</th>
                  <th className="text-left p-3 font-mono text-xs uppercase">Party</th>
                  <th className="text-left p-3 font-mono text-xs uppercase">Coalition</th>
                  <th className="text-left p-3 font-mono text-xs uppercase">Region</th>
                  <th className="text-left p-3 font-mono text-xs uppercase">Sentiment</th>
                  <th className="text-left p-3 font-mono text-xs uppercase">Trend</th>
                </tr>
              </thead>
              <tbody>
                {filteredGovernors.map((gov) => (
                  <tr 
                    key={gov.id} 
                    className="border-b border-border hover:bg-secondary transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/governors/${gov.county.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                  >
                    <td className="p-3 font-mono text-sm font-bold text-primary hover:underline">{gov.county}</td>
                    <td className="p-3 font-mono text-sm">{gov.name}</td>
                    <td className="p-3 font-mono text-sm">{gov.party}</td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-1 text-xs font-bold border border-border font-mono",
                        gov.coalition === 'Kenya Kwanza' ? "bg-amber-100 text-amber-900" : 
                        gov.coalition === 'Azimio' ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-900"
                      )}>
                        {gov.coalition}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-sm">{gov.region}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 border border-border relative">
                          <div 
                            className={cn("h-full absolute top-0 left-0", getSentimentColor(gov.sentiment))} 
                            style={{ width: `${gov.sentiment}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold">{gov.sentiment}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 text-xs font-bold border border-border font-mono",
                        gov.trend === 'up' ? "bg-green-100 text-green-900" : 
                        gov.trend === 'down' ? "bg-red-100 text-red-900" : "bg-gray-100 text-gray-900"
                      )}>
                        {getTrendIcon(gov.trend)}
                        {gov.trend}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Party Breakdown */}
        <Card className="brutalist-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase">Party Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={partyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="party" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1a1a1a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
