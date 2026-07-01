import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, Check, AlertTriangle, MapPin, Building2 } from "lucide-react";

// Validator scoring rubric (0–100), independent of the SME's self-assessment.
const RUBRIC: Record<string, { label: string; bands: [string, string, string, string] }> = {
  governance: { label: "Governance", bands: ["No formal structure", "Basic systems, inconsistent", "Documented processes, regular review", "Certified compliance, audit-ready"] },
  financial:  { label: "Financial health", bands: ["No records / negative cash", "Informal tracking, irregular", "Formal accounting, 2–3yr history", "Audited, institutional banking"] },
  innovation: { label: "Innovation capacity", bands: ["No R&D activity", "Ad-hoc improvements", "Systematic product development", "Patent/IP, market-leading"] },
  market:     { label: "Market reach", bands: ["No customers / local only", "<100 customers, 1 region", "100–1000 customers, 2–3 regions", "1000+ customers, multi-country"] },
};

function bandOf(v: number) { return v <= 25 ? 0 : v <= 50 ? 1 : v <= 75 ? 2 : 3; }

function Dim({ k, value, onChange }: { k: keyof typeof RUBRIC; value: number; onChange: (v: number) => void }) {
  const r = RUBRIC[k];
  const bi = bandOf(value);
  const tone = bi === 0 ? "#94a3b8" : bi === 1 ? "#f59e0b" : bi === 2 ? "#38bdf8" : "#22c55e";
  return (
    <div className="rounded-lg border border-[#1a2d4a] bg-[#0a1628] p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-white">{r.label}</span>
        <span className="text-sm font-black" style={{ color: tone }}>{value}<span className="text-xs text-slate-500">/100</span></span>
      </div>
      <p className="text-[11px] text-slate-400 mb-2 min-h-[30px] leading-snug">{r.bands[bi]}</p>
      <input type="range" min={0} max={100} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-cyan-400" />
    </div>
  );
}

export default function ValidatorScore() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const [, setLocation] = useLocation();

  const task = trpc.ersValidation.task.useQuery({ token }, { enabled: token.length > 10 });
  const submit = trpc.ersValidation.submitScore.useMutation();

  const [governance, setGov] = useState(50);
  const [financial, setFin] = useState(50);
  const [innovation, setInn] = useState(50);
  const [market, setMkt] = useState(50);
  const [comment, setComment] = useState("");

  if (task.isLoading) {
    return <div className="min-h-screen bg-[#050b1a] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>;
  }
  if (task.error || !task.data || !task.data.sme) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-3 text-center px-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <h2 className="text-xl font-black text-white">Invalid validation link</h2>
        <p className="text-sm text-slate-400 max-w-sm">This link is not valid. Ask ViralBeat to resend your validator invitation.</p>
      </div>
    );
  }

  const d = task.data;
  const sme = d.sme!;

  if (d.status === "scored" || submit.isSuccess) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <Check className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-xl font-black text-white">Thank you — your scores are in</h2>
        <p className="text-sm text-slate-400 max-w-sm">Your independent assessment of {sme.name} has been recorded. Once three validators submit, the consensus updates their Enterprise Readiness Score.</p>
        <Button variant="outline" className="border-[#1a2d4a] text-slate-300" onClick={() => setLocation("/exchange")}>Go to the Exchange</Button>
      </div>
    );
  }

  if (d.status !== "approved") {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-3 text-center px-4">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <h2 className="text-xl font-black text-white">Not open for scoring</h2>
        <p className="text-sm text-slate-400 max-w-sm">This validation isn't approved for scoring yet. ViralBeat will email you when it's ready.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight">Independent validation</h1>
            <p className="text-xs text-slate-500">Hi {d.validatorName} · blind review — you won't see their self-assessment</p>
          </div>
        </div>

        {/* Blind SME profile */}
        <div className="mt-5 bg-[#0a1628] border border-[#1a2d4a] rounded-xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-1">{sme.sector} · {sme.countryName}</div>
          <div className="flex items-center gap-2 mb-1"><Building2 className="w-4 h-4 text-slate-400" /><span className="text-lg font-black">{sme.name}</span></div>
          {sme.location && <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-2"><MapPin className="w-3.5 h-3.5" /> {sme.location}</div>}
          {sme.summary && <p className="text-sm text-slate-300 leading-relaxed">{sme.summary}</p>}
          {sme.products && <p className="text-sm text-slate-400 mt-2"><span className="text-slate-500">Products:</span> {sme.products}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[11px]">
            {sme.foundedYear ? <div><div className="text-slate-500 uppercase tracking-wider">Founded</div><div className="text-slate-200 font-semibold">{sme.foundedYear}</div></div> : null}
            {sme.employees ? <div><div className="text-slate-500 uppercase tracking-wider">Employees</div><div className="text-slate-200 font-semibold">{sme.employees}</div></div> : null}
            {sme.ownership ? <div><div className="text-slate-500 uppercase tracking-wider">Ownership</div><div className="text-slate-200 font-semibold">{sme.ownership}</div></div> : null}
            {sme.exportMarkets.length ? <div><div className="text-slate-500 uppercase tracking-wider">Exports</div><div className="text-slate-200 font-semibold">{sme.exportMarkets.join(", ")}</div></div> : null}
          </div>
          {sme.certifications.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {sme.certifications.map(c => <span key={c} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-slate-300">{c}</span>)}
            </div>
          )}
        </div>

        <p className="text-[12px] text-slate-400 mt-5 mb-3">Score each dimension from what you know of this enterprise. Rate honestly — your accuracy is tracked over time and builds your validator reputation.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Dim k="governance" value={governance} onChange={setGov} />
          <Dim k="financial" value={financial} onChange={setFin} />
          <Dim k="innovation" value={innovation} onChange={setInn} />
          <Dim k="market" value={market} onChange={setMkt} />
        </div>

        <div className="mt-4">
          <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">Why did you score them this way? (optional)</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
            placeholder="Briefly justify your assessment…"
            className="w-full bg-[#0a1628] border border-[#1a2d4a] rounded-md text-sm p-2.5 resize-none" />
        </div>

        {submit.error && <p className="text-xs text-red-400 mt-3">{submit.error.message}</p>}
        <Button className="w-full mt-4 bg-cyan-500 text-[#04222b] font-bold gap-2"
          disabled={submit.isPending}
          onClick={() => submit.mutate({ token, governance, financial, innovation, market, comment: comment || undefined })}>
          {submit.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Check className="w-4 h-4" /> Submit my scores</>}
        </Button>
        <p className="text-[11px] text-slate-600 mt-3 text-center">Your scores are combined with other validators; individual scores stay confidential.</p>
      </div>
    </div>
  );
}
