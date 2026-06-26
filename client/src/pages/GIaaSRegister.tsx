import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AFRICAN_COUNTRIES } from "@shared/africanCountries";

type Sector = "renewable_energy" | "reit" | "agriculture";
type FeedType = "url" | "document_url" | "text";

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

  // Data feed state
  const [feedType, setFeedType]               = useState<FeedType>("url");
  const [feedUrl, setFeedUrl]                 = useState("");
  const [feedDocUrl, setFeedDocUrl]           = useState("");
  const [feedText, setFeedText]               = useState("");
  const [feedTitle, setFeedTitle]             = useState("");
  const [feedCountries, setFeedCountries]     = useState<string[]>([]);
  const [feedSectors, setFeedSectors]         = useState<Sector[]>([]);
  const [feedSubmitted, setFeedSubmitted]     = useState(false);

  const create = trpc.giaas.projectsCreate.useMutation();
  const submitFeed = trpc.giaas.submitDataFeed.useMutation({
    onSuccess: () => setFeedSubmitted(true),
  });
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

      {/* ── DATA FEED SECTION ─────────────────────────────────────────── */}
      <div className="mt-10 border-t border-zinc-800 pt-10">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📡</span>
            <h2 className="text-lg font-bold text-zinc-100">Share Public Data with the GIaaS Agent</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Have a public report, article, or dataset about green investments in Africa? Share it here. The GIaaS Agent will read it, extract project data, and use it to build context and populate the registry — attributed to your contribution.
          </p>
        </div>

        {feedSubmitted ? (
          <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-5 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-semibold text-emerald-300 mb-0.5">Feed queued!</div>
              <div className="text-sm text-zinc-400">The GIaaS Agent will process it on the next cycle and extract any project data found.</div>
            </div>
            <button onClick={() => { setFeedSubmitted(false); setFeedUrl(""); setFeedDocUrl(""); setFeedText(""); setFeedTitle(""); }} className="ml-auto text-xs text-zinc-500 hover:text-zinc-300">
              Submit another
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">

            {/* Feed type tabs */}
            <div>
              <label className="text-xs text-zinc-400 mb-2 block font-medium">Data Type</label>
              <div className="flex gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1 w-fit">
                {([
                  { key: "url",          label: "🌐 Web URL",       desc: "Article, news, project page" },
                  { key: "document_url", label: "📄 Document Link", desc: "PDF, Google Doc, report" },
                  { key: "text",         label: "📋 Paste Text",    desc: "Copy & paste any content" },
                ] as { key: FeedType; label: string; desc: string }[]).map(opt => (
                  <button key={opt.key} type="button" onClick={() => setFeedType(opt.key)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      feedType === opt.key ? "bg-emerald-700 text-white" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional title */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Source Title (optional)</label>
              <input
                value={feedTitle} onChange={e => setFeedTitle(e.target.value)}
                placeholder="e.g. IRENA Africa Renewable Energy Report 2024"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
              />
            </div>

            {/* URL / document URL / text */}
            {feedType === "url" && (
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Web URL *</label>
                <input
                  type="url" value={feedUrl} onChange={e => setFeedUrl(e.target.value)}
                  placeholder="https://example.com/africa-green-investment-report"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
                />
                <p className="text-xs text-zinc-600 mt-1">The agent will fetch and read the page content.</p>
              </div>
            )}

            {feedType === "document_url" && (
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Document URL *</label>
                <input
                  type="url" value={feedDocUrl} onChange={e => setFeedDocUrl(e.target.value)}
                  placeholder="https://drive.google.com/… or https://example.com/report.pdf"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
                />
                <p className="text-xs text-zinc-600 mt-1">Public PDF, Google Docs (export link), or similar. The agent will read it directly.</p>
              </div>
            )}

            {feedType === "text" && (
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Paste Content * (min 50 chars)</label>
                <textarea
                  value={feedText} onChange={e => setFeedText(e.target.value)} rows={6}
                  placeholder="Paste the article text, report excerpt, press release, or any content describing green investment projects in Africa…"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none"
                />
                <div className="text-xs text-zinc-600 mt-1 text-right">{feedText.length} / 50,000</div>
              </div>
            )}

            {/* Country hints */}
            <div>
              <label className="text-xs text-zinc-400 mb-2 block">Countries Referenced (optional — helps agent focus)</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {AFRICAN_COUNTRIES.slice(0, 20).map(c => (
                  <button key={c.iso3} type="button"
                    onClick={() => setFeedCountries(prev => prev.includes(c.iso3) ? prev.filter(x => x !== c.iso3) : [...prev, c.iso3])}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      feedCountries.includes(c.iso3)
                        ? "border-emerald-600 bg-emerald-900/30 text-emerald-300"
                        : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {c.flag} {c.name}
                  </button>
                ))}
                {/* Show countries added from More... as removable chips */}
                {feedCountries.filter(iso3 => !AFRICAN_COUNTRIES.slice(0, 20).find(c => c.iso3 === iso3)).map(iso3 => {
                  const c = AFRICAN_COUNTRIES.find(x => x.iso3 === iso3);
                  if (!c) return null;
                  return (
                    <button key={iso3} type="button"
                      onClick={() => setFeedCountries(prev => prev.filter(x => x !== iso3))}
                      className="text-xs px-2.5 py-1 rounded-full border border-emerald-600 bg-emerald-900/30 text-emerald-300 flex items-center gap-1"
                    >
                      {c.flag} {c.name} <span className="text-emerald-500 ml-0.5">×</span>
                    </button>
                  );
                })}
                <select
                  onChange={e => {
                    const val = e.target.value;
                    if (val && val.length >= 2 && !feedCountries.includes(val)) {
                      setFeedCountries(prev => [...prev, val]);
                    }
                    e.target.value = "";
                  }}
                  className="text-xs bg-zinc-950 border border-zinc-700 text-zinc-400 rounded-full px-2 py-1 focus:outline-none"
                >
                  <option value="">+ More…</option>
                  {AFRICAN_COUNTRIES.slice(20).map(c => (
                    <option key={c.iso3} value={c.iso3}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sector hints */}
            <div>
              <label className="text-xs text-zinc-400 mb-2 block">Sectors Covered (optional)</label>
              <div className="flex gap-2">
                {([
                  { key: "renewable_energy", label: "⚡ Renewable Energy" },
                  { key: "reit",             label: "🏗️ REITs" },
                  { key: "agriculture",      label: "🌱 Agriculture" },
                ] as { key: Sector; label: string }[]).map(s => (
                  <button key={s.key} type="button"
                    onClick={() => setFeedSectors(prev => prev.includes(s.key) ? prev.filter(x => x !== s.key) : [...prev, s.key])}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      feedSectors.includes(s.key)
                        ? "border-emerald-600 bg-emerald-900/30 text-emerald-300"
                        : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit feed */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 max-w-xs">
                Submissions are public and will feed the shared GIaaS knowledge base. Do not submit confidential or proprietary data.
              </p>
              <button
                type="button"
                disabled={
                  submitFeed.isPending ||
                  (feedType === "url" && !feedUrl) ||
                  (feedType === "document_url" && !feedDocUrl) ||
                  (feedType === "text" && feedText.length < 50)
                }
                onClick={() => submitFeed.mutate({
                  feedType,
                  url:          feedType === "url"          ? feedUrl    : undefined,
                  documentUrl:  feedType === "document_url" ? feedDocUrl : undefined,
                  textContent:  feedType === "text"         ? feedText   : undefined,
                  title:        feedTitle || undefined,
                  countryHints: feedCountries.filter(x => x.length >= 2).length ? feedCountries.filter(x => x.length >= 2) : undefined,
                  sectorHints:  feedSectors.length   ? feedSectors   : undefined,
                })}
                className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {submitFeed.isPending ? "Submitting…" : "📡 Feed the Agent"}
              </button>
            </div>

            {submitFeed.error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-2">
                {submitFeed.error.message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
