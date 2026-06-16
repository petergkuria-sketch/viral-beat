import { useState, useMemo } from 'react';
import { Link, useParams } from 'wouter';
import { 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Building2,
  Scale,
  Vote,
  FileText,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Newspaper,
  MapPin,
  Calendar,
  Award,
  Briefcase
} from 'lucide-react';
import { 
  getSenatorByCounty, 
  generateVotingRecords, 
  generateCommitteeAssignments,
  VotingRecord,
  CommitteeAssignment
} from '@/lib/kenya/senators-data';
import { getGovernorByCounty } from '@/lib/kenya/governors-data';
import { getWomanRepByCounty } from '@/lib/kenya/women-reps-data';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function SenatorDetail() {
  const { county } = useParams<{ county: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'voting' | 'committees' | 'news'>('overview');
  
  const senator = useMemo(() => getSenatorByCounty(county || ''), [county]);
  const governor = useMemo(() => getGovernorByCounty(county || ''), [county]);
  const womanRep = useMemo(() => getWomanRepByCounty(county || ''), [county]);
  const votingRecords = useMemo(() => generateVotingRecords(county || ''), [county]);
  const committeeAssignments = useMemo(() => generateCommitteeAssignments(county || ''), [county]);
  
  // Generate approval rating history
  const approvalHistory = useMemo(() => {
    if (!senator) return [];
    const baseRating = senator.approvalRating;
    return [
      { month: 'Jan', rating: baseRating - 8 + Math.random() * 5 },
      { month: 'Feb', rating: baseRating - 6 + Math.random() * 5 },
      { month: 'Mar', rating: baseRating - 4 + Math.random() * 5 },
      { month: 'Apr', rating: baseRating - 2 + Math.random() * 5 },
      { month: 'May', rating: baseRating - 1 + Math.random() * 5 },
      { month: 'Jun', rating: baseRating + Math.random() * 3 },
      { month: 'Jul', rating: baseRating + 1 + Math.random() * 3 },
      { month: 'Aug', rating: baseRating + 2 + Math.random() * 3 },
      { month: 'Sep', rating: baseRating + Math.random() * 4 },
      { month: 'Oct', rating: baseRating - 1 + Math.random() * 4 },
      { month: 'Nov', rating: baseRating + Math.random() * 3 },
      { month: 'Dec', rating: baseRating }
    ].map(d => ({ ...d, rating: Math.round(d.rating) }));
  }, [senator]);
  
  // Voting statistics
  const votingStats = useMemo(() => {
    const yes = votingRecords.filter(v => v.vote === 'Yes').length;
    const no = votingRecords.filter(v => v.vote === 'No').length;
    const abstain = votingRecords.filter(v => v.vote === 'Abstain').length;
    const absent = votingRecords.filter(v => v.vote === 'Absent').length;
    return [
      { name: 'Yes', value: yes, color: '#22c55e' },
      { name: 'No', value: no, color: '#ef4444' },
      { name: 'Abstain', value: abstain, color: '#f59e0b' },
      { name: 'Absent', value: absent, color: '#6b7280' }
    ];
  }, [votingRecords]);
  
  // Mock news mentions
  const newsMentions = useMemo(() => {
    if (!senator) return [];
    return [
      {
        title: `Senator ${senator.name} Pushes for ${senator.keyIssues[0]} Reforms`,
        source: 'Nation Africa',
        date: '2024-12-28',
        sentiment: 'positive' as const,
        excerpt: `${senator.county} Senator advocates for improved policies affecting local communities...`
      },
      {
        title: `${senator.county} County Receives Boost in Budget Allocation`,
        source: 'The Standard',
        date: '2024-12-20',
        sentiment: 'positive' as const,
        excerpt: `Senator ${senator.name} celebrates increased funding for county development projects...`
      },
      {
        title: `Senate Debate: ${senator.name} Questions Government Policy`,
        source: 'Citizen Digital',
        date: '2024-12-15',
        sentiment: 'neutral' as const,
        excerpt: `The ${senator.party} senator raised concerns during the parliamentary session...`
      },
      {
        title: `${senator.keyIssues[1]} Crisis: Senator Calls for Emergency Action`,
        source: 'KTN News',
        date: '2024-12-10',
        sentiment: 'negative' as const,
        excerpt: `Senator ${senator.name} demands immediate government intervention in ${senator.county}...`
      },
      {
        title: `${senator.coalition} Alliance Meeting in ${senator.region}`,
        source: 'TV47',
        date: '2024-12-05',
        sentiment: 'neutral' as const,
        excerpt: `Coalition leaders including Senator ${senator.name} discuss regional development...`
      }
    ];
  }, [senator]);
  
  if (!senator) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-mono font-bold text-[#1a1a1a] mb-4">SENATOR NOT FOUND</h1>
          <p className="text-[#666] mb-4">No senator data available for this county.</p>
          <Link href="/senate">
            <span className="text-[#dc2626] hover:underline cursor-pointer">← Back to Senate Agent</span>
          </Link>
        </div>
      </div>
    );
  }
  
  const TrendIcon = senator.trend === 'up' ? TrendingUp : senator.trend === 'down' ? TrendingDown : Minus;
  const trendColor = senator.trend === 'up' ? 'text-green-600' : senator.trend === 'down' ? 'text-red-600' : 'text-gray-500';
  
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Header */}
      <header className="bg-[#1a1a1a] text-[#f5f5f0] py-4 border-b-4 border-[#dc2626]">
        <div className="container">
          <Link href="/senate">
            <span className="inline-flex items-center gap-2 text-[#888] hover:text-[#f5f5f0] transition-colors cursor-pointer mb-4">
              <ArrowLeft size={16} />
              <span className="font-mono text-sm">BACK TO SENATE AGENT</span>
            </span>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-20 h-20 bg-[#333] rounded-lg flex items-center justify-center border-2 border-[#dc2626]">
              <Users size={40} className="text-[#dc2626]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-mono font-bold">Sen. {senator.name}</h1>
                <span className={`px-2 py-0.5 text-xs font-mono rounded ${
                  senator.coalition === 'Kenya Kwanza' ? 'bg-yellow-500 text-black' : 'bg-orange-500 text-white'
                }`}>
                  {senator.coalition}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#888]">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {senator.county} County
                </span>
                <span className="flex items-center gap-1">
                  <Building2 size={14} />
                  {senator.party}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {senator.termStart} - {senator.termEnd}
                </span>
              </div>
              {senator.leadershipPosition && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#dc2626] text-white text-xs font-mono rounded">
                    <Award size={12} />
                    {senator.leadershipPosition}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-[#22c55e]">{senator.sentimentScore}%</div>
                <div className="text-xs text-[#888] font-mono">SENTIMENT</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-[#3b82f6]">{senator.approvalRating}%</div>
                <div className="text-xs text-[#888] font-mono">APPROVAL</div>
              </div>
              <div className="text-center">
                <TrendIcon size={32} className={trendColor} />
                <div className="text-xs text-[#888] font-mono uppercase">{senator.trend}</div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation Tabs */}
      <div className="bg-white border-b-2 border-[#1a1a1a]">
        <div className="container">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: Users },
              { id: 'voting', label: 'Voting Record', icon: Vote },
              { id: 'committees', label: 'Committees', icon: Scale },
              { id: 'news', label: 'News Mentions', icon: Newspaper }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 font-mono text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#dc2626] text-[#dc2626] bg-red-50'
                    : 'border-transparent text-[#666] hover:text-[#1a1a1a] hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Info */}
            <div className="space-y-6">
              {/* Key Issues */}
              <div className="bg-white border-2 border-[#1a1a1a] p-4">
                <h3 className="font-mono font-bold text-lg mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-[#dc2626]" />
                  KEY ISSUES
                </h3>
                <div className="flex flex-wrap gap-2">
                  {senator.keyIssues.map((issue, i) => (
                    <span key={i} className="px-3 py-1 bg-[#f5f5f0] border border-[#1a1a1a] text-sm font-mono">
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Previous Role */}
              {senator.previousRole && (
                <div className="bg-white border-2 border-[#1a1a1a] p-4">
                  <h3 className="font-mono font-bold text-lg mb-3 flex items-center gap-2">
                    <Briefcase size={18} className="text-[#dc2626]" />
                    PREVIOUS ROLE
                  </h3>
                  <p className="text-[#666]">{senator.previousRole}</p>
                </div>
              )}
              
              {/* County Representatives */}
              <div className="bg-white border-2 border-[#1a1a1a] p-4">
                <h3 className="font-mono font-bold text-lg mb-3 flex items-center gap-2">
                  <Users size={18} className="text-[#dc2626]" />
                  COUNTY LEADERSHIP
                </h3>
                <div className="space-y-3">
                  {governor && (
                    <Link href={`/governors/${county}`}>
                      <div className="p-3 bg-[#f5f5f0] border border-[#ddd] hover:border-[#dc2626] transition-colors cursor-pointer">
                        <div className="text-xs text-[#888] font-mono mb-1">GOVERNOR</div>
                        <div className="font-medium">{governor.name}</div>
                        <div className="text-sm text-[#666]">{governor.party}</div>
                      </div>
                    </Link>
                  )}
                  {womanRep && (
                    <Link href={`/women-reps/${county}`}>
                      <div className="p-3 bg-[#f5f5f0] border border-[#ddd] hover:border-[#dc2626] transition-colors cursor-pointer">
                        <div className="text-xs text-[#888] font-mono mb-1">WOMAN REP</div>
                        <div className="font-medium">{womanRep.name}</div>
                        <div className="text-sm text-[#666]">{womanRep.party}</div>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
            
            {/* Middle Column - Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Approval Rating History */}
              <div className="bg-white border-2 border-[#1a1a1a] p-4">
                <h3 className="font-mono font-bold text-lg mb-4">APPROVAL RATING HISTORY (2024)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={approvalHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                      <Tooltip 
                        contentStyle={{ 
                          fontFamily: 'monospace', 
                          border: '2px solid #1a1a1a',
                          borderRadius: 0
                        }}
                        formatter={(value: number) => [`${value}%`, 'Approval']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Voting Summary */}
              <div className="bg-white border-2 border-[#1a1a1a] p-4">
                <h3 className="font-mono font-bold text-lg mb-4">VOTING SUMMARY</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={votingStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {votingStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-2">
                    {votingStats.map((stat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: stat.color }} />
                          <span className="font-mono text-sm">{stat.name}</span>
                        </div>
                        <span className="font-mono font-bold">{stat.value}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-[#ddd]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">Total Votes</span>
                        <span className="font-mono font-bold">{votingRecords.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'voting' && (
          <div className="bg-white border-2 border-[#1a1a1a]">
            <div className="p-4 border-b-2 border-[#1a1a1a] bg-[#f5f5f0]">
              <h3 className="font-mono font-bold text-lg flex items-center gap-2">
                <Vote size={18} className="text-[#dc2626]" />
                LEGISLATIVE VOTING RECORD
              </h3>
              <p className="text-sm text-[#666] mt-1">Recent votes on key bills in the Senate</p>
            </div>
            <div className="divide-y divide-[#ddd]">
              {votingRecords.map((record, i) => (
                <VotingRecordRow key={i} record={record} />
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'committees' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {committeeAssignments.map((committee, i) => (
              <CommitteeCard key={i} assignment={committee} />
            ))}
          </div>
        )}
        
        {activeTab === 'news' && (
          <div className="space-y-4">
            {newsMentions.map((news, i) => (
              <NewsCard key={i} news={news} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function VotingRecordRow({ record }: { record: VotingRecord }) {
  const voteConfig = {
    Yes: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    No: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    Abstain: { icon: MinusCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    Absent: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' }
  };
  
  const config = voteConfig[record.vote];
  const VoteIcon = config.icon;
  
  return (
    <div className="p-4 hover:bg-[#f5f5f0] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-medium text-[#1a1a1a]">{record.billName}</h4>
          <p className="text-sm text-[#666] mt-1">{record.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-[#888]">
            <span>{record.date}</span>
            <span className={`px-2 py-0.5 rounded ${
              record.outcome === 'Passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {record.outcome}
            </span>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded ${config.bg}`}>
          <VoteIcon size={16} className={config.color} />
          <span className={`font-mono text-sm font-bold ${config.color}`}>{record.vote}</span>
        </div>
      </div>
    </div>
  );
}

function CommitteeCard({ assignment }: { assignment: CommitteeAssignment }) {
  const roleColors = {
    Chair: 'bg-[#dc2626] text-white',
    'Vice Chair': 'bg-[#f59e0b] text-white',
    Member: 'bg-[#6b7280] text-white'
  };
  
  return (
    <div className="bg-white border-2 border-[#1a1a1a] p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale size={20} className="text-[#dc2626]" />
          <h4 className="font-mono font-bold">{assignment.name}</h4>
        </div>
        <span className={`px-2 py-1 text-xs font-mono rounded ${roleColors[assignment.role]}`}>
          {assignment.role}
        </span>
      </div>
      <p className="text-sm text-[#666]">{assignment.description}</p>
    </div>
  );
}

function NewsCard({ news }: { news: { title: string; source: string; date: string; sentiment: 'positive' | 'neutral' | 'negative'; excerpt: string } }) {
  const sentimentConfig = {
    positive: { color: 'text-green-600', bg: 'bg-green-100', label: 'Positive' },
    neutral: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Neutral' },
    negative: { color: 'text-red-600', bg: 'bg-red-100', label: 'Negative' }
  };
  
  const config = sentimentConfig[news.sentiment];
  
  return (
    <div className="bg-white border-2 border-[#1a1a1a] p-4 hover:border-[#dc2626] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-medium text-[#1a1a1a] hover:text-[#dc2626] cursor-pointer">{news.title}</h4>
          <p className="text-sm text-[#666] mt-2">{news.excerpt}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-[#888]">
            <span className="font-medium">{news.source}</span>
            <span>{news.date}</span>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-mono rounded ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>
    </div>
  );
}
