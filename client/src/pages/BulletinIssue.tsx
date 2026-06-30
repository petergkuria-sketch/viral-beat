import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { AFRICAN_COUNTRIES } from "@shared/africanCountries";
import { ArrowLeft, Calendar, Zap, TrendingUp, Users, Leaf, ExternalLink, Download, Home } from "lucide-react";

function downloadHtml(title: string, slug: string, htmlContent: string, sections: any, stats: any) {
  const s = sections ?? {};
  const ls = s.leadStory;
  const signals: any[] = s.signals ?? [];
  const shifts: any[]  = s.verdictShifts ?? [];
  const fields: any[]  = s.fieldObservations ?? [];
  const giaas           = s.giaasSpotlight;

  const verdictBadge = (v: string) => {
    const colors: Record<string, string> = {
      "go-market": "#22c55e", monitor: "#a3e635", caution: "#f59e0b", "no-go": "#ef4444",
    };
    return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:${colors[v] ?? "#fff"}22;color:${colors[v] ?? "#ccc"};border:1px solid ${colors[v] ?? "#ccc"}44">${v.replace("-"," ")}</span>`;
  };

  const blob = new Blob([`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#050b1a;color:#e5e7eb;line-height:1.6;padding:0}
  a{color:#22d3ee}
  .wrap{max-width:680px;margin:0 auto;padding:40px 24px}
  .masthead{background:#030712;border:1px solid #ffffff0d;border-radius:12px;padding:32px;margin-bottom:32px}
  .label{font-size:10px;font-weight:900;letter-spacing:.18em;color:#22d3ee;text-transform:uppercase}
  h1{font-size:22px;font-weight:900;margin:12px 0 8px;line-height:1.25}
  .summary{color:#9ca3af;font-size:13px;margin-bottom:24px}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .stat{background:#ffffff07;border-radius:8px;padding:12px;text-align:center}
  .stat-val{font-size:20px;font-weight:900}
  .stat-lbl{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-top:2px}
  .section-label{font-size:9px;font-weight:900;letter-spacing:.18em;color:#4b5563;text-transform:uppercase;margin:32px 0 10px}
  .card{background:#ffffff05;border:1px solid #ffffff0d;border-radius:10px;padding:16px;margin-bottom:10px}
  .card-meta{font-size:11px;color:#6b7280;margin-bottom:6px;display:flex;gap:8px;align-items:center}
  .card h3{font-size:14px;font-weight:700;margin-bottom:6px}
  .card p{font-size:12px;color:#9ca3af;line-height:1.55}
  .signals-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .shifts-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .shift{background:#ffffff05;border:1px solid #ffffff0d;border-radius:10px;padding:16px;text-align:center}
  .shift-delta{font-size:18px;font-weight:900}
  .shift-delta.pos{color:#22c55e}.shift-delta.neg{color:#ef4444}
  .obs{border-left:2px solid #22c55e55;padding:12px 14px;border-radius:0 8px 8px 0;background:#ffffff04;margin-bottom:10px}
  .obs-meta{font-size:10px;color:#6b7280}
  .giaas{background:#22c55e08;border:1px solid #22c55e22;border-radius:10px;padding:20px;display:flex;gap:16px}
  .giaas-body .tag{font-size:8px;font-weight:900;letter-spacing:.15em;color:#4ade80;text-transform:uppercase;margin-bottom:4px}
  .footer{border-top:1px solid #ffffff08;margin-top:48px;padding-top:20px;text-align:center;font-size:11px;color:#374151}
  @media print{body{background:#fff;color:#111}.masthead,.card,.obs,.giaas,.stat,.shift{border-color:#ddd;background:#f9f9f9}.label,.giaas-body .tag{color:#0e7490}.shift-delta.pos{color:#166534}.shift-delta.neg{color:#991b1b}.card p,.summary{color:#374151}.stat-lbl,.card-meta,.obs-meta,.footer{color:#6b7280}}
</style>
</head>
<body>
<div class="wrap">
  <div class="masthead">
    <div class="label">Africa Intelligence Bulletin · ViralBeat</div>
    <h1>${title}</h1>
    <p class="summary">${htmlContent.replace(/<[^>]+>/g, " ").slice(0, 300)}…</p>
    ${stats ? `<div class="stats-grid">
      <div class="stat"><div class="stat-val">${stats.breakingShifts ?? 0}</div><div class="stat-lbl">Breaking shifts</div></div>
      <div class="stat"><div class="stat-val">${stats.greenProjects ?? 0}</div><div class="stat-lbl">Green projects</div></div>
      <div class="stat"><div class="stat-val">${stats.fieldSignals ?? 0}</div><div class="stat-lbl">Field signals</div></div>
      <div class="stat"><div class="stat-val">${stats.verdictsChanged ?? 0}</div><div class="stat-lbl">Verdicts changed</div></div>
    </div>` : ""}
  </div>

  ${ls ? `<div class="section-label">Lead story</div>
  <div class="card">
    <div class="card-meta"><span>${ls.countryFlag}</span><strong>${ls.country}</strong><span>${ls.source}</span></div>
    <h3>${ls.headline}</h3>
    <p>${ls.body}</p>
    <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">${(ls.verdicts ?? []).map(verdictBadge).join("")}</div>
  </div>` : ""}

  ${signals.length > 0 ? `<div class="section-label">Signals this issue</div>
  <div class="signals-grid">
    ${signals.map(s => `<div class="card">
      <div class="card-meta"><span>${s.countryFlag}</span><strong>${s.country}</strong>${verdictBadge(s.verdict)}</div>
      <p>${s.headline}</p>
      <div style="font-size:10px;color:#6b7280;margin-top:6px">${s.source} · ${s.date}</div>
    </div>`).join("")}
  </div>` : ""}

  ${shifts.length > 0 ? `<div class="section-label">Verdict shifts</div>
  <div class="shifts-grid">
    ${shifts.map(s => `<div class="shift">
      <div style="font-size:24px;margin-bottom:4px">${s.countryFlag}</div>
      <div class="shift-delta ${s.delta > 0 ? "pos" : "neg"}">${s.delta > 0 ? "+" : ""}${s.delta} pts</div>
      <div style="font-size:10px;color:#6b7280;margin-top:4px">${s.from} → ${s.to}</div>
    </div>`).join("")}
  </div>` : ""}

  ${fields.length > 0 ? `<div class="section-label">Field observations</div>
  ${fields.map(f => `<div class="obs">
    <div style="font-size:12px;font-weight:700;margin-bottom:2px">${f.location}</div>
    <div style="font-size:13px;font-weight:600;margin-bottom:6px">${f.headline}</div>
    <p>${f.body}</p>
    <div class="obs-meta" style="margin-top:8px">Verified by ${f.contributors} contributor${f.contributors !== 1 ? "s" : ""} · ${f.date} · +${f.vbtAwarded} VBT</div>
  </div>`).join("")}` : ""}

  ${giaas ? `<div class="section-label">Green intelligence — GIaaS spotlight</div>
  <div class="giaas">
    <div style="font-size:28px">🌿</div>
    <div class="giaas-body">
      <div class="tag">GIaaS spotlight</div>
      <div style="font-weight:700;font-size:14px;margin-bottom:4px">${giaas.projectTitle}</div>
      <div style="font-size:11px;color:#6b7280;margin-bottom:8px">${giaas.countryFlag} ${giaas.country} · ${giaas.developer}</div>
      <p style="font-size:12px;color:#9ca3af">${giaas.summary}</p>
    </div>
  </div>` : ""}

  <div class="footer">
    Africa Intelligence Bulletin · ViralBeat · viralbeat.io<br>
    Published ${new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
  </div>
</div>
</body></html>`], { type: "text/html" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `viralbeat-bulletin-${slug}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

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
          <button onClick={() => setLocation("/")} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors shrink-0" title="Home">
            <Home className="w-4 h-4" />
          </button>
          <span className="text-white/15">/</span>
          <button onClick={() => setLocation("/bulletins")} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Archive
          </button>
          <span className="text-white/15">/</span>
          <span className="text-sm text-white/50 truncate flex-1">{issue.title}</span>
          <button
            onClick={() => downloadHtml(issue.title, issue.slug, issue.htmlContent, sections, stats)}
            className="flex items-center gap-1.5 text-white/40 hover:text-cyan-400 text-xs transition-colors shrink-0"
            title="Download as HTML (open in browser → Print → Save as PDF)"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
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
