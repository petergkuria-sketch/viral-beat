import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { AFRICAN_COUNTRIES } from "@shared/africanCountries";

const SECTOR_LABEL: Record<string, string> = {
  renewable_energy: "Renewable Energy",
  reit:             "Real Estate (REIT)",
  agriculture:      "Agriculture",
};

const VERDICT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  verified:     { label: "Verified",     color: "text-emerald-300", bg: "bg-emerald-900/30 border-emerald-700/50", icon: "✅" },
  inconclusive: { label: "Inconclusive", color: "text-yellow-300",  bg: "bg-yellow-900/30 border-yellow-700/50",  icon: "⏳" },
  flagged:      { label: "Flagged",      color: "text-orange-300",  bg: "bg-orange-900/30 border-orange-700/50",  icon: "⚠️" },
  greenwashing: { label: "Greenwashing", color: "text-red-300",     bg: "bg-red-900/30 border-red-700/50",        icon: "🚨" },
};

const CLAIM_STATUS_STYLES: Record<string, string> = {
  verified:       "text-emerald-400",
  unverified:     "text-zinc-400",
  disputed:       "text-red-400",
  not_applicable: "text-zinc-600",
};

function ScoreRing({ score, label }: { score: number | null; label: string }) {
  const n = score ?? 0;
  const color = n >= 70 ? "#34d399" : n >= 40 ? "#fbbf24" : "#f87171";
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 56 56" className="w-16 h-16 -rotate-90">
          <circle cx="28" cy="28" r="22" fill="none" stroke="#27272a" strokeWidth="6" />
          <circle
            cx="28" cy="28" r="22" fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={`${(n / 100) * 138.2} 138.2`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-zinc-100">
          {score != null ? n.toFixed(0) : "–"}
        </span>
      </div>
      <span className="text-xs text-zinc-500 mt-1 text-center">{label}</span>
    </div>
  );
}

