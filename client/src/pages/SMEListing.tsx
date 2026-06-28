import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { COUNTRIES } from "@/lib/scannerData";
import { ERS_GATE, ersBand } from "@/lib/exchangeData";
import {
  Building2, ArrowLeft, Check, Loader2, Plus, X, TrendingUp,
} from "lucide-react";

const STATUS_OPTIONS = ["Seeking capital", "Open to collaboration", "Open to exit", "Seeking partners", "Export bound"];

interface FormState {
  name: string; sector: string; countryCode: string; location: string;
  website: string; foundedYear: string; ownership: string; employees: string;
  summary: string; products: string;
  governance: number; financial: number; innovation: number; market: number;
  statusTags: string[]; certifications: string[]; exportMarkets: string[]; awards: string[];
  contactName: string; contactEmail: string; contactPhone: string;
}

const EMPTY: FormState = {
  name: "", sector: "", countryCode: "", location: "",
  website: "", foundedYear: "", ownership: "", employees: "",
  summary: "", products: "",
  governance: 50, financial: 50, innovation: 50, market: 50,
  statusTags: [], certifications: [], exportMarkets: [], awards: [],
  contactName: "", contactEmail: "", contactPhone: "",
};

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">{label}</label>
      <Input value={value} type={type} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="bg-[#0a1628] border-[#1a2d4a] text-sm h-9" />
    </div>
  );
}

