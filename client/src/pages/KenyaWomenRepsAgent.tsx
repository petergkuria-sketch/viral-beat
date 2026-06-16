import { useState, useMemo } from 'react';
import { Link } from 'wouter';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 55) return 'text-green-500';
    if (sentiment >= 45) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getCountySlug = (county: string) => {
    return county.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b-4 border-black pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-mono font-bold tracking-tight">WOMEN REPRESENTATIVES</h1>
              <p className="text-muted-foreground font-mono text-sm mt-1">
                Tracking sentiment for all 47 county Women Representatives
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-pink-100 text-pink-800 font-mono text-xs font-bold border-2 border-pink-800">
                47 WOMEN REPS
              </span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-black">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 border-2 border-pink-800">
                  <Users className="w-5 h-5 text-pink-800" />
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground">TOTAL WOMEN REPS</p>
                  <p className="text-2xl font-mono font-bold">47</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 border-2 border-yellow-600">
                  <Vote className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground">KENYA KWANZA</p>
                  <p className="text-2xl font-mono font-bold">{coalitionStats.kenyaKwanza}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 border-2 border-blue-600">
                  <Vote className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground">AZIMIO</p>
                  <p className="text-2xl font-mono font-bold">{coalitionStats.azimio}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 border-2 border-green-600">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground">AVG SENTIMENT</p>
                  <p className="text-2xl font-mono font-bold">
                    {Math.round(womenReps.reduce((sum, rep) => sum + rep.sentiment, 0) / womenReps.length)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coalition Distribution */}
          <Card className="border-2 border-black">
            <CardHeader className="border-b-2 border-black bg-gray-50 py-3">
              <CardTitle className="font-mono text-sm">COALITION DISTRIBUTION</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Regional Distribution */}
          <Card className="border-2 border-black">
            <CardHeader className="border-b-2 border-black bg-gray-50 py-3">
              <CardTitle className="font-mono text-sm">REGIONAL DISTRIBUTION</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionStats} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="region" type="category" width={80} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#EC4899" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-2 border-black">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or county..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 font-mono border-2 border-black"
                />
              </div>

              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[150px] font-mono border-2 border-black">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={coalitionFilter} onValueChange={setCoalitionFilter}>
                <SelectTrigger className="w-[160px] font-mono border-2 border-black">
                  <Vote className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Coalition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coalitions</SelectItem>
                  <SelectItem value="Kenya Kwanza">Kenya Kwanza</SelectItem>
                  <SelectItem value="Azimio">Azimio</SelectItem>
                </SelectContent>
              </Select>

              <Select value={partyFilter} onValueChange={setPartyFilter}>
                <SelectTrigger className="w-[140px] font-mono border-2 border-black">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Party" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parties</SelectItem>
                  {parties.map(party => (
                    <SelectItem key={party} value={party}>{party}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={trendFilter} onValueChange={setTrendFilter}>
                <SelectTrigger className="w-[130px] font-mono border-2 border-black">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Trend" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trends</SelectItem>
                  <SelectItem value="up">Trending Up</SelectItem>
                  <SelectItem value="down">Trending Down</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1 border-2 border-black">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="font-mono text-sm text-muted-foreground">
          Showing {filteredReps.length} of {womenReps.length} Women Representatives
        </div>

        {/* Women Reps Grid/Table */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredReps.map((rep) => (
              <Link key={rep.id} href={`/women-reps/${getCountySlug(rep.county)}`}>
                <Card className="border-2 border-black hover:border-pink-500 hover:shadow-lg transition-all cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-mono font-bold text-sm truncate">{rep.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{rep.county} County</p>
                      </div>
                      {getTrendIcon(rep.trend)}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className={`px-2 py-0.5 text-xs font-mono font-bold border ${
                        rep.coalition === 'Kenya Kwanza' 
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-600' 
                          : 'bg-blue-100 text-blue-800 border-blue-600'
                      }`}>
                        {rep.coalition === 'Kenya Kwanza' ? 'KK' : 'AZ'}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 border border-gray-400">
                        {rep.party}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-mono bg-pink-50 text-pink-700 border border-pink-300">
                        {rep.region}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-muted-foreground">Sentiment</span>
                        <span className={`font-mono font-bold ${getSentimentColor(rep.sentiment)}`}>
                          {rep.sentiment}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-2">
                        <div 
                          className={`h-2 ${
                            rep.sentiment >= 55 ? 'bg-green-500' : 
                            rep.sentiment >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${rep.sentiment}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-muted-foreground">Approval</span>
                        <span className="font-mono font-bold">{rep.approvalRating}%</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-mono text-muted-foreground mb-1">Key Issues:</p>
                      <div className="flex flex-wrap gap-1">
                        {rep.keyIssues.slice(0, 2).map((issue, idx) => (
                          <span key={idx} className="text-xs font-mono bg-gray-50 px-1 border">
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-black overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-black">
                  <tr>
                    <th className="text-left p-3 font-mono text-xs">#</th>
                    <th className="text-left p-3 font-mono text-xs">NAME</th>
                    <th className="text-left p-3 font-mono text-xs">COUNTY</th>
                    <th className="text-left p-3 font-mono text-xs">PARTY</th>
                    <th className="text-left p-3 font-mono text-xs">COALITION</th>
                    <th className="text-left p-3 font-mono text-xs">REGION</th>
                    <th className="text-center p-3 font-mono text-xs">SENTIMENT</th>
                    <th className="text-center p-3 font-mono text-xs">APPROVAL</th>
                    <th className="text-center p-3 font-mono text-xs">TREND</th>
                    <th className="text-center p-3 font-mono text-xs">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReps.map((rep, index) => (
                    <tr key={rep.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3 font-mono text-sm">{index + 1}</td>
                      <td className="p-3 font-mono text-sm font-bold">{rep.name}</td>
                      <td className="p-3 font-mono text-sm">{rep.county}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 border">
                          {rep.party}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-xs font-mono font-bold border ${
                          rep.coalition === 'Kenya Kwanza' 
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-600' 
                            : 'bg-blue-100 text-blue-800 border-blue-600'
                        }`}>
                          {rep.coalition}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-sm">{rep.region}</td>
                      <td className="p-3 text-center">
                        <span className={`font-mono font-bold ${getSentimentColor(rep.sentiment)}`}>
                          {rep.sentiment}%
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono">{rep.approvalRating}%</td>
                      <td className="p-3 text-center">{getTrendIcon(rep.trend)}</td>
                      <td className="p-3 text-center">
                        <Link href={`/women-reps/${getCountySlug(rep.county)}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <ArrowUpRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Party Stats */}
        <Card className="border-2 border-black">
          <CardHeader className="border-b-2 border-black bg-gray-50 py-3">
            <CardTitle className="font-mono text-sm">PARTY REPRESENTATION</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {partyStats.map(({ party, count }) => (
                <div key={party} className="p-3 border-2 border-black bg-gray-50">
                  <p className="font-mono text-xs text-muted-foreground">{party}</p>
                  <p className="font-mono text-xl font-bold">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
