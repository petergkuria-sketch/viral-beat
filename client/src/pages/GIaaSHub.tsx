import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AFRICAN_COUNTRIES } from "@shared/africanCountries";
import { useQueryClient } from "@tanstack/react-query";

const SECTORS = [
  { key: undefined,             label: "All Sectors" },
  { key: "renewable_energy",    label: "Renewable Energy" },
  { key: "reit",                label: "REITs" },
  { key: "agriculture",         label: "Agriculture" },
] as const;

const SECTOR_ICONS: Record<string, string> = {
  renewable_energy: "⚡",
  reit:             "🏗️",
  agriculture:      "🌱",
};

const STATUS_STYLES: Record<string, string> = {
  validated: "bg-emerald-900/40 text-emerald-300 border border-emerald-700/50",
  active:    "bg-blue-900/40 text-blue-300 border border-blue-700/50",
  pending:   "bg-yellow-900/40 text-yellow-300 border border-yellow-700/50",
  flagged:   "bg-red-900/40 text-red-300 border border-red-700/50",
};

const VERDICT_STYLES: Record<string, string> = {
  verified:      "text-emerald-400",
  inconclusive:  "text-yellow-400",
  flagged:       "text-orange-400",
  greenwashing:  "text-red-400",
};

function ScoreBadge({ score }: { score: string | number | null }) {
  if (score == null) return <span className="text-zinc-500 text-xs">Unscored</span>;
  const n = Number(score);
  const color = n >= 70 ? "text-emerald-400" : n >= 40 ? "text-yellow-400" : "text-red-400";
  return <span className={`font-bold text-lg ${color}`}>{n.toFixed(0)}<span className="text-xs text-zinc-500">/100</span></span>;
}

export default function GIaaSHub() {
  const [, setLocation] = useLocation();
  const [sector, setSector] = useState<"renewable_energy" | "reit" | "agriculture" | undefined>(undefined);
  const [countryCode, setCountryCode] = useState<string | undefined>(undefined);

  const queryClient = useQueryClient();
  const { data: projects, isLoading } = trpc.giaas.projectsList.useQuery({
    sector,
    countryCode,
    limit: 24,
  });
  const { data: me } = trpc.auth.me.useQuery();
  const agentRun = trpc.giaas.agentRun.useMutation({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [["giaas", "projectsList"]] }),
  });
  const isAnalyst = me?.role && ["analyst", "admin"].includes(me.role);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🌍</span>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest bg-emerald-900/30 border border-emerald-700/40 px-2 py-0.5 rounded">
            GIaaS × ViralBeat
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Green Investment Intelligence</h1>
        <p className="text-zinc-400 mt-1 max-w-2xl">
          Citizen-validated ESG project data for Africa. Earn VBT tokens for submitting field observations.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Sector tabs */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {SECTORS.map(s => (
            <button
              key={String(s.key)}
              onClick={() => setSector(s.key as any)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sector === s.key
                  ? "bg-emerald-700 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Country filter */}
        <select
          value={countryCode ?? ""}
          onChange={e => setCountryCode(e.target.value || undefined)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-600"
        >
          <option value="">All Countries</option>
          {AFRICAN_COUNTRIES.map(c => (
            <option key={c.iso3} value={c.iso3}>{c.flag} {c.name}</option>
          ))}
        </select>

        {/* CTAs */}
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {isAnalyst && (
            <button
              onClick={() => agentRun.mutate()}
              disabled={agentRun.isPending}
              className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-sm font-medium px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              title="Harvest known green projects for all 55 African nations"
            >
              {agentRun.isPending ? (
                <><span className="animate-spin">⟳</span> Harvesting…</>
              ) : (
                <><span>🤖</span> Run VB Agent</>
              )}
            </button>
          )}
          {agentRun.data && (
            <span className="text-xs text-emerald-400">
              +{agentRun.data.projectsInserted} inserted
            </span>
          )}
          <button
            onClick={() => setLocation("/green/submit")}
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            + Submit Observation
          </button>
          <button
            onClick={() => setLocation("/green/register")}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            Register Project
          </button>
        </div>
      </div>

      {/* Projects grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : !projects?.length ? (
        <div className="text-center py-24 text-zinc-500">
          <div className="text-4xl mb-3">🌱</div>
          <div className="font-medium">No projects yet.</div>
          <div className="text-sm mt-1">Be the first to register a green project.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <button
              key={p.projectId}
              onClick={() => setLocation(`/green/${p.projectId}`)}
              className="text-left bg-zinc-900 border border-zinc-800 hover:border-emerald-700/60 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-emerald-900/10 group"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{SECTOR_ICONS[p.sector] ?? "📊"}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status]}`}>
                  {p.status}
                </span>
              </div>

              {/* Title & developer */}
              <div className="font-semibold text-zinc-100 group-hover:text-emerald-300 transition-colors leading-snug mb-1">
                {p.title}
              </div>
              <div className="text-xs text-zinc-500 mb-3">{p.developer}</div>

              {/* Country & sector */}
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
                <span>{AFRICAN_COUNTRIES.find(c => c.iso3 === p.countryCode)?.flag ?? "🌍"}</span>
                <span>{p.countryName}</span>
                <span className="text-zinc-700">·</span>
                <span>{p.sector.replace("_", " ")}</span>
              </div>

              {/* Score */}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <div>
                  <div className="text-xs text-zinc-500 mb-0.5">GIaaS Score</div>
                  <ScoreBadge score={p.giaasScore} />
                </div>
                {p.claimedCo2Reduction && (
                  <div className="text-right">
                    <div className="text-xs text-zinc-500 mb-0.5">CO₂ Claimed</div>
                    <div className="text-sm font-medium text-zinc-300">
                      {Number(p.claimedCo2Reduction).toLocaleString()} t
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-10 pt-6 border-t border-zinc-800 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span>Verdicts: </span>
        {Object.entries(VERDICT_STYLES).map(([v, cls]) => (
          <span key={v} className={cls}>● {v}</span>
        ))}
        <span className="ml-auto">Earn VBT by submitting field observations ↗</span>
      </div>
    </div>
  );
}
