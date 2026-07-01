import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileCheck2, Loader2, Check, ShieldAlert, Plus, Upload, Gavel } from "lucide-react";

const TIERS: { tier: "foundation" | "verification" | "compliance"; title: string; note: string; types: [string, string][] }[] = [
  { tier: "foundation", title: "Tier 1 — Foundation", note: "All four are mandatory. A gap or fraud flag here vetoes verification.", types: [
    ["business_registration", "Business registration certificate"],
    ["tax_compliance", "Tax compliance certificate (last 2 years)"],
    ["bank_statements", "Bank statements (last 6 months)"],
    ["ownership", "Ownership / organisational structure"],
  ] },
  { tier: "verification", title: "Tier 2 — Verification (submit 2+)", note: "", types: [
    ["certifications", "Industry certifications (NAFDAC / FDA / ISO…)"],
    ["customer_references", "Customer references (3+ letters)"],
    ["financial_statements", "Financial statements (audited / reviewed)"],
  ] },
  { tier: "compliance", title: "Tier 3 — Compliance (submit 1+)", note: "", types: [
    ["env_labor", "Environmental / labour compliance"],
    ["insurance", "Insurance certificates"],
    ["ip", "Intellectual property documentation"],
    ["export_license", "Export / import licenses"],
  ] },
];

const CHIP: Record<string, string> = {
  verified: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  pending:  "text-amber-300 bg-amber-500/10 border-amber-500/25",
  rejected: "text-red-300 bg-red-500/10 border-red-500/25",
  flagged:  "text-red-300 bg-red-500/12 border-red-500/40",
};

