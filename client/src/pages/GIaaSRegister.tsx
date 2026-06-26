import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AFRICAN_COUNTRIES } from "@shared/africanCountries";

type Sector = "renewable_energy" | "reit" | "agriculture";

const SECTOR_OPTIONS: { key: Sector; label: string; icon: string; metrics: { key: string; label: string; unit: string }[] }[] = [
  {
    key: "renewable_energy",
    label: "Renewable Energy",
    icon: "⚡",
    metrics: [
      { key: "energyType",        label: "Energy Type",          unit: "e.g. Solar, Wind" },
      { key: "gridConnection",    label: "Grid Connection",      unit: "yes/no" },
      { key: "householdsServed",  label: "Households Served",    unit: "count" },
    ],
  },
  {
    key: "reit",
    label: "Real Estate (REIT)",
    icon: "🏗️",
    metrics: [
      { key: "buildingCert",      label: "Green Building Cert",  unit: "e.g. LEED, EDGE" },
      { key: "energyEfficiency",  label: "Energy Efficiency",    unit: "kWh/m²/year" },
      { key: "waterReduction",    label: "Water Reduction",      unit: "%" },
    ],
  },
  {
    key: "agriculture",
    label: "Agriculture",
    icon: "🌱",
    metrics: [
      { key: "soilCarbon",        label: "Soil Carbon Rate",     unit: "t/ha/year" },
      { key: "fertilizerReduction", label: "Fertilizer Reduction", unit: "%" },
      { key: "farmersSupported",  label: "Farmers Supported",    unit: "count" },
    ],
  },
];

const CERT_OPTIONS = ["LEED", "EDGE", "Climate Bonds Initiative", "GreenStar", "ISO 14001", "Fairtrade", "Gold Standard", "Verra VCS"];

export default function GIaaSRegister() {
  const [, setLocation] = useLocation();

  const [sector, setSector]                   = useState<Sector>("renewable_energy");
  const [title, setTitle]                     = useState("");
  const [developer, setDeveloper]             = useState("");
  const [countryCode, setCountryCode]         = useState("");
  const [description, setDescription]         = useState("");
  const [co2, setCo2]                         = useState("");
  const [jobs, setJobs]                       = useState("");
  const [capacityMw, setCapacityMw]           = useState("");
  const [budget, setBudget]                   = useState("");
  const [startDate, setStartDate]             = useState("");
  const [endDate, setEndDate]                 = useState("");
  const [certs, setCerts]                     = useState<string[]>([]);
  const [sectorMetrics, setSectorMetrics]     = useState<Record<string, string>>({});
  const [submitted, setSubmitted]             = useState(false);
  const [newProjectId, setNewProjectId]       = useState<string | null>(null);

  const create = trpc.giaas.projectsCreate.useMutation();
  const { data: me } = trpc.auth.me.useQuery();

  const country = AFRICAN_COUNTRIES.find(c => c.iso3 === countryCode);
  const selectedSector = SECTOR_OPTIONS.find(s => s.key === sector)!;

  if (!me) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-4">
        <div className="text-4xl">🔒</div>
        <div className="text-zinc-400">Sign in to register a project.</div>
        <button onClick={() => setLocation("/login")} className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2 rounded-lg">
          Sign In
        </button>
      </div>
    );
  }

  if (submitted && newProjectId) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">Project Registered!</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Your project is now live in the GIaaS directory. Invite field observers to submit data and trigger your first AI validation.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setLocation(`/green/${newProjectId}`)}
              className="bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-lg"
            >
              View Project
            </button>
            <button
              onClick={() => setLocation("/green")}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium px-5 py-2 rounded-lg"
            >
              All Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!countryCode) return;
    const result = await create.mutateAsync({
      title,
      developer,
      sector,
      countryCode,
      countryName: country?.name ?? countryCode,
      description,
      claimedCo2Reduction: co2 ? Number(co2) : undefined,
      claimedJobsCreated:  jobs ? Number(jobs) : undefined,
      claimedCapacityMw:   capacityMw ? Number(capacityMw) : undefined,
      budget:              budget ? Number(budget) : undefined,
      startDate:           startDate || undefined,
      endDate:             endDate || undefined,
      certifications:      certs,
      sectorMetrics:       Object.fromEntries(Object.entries(sectorMetrics).filter(([, v]) => v.trim())),
    });
    setNewProjectId(result.projectId);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8 max-w-3xl mx-auto">

      <button onClick={() => setLocation("/green")} className="text-zinc-500 hover:text-zinc-300 text-sm mb-6">
        ← Green Projects
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-900/30 border border-emerald-700/40 px-2 py-0.5 rounded">
            GIaaS × VB
          </span>
        </div>
        <h1 className="text-2xl font-bold">Register Green Project</h1>
        <p className="text-zinc-400 text-sm mt-1">
          List your ESG project for citizen validation and GIaaS scoring.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Sector */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-3 block">Sector</label>
          <div className="grid grid-cols-3 gap-3">
            {SECTOR_OPTIONS.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSector(s.key)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  sector === s.key
                    ? "border-emerald-600 bg-emerald-900/20 text-emerald-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="text-2xl mb-1">{s.icon}</div>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-400 mb-1 block">Project Title *</label>
            <input
              required value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Turkana Wind Power Phase III"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Developer / Company *</label>
            <input
              required value={developer} onChange={e => setDeveloper(e.target.value)}
              placeholder="Company name"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Country *</label>
            <select
              required value={countryCode} onChange={e => setCountryCode(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none"
            >
              <option value="">Select country…</option>
              {AFRICAN_COUNTRIES.map(c => (
                <option key={c.iso3} value={c.iso3}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-400 mb-1 block">Description * (min 20 chars)</label>
            <textarea
              required value={description} onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the project's environmental goals, methodology, and expected impact…"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Environmental Claims */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-3 block">Environmental Claims (optional)</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">CO₂ Reduction (tonnes)</label>
              <input type="number" min="0" value={co2} onChange={e => setCo2(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Jobs Created</label>
              <input type="number" min="0" value={jobs} onChange={e => setJobs(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                placeholder="0" />
            </div>
            {sector === "renewable_energy" && (
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Capacity (MW)</label>
                <input type="number" min="0" value={capacityMw} onChange={e => setCapacityMw(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                  placeholder="0" />
              </div>
            )}
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Budget (USD)</label>
              <input type="number" min="0" value={budget} onChange={e => setBudget(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                placeholder="0" />
            </div>
          </div>
        </div>

        {/* Sector-specific metrics */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-3 block">
            {selectedSector.icon} {selectedSector.label} Metrics
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {selectedSector.metrics.map(m => (
              <div key={m.key}>
                <label className="text-xs text-zinc-500 mb-1 block">{m.label}</label>
                <input
                  value={sectorMetrics[m.key] ?? ""}
                  onChange={e => setSectorMetrics(prev => ({ ...prev, [m.key]: e.target.value }))}
                  placeholder={m.unit}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none" />
          </div>
        </div>

        {/* Certifications */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-3 block">Certifications</label>
          <div className="flex flex-wrap gap-2">
            {CERT_OPTIONS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCerts(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  certs.includes(c)
                    ? "border-emerald-600 bg-emerald-900/30 text-emerald-300"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {certs.includes(c) ? "✓ " : ""}{c}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={create.isPending || !title || !developer || !countryCode || description.length < 20}
            className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {create.isPending ? "Registering…" : "Register Project →"}
          </button>
          {create.error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-2 mt-3">
              {create.error.message}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
