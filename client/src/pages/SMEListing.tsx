import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { TopNav } from "@/components/TopNav";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { COUNTRIES } from "@/lib/scannerData";
import { ERS_GATE, ersBand } from "@/lib/exchangeData";
import { parseListingDocx } from "@/lib/docxImport";
import {
  Building2, ArrowLeft, Check, Loader2, Plus, X, TrendingUp, Lock, AlertTriangle,
  Download, Upload, FileText,
} from "lucide-react";

const STATUS_OPTIONS = ["Seeking capital", "Open to collaboration", "Open to exit", "Seeking partners", "Export bound"];
type ListedByType = "self" | "incubator" | "accelerator";

interface FormState {
  name: string; sector: string; countryCode: string; location: string;
  website: string; foundedYear: string; ownership: string; employees: string;
  summary: string; products: string;
  governance: number; financial: number; innovation: number; market: number;
  statusTags: string[]; certifications: string[]; exportMarkets: string[]; awards: string[];
  contactName: string; contactEmail: string; contactPhone: string;
  listedByType: ListedByType; listedByOrg: string;
}

const EMPTY: FormState = {
  name: "", sector: "", countryCode: "", location: "",
  website: "", foundedYear: "", ownership: "", employees: "",
  summary: "", products: "",
  governance: 50, financial: 50, innovation: 50, market: 50,
  statusTags: [], certifications: [], exportMarkets: [], awards: [],
  contactName: "", contactEmail: "", contactPhone: "",
  listedByType: "self", listedByOrg: "",
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
      <input type="range" min={0} max={100} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-cyan-400" />
    </div>
  );
}