export default function GIaaSProject() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data, isLoading } = trpc.giaas.projectsGet.useQuery({ projectId: id });
  const { data: me } = trpc.auth.me.useQuery();
  const runValidation = trpc.giaas.validationsRun.useMutation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse">Loading project…</div>
      </div>
    );
  }

  if (!data?.project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <div className="text-4xl">🌿</div>
        <div className="text-zinc-400">Project not found.</div>
        <button onClick={() => setLocation("/green")} className="text-emerald-400 text-sm hover:underline">
          ← Back to projects
        </button>
      </div>
    );
  }

  const { project, latestValidation, submissionCounts } = data;
  const country = AFRICAN_COUNTRIES.find(c => c.iso3 === project.countryCode);
  const verdict = latestValidation ? VERDICT_CONFIG[latestValidation.verdict] : null;
  const claimsAnalysis = latestValidation?.claimsAnalysis as any;
  const isAnalyst = me?.role && ["analyst", "admin"].includes(me.role);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8 max-w-5xl mx-auto">

      {/* Back */}
      <button onClick={() => setLocation("/green")} className="text-zinc-500 hover:text-zinc-300 text-sm mb-6 flex items-center gap-1">
        ← Green Projects
      </button>

      {/* Hero */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-900/30 border border-emerald-700/40 px-2 py-0.5 rounded">
                GIaaS × VB
              </span>
              <span className="text-xs text-zinc-500">{SECTOR_LABEL[project.sector]}</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">{project.title}</h1>
            <div className="text-zinc-400 text-sm">{project.developer}</div>
          </div>
          <div className="flex items-center gap-2">
            {country && <span className="text-3xl">{country.flag}</span>}
            <div>
              <div className="text-sm font-medium">{project.countryName}</div>
              <div className="text-xs text-zinc-500">{project.countryCode}</div>
            </div>
          </div>
        </div>

        {/* Score rings */}
        <div className="flex gap-8 pt-4 border-t border-zinc-800">
          <ScoreRing score={project.giaasScore ? Number(project.giaasScore) : null} label="GIaaS Score" />
          <ScoreRing score={project.politicalRiskScore ? Number(project.politicalRiskScore) : null} label="Pol. Risk (VB)" />
          {latestValidation && (
            <>
              <ScoreRing score={Number(latestValidation.confidenceScore)} label="Confidence" />
              <ScoreRing score={100 - Number(latestValidation.divergenceScore)} label="Consistency" />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Claims + description */}
        <div className="lg:col-span-2 space-y-5">

          {/* Description */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Project Description</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">{project.description}</p>
          </div>

          {/* Developer Claims */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Developer Claims</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {project.claimedCo2Reduction && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">CO₂ Reduction</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {Number(project.claimedCo2Reduction).toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-500">tonnes</div>
                  {claimsAnalysis?.co2Claim && (
                    <div className={`text-xs mt-1 font-medium ${CLAIM_STATUS_STYLES[claimsAnalysis.co2Claim]}`}>
                      {claimsAnalysis.co2Claim}
                    </div>
                  )}
                </div>
              )}
              {project.claimedJobsCreated && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Jobs Created</div>
                  <div className="text-lg font-bold text-blue-400">
                    {project.claimedJobsCreated.toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-500">direct jobs</div>
                  {claimsAnalysis?.jobsClaim && (
                    <div className={`text-xs mt-1 font-medium ${CLAIM_STATUS_STYLES[claimsAnalysis.jobsClaim]}`}>
                      {claimsAnalysis.jobsClaim}
                    </div>
                  )}
                </div>
              )}
              {project.claimedCapacityMw && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Capacity</div>
                  <div className="text-lg font-bold text-yellow-400">
                    {Number(project.claimedCapacityMw).toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-500">MW</div>
                  {claimsAnalysis?.capacityClaim && (
                    <div className={`text-xs mt-1 font-medium ${CLAIM_STATUS_STYLES[claimsAnalysis.capacityClaim]}`}>
                      {claimsAnalysis.capacityClaim}
                    </div>
                  )}
                </div>
              )}
              {project.budget && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Budget</div>
                  <div className="text-lg font-bold text-zinc-200">
                    ${(Number(project.budget) / 1_000_000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-zinc-500">USD</div>
                </div>
              )}
            </div>
          </div>

          {/* Key Findings */}
          {claimsAnalysis?.keyFindings?.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">AI Analysis Findings</h2>
              <ul className="space-y-2">
                {(claimsAnalysis.keyFindings as string[]).map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-300">
                    <span className="text-emerald-500 mt-0.5">›</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Certifications */}
          {(project.certifications as string[])?.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Certifications</h2>
              <div className="flex flex-wrap gap-2">
                {(project.certifications as string[]).map(c => (
                  <span key={c} className="bg-emerald-900/30 border border-emerald-700/40 text-emerald-300 text-xs px-2 py-1 rounded-full">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Validation + submissions */}
        <div className="space-y-5">

          {/* Validation verdict */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Validation Status</h2>
            {verdict ? (
              <div className={`border rounded-lg p-3 mb-3 ${verdict.bg}`}>
                <div className={`font-bold flex items-center gap-2 ${verdict.color}`}>
                  <span>{verdict.icon}</span> {verdict.label}
                </div>
                {latestValidation?.verdictSummary && (
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {latestValidation.verdictSummary}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-sm text-zinc-500 mb-3">No validation run yet.</div>
            )}

            {latestValidation && (
              <div className="text-xs text-zinc-600">
                Last run: {new Date(latestValidation.runAt).toLocaleDateString()}
              </div>
            )}

            {isAnalyst && (
              <button
                onClick={() => runValidation.mutate({ projectId: id })}
                disabled={runValidation.isPending}
                className="mt-3 w-full bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                {runValidation.isPending ? "Running AI…" : "Run Validation"}
              </button>
            )}
          </div>

          {/* Citizen Data */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Citizen Data</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-zinc-200">{submissionCounts?.total ?? 0}</div>
                <div className="text-xs text-zinc-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-400">{submissionCounts?.confirms ?? 0}</div>
                <div className="text-xs text-zinc-500">Confirms</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-400">{submissionCounts?.disputes ?? 0}</div>
                <div className="text-xs text-zinc-500">Disputes</div>
              </div>
            </div>

            <button
              onClick={() => setLocation(`/green/${id}/submit`)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Submit Observation → Earn VBT
            </button>
          </div>

          {/* Timeline */}
          {(project.startDate || project.endDate) && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Timeline</h2>
              {project.startDate && <div className="text-xs text-zinc-400">Start: <span className="text-zinc-200">{project.startDate}</span></div>}
              {project.endDate && <div className="text-xs text-zinc-400 mt-1">End: <span className="text-zinc-200">{project.endDate}</span></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
