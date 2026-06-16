import { Link, useParams } from 'wouter';
import { ArrowLeft, MapPin, Users, Vote, FileText, Megaphone, TrendingUp, TrendingDown, Minus, Calendar, Scale, Heart, Briefcase, Award, Clock, ExternalLink } from 'lucide-react';
import { getWomanRepByCounty, WomanRep } from '@/lib/kenya/women-reps-data';
import { governors } from '@/lib/kenya/governors-data';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

// Generate mock legislative record for a Woman Rep
const generateLegislativeRecord = (rep: WomanRep) => {
  const billTypes = ['Healthcare', 'Education', 'Women Rights', 'Youth Employment', 'Agriculture', 'Infrastructure', 'Social Welfare', 'Gender Equality'];
  const statuses = ['Passed', 'Pending', 'In Committee', 'Second Reading'];
  
  const bills = Array.from({ length: 5 + Math.floor(Math.random() * 5) }, (_, i) => ({
    id: i + 1,
    title: `${rep.county} ${billTypes[i % billTypes.length]} ${['Enhancement', 'Development', 'Protection', 'Empowerment'][i % 4]} Bill`,
    type: billTypes[i % billTypes.length],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    date: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Math.floor(Math.random() * 12)]} 2024`,
    coSponsors: Math.floor(Math.random() * 15) + 3,
  }));

  const motions = Array.from({ length: 3 + Math.floor(Math.random() * 4) }, (_, i) => ({
    id: i + 1,
    title: `Motion on ${['Gender-Based Violence', 'Maternal Healthcare', 'Girl Child Education', 'Women Economic Empowerment', 'Youth Unemployment', 'County Development'][i % 6]}`,
    outcome: Math.random() > 0.3 ? 'Carried' : 'Defeated',
    date: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Math.floor(Math.random() * 12)]} 2024`,
    votes: { for: Math.floor(Math.random() * 150) + 100, against: Math.floor(Math.random() * 80) + 20 },
  }));

  const votingRecord = {
    totalVotes: Math.floor(Math.random() * 50) + 150,
    attendance: Math.floor(Math.random() * 15) + 80,
    withGovernment: Math.floor(Math.random() * 30) + 50,
    withOpposition: Math.floor(Math.random() * 30) + 20,
  };

  return { bills, motions, votingRecord };
};

// Generate mock constituency engagement data
const generateConstituencyEngagement = (rep: WomanRep) => {
  const events = [
    { type: 'Town Hall', count: Math.floor(Math.random() * 10) + 5 },
    { type: 'Women Groups', count: Math.floor(Math.random() * 20) + 15 },
    { type: 'Youth Forums', count: Math.floor(Math.random() * 15) + 8 },
    { type: 'School Visits', count: Math.floor(Math.random() * 25) + 20 },
    { type: 'Health Camps', count: Math.floor(Math.random() * 8) + 3 },
  ];

  const projects = [
    { name: `${rep.county} Women Empowerment Fund`, status: 'Active', beneficiaries: Math.floor(Math.random() * 5000) + 2000, budget: `KES ${Math.floor(Math.random() * 50) + 20}M` },
    { name: 'Bursary Program', status: 'Active', beneficiaries: Math.floor(Math.random() * 3000) + 1500, budget: `KES ${Math.floor(Math.random() * 30) + 15}M` },
    { name: 'Maternal Healthcare Initiative', status: 'Ongoing', beneficiaries: Math.floor(Math.random() * 2000) + 800, budget: `KES ${Math.floor(Math.random() * 20) + 10}M` },
    { name: 'Youth Skills Training', status: 'Completed', beneficiaries: Math.floor(Math.random() * 1500) + 500, budget: `KES ${Math.floor(Math.random() * 15) + 5}M` },
  ];

  return { events, projects };
};

