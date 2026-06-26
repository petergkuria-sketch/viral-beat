import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { AFRICAN_COUNTRIES } from "@shared/africanCountries";
import { ArrowLeft, Calendar, Zap, TrendingUp, Users, Leaf, ExternalLink } from "lucide-react";

const VERDICT_STYLE: Record<string, string> = {
  "go-market": "bg-green-500/10 text-green-400 border border-green-500/25",
  "monitor":   "bg-lime-500/10 text-lime-400 border border-lime-500/25",
  "caution":   "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  "no-go":     "bg-red-500/10 text-red-400 border border-red-500/25",
};

function VerdictChip({ v }: { v: string }) {
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${VERDICT_STYLE[v] ?? "bg-white/10 text-white/50"}`}>
      {v.replace("-", " ")}
    </span>
  );
}

function issueLabel(slug: string) {
  const [y, m] = slug.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default function BulletinIssue() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { data: issue, isLoading, error } = trpc.bulletins.bySlug.useQuery({ slug });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex items-center justify-center">
        <div className="animate-pulse text-white/30 text-sm">Loading issue…</div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-4">
        <p className="text-white/40 text-sm">Issue not found.</p>
        <button onClick={() => setLocation("/bulletins")} className="text-cyan-400 text-sm hover:underline">
          ← Back to archive
        </button>
      </div>
    );
  }

  const stats   = issue.stats as Record<string, number> | null;
  const sections = issue.sections as any;
  const ls = sections?.leadStory;
  const signals: any[]  = sections?.signals ?? [];
  const shifts: any[]   = sections?.verdictShifts ?? [];
  const fields: any[]   = sections?.fieldObservations ?? [];
  const giaas            = sections?.giaasSpotlight;

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">

      {/* Back nav */}
      <div className="border-b border-white/5 bg-[#080d1a] sticky top-0 z-20 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center gap-3">
          <button onClick={() => setLocation("/bulletins")} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Archive
          </button>
          <span className="text-white/15">/</span>
          <span className="text-sm text-white/50 truncate">{issue.title}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Masthead */}
        <div className="bg-[#030712] rounded-xl p-8 mb-8 border border-white/5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-black tracking-[2px] text-cyan-400 uppercase">Africa Intelligence Bulletin</span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-xs text-white/30 flex items-center gap-1"><Calendar className="w-3 h-3" />{issueLabel(issue.slug)}</span>
            <span className="text-xs text-white/20">Issue #{issue.issueNumber}</span>
          </div>
          <h1 className="text-2xl font-black mb-3 leading-tight">{issue.title}</h1>
          <p className="text-white/50 text-sm leading-relaxed mb-6">{issue.summary}</p>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Zap, val: stats.breakingShifts,  label: "Breaking shifts" },
                { icon: Leaf, val: stats.greenProjects,  label: "Green projects" },
                { icon: Users, val: stats.fieldSignals,  label: "Field signals" },
                { icon: TrendingUp, val: stats.verdictsChanged, label: "Verdicts changed" },
              ].map(({ icon: Icon, val, label }) => (
                <div key={label} className="bg-white/[0.04] rounded-lg p-3 text-center">
                  <Icon className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <div className="text-xl font-black text-white">{val ?? 0}</div>
                  <div className="text-[10px] text-white/35 uppercase tracking-wide mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lead story */}
        {ls && (
          <section className="mb-8">
            <h2 className="text-[10px] font-black tracking-[2px] text-white/30 uppercase mb-3">Lead story</h2>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{ls.countryFlag}</span>
                <span className="text-sm font-bold">{ls.country}</span>
                <span className="ml-auto text-xs text-white/25">{ls.source}</span>
              </div>
              <h3 className="text-base font-bold mb-2 leading-snug">{ls.headline}</h3>
              <p className="text-sm text-white/55 leading-relaxed mb-4">{ls.body}</p>
              <div className="flex flex-wrap gap-2">
                {(ls.verdicts ?? []).map((v: string) => <VerdictChip key={v} v={v} />)}
              </div>
            </div>
          </section>
        )}

        {/* Signals grid */}
        {signals.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[10px] font-black tracking-[2px] text-white/30 uppercase mb-3">Signals this issue</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {signals.map((s, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{s.countryFlag}</span>
                    <span className="text-sm font-bold">{s.country}</span>
                    <VerdictChip v={s.verdict} />
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed mb-2">{s.headline}</p>
                  <div className="text-[10px] text-white/25">{s.source} · {s.date}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Verdict shifts */}
        {shifts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[10px] font-black tracking-[2px] text-white/30 uppercase mb-3">Verdict shifts</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {shifts.map((s, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{s.countryFlag}</div>
                  <div
                    className={`text-lg font-black mb-1 ${s.delta > 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {s.delta > 0 ? "+" : ""}{s.delta} pts
                  </div>
                  <div className="text-[10px] text-white/35">
                    {s.from} → {s.to}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Field observations */}
        {fields.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[10px] font-black tracking-[2px] text-white/30 uppercase mb-3">Field observations</h2>
            <div className="space-y-3">
              {fields.map((f, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 border-l-2 border-l-green-500/40 rounded-r-xl pl-4 pr-4 py-4">
                  <div className="text-xs font-bold text-white/70 mb-1">{f.location}</div>
                  <div className="text-sm font-semibold mb-1">{f.headline}</div>
                  <p className="text-xs text-white/45 leading-relaxed mb-2">{f.body}</p>
                  <div className="text-[10px] text-white/25">
                    Verified by {f.contributors} contributor{f.contributors !== 1 ? "s" : ""} · {f.date} · +{f.vbtAwarded} VBT
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GIaaS spotlight */}
        {giaas && (
          <section className="mb-8">
            <h2 className="text-[10px] font-black tracking-[2px] text-white/30 uppercase mb-3">Green intelligence</h2>
            <div className="bg-green-500/[0.04] border border-green-500/20 rounded-xl p-5 flex gap-4">
              <div className="text-2xl shrink-0">🌿</div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-black tracking-[2px] text-green-400 uppercase mb-1">GIaaS spotlight</div>
                <div className="font-bold text-sm mb-1">{giaas.projectTitle}</div>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
                  <span>{giaas.countryFlag}</span>
                  <span>{giaas.country}</span>
                  <span>·</span>
                  <span>{giaas.developer}</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed mb-3">{giaas.summary}</p>
                {giaas.projectId && (
                  <button
                    onClick={() => setLocation(`/green/${giaas.projectId}`)}
                    className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                  >
                    View full project brief <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* If the issue has custom HTML content (for rich formatted issues) */}
        {issue.htmlContent && issue.htmlContent.length > 100 && !ls && (
          <div
            className="prose prose-invert prose-sm max-w-none text-white/70"
            dangerouslySetInnerHTML={{ __html: issue.htmlContent }}
          />
        )}

        {/* Footer nav */}
        <div className="border-t border-white/5 pt-6 mt-10 flex items-center justify-between">
          <button onClick={() => setLocation("/bulletins")} className="text-sm text-white/30 hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All issues
          </button>
          <button onClick={() => setLocation("/scanner")} className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
            Open Scanner →
          </button>
        </div>

      </div>
    </div>
  );
}