export default function SMEListing() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const editId = params.id ? Number(params.id) : undefined;
  const isEdit = editId != null && !Number.isNaN(editId);
  const { user, loading } = useAuth();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [done, setDone] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const existing = trpc.exchange.getOne.useQuery({ id: editId! }, { enabled: isEdit && !!user });
  const submit = trpc.exchange.submit.useMutation({ onSuccess: () => setDone(true) });
  const update = trpc.exchange.update.useMutation({ onSuccess: () => setDone(true) });
  const busy = submit.isPending || update.isPending;
  const err = submit.error || update.error;

  // Prefill the form once when editing
  useEffect(() => {
    if (isEdit && existing.data && !prefilled) {
      const r = existing.data;
      setForm({
        name: r.name, sector: r.sector, countryCode: r.countryCode, location: r.location ?? "",
        website: r.website ?? "", foundedYear: r.foundedYear ? String(r.foundedYear) : "",
        ownership: r.ownership ?? "", employees: r.employees ?? "",
        summary: r.summary ?? "", products: r.products ?? "",
        governance: r.governance ?? 50, financial: r.financial ?? 50,
        innovation: r.innovation ?? 50, market: r.market ?? 50,
        statusTags: (r.statusTags as string[]) ?? [],
        certifications: (r.certifications as string[]) ?? [],
        exportMarkets: (r.exportMarkets as string[]) ?? [],
        awards: (r.awards as string[]) ?? [],
        contactName: r.contactName ?? "", contactEmail: r.contactEmail ?? "", contactPhone: r.contactPhone ?? "",
        listedByType: (r.listedByType as ListedByType) ?? "self", listedByOrg: r.listedByOrg ?? "",
      });
      setPrefilled(true);
    }
  }, [isEdit, existing.data, prefilled]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  async function handleImport(file: File) {
    setImportErr(null); setImportMsg(null);
    try {
      const buf = await file.arrayBuffer();
      const { data, filledCount } = parseListingDocx(buf);
      if (filledCount === 0) {
        setImportErr("No answers found. Make sure you typed into the 'Your answer' column and saved as .docx.");
        return;
      }
      setForm(f => ({
        ...f,
        name: data.name ?? f.name,
        sector: data.sector ?? f.sector,
        countryCode: data.countryCode ?? f.countryCode,
        location: data.location ?? f.location,
        website: data.website ?? f.website,
        foundedYear: data.foundedYear ?? f.foundedYear,
        ownership: data.ownership ?? f.ownership,
        employees: data.employees ?? f.employees,
        summary: data.summary ?? f.summary,
        products: data.products ?? f.products,
        governance: data.governance ?? f.governance,
        financial: data.financial ?? f.financial,
        innovation: data.innovation ?? f.innovation,
        market: data.market ?? f.market,
        statusTags: data.statusTags ?? f.statusTags,
        certifications: data.certifications ?? f.certifications,
        exportMarkets: data.exportMarkets ?? f.exportMarkets,
        awards: data.awards ?? f.awards,
        contactName: data.contactName ?? f.contactName,
        contactEmail: data.contactEmail ?? f.contactEmail,
        contactPhone: data.contactPhone ?? f.contactPhone,
        listedByType: data.listedByType ?? f.listedByType,
        listedByOrg: data.listedByOrg ?? f.listedByOrg,
      }));
      const countryNote = !data.countryCode ? " Pick your country from the dropdown if it's blank." : "";
      setImportMsg(`Imported ${filledCount} field${filledCount === 1 ? "" : "s"} — review everything below, then submit.${countryNote}`);
    } catch (e: any) {
      setImportErr(e?.message ?? "Could not read that file. Please upload the completed .docx template.");
    }
  }

  const ers = Math.round((form.governance + form.financial + form.innovation + form.market) / 4);
  const band = ersBand(ers);
  const wasApproved = isEdit && existing.data?.status === "approved";

  function toggleStatus(s: string) {
    set("statusTags", form.statusTags.includes(s) ? form.statusTags.filter(x => x !== s) : [...form.statusTags, s]);
  }

  function handleSubmit() {
    const country = COUNTRIES.find(c => c.code === form.countryCode);
    const payload = {
      name: form.name, sector: form.sector, countryCode: form.countryCode,
      countryName: country?.name ?? form.countryCode,
      location: form.location || undefined, website: form.website || undefined,
      foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
      ownership: form.ownership || undefined, employees: form.employees || undefined,
      summary: form.summary || undefined, products: form.products || undefined,
      governance: form.governance, financial: form.financial, innovation: form.innovation, market: form.market,
      statusTags: form.statusTags.length ? form.statusTags : undefined,
      certifications: form.certifications.length ? form.certifications : undefined,
      exportMarkets: form.exportMarkets.length ? form.exportMarkets : undefined,
      awards: form.awards.length ? form.awards : undefined,
      contactName: form.contactName || undefined, contactEmail: form.contactEmail || undefined, contactPhone: form.contactPhone || undefined,
      listedByType: form.listedByType,
      listedByOrg: form.listedByType === "self" ? undefined : (form.listedByOrg || undefined),
    };
    if (isEdit) update.mutate({ id: editId!, ...payload });
    else submit.mutate(payload);
  }

  // ── Gates ──────────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="min-h-screen bg-[#050b1a] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>;
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-4 text-center px-4">
        <Lock className="w-10 h-10 text-slate-600" />
        <h2 className="text-xl font-black text-white">Sign in to list your SME</h2>
        <p className="text-sm text-slate-400 max-w-sm">Listings require an account so you can manage and update them later.</p>
        <Button className="bg-cyan-500 text-[#04222b] font-bold" onClick={() => { window.location.href = getLoginUrl(); }}>Sign in</Button>
        <button onClick={() => setLocation("/exchange")} className="text-xs text-slate-500 hover:text-cyan-400">Back to the Exchange</button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <Check className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-xl font-black text-white">{isEdit ? "Listing updated" : "Listing submitted"}</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          {isEdit ? "Your changes are pending re-review before they go live again." : "Your SME is in the review queue."}{" "}
          Once verified it appears on the {ers >= ERS_GATE ? "Capital-Ready" : "Open Innovation"} board (self-assessed ERS {ers}).
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#1a2d4a] text-slate-300" onClick={() => setLocation("/exchange/mine")}>My listings</Button>
          <Button className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" onClick={() => setLocation("/exchange")}>Back to the Exchange</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <TopNav />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => setLocation(isEdit ? "/exchange/mine" : "/exchange")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> {isEdit ? "My listings" : "Back to the Exchange"}
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight">{isEdit ? "Edit listing" : "List your SME"}</h1>
            <p className="text-xs text-slate-500">SME Exchange · Phase 1 — discovery only, no capital handled</p>
          </div>
        </div>

        {/* Value proposition — new listings only */}
        {!isEdit && (
          <div className="mt-5 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.07] to-purple-500/[0.05] p-5">
            <h2 className="text-base font-black text-white mb-1.5">
              Get discovered by the people who fund and partner with businesses like yours.
            </h2>
            <p className="text-[13px] text-slate-300 leading-relaxed mb-3">
              Put your enterprise in front of investors, development finance institutions, and large corporates
              actively looking for African SMEs to back, buy from, and partner with.
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5 mb-3">
              {[
                ["Build a verified track record", "Your Enterprise Readiness Score turns governance, finances, innovation and reach into one credible signal — no pitch deck needed."],
                ["Be found, not lost", "The right investor finds you by country, sector and readiness — instead of you cold-emailing hundreds."],
                ["Talk safely, on your terms", "Interested parties reach out through the platform. Your contact details stay private until you accept."],
                ["Free to list, no fees to connect", "Phase 1 is pure discovery. ViralBeat never handles your money or charges to introduce you."],
              ].map(([t, d]) => (
                <div key={t} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold text-white">{t}</div>
                    <div className="text-[11px] text-slate-400 leading-snug">{d}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-cyan-300 font-semibold">
              Takes 5 minutes — or download the Word template below and we'll fill it in for you.
            </p>
          </div>
        )}

        {wasApproved && (
          <div className="flex items-start gap-2 text-[12px] text-amber-300 bg-amber-500/8 border border-amber-500/25 rounded-lg p-3 mt-5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>This listing is currently published. Saving changes returns it to review, and it will be temporarily hidden from the exchange until re-approved.</p>
          </div>
        )}

        {/* Offline template — download / upload */}
        {!isEdit && (
          <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
            <div className="flex items-start gap-2 mb-3">
              <FileText className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-white">Prefer to prepare offline?</div>
                <p className="text-[12px] text-slate-400">Download the Word template, complete it, then upload it here — we'll fill the form for you to review and submit.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/VB_SME_Listing_Template.docx" download
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-slate-200 hover:bg-white/[0.08]">
                <Download className="w-3.5 h-3.5" /> Download template (.docx)
              </a>
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Upload completed document
                <input type="file" accept=".docx" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.currentTarget.value = ""; }} />
              </label>
            </div>
            {importMsg && <p className="text-[12px] text-emerald-400 mt-2 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> {importMsg}</p>}
            {importErr && <p className="text-[12px] text-red-400 mt-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {importErr}</p>}
          </div>
        )}

        {/* Who is listing */}
        <div className="mt-5">
          <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">Listing on behalf of</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {([["self", "My own SME"], ["incubator", "An incubator"], ["accelerator", "An accelerator"]] as [ListedByType, string][]).map(([t, lbl]) => (
              <button key={t} type="button" onClick={() => set("listedByType", t)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  form.listedByType === t ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300" : "bg-white/[0.03] border-white/10 text-slate-400 hover:border-slate-600"}`}>
                {lbl}
              </button>
            ))}
          </div>
          {form.listedByType !== "self" && (
            <Field label={`${form.listedByType === "incubator" ? "Incubator" : "Accelerator"} name *`} value={form.listedByOrg}
              onChange={v => set("listedByOrg", v)} placeholder="e.g. NSE Ibuka, MEST" />
          )}
          {form.listedByType !== "self" && (
            <p className="text-[11px] text-slate-500 mt-1.5">The listing will be publicly attributed to this {form.listedByType} as the lodging party.</p>
          )}
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
                    form.statusTags.includes(s) ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300" : "bg-white/[0.03] border-white/10 text-slate-400 hover:border-slate-600"}`}>
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

          {err && <p className="text-xs text-red-400">{err.message}</p>}

          <Button onClick={handleSubmit}
            disabled={form.name.trim().length < 2 || form.sector.trim().length < 2 || !form.countryCode
              || (form.listedByType !== "self" && form.listedByOrg.trim().length < 2) || busy}
            className="w-full h-11 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 gap-2">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> {isEdit ? "Save changes (re-review)" : "Submit listing for review"}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