// Generate mock news mentions
const generateNewsMentions = (rep: WomanRep) => {
  const sources = ['Nation Africa', 'The Standard', 'Citizen Digital', 'KTN News', 'K24 TV'];
  const sentiments = ['positive', 'neutral', 'negative'] as const;
  
  const headlines = [
    `${rep.name} launches new ${rep.keyIssues[0]} initiative in ${rep.county}`,
    `${rep.county} Woman Rep addresses ${rep.keyIssues[1]} concerns`,
    `${rep.name} sponsors bill on ${rep.keyIssues[0]}`,
    `${rep.party} coalition meeting: ${rep.name} in attendance`,
    `${rep.county} residents praise ${rep.name}'s ${rep.keyIssues[2] || rep.keyIssues[0]} efforts`,
    `Opposition criticizes ${rep.county} Woman Rep's stance on Finance Bill`,
    `${rep.name} meets with women groups in ${rep.county}`,
    `${rep.county} Woman Rep calls for increased healthcare funding`,
  ];

  return headlines.slice(0, 6).map((headline, i) => ({
    id: i + 1,
    headline,
    source: sources[i % sources.length],
    time: ['2h ago', '5h ago', '8h ago', '12h ago', '1d ago', '2d ago'][i],
    sentiment: sentiments[Math.floor(Math.random() * 3)],
    url: '#',
  }));
};

// Generate approval rating history
const generateApprovalHistory = (currentRating: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month, i) => ({
    month,
    rating: Math.max(20, Math.min(90, currentRating + (Math.random() - 0.5) * 20 - (11 - i) * 0.5)),
  }));
};