/** SME-owner Layer 3 panel: submit document references, see gateway status. */
export function DocumentGateway({ listingId }: { listingId: number }) {
  const q = trpc.ersDocuments.mine.useQuery({ listingId });
  const storage = trpc.ersDocuments.storageEnabled.useQuery();
  const submit = trpc.ersDocuments.submit.useMutation({ onSuccess: () => { q.refetch(); setOpen(null); } });
  const uploadUrl = trpc.ersDocuments.uploadUrl.useMutation();
  const appeals = trpc.ersDocuments.myAppeals.useQuery({ listingId });
  const submitAppeal = trpc.ersDocuments.submitAppeal.useMutation({ onSuccess: () => { appeals.refetch(); setAppealText(""); setAppealOpen(false); } });
  const [open, setOpen] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [reference, setReference] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealText, setAppealText] = useState("");
  const canUpload = storage.data?.enabled;

  async function handleFile(tier: "foundation" | "verification" | "compliance", docType: string, file: File) {
    setUploading(docType);
    try {
      const ext = file.name.split(".").pop() ?? "";
      const { uploadUrl: url, reference: ref } = await uploadUrl.mutateAsync({ listingId, docType, contentType: file.type || "application/octet-stream", ext });
      const put = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
      if (!put.ok) throw new Error("Upload failed");
      await submit.mutateAsync({ listingId, tier, docType, label: label || file.name, reference: ref });
    } catch { /* surfaced via submit.error */ } finally { setUploading(null); }
  }

  const docs = q.data?.docs ?? [];
  const byType = new Map(docs.map(d => [d.docType, d]));
  const g = q.data?.gateway;

  const openForm = (t: string) => { const d = byType.get(t); setLabel(d?.label ?? ""); setReference(""); setOpen(open === t ? null : t); };

  return (
    <div className="mt-3 border-t border-white/[0.06] pt-3">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <div className="flex items-center gap-1.5 text-[12px] text-slate-300">
          <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
          Document gateway — final step
          {g && <span className="text-slate-500">· {g.documentErs}/20 pts</span>}
        </div>
        {g?.tier1Ok
          ? <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">Gateway cleared</span>
          : <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">Tier-1 required</span>}
      </div>
      {g?.flagged && (
        <p className="text-[11px] text-red-300 flex items-center gap-1.5 mb-2"><ShieldAlert className="w-3.5 h-3.5" /> A document was flagged — verification is blocked until resolved.</p>
      )}

      <div className="space-y-3">
        {TIERS.map(t => (
          <div key={t.tier}>
            <div className="text-[11px] font-semibold text-slate-400">{t.title}</div>
            {t.note && <div className="text-[10px] text-slate-600 mb-1">{t.note}</div>}
            <div className="space-y-1.5 mt-1">
              {t.types.map(([type, lbl]) => {
                const d = byType.get(type);
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-[#050e1c] border border-[#1a2d4a] px-3 py-2">
                      <span className="text-[12px] text-slate-300 min-w-0 truncate">{lbl}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {d && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CHIP[d.status] ?? ""}`}>{d.status}</span>}
                        <button onClick={() => openForm(type)} className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                          {d ? "Update" : <><Plus className="w-3 h-3" /> Add</>}
                        </button>
                      </div>
                    </div>
                    {d?.status === "rejected" && d.reviewNote && <p className="text-[10px] text-red-400/90 mt-1 ml-1">Reviewer: {d.reviewNote}</p>}
                    {open === type && (
                      <div className="mt-1.5 rounded-lg bg-[#0a1628] border border-[#1a2d4a] p-2.5 space-y-2">
                        <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label / issuer + reference number" className="bg-[#050e1c] border-[#1a2d4a] text-sm h-9" />
                        {canUpload && (
                          <label className="flex items-center gap-2 text-[12px] text-cyan-300 cursor-pointer rounded-md bg-cyan-500/10 border border-cyan-500/30 px-3 h-9 hover:bg-cyan-500/15">
                            {uploading === type ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            {uploading === type ? "Uploading…" : "Upload file"}
                            <input type="file" className="hidden" disabled={!!uploading}
                              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(t.tier, type, f); e.currentTarget.value = ""; }} />
                          </label>
                        )}
                        <Input value={reference} onChange={e => setReference(e.target.value)} placeholder={canUpload ? "…or paste a document link / issuer reference" : "Link to document (Drive/URL) or issuer reference"} className="bg-[#050e1c] border-[#1a2d4a] text-sm h-9" />
                        <div className="flex justify-end">
                          <Button size="sm" disabled={submit.isPending || (!label.trim() && !reference.trim())}
                            className="h-8 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 gap-1.5"
                            onClick={() => submit.mutate({ listingId, tier: t.tier, docType: type, label: label || undefined, reference: reference || undefined })}>
                            {submit.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Submit reference
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {submit.error && <p className="text-[11px] text-red-400 mt-2">{submit.error.message}</p>}
      <p className="text-[10px] text-slate-600 mt-2">Submit a verifiable link, uploaded file, or issuer reference for each document. ViralBeat verifies each with the issuing body before it counts.</p>

      {/* Appeals — contest a decision */}
      <div className="mt-3 pt-2 border-t border-white/[0.06]">
        {(appeals.data ?? []).filter(a => a.status === "open").length > 0 && (
          <p className="text-[11px] text-amber-300 flex items-center gap-1.5 mb-1"><Gavel className="w-3 h-3" /> Appeal under review.</p>
        )}
        {!appealOpen ? (
          <button onClick={() => setAppealOpen(true)} className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1"><Gavel className="w-3 h-3" /> Contest a score or document decision</button>
        ) : (
          <div className="space-y-2">
            <textarea value={appealText} onChange={e => setAppealText(e.target.value)} rows={2}
              placeholder="Explain what you're contesting and why…"
              className="w-full bg-[#050e1c] border border-[#1a2d4a] rounded-md text-sm p-2 resize-none" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setAppealOpen(false)} className="text-[11px] text-slate-500 hover:text-slate-300">Cancel</button>
              <Button size="sm" disabled={appealText.trim().length < 10 || submitAppeal.isPending}
                className="h-7 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-[11px]"
                onClick={() => submitAppeal.mutate({ listingId, reason: appealText })}>
                {submitAppeal.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Submit appeal"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
