import { useState, useMemo } from 'react';
import { Link } from 'wouter';

import { Button } from '@/components/ui/button';
import {
  womenReps,
  getCoalitionStats,
  getRegionStats,
  getPartyStats,
  WomanRep
} from '@/lib/kenya/women-reps-data';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  MapPin,
  Building2,
  LayoutGrid,
  List,
  ArrowUpRight,
  Vote
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function WomenRepsAgent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [coalitionFilter, setCoalitionFilter] = useState<string>('all');
  const [partyFilter, setPartyFilter] = useState<string>('all');
  const [trendFilter, setTrendFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const coalitionStats = getCoalitionStats();
  const regionStats = getRegionStats();
  const partyStats = getPartyStats();

  const regions = ['Coast', 'North Eastern', 'Eastern', 'Central', 'Rift Valley', 'Western', 'Nyanza', 'Nairobi'];
  const parties = Array.from(new Set(womenReps.map(rep => rep.party))).sort();

  const filteredReps = useMemo(() => {
    return womenReps.filter(rep => {
      const matchesSearch = rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           rep.county.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = regionFilter === 'all' || rep.region === regionFilter;
      const matchesCoalition = coalitionFilter === 'all' || rep.coalition === coalitionFilter;
      const matchesParty = partyFilter === 'all' || rep.party === partyFilter;
      const matchesTrend = trendFilter === 'all' || rep.trend === trendFilter;
      return matchesSearch && matchesRegion && matchesCoalition && matchesParty && matchesTrend;
    });
  }, [searchTerm, regionFilter, coalitionFilter, partyFilter, trendFilter]);

  const coalitionChartData = [
    { name: 'Kenya Kwanza', value: coalitionStats.kenyaKwanza, color: '#EAB308' },
    { name: 'Azimio', value: coalitionStats.azimio, color: '#3B82F6' }
  ];

  const chartTooltipStyle = {
    backgroundColor: '#0d1525',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#e2e8f0'
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" style={{ color: '#34d399' }} />;
      case 'down': return <TrendingDown className="w-4 h-4" style={{ color: '#f87171' }} />;
      default: return <Minus className="w-4 h-4 text-slate-500" />;
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 55) return 'text-emerald-400';
    if (sentiment >= 45) return 'text-amber-400';
    return 'text-red-400';
  };

  const getSentimentBg = (sentiment: number) => {
    if (sentiment >= 55) return 'bg-emerald-500';
    if (sentiment >= 45) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getCountySlug = (county: string) => {
    return county.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-100">Women Representatives</h1>
            <p className="text-slate-400 text-sm mt-1">
              Tracking sentiment for all 47 county Women Representatives
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs">
            47 Women Reps
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20">
                <Users className="w-5 h-5" style={{ color: '#f472b6' }} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Women Reps</p>
                <p className="text-2xl font-bold text-slate-100">47</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-amber-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Vote className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Kenya Kwanza</p>
                <p className="text-2xl font-bold text-amber-300">{coalitionStats.kenyaKwanza}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-indigo-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Vote className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Azimio</p>
                <p className="text-2xl font-bold text-indigo-300">{coalitionStats.azimio}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-emerald-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" style={{ color: '#34d399' }} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Avg Sentiment</p>
                <p className="text-2xl font-bold text-slate-100">
                  {Math.round(womenReps.reduce((sum, rep) => sum + rep.sentiment, 0) / womenReps.length)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <p className="text-sm font-bold text-slate-300 mb-3">Coalition Distribution</p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={coalitionChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {coalitionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <p className="text-sm font-bold text-slate-300 mb-3">Regional Distribution</p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionStats} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <YAxis dataKey="region" type="category" width={80} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="#f472b6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                placeholder="Search by name or county..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
            >
              <option value="all">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>

            <select
              value={coalitionFilter}
              onChange={(e) => setCoalitionFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
            >
              <option value="all">All Coalitions</option>
              <option value="Kenya Kwanza">Kenya Kwanza</option>
              <option value="Azimio">Azimio</option>
            </select>

            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
            >
              <option value="all">All Parties</option>
              {parties.map(party => (
                <option key={party} value={party}>{party}</option>
              ))}
            </select>

            <select
              value={trendFilter}
              onChange={(e) => setTrendFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
            >
              <option value="all">All Trends</option>
              <option value="up">Trending Up</option>
              <option value="down">Trending Down</option>
              <option value="stable">Stable</option>
            </select>

            <div className="flex gap-1 rounded-xl overflow-hidden border border-border/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-slate-100' : 'bg-card text-slate-400 hover:bg-white/5'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 transition-colors border-l border-border/50 ${viewMode === 'table' ? 'bg-white/10 text-slate-100' : 'bg-card text-slate-400 hover:bg-white/5'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-slate-400">
          Showing {filteredReps.length} of {womenReps.length} Women Representatives
        </div>

        {/* Women Reps Grid/Table */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredReps.map((rep) => (
              <Link key={rep.id} href={`/kenya/woman-rep/${getCountySlug(rep.county)}`}>
                <div className="bg-card border border-border/50 rounded-2xl p-5 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-slate-100 truncate">{rep.name}</h3>
                      <p className="text-xs text-slate-400">{rep.county} County</p>
                    </div>
                    {getTrendIcon(rep.trend)}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${
                      rep.coalition === 'Kenya Kwanza'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                    }`}>
                      {rep.coalition === 'Kenya Kwanza' ? 'KK' : 'AZ'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-slate-300">
                      {rep.party}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-pink-500/10 border border-pink-500/20 text-pink-300">
                      {rep.region}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Sentiment</span>
                      <span className={`font-bold ${getSentimentColor(rep.sentiment)}`}>
                        {rep.sentiment}%
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${getSentimentBg(rep.sentiment)}`}
                        style={{ width: `${rep.sentiment}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Approval</span>
                      <span className="font-bold text-slate-200">{rep.approvalRating}%</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-slate-400 mb-1">Key Issues:</p>
                    <div className="flex flex-wrap gap-1">
                      {rep.keyIssues.slice(0, 2).map((issue, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-border/50">
                  <tr>
                    <th className="text-left p-3 text-xs text-slate-400 font-bold">#</th>
                    <th className="text-left p-3 text-xs text-slate-400 font-bold">Name</th>
                    <th className="text-left p-3 text-xs text-slate-400 font-bold">County</th>
                    <th className="text-left p-3 text-xs text-slate-400 font-bold">Party</th>
                    <th className="text-left p-3 text-xs text-slate-400 font-bold">Coalition</th>
                    <th className="text-left p-3 text-xs text-slate-400 font-bold">Region</th>
                    <th className="text-center p-3 text-xs text-slate-400 font-bold">Sentiment</th>
                    <th className="text-center p-3 text-xs text-slate-400 font-bold">Approval</th>
                    <th className="text-center p-3 text-xs text-slate-400 font-bold">Trend</th>
                    <th className="text-center p-3 text-xs text-slate-400 font-bold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReps.map((rep, index) => (
                    <tr key={rep.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                      <td className="p-3 text-sm text-slate-400">{index + 1}</td>
                      <td className="p-3 text-sm font-bold text-slate-200">{rep.name}</td>
                      <td className="p-3 text-sm text-slate-200">{rep.county}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-slate-300">
                          {rep.party}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${
                          rep.coalition === 'Kenya Kwanza'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                        }`}>
                          {rep.coalition}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-slate-200">{rep.region}</td>
                      <td className="p-3 text-center">
                        <span className={`font-bold ${getSentimentColor(rep.sentiment)}`}>
                          {rep.sentiment}%
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-200">{rep.approvalRating}%</td>
                      <td className="p-3 text-center">{getTrendIcon(rep.trend)}</td>
                      <td className="p-3 text-center">
                        <Link href={`/kenya/woman-rep/${getCountySlug(rep.county)}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-400 hover:text-slate-200">
                            <ArrowUpRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Party Stats */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-300 mb-3">Party Representation</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {partyStats.map(({ party, count }) => (
              <div key={party} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-xs text-slate-400">{party}</p>
                <p className="text-xl font-bold text-slate-100">{count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
