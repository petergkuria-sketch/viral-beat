import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { COUNTRIES, OSS_DATA } from "@/lib/scannerData";
import {
  Building2, ArrowLeft, Check, Loader2, Plus, X, Info,
} from "lucide-react";

// A known real example to seed Uganda's OSS so contributors see the expected shape.
const EXAMPLES: Record<string, Partial<FormState>> = {
  UGA: {
    name: "Uganda Free Zones and Export Promotion Authority",
    acronym: "UFZEPA",
    mandate: "Establishes, develops, and regulates free zones; promotes exports and facilitates investment into Uganda's special economic zones.",
    location: "Kampala, Uganda",
    website: "https://www.ufzepa.go.ug",
    operatingHours: "Mon–Fri, 8:00–17:00 EAT",
    legalBasis: "Free Zones Act, 2014 (as amended)",
    established: "2014",
    services: ["Free zone licensing", "Investment facilitation", "Export promotion", "One-stop aftercare"],
    offers: ["Corporate tax holidays", "Duty-free imports of inputs", "VAT exemptions in zones"],
    linkedZones: ["Kampala Industrial Business Park", "Sino-Uganda Mbale Industrial Park"],
  },
};

interface FormState {
  name: string;
  acronym: string;
  mandate: string;
  location: string;
  website: string;
  operatingHours: string;
  legalBasis: string;
  established: string;
  services: string[];
  offers: string[];
  linkedZones: string[];
  sourceUrl: string;
  notes: string;
  contributorName: string;
  contributorEmail: string;
}

const EMPTY: FormState = {
  name: "", acronym: "", mandate: "", location: "", website: "",
  operatingHours: "", legalBasis: "", established: "",
  services: [], offers: [], linkedZones: [],
  sourceUrl: "", notes: "", contributorName: "", contributorEmail: "",
};

