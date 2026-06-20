import { useMemo } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, MapPin, Users, Award, Building2 } from 'lucide-react';
import { getGovernorByCounty } from '@/lib/kenya/governors-data';
import { getSenatorByCounty } from '@/lib/kenya/senators-data';
import { getWomanRepByCounty } from '@/lib/kenya/women-reps-data';

const COALITION_COLOR: Record<string, string> = {
  'Kenya Kwanza': '#dc2626',
  'Azimio': '#f97316',
  'Independent': '#6b7280',
};

export default function KenyaGovernorDetail() {
  const { county } = useParams<{ county: string }>();
  const governor = useMemo(() => getGovernorByCounty(county || ''), [county]);
  const senator = useMemo(() => getSenatorByCounty(county || ''), [county]);
  const womanRep = useMemo(() => getWomanRepByCounty(county || ''), [county]);

  if (!governor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-slate-400 font-mono">Governor not found for county: <strong>{county}</strong></p>
        <Link href="/kenya/governors" className="text-primary hover:underline font-mono text-sm">
          ← Back to Governors
        </Link>
      </div>
    );
  }

  const coalitionColor = COALITION_COLOR[governor.coalition] ?? '#6b7280';
  const approvalColor = governor.approvalRating >= 60 ? '#34d399' : governor.approvalRating >= 40 ? '#fbbf24' : '#f87171';

  // Simulated approval history
  const approvalHistory = useMemo(() => {
    const base = governor.approvalRating;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((m, i) => ({
      month: m,
      rating: Math.min(95, Math.max(15, base + (i - 2) * (governor.trend === 'up' ? 2 : governor.trend === 'down' ? -2 : 0) + (i % 2 === 0 ? 2 : -1))),
    }));
  }, [governor]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/50 px-4 sm:px-8 py-5 bg-card/40">
        <Link href="/kenya/governors" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors font-mono">
          <ArrowLeft className="w-3.5 h-3.5" /> All Governors
        </Link>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black text-white shrink-0"
            style={{ background: coalitionColor }}>
            {governor.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-slate-100">{governor.name}</h1>
            <p className="text-slate-400 font-mono text-sm mt-0.5">Governor · {governor.county} County</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ background: coalitionColor }}>
                {governor.coalition}
              </span>
              <span className="text-xs text-slate-400 font-mono">{governor.party}</span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {governor.region}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-black" style={{ color: approvalColor }}>{governor.approvalRating}%</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">Approval Rating</div>
            <div className="flex items-center justify-end gap-1 mt-1">
              {governor.trend === 'up' ? <TrendingUp className="w-4 h-4 text-emerald-400" /> :
               governor.trend === 'down' ? <TrendingDown className="w-4 h-4 text-red-400" /> :
               <Minus className="w-4 h-4 text-slate-400" />}
              <span className="text-xs font-mono" style={{ color: governor.trend === 'up' ? '#34d399' : governor.trend === 'down' ? '#f87171' : '#94a3b8' }}>
                {governor.trend === 'up' ? 'Rising' : governor.trend === 'down' ? 'Falling' : 'Stable'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Sentiment Score', value: `${governor.sentiment}%`, color: governor.sentiment >= 50 ? '#34d399' : '#fbbf24' },
            { label: 'Approval Rating', value: `${governor.approvalRating}%`, color: approvalColor },
            { label: 'Gender', value: governor.gender, color: '#818cf8' },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border/50 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-mono mb-1">{stat.label}</div>
              <div className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Approval trend */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-200 mb-4">Approval Trend (2024)</h2>
          <div className="flex items-end gap-2 h-24">
            {approvalHistory.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-sm transition-all" style={{ height: `${d.rating}%`, background: approvalColor, opacity: 0.7 + i * 0.05 }} />
                <span className="text-[10px] text-slate-500 font-mono">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key issues */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Key Issues
          </h2>
          <div className="flex flex-wrap gap-2">
            {governor.keyIssues.map(issue => (
              <span key={issue} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 font-mono">
                {issue}
              </span>
            ))}
          </div>
        </div>

        {/* County representatives */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" /> {governor.county} County Leadership
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {senator && (
              <Link href={`/kenya/senator/${governor.county.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-red-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">{senator.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Senator</div>
                </div>
              </Link>
            )}
            {womanRep && (
              <Link href={`/kenya/woman-rep/${governor.county.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-pink-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">{womanRep.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Woman Representative</div>
                </div>
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
