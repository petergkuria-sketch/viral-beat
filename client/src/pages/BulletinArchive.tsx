import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AFRICAN_COUNTRIES } from "@shared/africanCountries";
import { BookOpen, Calendar, ArrowRight, TrendingUp, Zap, Users, Leaf } from "lucide-react";
import { BackToDashboard } from "@/components/BackToDashboard";

function issueLabel(slug: string) {
  const [y, m] = slug.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function StatPill({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-cyan-400 shrink-0" />
      <span className="text-sm font-bold text-white">{value}</span>
      <span className="text-xs text-white/40">{label}</span>
    </div>
  );
}

export default function BulletinArchive() {
  const [, setLocation] = useLocation();
  const { data: issues, isLoading } = trpc.bulletins.list.useQuery({ limit: 50 });

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">

      {/* Header */}
      <div className="border-b border-white/5 bg-[#080d1a]">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <BackToDashboard />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs font-bold tracking-[2px] text-cyan-400 uppercase">Africa Intelligence Bulletin</span>
          </div>
          <h1 className="text-3xl font-black mb-2">Newsletter archive</h1>
          <p className="text-white/50 text-sm max-w-lg">
            Every issue of the monthly Africa Intelligence Bulletin — PESTEL shifts, verdict changes, field signals, and GIaaS green investment spotlights across all 55 nations.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 bg-white/[0.03] rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (!issues || issues.length === 0) && (
          <div className="text-center py-24">
            <BookOpen className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">No bulletins published yet.</p>
            <p className="text-white/20 text-xs mt-1">The first issue will appear here once published.</p>
          </div>
        )}

        {issues && issues.length > 0 && (
          <div className="space-y-4">
            {issues.map((issue, idx) => {
              const stats = issue.stats as Record<string, number> | null;
              const countries = (issue.coverCountries as string[] | null) ?? [];
              const flags = countries.slice(0, 5).map(iso3 =>
                AFRICAN_COUNTRIES.find(c => c.iso3 === iso3)?.flag ?? "🌍"
              );

              return (
                <button
                  key={issue.id}
                  onClick={() => setLocation(`/bulletins/${issue.slug}`)}
                  className="w-full text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/20 rounded-xl p-6 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Issue meta */}
                      <div className="flex items-center gap-3 mb-2">
                        {idx === 0 && (
                          <span className="text-[9px] font-black tracking-[2px] px-2 py-0.5 bg-cyan-500 text-black rounded uppercase">
                            Latest
                          </span>
                        )}
                        <span className="text-xs text-white/30 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {issueLabel(issue.slug)}
                        </span>
                        <span className="text-xs text-white/20">Issue #{issue.issueNumber}</span>
                      </div>

                      {/* Title */}
                      <h2 className="font-bold text-base text-white mb-1.5 truncate">{issue.title}</h2>

                      {/* Summary */}
                      <p className="text-sm text-white/45 line-clamp-2 mb-3">{issue.summary}</p>

                      {/* Stats row */}
                      {stats && (
                        <div className="flex flex-wrap gap-4">
                          {stats.breakingShifts > 0 && <StatPill icon={Zap}       value={stats.breakingShifts} label="breaking shifts" />}
                          {stats.verdictsChanged > 0 && <StatPill icon={TrendingUp} value={stats.verdictsChanged} label="verdicts changed" />}
                          {stats.fieldSignals > 0    && <StatPill icon={Users}      value={stats.fieldSignals}   label="field signals" />}
                          {stats.greenProjects > 0   && <StatPill icon={Leaf}       value={stats.greenProjects}  label="green projects" />}
                        </div>
                      )}

                      {/* Country flags */}
                      {flags.length > 0 && (
                        <div className="flex items-center gap-1 mt-3">
                          {flags.map((f, i) => <span key={i} className="text-base">{f}</span>)}
                          {countries.length > 5 && <span className="text-xs text-white/25 ml-1">+{countries.length - 5} more</span>}
                        </div>
                      )}
                    </div>

                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400 shrink-0 transition-colors mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