function ChipList({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setDraft("");
  };
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">{label}</label>
      <div className="flex gap-2 mb-2">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="bg-[#0a1628] border-[#1a2d4a] text-sm h-9"
        />
        <Button type="button" onClick={add} variant="outline"
          className="h-9 px-3 border-[#1a2d4a] text-slate-300 shrink-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 rounded-full px-2.5 py-1">
              {it}
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

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

export default function OSSContribute() {
  const params = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const code = (params.code ?? "").toUpperCase();

  const country = COUNTRIES.find(c => c.code === code);
  const existing = OSS_DATA[code] ?? null;
  const kind: "new" | "update" = existing?.exists ? "update" : "new";

  const [form, setForm] = useState<FormState>(EMPTY);
  const [done, setDone] = useState(false);
  const submit = trpc.oss.submit.useMutation({ onSuccess: () => setDone(true) });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  function prefillExample() {
    const ex = EXAMPLES[code];
    if (ex) setForm({ ...EMPTY, ...ex } as FormState);
  }

  function handleSubmit() {
    if (!country) return;
    submit.mutate({
      countryCode: code,
      countryName: country.name,
      kind,
      name: form.name,
      acronym: form.acronym || undefined,
      mandate: form.mandate || undefined,
      location: form.location || undefined,
      website: form.website || undefined,
      operatingHours: form.operatingHours || undefined,
      legalBasis: form.legalBasis || undefined,
      established: form.established ? Number(form.established) : undefined,
      services: form.services.length ? form.services : undefined,
      offers: form.offers.length ? form.offers : undefined,
      linkedZones: form.linkedZones.length ? form.linkedZones : undefined,
      sourceUrl: form.sourceUrl || undefined,
      notes: form.notes || undefined,
      contributorName: form.contributorName || undefined,
      contributorEmail: form.contributorEmail || undefined,
    });
  }

  if (!country) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-3 text-center px-4">
        <Building2 className="w-10 h-10 text-slate-700" />
        <p className="text-slate-400 font-semibold">Unknown country code “{code}”.</p>
        <Button variant="outline" className="border-[#1a2d4a] text-slate-300" onClick={() => setLocation("/scanner")}>
          Back to Scanner
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <Check className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-xl font-black text-white">Contribution received</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Thank you for helping map {country.flag} {country.name}'s investment-facilitation landscape.
          Our team will verify your submission before it appears on the profile.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#1a2d4a] text-slate-300" onClick={() => { setForm(EMPTY); setDone(false); }}>
            Add another
          </Button>
          <Button className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" onClick={() => setLocation(`/scanner/${code}`)}>
            Back to {country.name}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => setLocation(`/scanner/${code}`)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {country.name} profile
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight">
              {kind === "update" ? "Update" : "Add"} One-Stop-Shop data
            </h1>
            <p className="text-xs text-slate-500">{country.flag} {country.name} · Investment Facilitation</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-[12px] text-slate-400 bg-[#0a1628] border border-[#1a2d4a] rounded-lg p-3 my-5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            Help the community map every African OSS. An OSS is an investment-facilitation agency — for
            example, Uganda's <span className="text-cyan-300 font-semibold">UFZEPA</span> (Free Zones &amp; Export Promotion Authority).
            Submissions are reviewed before publishing.
            {EXAMPLES[code] && (
              <> {" "}<button onClick={prefillExample} className="text-cyan-400 underline hover:text-cyan-300">Pre-fill the {code} example</button> to see the expected shape.</>
            )}
          </p>
        </div>

        <div className="space-y-4">
          <Field label="OSS / agency name *" value={form.name} onChange={v => set("name", v)} placeholder="e.g. Uganda Free Zones and Export Promotion Authority" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Acronym" value={form.acronym} onChange={v => set("acronym", v)} placeholder="UFZEPA" />
            <Field label="Established (year)" value={form.established} onChange={v => set("established", v)} placeholder="2014" type="number" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">Mandate</label>
            <textarea value={form.mandate} onChange={e => set("mandate", e.target.value)} rows={3}
              placeholder="What the agency does for investors…"
              className="w-full bg-[#0a1628] border border-[#1a2d4a] rounded-md text-sm p-2.5 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location" value={form.location} onChange={v => set("location", v)} placeholder="Kampala, Uganda" />
            <Field label="Website" value={form.website} onChange={v => set("website", v)} placeholder="https://…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Operating hours" value={form.operatingHours} onChange={v => set("operatingHours", v)} placeholder="Mon–Fri, 8:00–17:00" />
            <Field label="Legal basis" value={form.legalBasis} onChange={v => set("legalBasis", v)} placeholder="Free Zones Act, 2014" />
          </div>

          <ChipList label="Services offered" items={form.services} onChange={v => set("services", v)} placeholder="Add a service, press Enter" />
          <ChipList label="Incentives / offers" items={form.offers} onChange={v => set("offers", v)} placeholder="Add an incentive, press Enter" />
          <ChipList label="Linked free zones / SEZs" items={form.linkedZones} onChange={v => set("linkedZones", v)} placeholder="Add a zone, press Enter" />

          <Field label="Source / evidence URL" value={form.sourceUrl} onChange={v => set("sourceUrl", v)} placeholder="Link supporting your data" />
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">Notes for reviewers</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              placeholder="Anything that helps verification…"
              className="w-full bg-[#0a1628] border border-[#1a2d4a] rounded-md text-sm p-2.5 resize-none" />
          </div>

          {!user && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#0f1e35]">
              <Field label="Your name" value={form.contributorName} onChange={v => set("contributorName", v)} placeholder="For attribution" />
              <Field label="Your email" value={form.contributorEmail} onChange={v => set("contributorEmail", v)} placeholder="For follow-up" type="email" />
            </div>
          )}

          {submit.error && (
            <p className="text-xs text-red-400">{submit.error.message}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={form.name.trim().length < 2 || submit.isPending}
            className="w-full h-11 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 gap-2">
            {submit.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              : <><Check className="w-4 h-4" /> Submit {kind === "update" ? "update" : "OSS data"} for review</>}
          </Button>
          <p className="text-center text-[11px] text-slate-600">
            {user ? "Submitted as a verified contributor." : "You can submit anonymously, or sign in for attribution and VBT rewards."}
          </p>
        </div>
      </div>
    </div>
  );
}
