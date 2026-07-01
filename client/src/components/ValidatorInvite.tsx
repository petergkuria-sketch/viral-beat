import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Plus, Loader2, Check, Trash2 } from "lucide-react";

type Nominee = { name: string; email: string; org: string; relationship: string };
const BLANK: Nominee = { name: "", email: "", org: "", relationship: "" };

const STATUS_STYLE: Record<string, string> = {
  nominated: "text-amber-300 bg-amber-500/10 border-amber-500/25",
  approved:  "text-cyan-300 bg-cyan-500/10 border-cyan-500/25",
  scored:    "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  rejected:  "text-slate-500 bg-white/[0.04] border-white/10",
};

/** SME-owner panel: shows validator progress and lets the owner nominate more. */
export function ValidatorInvite({ listingId }: { listingId: number }) {
  const q = trpc.ersValidation.myValidators.useQuery({ listingId });
  const nominate = trpc.ersValidation.nominate.useMutation({
    onSuccess: () => { q.refetch(); setRows([{ ...BLANK }]); setOpen(false); },
  });
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Nominee[]>([{ ...BLANK }]);

  const data = q.data;
  const validators = data?.validators ?? [];
  const scored = data?.scoredCount ?? 0;
  const needed = data?.needed ?? 3;
  const active = validators.filter(v => v.status !== "rejected");

  const setRow = (i: number, k: keyof Nominee, v: string) =>
    setRows(rs => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const valid = rows.filter(r => r.name.trim().length > 1 && /.+@.+\..+/.test(r.email));

  return (
    <div className="mt-3 border-t border-white/[0.06] pt-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[12px] text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          Validator verification
          <span className="text-slate-500">· {scored}/{needed} scored</span>
        </div>
        <Button size="sm" variant="outline" className="h-7 border-cyan-500/30 text-cyan-300 gap-1.5 text-[11px]"
          onClick={() => setOpen(o => !o)}>
          <Plus className="w-3.5 h-3.5" /> Invite validators
        </Button>
      </div>

      {/* progress bar */}
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-2">
        <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${Math.min(100, (scored / needed) * 100)}%` }} />
      </div>

      {active.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {active.map(v => (
            <span key={v.id} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[v.status] ?? ""}`}>
              {v.name}{v.org ? ` · ${v.org}` : ""} — {v.status}
            </span>
          ))}
        </div>
      )}

      {scored >= needed ? (
        <p className="text-[11px] text-emerald-400/90 mt-2 flex items-center gap-1.5"><Check className="w-3 h-3" /> Enough validators have scored — your ERS reflects their consensus.</p>
      ) : (
        <p className="text-[11px] text-slate-500 mt-2">Nominate {needed}+ independent experts (not family, staff, or business partners). ViralBeat approves them, then they score you blind.</p>
      )}

      {open && (
        <div className="mt-3 rounded-lg bg-[#050e1c] border border-[#1a2d4a] p-3 space-y-2.5">
          {rows.map((r, i) => (
            <div key={i} className="grid sm:grid-cols-2 gap-2">
              <Input value={r.name} onChange={e => setRow(i, "name", e.target.value)} placeholder="Validator name" className="bg-[#0a1628] border-[#1a2d4a] text-sm h-9" />
              <Input value={r.email} onChange={e => setRow(i, "email", e.target.value)} type="email" placeholder="Email" className="bg-[#0a1628] border-[#1a2d4a] text-sm h-9" />
              <Input value={r.org} onChange={e => setRow(i, "org", e.target.value)} placeholder="Organisation (optional)" className="bg-[#0a1628] border-[#1a2d4a] text-sm h-9" />
              <div className="flex gap-2">
                <Input value={r.relationship} onChange={e => setRow(i, "relationship", e.target.value)} placeholder="How they know you" className="bg-[#0a1628] border-[#1a2d4a] text-sm h-9 flex-1" />
                {rows.length > 1 && (
                  <button onClick={() => setRows(rs => rs.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400 shrink-0"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => setRows(rs => [...rs, { ...BLANK }])} className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add another
            </button>
            <Button size="sm" disabled={valid.length === 0 || nominate.isPending}
              className="h-8 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 gap-1.5"
              onClick={() => nominate.mutate({ listingId, validators: valid.map(v => ({ name: v.name, email: v.email, org: v.org || undefined, relationship: v.relationship || undefined })) })}>
              {nominate.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Nominate {valid.length || ""}
            </Button>
          </div>
          {nominate.error && <p className="text-[11px] text-red-400">{nominate.error.message}</p>}
        </div>
      )}
    </div>
  );
}