function ChipList({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => { const v = draft.trim(); if (v && !items.includes(v)) onChange([...items, v]); setDraft(""); };
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">{label}</label>
      <div className="flex gap-2 mb-2">
        <Input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder} className="bg-[#0a1628] border-[#1a2d4a] text-sm h-9" />
        <Button type="button" onClick={add} variant="outline" className="h-9 px-3 border-[#1a2d4a] text-slate-300 shrink-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 rounded-full px-2.5 py-1">
              {it}
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="hover:text-white"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Pillar({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200 font-semibold">{value}</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-cyan-400" />
    </div>
  );
}

export default function SMEListing() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [done, setDone] = useState(false);
  const submit = trpc.exchange.submit.useMutation({ onSuccess: () => setDone(true) });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));
  const ers = Math.round((form.governance + form.financial + form.innovation + form.market) / 4);
  const band = ersBand(ers);

  function toggleStatus(s: string) {
    set("statusTags", form.statusTags.includes(s) ? form.statusTags.filter(x => x !== s) : [...form.statusTags, s]);
  }

  function handleSubmit() {
    const country = COUNTRIES.find(c => c.code === form.countryCode);
    submit.mutate({
      name: form.name,
      sector: form.sector,
      countryCode: form.countryCode,
      countryName: country?.name ?? form.countryCode,
      location: form.location || undefined,
      website: form.website || undefined,
      foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
      ownership: form.ownership || undefined,
      employees: form.employees || undefined,
      summary: form.summary || undefined,
      products: form.products || undefined,
      governance: form.governance,
      financial: form.financial,
      innovation: form.innovation,
      market: form.market,
      statusTags: form.statusTags.length ? form.statusTags : undefined,
      certifications: form.certifications.length ? form.certifications : undefined,
      exportMarkets: form.exportMarkets.length ? form.exportMarkets : undefined,
      awards: form.awards.length ? form.awards : undefined,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
    });
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <Check className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-xl font-black text-white">Listing submitted</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Your SME is in the review queue. Once verified it appears on the {ers >= ERS_GATE ? "Capital-Ready" : "Open Innovation"} board
          (self-assessed ERS {ers}). Our team verifies scores before publishing.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#1a2d4a] text-slate-300" onClick={() => { setForm(EMPTY); setDone(false); }}>
            List another
          </Button>
          <Button className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" onClick={() => setLocation("/exchange")}>
            Back to the Exchange
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => setLocation("/exchange")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to the Exchange
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight">List your SME</h1>
            <p className="text-xs text-slate-500">SME Exchange · Phase 1 — discovery only, no capital handled</p>
          </div>
        </div>

        {/* Live ERS preview */}
        <div className="flex items-center justify-between bg-[#0a1628] border border-[#1a2d4a] rounded-lg p-4 my-5">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Self-assessed ERS</div>
            <div className="text-xs text-slate-400">{ers >= ERS_GATE ? "Qualifies for Capital-Ready board" : `Open Innovation board · ${ERS_GATE - ers} to graduate`}</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black" style={{ color: band.color }}>{ers}</div>
            <div className="text-[10px]" style={{ color: band.color }}>{band.label}</div>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Enterprise name *" value={form.name} onChange={v => set("name", v)} placeholder="e.g. Nile Chocolates" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sector *" value={form.sector} onChange={v => set("sector", v)} placeholder="Agro-processing" />
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">Country *</label>
              <select value={form.countryCode} onChange={e => set("countryCode", e.target.value)}
                className="w-full bg-[#0a1628] border border-[#1a2d4a] rounded-md text-sm h-9 px-2">
                <option value="">Select…</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location" value={form.location} onChange={v => set("location", v)} placeholder="City, country" />
            <Field label="Website" value={form.website} onChange={v => set("website", v)} placeholder="https://…" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Founded" value={form.foundedYear} onChange={v => set("foundedYear", v)} placeholder="2018" type="number" />
            <Field label="Ownership" value={form.ownership} onChange={v => set("ownership", v)} placeholder="Women-owned 60%" />
            <Field label="Employees" value={form.employees} onChange={v => set("employees", v)} placeholder="12" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">Summary</label>
            <textarea value={form.summary} onChange={e => set("summary", e.target.value)} rows={3}
              placeholder="What your business does and where it's headed…"
              className="w-full bg-[#0a1628] border border-[#1a2d4a] rounded-md text-sm p-2.5 resize-none" />
          </div>
          <Field label="Products" value={form.products} onChange={v => set("products", v)} placeholder="Key products / services" />

          {/* Status */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">Market status</label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleStatus(s)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                    form.statusTags.includes(s)
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                      : "bg-white/[0.03] border-white/10 text-slate-400 hover:border-slate-600"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ERS self-assessment */}
          <div className="border-t border-[#0f1e35] pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">Readiness self-assessment</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">Rate each pillar honestly — scores are verified by ViralBeat's network before publishing.</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Pillar label="Governance" value={form.governance} onChange={v => set("governance", v)} />
              <Pillar label="Financial health" value={form.financial} onChange={v => set("financial", v)} />
              <Pillar label="Innovation capacity" value={form.innovation} onChange={v => set("innovation", v)} />
              <Pillar label="Market reach" value={form.market} onChange={v => set("market", v)} />
            </div>
          </div>

          <ChipList label="Certifications" items={form.certifications} onChange={v => set("certifications", v)} placeholder="UNBS, ISO 9001…" />
          <ChipList label="Export markets" items={form.exportMarkets} onChange={v => set("exportMarkets", v)} placeholder="Kenya, Rwanda…" />
          <ChipList label="Awards / recognition" items={form.awards} onChange={v => set("awards", v)} placeholder="Top 100 MSMEs…" />

          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#0f1e35]">
            <Field label="Contact name" value={form.contactName} onChange={v => set("contactName", v)} placeholder="Founder / rep" />
            <Field label="Contact email" value={form.contactEmail} onChange={v => set("contactEmail", v)} placeholder="you@company.com" type="email" />
            <Field label="Contact phone" value={form.contactPhone} onChange={v => set("contactPhone", v)} placeholder="+256…" />
          </div>

          {submit.error && <p className="text-xs text-red-400">{submit.error.message}</p>}

          <Button onClick={handleSubmit}
            disabled={form.name.trim().length < 2 || form.sector.trim().length < 2 || !form.countryCode || submit.isPending}
            className="w-full h-11 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 gap-2">
            {submit.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Check className="w-4 h-4" /> Submit listing for review</>}
          </Button>
          <p className="text-center text-[11px] text-slate-600">
            {user ? "Submitted as a verified contributor." : "You can submit anonymously, or sign in to manage your listing."}
          </p>
        </div>
      </div>
    </div>
  );
}
