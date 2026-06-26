import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import {
  Leaf, Bot, RefreshCw, Globe, Zap, AlertTriangle, CheckCircle2,
  Clock, ExternalLink, Play, ChevronRight, Database, FileText,
  Users, BarChart3, Activity, X,
} from "lucide-react";
import { AFRICAN_COUNTRIES } from "@shared/africanCountries";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(d: string | Date | null) {
  if (!d) return "—";
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Stat({ label, value, sub, color = "text-cyan-400" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function SectionHead({ icon: Icon, title, action }: { icon: React.ElementType; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const STATUS_PILL: Record<string, string> = {
  pending:   "bg-yellow-900/40 text-yellow-300 border border-yellow-700/40",
  active:    "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  validated: "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40",
  flagged:   "bg-red-900/40 text-red-300 border border-red-700/40",
  ingested:  "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40",
  failed:    "bg-red-900/40 text-red-300 border border-red-700/40",
  approved:  "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40",
  rejected:  "bg-red-900/40 text-red-300 border border-red-700/40",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function GIaaSAdmin() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [countryInput, setCountryInput] = useState("");
  const [log, setLog] = useState<{ ts: string; msg: string; ok: boolean }[]>([]);
  const [feedFilter, setFeedFilter] = useState<"pending" | "ingested" | "failed" | undefined>(undefined);

  function addLog(msg: string, ok = true) {
    setLog(p => [{ ts: new Date().toLocaleTimeString(), msg, ok }, ...p].slice(0, 50));
  }

  // ── Queries ──────────────────────────────────────────────────────────────
  const stats       = trpc.giaas.adminStats.useQuery();
  const projects    = trpc.giaas.projectsList.useQuery({ limit: 20, offset: 0 });
  const feeds       = trpc.giaas.feedsList.useQuery({ status: feedFilter, limit: 50 });
  const pending     = trpc.giaas.submissionsPending.useQuery({ limit: 30 });

  function refetchAll() {
    qc.invalidateQueries();
  }

  // ── Mutations ────────────────────────────────────────────────────────────
  const agentRun = trpc.giaas.agentRun.useMutation({
    onSuccess: (r) => { addLog(`Full cycle complete — inserted ${(r as any)?.inserted ?? 0} projects`); refetchAll(); },
    onError:   (e) => addLog(`Agent error: ${e.message}`, false),
  });

  const agentCountry = trpc.giaas.agentRunCountry.useMutation({
    onSuccess: (r) => { addLog(`Country cycle done — ${(r as any)?.inserted ?? 0} inserted`); refetchAll(); },
    onError:   (e) => addLog(`Country error: ${e.message}`, false),
  });

  const feedsIngest = trpc.giaas.feedsIngest.useMutation({
    onSuccess: (r) => { addLog(`Feeds ingested — ${(r as any)?.inserted ?? 0} projects extracted`); refetchAll(); },
    onError:   (e) => addLog(`Feed error: ${e.message}`, false),
  });

  const approveSubmission = trpc.giaas.submissionsApprove.useMutation({
    onSuccess: () => { addLog("Submission approved — VBT awarded"); refetchAll(); },
    onError:   (e) => addLog(`Approve error: ${e.message}`, false),
  });

  const rejectSubmission = trpc.giaas.submissionsReject.useMutation({
    onSuccess: () => { addLog("Submission rejected"); refetchAll(); },
    onError:   (e) => addLog(`Reject error: ${e.message}`, false),
  });

  const runValidation = trpc.giaas.validationsRun.useMutation({
    onSuccess: (r) => { addLog(`Validation complete — verdict: ${r.verdict}`); refetchAll(); },
    onError:   (e) => addLog(`Validation error: ${e.message}`, false),
  });

  const isRunning = agentRun.isPending || agentCountry.isPending || feedsIngest.isPending;

  return (
    <div className="min-h-screen bg-[#09090f] text-white p-6 max-w-7xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">GIaaS Admin</h1>
            <p className="text-xs text-zinc-500">Green Investment as a Service — control panel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetchAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <button
            onClick={() => setLocation("/green")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> View /green
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Green Projects"   value={stats.data?.projects?.total ?? 0}     sub="all statuses" />
        <Stat label="Validated"        value={stats.data?.projects?.validated ?? 0}  color="text-emerald-400" sub="AI verified" />
        <Stat label="Flagged"          value={stats.data?.projects?.flagged ?? 0}    color="text-red-400"     sub="greenwashing risk" />
        <Stat label="Pending reviews"  value={stats.data?.submissions?.pending ?? 0} color="text-yellow-400"  sub="citizen submissions" />
      </div>

      {/* ── Main two-column layout ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── LEFT (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Agent controls */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionHead icon={Bot} title="Agent Controls" />

            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              {/* Full cycle */}
              <button
                onClick={() => { addLog("Starting full 55-country sweep…"); agentRun.mutate(); }}
                disabled={isRunning}
                className="flex flex-col items-start gap-2 p-4 rounded-xl bg-cyan-500/8 border border-cyan-500/20 hover:border-cyan-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center gap-2">
                  {agentRun.isPending
                    ? <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                    : <Globe className="w-4 h-4 text-cyan-400" />}
                  <span className="text-sm font-bold text-white">Full Sweep</span>
                </div>
                <span className="text-[11px] text-zinc-500 leading-snug">Harvest green investments across all 55 AU nations</span>
              </button>

              {/* Feed ingestion */}
              <button
                onClick={() => { addLog(`Ingesting ${feeds.data?.filter(f => f.status === "pending").length ?? "pending"} feeds…`); feedsIngest.mutate(); }}
                disabled={isRunning}
                className="flex flex-col items-start gap-2 p-4 rounded-xl bg-purple-500/8 border border-purple-500/20 hover:border-purple-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center gap-2">
                  {feedsIngest.isPending
                    ? <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                    : <Database className="w-4 h-4 text-purple-400" />}
                  <span className="text-sm font-bold text-white">Ingest Feeds</span>
                </div>
                <span className="text-[11px] text-zinc-500 leading-snug">Process pending URL / document feeds</span>
              </button>

              {/* Single country */}
              <div className="flex flex-col gap-2 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 text-left">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">Single Country</span>
                </div>
                <select
                  value={countryInput}
                  onChange={e => setCountryInput(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">Select country…</option>
                  {AFRICAN_COUNTRIES.map(c => (
                    <option key={c.iso3} value={c.iso3}>{c.flag} {c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (!countryInput) return;
                    addLog(`Running cycle for ${countryInput}…`);
                    agentCountry.mutate({ countryCode: countryInput });
                  }}
                  disabled={!countryInput || isRunning}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs text-amber-400 font-semibold hover:bg-amber-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-3 h-3" /> Run
                </button>
              </div>
            </div>

            {/* Activity log */}
            {log.length > 0 && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 max-h-36 overflow-y-auto">
                <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Activity log</div>
                {log.map((l, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5">
                    <span className="text-[10px] text-zinc-600 shrink-0">{l.ts}</span>
                    <span className={`text-[11px] ${l.ok ? "text-zinc-300" : "text-red-400"}`}>{l.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionHead
              icon={BarChart3}
              title={`Projects (${stats.data?.projects?.total ?? 0})`}
              action={
                <button onClick={() => setLocation("/green")} className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              }
            />

            {projects.isLoading && <div className="text-xs text-zinc-500 py-4 text-center">Loading…</div>}
            {!projects.isLoading && (!projects.data || projects.data.length === 0) && (
              <div className="text-center py-8">
                <div className="text-2xl mb-2">🌿</div>
                <div className="text-sm text-zinc-400 mb-1">No projects yet</div>
                <div className="text-xs text-zinc-600">Run the agent or ingest feeds to populate</div>
              </div>
            )}

            {projects.data && projects.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-600 border-b border-zinc-800">
                      <th className="text-left pb-2 font-medium">Project</th>
                      <th className="text-left pb-2 font-medium">Country</th>
                      <th className="text-left pb-2 font-medium">Sector</th>
                      <th className="text-left pb-2 font-medium">Score</th>
                      <th className="text-left pb-2 font-medium">Status</th>
                      <th className="text-left pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.data.map(p => (
                      <tr key={p.projectId} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                        <td className="py-2.5 pr-3">
                          <div className="font-medium text-white truncate max-w-[180px]">{p.title}</div>
                          <div className="text-zinc-600 truncate max-w-[180px]">{p.developer}</div>
                        </td>
                        <td className="py-2.5 pr-3 text-zinc-400">{p.countryCode}</td>
                        <td className="py-2.5 pr-3">
                          <span className="text-zinc-400">
                            {p.sector === "renewable_energy" ? "⚡ Energy" : p.sector === "reit" ? "🏗️ REIT" : "🌱 Agri"}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          {p.giaasScore
                            ? <span className={`font-bold ${Number(p.giaasScore) >= 70 ? "text-emerald-400" : Number(p.giaasScore) >= 40 ? "text-yellow-400" : "text-red-400"}`}>{Number(p.giaasScore).toFixed(0)}</span>
                            : <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_PILL[p.status] ?? ""}`}>{p.status}</span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setLocation(`/green/${p.projectId}`)}
                              className="text-[10px] text-zinc-500 hover:text-cyan-400 transition-colors"
                              title="View project"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => { addLog(`Validating ${p.title}…`); runValidation.mutate({ projectId: p.projectId }); }}
                              disabled={runValidation.isPending}
                              className="text-[10px] text-zinc-500 hover:text-purple-400 transition-colors"
                              title="Run AI validation"
                            >
                              <Activity className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending submissions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionHead
              icon={Users}
              title={`Pending Submissions (${pending.data?.length ?? 0})`}
            />

            {pending.data && pending.data.length === 0 && (
              <div className="text-xs text-zinc-600 py-4 text-center">No pending submissions</div>
            )}

            {pending.data && pending.data.length > 0 && (
              <div className="space-y-2">
                {pending.data.map(s => (
                  <div key={s.submissionId} className="flex items-start justify-between gap-4 p-3 bg-zinc-800/40 border border-zinc-700/40 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.confirms ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"}`}>
                          {s.confirms ? "Confirms" : "Disputes"}
                        </span>
                        <span className="text-[10px] text-zinc-500">{s.observationType} · {s.confidenceLevel} confidence</span>
                        <span className="text-[10px] text-zinc-600">{timeAgo(s.createdAt)}</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-snug line-clamp-2">{s.content}</p>
                      <div className="text-[10px] text-zinc-600 mt-1">Project: {s.projectId.slice(0, 8)}…</div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => approveSubmission.mutate({ submissionId: s.submissionId, qualityScore: 0.85 })}
                        disabled={approveSubmission.isPending}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-900/40 border border-emerald-700/40 text-emerald-300 text-[10px] font-medium hover:bg-emerald-900/70 transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => rejectSubmission.mutate({ submissionId: s.submissionId })}
                        disabled={rejectSubmission.isPending}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-900/40 border border-red-700/40 text-red-300 text-[10px] font-medium hover:bg-red-900/70 transition-colors"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT (1/3) ── */}
        <div className="space-y-6">

          {/* DB status */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionHead icon={Database} title="Database" />
            <div className="space-y-2">
              {[
                { label: "greenProjects",    val: stats.data?.projects?.total },
                { label: "Active",           val: stats.data?.projects?.active,    dim: true },
                { label: "Validated",        val: stats.data?.projects?.validated, dim: true },
                { label: "Flagged",          val: stats.data?.projects?.flagged,   dim: true },
                { label: "Submissions",      val: stats.data?.submissions?.total },
                { label: "Pending review",   val: stats.data?.submissions?.pending, dim: true },
              ].map(row => (
                <div key={row.label} className={`flex items-center justify-between text-xs ${row.dim ? "pl-4 text-zinc-600" : "text-zinc-400"}`}>
                  <span>{row.label}</span>
                  <span className={row.dim ? "text-zinc-500" : "text-white font-semibold"}>{row.val ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data feeds */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionHead
              icon={FileText}
              title="Data Feeds"
              action={
                <div className="flex gap-1">
                  {(["pending", "ingested", "failed"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setFeedFilter(feedFilter === s ? undefined : s)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${feedFilter === s ? STATUS_PILL[s] : "border-zinc-700 text-zinc-600 hover:text-zinc-400"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              }
            />

            {feeds.isLoading && <div className="text-xs text-zinc-600 py-3 text-center">Loading…</div>}
            {feeds.data && feeds.data.length === 0 && (
              <div className="text-xs text-zinc-600 py-3 text-center">No feeds{feedFilter ? ` with status "${feedFilter}"` : ""}</div>
            )}

            <div className="space-y-2">
              {feeds.data?.map(f => (
                <div key={f.feedId} className="p-3 bg-zinc-800/40 border border-zinc-700/40 rounded-xl">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="text-xs text-zinc-200 font-medium leading-snug line-clamp-2">
                      {f.title ?? f.url ?? f.documentUrl ?? "Text feed"}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${STATUS_PILL[f.status]}`}>{f.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                    <span>{f.feedType}</span>
                    {f.projectsCreated != null && <span>+{f.projectsCreated} projects</span>}
                    <span>{timeAgo(f.createdAt)}</span>
                  </div>
                  {f.url && (
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-600 hover:text-cyan-400 flex items-center gap-1 mt-1 truncate">
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{f.url}</span>
                    </a>
                  )}
                  {f.errorMessage && (
                    <div className="text-[10px] text-red-400 mt-1 flex items-start gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                      {f.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick ingest CTA if pending feeds exist */}
            {feeds.data?.some(f => f.status === "pending") && (
              <button
                onClick={() => { addLog("Ingesting pending feeds…"); feedsIngest.mutate(); }}
                disabled={feedsIngest.isPending}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-500/10 border border-purple-500/25 text-xs text-purple-300 font-semibold hover:bg-purple-500/20 transition-all disabled:opacity-40"
              >
                {feedsIngest.isPending
                  ? <><RefreshCw className="w-3 h-3 animate-spin" /> Ingesting…</>
                  : <><Play className="w-3 h-3" /> Ingest {feeds.data.filter(f => f.status === "pending").length} pending feeds</>
                }
              </button>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <SectionHead icon={ChevronRight} title="Quick Links" />
            <div className="space-y-1.5">
              {[
                { label: "GIaaS Hub",       path: "/green",            icon: Leaf },
                { label: "Register Project", path: "/green/register",   icon: FileText },
                { label: "Admin Dashboard",  path: "/admin",            icon: Activity },
              ].map(l => (
                <button
                  key={l.path}
                  onClick={() => setLocation(l.path)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/40 text-xs text-zinc-400 hover:text-white transition-all text-left"
                >
                  <l.icon className="w-3.5 h-3.5 text-zinc-600" />
                  {l.label}
                  <ChevronRight className="w-3 h-3 ml-auto text-zinc-700" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
