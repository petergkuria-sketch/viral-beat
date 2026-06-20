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
      const matchesSearch = searchTerm === "" ||
        gov.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gov.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gov.party.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = selectedRegion === 'all' || gov.region === selectedRegion;
      const matchesCoalition = selectedCoalition === 'all' || gov.coalition === selectedCoalition;
      const matchesParty = selectedParty === 'all' || gov.party === selectedParty;
      const matchesGender = selectedGender === 'all' || gov.gender === selectedGender;
      const matchesTrend = selectedTrend === 'all' || gov.trend === selectedTrend;
      return matchesSearch && matchesRegion && matchesCoalition && matchesParty && matchesGender && matchesTrend;
    });
  }, [searchTerm, selectedRegion, selectedCoalition, selectedParty, selectedGender, selectedTrend]);

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
      case 'up': return <ArrowUpRight className="w-4 h-4" style={{ color: '#34d399' }} />;
      case 'down': return <ArrowDownRight className="w-4 h-4" style={{ color: '#f87171' }} />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 60) return 'bg-emerald-500';
    if (sentiment >= 45) return 'bg-amber-500';
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

  const chartTooltipStyle = {
    backgroundColor: '#0d1525',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#e2e8f0'
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-100">County Governors</h1>
            <p className="text-slate-400 text-sm mt-1">Tracking sentiment for all 47 county governors.</p>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              Kenya Kwanza: {coalition['Kenya Kwanza']}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
              Azimio: {coalition['Azimio']}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-slate-400" />
              <div>
                <p className="text-2xl font-bold text-slate-100">47</p>
                <p className="text-xs text-slate-400">Total Counties</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8" style={{ color: '#f472b6' }} />
              <div>
                <p className="text-2xl font-bold text-slate-100">{femaleCount}</p>
                <p className="text-xs text-slate-400">Female Governors</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8" style={{ color: '#34d399' }} />
              <div>
                <p className="text-2xl font-bold text-slate-100">{governors.filter(g => g.trend === 'up').length}</p>
                <p className="text-xs text-slate-400">Trending Up</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8" style={{ color: '#f87171' }} />
              <div>
                <p className="text-2xl font-bold text-slate-100">{governors.filter(g => g.trend === 'down').length}</p>
                <p className="text-xs text-slate-400">Trending Down</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <p className="text-sm font-bold text-slate-300 mb-3">Coalition Distribution</p>
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
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5 lg:col-span-2">
            <p className="text-sm font-bold text-slate-300 mb-3">Regional Distribution</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={regionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="counties" fill="#34d399">
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, county, or party..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>

            <div className="relative">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none cursor-pointer"
              >
                <option value="all">All Regions</option>
                {Object.keys(regionStats).map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={selectedCoalition}
                onChange={(e) => setSelectedCoalition(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none cursor-pointer"
              >
                <option value="all">All Coalitions</option>
                <option value="Kenya Kwanza">Kenya Kwanza</option>
                <option value="Azimio">Azimio</option>
                <option value="Independent">Independent</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none cursor-pointer"
              >
                <option value="all">All Parties</option>
                {parties.map(p => (
                  <option key={p.party} value={p.party}>{p.party} ({p.count})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none cursor-pointer"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={selectedTrend}
                onChange={(e) => setSelectedTrend(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none cursor-pointer"
              >
                <option value="all">All Trends</option>
                <option value="up">Trending Up</option>
                <option value="down">Trending Down</option>
                <option value="stable">Stable</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
            </div>

            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-card border border-border/50 rounded-xl text-slate-200 text-sm hover:bg-white/5 transition-colors"
            >
              Clear
            </button>

            <div className="flex rounded-xl overflow-hidden border border-border/50">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "px-3 py-2 text-xs",
                  viewMode === 'grid' ? "bg-white/10 border-white/20 text-slate-100" : "bg-card text-slate-400 hover:bg-white/5"
                )}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  "px-3 py-2 text-xs border-l border-border/50",
                  viewMode === 'table' ? "bg-white/10 border-white/20 text-slate-100" : "bg-card text-slate-400 hover:bg-white/5"
                )}
              >
                Table
              </button>
            </div>
          </div>

          <div className="text-sm text-slate-400">
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
                className={cn(
                  "bg-card border rounded-2xl p-5 group cursor-pointer block transition-colors hover:bg-white/5",
                  gov.trend === 'up' ? "border-emerald-500/20" : gov.trend === 'down' ? "border-red-500/20" : "border-border/50"
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs border",
                    gov.coalition === 'Kenya Kwanza' ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                    gov.coalition === 'Azimio' ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-white/5 border-white/10 text-slate-400"
                  )}>
                    {gov.coalition}
                  </span>
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-xs border flex items-center gap-1",
                    gov.trend === 'up' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" :
                    gov.trend === 'down' ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-white/5 border-white/10 text-slate-400"
                  )}>
                    {getTrendIcon(gov.trend)}
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-100 leading-tight mb-1">{gov.name}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <MapPin className="w-3 h-3" />
                  {gov.county} County
                </div>
                <p className="text-xs text-slate-400 mb-3">{gov.party} • {gov.region}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Sentiment</span>
                    <span className="text-slate-200">{gov.sentiment}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full relative overflow-hidden">
                    <div
                      className={cn("h-full absolute top-0 left-0 rounded-full", getSentimentColor(gov.sentiment))}
                      style={{ width: `${gov.sentiment}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {gov.keyIssues.slice(0, 2).map((issue, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs">
                      {issue}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-2xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-3 text-xs text-slate-400 font-bold">County</th>
                  <th className="text-left p-3 text-xs text-slate-400 font-bold">Governor</th>
                  <th className="text-left p-3 text-xs text-slate-400 font-bold">Party</th>
                  <th className="text-left p-3 text-xs text-slate-400 font-bold">Coalition</th>
                  <th className="text-left p-3 text-xs text-slate-400 font-bold">Region</th>
                  <th className="text-left p-3 text-xs text-slate-400 font-bold">Sentiment</th>
                  <th className="text-left p-3 text-xs text-slate-400 font-bold">Trend</th>
                </tr>
              </thead>
              <tbody>
                {filteredGovernors.map((gov) => (
                  <tr
                    key={gov.id}
                    className="border-b border-border/50 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/governors/${gov.county.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                  >
                    <td className="p-3 text-sm font-bold" style={{ color: '#34d399' }}>{gov.county}</td>
                    <td className="p-3 text-sm text-slate-200">{gov.name}</td>
                    <td className="p-3 text-sm text-slate-200">{gov.party}</td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs border",
                        gov.coalition === 'Kenya Kwanza' ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                        gov.coalition === 'Azimio' ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-white/5 border-white/10 text-slate-400"
                      )}>
                        {gov.coalition}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-slate-200">{gov.region}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-white/5 rounded-full relative overflow-hidden">
                          <div
                            className={cn("h-full absolute top-0 left-0 rounded-full", getSentimentColor(gov.sentiment))}
                            style={{ width: `${gov.sentiment}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-200">{gov.sentiment}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border",
                        gov.trend === 'up' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" :
                        gov.trend === 'down' ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-white/5 border-white/10 text-slate-400"
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
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-300 mb-3">Party Breakdown</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={partyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="party" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="count" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