export default function WomanRepDetail() {
  const { county } = useParams<{ county: string }>();
  const rep = getWomanRepByCounty(county || '');
  const governor = governors.find(g => g.county.toLowerCase().replace(/['\s-]/g, '') === county?.toLowerCase().replace(/['\s-]/g, ''));

  if (!rep) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-mono font-bold text-foreground mb-4">WOMAN REP NOT FOUND</h1>
          <p className="text-muted-foreground mb-6">No Woman Representative found for "{county}"</p>
          <Link href="/women-reps" className="text-primary hover:underline font-mono">
            ← Back to Women Reps Agent
          </Link>
        </div>
      </div>
    );
  }

  const legislative = generateLegislativeRecord(rep);
  const engagement = generateConstituencyEngagement(rep);
  const news = generateNewsMentions(rep);
  const approvalHistory = generateApprovalHistory(rep.approvalRating);

  const TrendIcon = rep.trend === 'up' ? TrendingUp : rep.trend === 'down' ? TrendingDown : Minus;
  const trendColor = rep.trend === 'up' ? 'text-green-500' : rep.trend === 'down' ? 'text-red-500' : 'text-yellow-500';

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Back Navigation */}
        <Link href="/women-reps" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 font-mono text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Women Reps
        </Link>

        {/* Header Section */}
        <div className="border-2 border-border bg-card p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2 py-1 text-xs font-mono ${rep.coalition === 'Kenya Kwanza' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500' : 'bg-blue-500/20 text-blue-600 border border-blue-500'}`}>
                  {rep.coalition}
                </span>
                <span className="px-2 py-1 text-xs font-mono bg-muted text-muted-foreground border border-border">
                  {rep.party}
                </span>
                <span className="px-2 py-1 text-xs font-mono bg-pink-500/20 text-pink-600 border border-pink-500">
                  {rep.county}
                </span>
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-mono font-bold text-foreground mb-2 tracking-tight">
                {rep.name.toUpperCase()}
              </h1>
              
              <p className="text-muted-foreground font-mono flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4" />
                Woman Representative, {rep.county} County
              </p>

              {/* Key Issues */}
              <div className="mb-4">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Key Issues:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {rep.keyIssues.map((issue, i) => (
                    <span key={i} className="px-3 py-1 text-sm font-mono bg-background border border-border">
                      {issue}
                    </span>
                  ))}
                </div>
              </div>

              {/* Term Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Term: {rep.termStart} - 2027
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {rep.region} Region
                </span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 lg:w-80">
              <div className="border-2 border-border p-4 text-center">
                <div className="text-3xl font-mono font-bold text-foreground">{rep.sentiment}%</div>
                <div className="text-xs font-mono text-muted-foreground uppercase">Sentiment</div>
                <div className={`flex items-center justify-center gap-1 mt-1 ${trendColor}`}>
                  <TrendIcon className="w-4 h-4" />
                  <span className="text-xs font-mono capitalize">{rep.trend}</span>
                </div>
              </div>
              <div className="border-2 border-border p-4 text-center">
                <div className="text-3xl font-mono font-bold text-foreground">{rep.approvalRating}%</div>
                <div className="text-xs font-mono text-muted-foreground uppercase">Approval</div>
              </div>
              <div className="border-2 border-border p-4 text-center">
                <div className="text-3xl font-mono font-bold text-foreground">{legislative.bills.length}</div>
                <div className="text-xs font-mono text-muted-foreground uppercase">Bills</div>
              </div>
              <div className="border-2 border-border p-4 text-center">
                <div className="text-3xl font-mono font-bold text-foreground">{legislative.votingRecord.attendance}%</div>
                <div className="text-xs font-mono text-muted-foreground uppercase">Attendance</div>
              </div>
            </div>
          </div>
        </div>

        {/* County Governor Link */}
        {governor && (
          <div className="border-2 border-pink-500/30 bg-pink-500/5 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-pink-600 uppercase tracking-wider">County Governor</span>
                <p className="font-mono font-bold text-foreground">{governor.name}</p>
                <p className="text-sm text-muted-foreground font-mono">{governor.party} • {governor.coalition}</p>
              </div>
              <Link href={`/governors/${county}`} className="px-4 py-2 border-2 border-pink-500 text-pink-600 font-mono text-sm hover:bg-pink-500 hover:text-white transition-colors">
                View Governor Profile →
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Legislative Record */}
          <div className="lg:col-span-2 space-y-6">
            {/* Approval Rating History */}
            <div className="border-2 border-border bg-card p-6">
              <h2 className="font-mono font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                APPROVAL RATING HISTORY (2025)
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={approvalHistory}>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip 
                      contentStyle={{ fontFamily: 'monospace', fontSize: 12, border: '2px solid #333' }}
                      formatter={(value: number) => [`${value.toFixed(0)}%`, 'Rating']}
                    />
                    <Line type="monotone" dataKey="rating" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bills Sponsored */}
            <div className="border-2 border-border bg-card p-6">
              <h2 className="font-mono font-bold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                BILLS SPONSORED
              </h2>
              <div className="space-y-3">
                {legislative.bills.map((bill) => (
                  <div key={bill.id} className="border border-border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-mono font-medium text-foreground">{bill.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs font-mono text-muted-foreground">{bill.type}</span>
                          <span className="text-xs font-mono text-muted-foreground">•</span>
                          <span className="text-xs font-mono text-muted-foreground">{bill.coSponsors} co-sponsors</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-mono ${
                          bill.status === 'Passed' ? 'bg-green-500/20 text-green-600 border border-green-500' :
                          bill.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500' :
                          'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {bill.status}
                        </span>
                        <p className="text-xs font-mono text-muted-foreground mt-2">{bill.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motions */}
            <div className="border-2 border-border bg-card p-6">
              <h2 className="font-mono font-bold text-lg mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                MOTIONS MOVED
              </h2>
              <div className="space-y-3">
                {legislative.motions.map((motion) => (
                  <div key={motion.id} className="border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-mono font-medium text-foreground">{motion.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs font-mono text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Vote className="w-3 h-3" />
                            For: {motion.votes.for} | Against: {motion.votes.against}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-mono ${
                          motion.outcome === 'Carried' ? 'bg-green-500/20 text-green-600 border border-green-500' :
                          'bg-red-500/20 text-red-600 border border-red-500'
                        }`}>
                          {motion.outcome}
                        </span>
                        <p className="text-xs font-mono text-muted-foreground mt-2">{motion.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voting Record */}
            <div className="border-2 border-border bg-card p-6">
              <h2 className="font-mono font-bold text-lg mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5" />
                VOTING RECORD
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 border border-border">
                  <div className="text-2xl font-mono font-bold text-foreground">{legislative.votingRecord.totalVotes}</div>
                  <div className="text-xs font-mono text-muted-foreground uppercase">Total Votes</div>
                </div>
                <div className="text-center p-4 bg-muted/50 border border-border">
                  <div className="text-2xl font-mono font-bold text-green-600">{legislative.votingRecord.attendance}%</div>
                  <div className="text-xs font-mono text-muted-foreground uppercase">Attendance</div>
                </div>
                <div className="text-center p-4 bg-muted/50 border border-border">
                  <div className="text-2xl font-mono font-bold text-yellow-600">{legislative.votingRecord.withGovernment}%</div>
                  <div className="text-xs font-mono text-muted-foreground uppercase">With Gov't</div>
                </div>
                <div className="text-center p-4 bg-muted/50 border border-border">
                  <div className="text-2xl font-mono font-bold text-blue-600">{legislative.votingRecord.withOpposition}%</div>
                  <div className="text-xs font-mono text-muted-foreground uppercase">With Opposition</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Engagement & News */}
          <div className="space-y-6">
            {/* Constituency Engagement */}
            <div className="border-2 border-border bg-card p-6">
              <h2 className="font-mono font-bold text-lg mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                CONSTITUENCY ENGAGEMENT
              </h2>
              <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagement.events} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis dataKey="type" type="category" tick={{ fontSize: 10, fontFamily: 'monospace' }} width={80} />
                    <Tooltip contentStyle={{ fontFamily: 'monospace', fontSize: 12, border: '2px solid #333' }} />
                    <Bar dataKey="count" fill="#ec4899">
                      {engagement.events.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3'][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs font-mono text-muted-foreground text-center">
                Events in 2024-2025
              </div>
            </div>

            {/* Constituency Projects */}
            <div className="border-2 border-border bg-card p-6">
              <h2 className="font-mono font-bold text-lg mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                CONSTITUENCY PROJECTS
              </h2>
              <div className="space-y-3">
                {engagement.projects.map((project, i) => (
                  <div key={i} className="border border-border p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-mono text-sm font-medium text-foreground">{project.name}</h4>
                      <span className={`px-2 py-0.5 text-xs font-mono ${
                        project.status === 'Active' ? 'bg-green-500/20 text-green-600' :
                        project.status === 'Completed' ? 'bg-blue-500/20 text-blue-600' :
                        'bg-yellow-500/20 text-yellow-600'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-mono text-muted-foreground">
                      <span>{project.beneficiaries.toLocaleString()} beneficiaries</span>
                      <span>{project.budget}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent News Mentions */}
            <div className="border-2 border-border bg-card p-6">
              <h2 className="font-mono font-bold text-lg mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                RECENT NEWS MENTIONS
              </h2>
              <div className="space-y-3">
                {news.map((item) => (
                  <div key={item.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <h4 className="font-mono text-sm text-foreground hover:text-primary cursor-pointer line-clamp-2">
                      {item.headline}
                    </h4>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{item.source}</span>
                        <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-mono ${
                        item.sentiment === 'positive' ? 'bg-green-500/20 text-green-600' :
                        item.sentiment === 'negative' ? 'bg-red-500/20 text-red-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {item.sentiment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Women Reps in Region */}
            <div className="border-2 border-border bg-card p-6">
              <h2 className="font-mono font-bold text-sm mb-4 text-muted-foreground">
                Other {rep.region} Region Women Reps
              </h2>
              <div className="space-y-2">
                {/* This would show other women reps from the same region */}
                <p className="text-xs font-mono text-muted-foreground">
                  View all Women Representatives from {rep.region} region in the Women Reps Agent.
                </p>
                <Link href={`/women-reps?region=${encodeURIComponent(rep.region)}`} className="text-xs font-mono text-primary hover:underline flex items-center gap-1">
                  View Region <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
