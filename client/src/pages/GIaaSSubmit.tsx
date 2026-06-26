import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";

type ObsType = "site_visit" | "photo" | "community_report" | "sensor";
type ConfidenceLevel = "low" | "medium" | "high";

const OBS_OPTIONS: { key: ObsType; label: string; icon: string; desc: string; vbt: number }[] = [
  { key: "site_visit",        label: "Site Visit",         icon: "🚶", desc: "You physically visited the project location", vbt: 40 },
  { key: "photo",             label: "Photo Evidence",     icon: "📷", desc: "You have photographic documentation",         vbt: 30 },
  { key: "community_report",  label: "Community Report",   icon: "👥", desc: "Report from local community members",         vbt: 25 },
  { key: "sensor",            label: "Sensor Reading",     icon: "📡", desc: "Verified sensor or meter data",               vbt: 20 },
];

const CONFIDENCE_OPTIONS: { key: ConfidenceLevel; label: string; bonus: number }[] = [
  { key: "low",    label: "Low — rough estimate",         bonus: 0  },
  { key: "medium", label: "Medium — reasonably confident", bonus: 0  },
  { key: "high",   label: "High — verified data",          bonus: 15 },
];

export default function GIaaSSubmit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const [obsType, setObsType]         = useState<ObsType>("site_visit");
  const [content, setContent]         = useState("");
  const [confirms, setConfirms]       = useState<boolean>(true);
  const [confidence, setConfidence]   = useState<ConfidenceLevel>("medium");
  const [photoUrls, setPhotoUrls]     = useState<string[]>([""]);
  const [geoLat, setGeoLat]           = useState<number | undefined>();
  const [geoLng, setGeoLng]           = useState<number | undefined>();
  const [geoLoading, setGeoLoading]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const submit = trpc.giaas.submissionsSubmit.useMutation();
  const { data: project } = trpc.giaas.projectsGet.useQuery(
    { projectId: id },
    { enabled: !!id }
  );

  const selectedObs    = OBS_OPTIONS.find(o => o.key === obsType)!;
  const selectedConf   = CONFIDENCE_OPTIONS.find(c => c.key === confidence)!;
  const estimatedVbt   = (confirms ? selectedObs.vbt : selectedObs.vbt + 15) + selectedConf.bonus;

  function detectGeo() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setGeoLat(pos.coords.latitude); setGeoLng(pos.coords.longitude); setGeoLoading(false); },
      ()  => setGeoLoading(false)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || content.length < 20) return;

    const urls = photoUrls.filter(u => u.trim().length > 0);
    const result = await submit.mutateAsync({
      projectId:       id,
      observationType: obsType,
      content:         content.trim(),
      confirms,
      confidenceLevel: confidence,
      photoUrls:       urls.length ? urls : undefined,
      geoLat,
      geoLng,
    });

    setSubmissionId(result.submissionId);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">🌿</div>
          <h1 className="text-2xl font-bold mb-2">Observation Submitted!</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Your field data is under review. Once approved, you'll receive up to{" "}
            <span className="text-emerald-400 font-semibold">{estimatedVbt} VBT</span> in your wallet.
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500 mb-6">
            Submission ID: <span className="font-mono text-zinc-300">{submissionId}</span>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setLocation(`/green/${id}`)}
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8 max-w-2xl mx-auto">

      {/* Back */}
      <button
        onClick={() => id ? setLocation(`/green/${id}`) : setLocation("/green")}
        className="text-zinc-500 hover:text-zinc-300 text-sm mb-6 flex items-center gap-1"
      >
        ← {project?.project?.title ?? "Back"}
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-900/30 border border-emerald-700/40 px-2 py-0.5 rounded">
            GIaaS × VB
          </span>
        </div>
        <h1 className="text-2xl font-bold">Submit Field Observation</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Ground-truth data earns VBT tokens. Disputes earn more — honest reporting matters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Observation type */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-3 block">Observation Type</label>
          <div className="grid grid-cols-2 gap-3">
            {OBS_OPTIONS.map(o => (
              <button
                key={o.key}
                type="button"
                onClick={() => setObsType(o.key)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  obsType === o.key
                    ? "border-emerald-600 bg-emerald-900/20"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <div className="text-xl mb-1">{o.icon}</div>
                <div className="text-sm font-medium text-zinc-200">{o.label}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{o.desc}</div>
                <div className="text-xs text-emerald-400 mt-1">~{o.vbt} VBT base</div>
              </button>
            ))}
          </div>
        </div>

        {/* Confirms or disputes */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-3 block">
            Does your observation support or dispute the developer's claims?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfirms(true)}
              className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                confirms
                  ? "border-emerald-600 bg-emerald-900/30 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              ✅ Supports Claims
            </button>
            <button
              type="button"
              onClick={() => setConfirms(false)}
              className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                !confirms
                  ? "border-red-700 bg-red-900/20 text-red-300"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              ⚠️ Disputes Claims
            </button>
          </div>
          {!confirms && (
            <p className="text-xs text-yellow-400 mt-2">
              Disputes earn +15 VBT bonus — honest reporting is critical for accountability.
            </p>
          )}
        </div>

        {/* Content */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-2 block">
            Observation Details <span className="text-zinc-500">(min 20 chars)</span>
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
            placeholder="Describe what you observed at the project site or from community feedback. Be specific — dates, measurements, and direct observations carry more weight."
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none"
            required
          />
          <div className="text-xs text-zinc-600 mt-1 text-right">{content.length} chars</div>
        </div>

        {/* Confidence */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-3 block">Confidence Level</label>
          <div className="space-y-2">
            {CONFIDENCE_OPTIONS.map(c => (
              <button
                key={c.key}
                type="button"
                onClick={() => setConfidence(c.key)}
                className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                  confidence === c.key
                    ? "border-emerald-600 bg-emerald-900/20 text-emerald-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {c.label}
                {c.bonus > 0 && <span className="text-emerald-400 ml-2">+{c.bonus} VBT</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Geo */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-2 block">Location (optional)</label>
          <button
            type="button"
            onClick={detectGeo}
            disabled={geoLoading}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {geoLoading ? "Detecting…" : "📍 Use My Location"}
          </button>
          {geoLat && geoLng && (
            <span className="ml-3 text-xs text-emerald-400">
              {geoLat.toFixed(5)}, {geoLng.toFixed(5)}
            </span>
          )}
        </div>

        {/* Photo URLs (MVP: link-based) */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-2 block">
            Photo Links <span className="text-zinc-500">(optional, up to 5 URLs)</span>
          </label>
          {photoUrls.map((url, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="url"
                value={url}
                onChange={e => {
                  const next = [...photoUrls];
                  next[i] = e.target.value;
                  setPhotoUrls(next);
                }}
                placeholder="https://…"
                className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-emerald-600 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
              />
              {photoUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPhotoUrls(photoUrls.filter((_, j) => j !== i))}
                  className="text-zinc-600 hover:text-zinc-400 text-lg px-2"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {photoUrls.length < 5 && (
            <button
              type="button"
              onClick={() => setPhotoUrls([...photoUrls, ""])}
              className="text-xs text-zinc-500 hover:text-zinc-300 mt-1"
            >
              + Add another URL
            </button>
          )}
        </div>

        {/* VBT estimate + submit */}
        <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 mb-0.5">Estimated reward (on approval)</div>
            <div className="text-2xl font-bold text-emerald-400">{estimatedVbt} <span className="text-sm text-zinc-400">VBT</span></div>
          </div>
          <button
            type="submit"
            disabled={submit.isPending || content.length < 20}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            {submit.isPending ? "Submitting…" : "Submit Observation"}
          </button>
        </div>

        {submit.error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-2">
            {submit.error.message}
          </div>
        )}
      </form>
    </div>
  );
}
