import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { FileCheck2, Loader2, Lock, ArrowLeft, Inbox, Check, X, ShieldAlert, Sparkles, ExternalLink, RefreshCw, Gavel } from "lucide-react";

const CHIP: Record<string, string> = {
  pending:  "text-amber-300 bg-amber-500/10 border-amber-500/25",
  rejected: "text-red-300 bg-red-500/10 border-red-500/25",
  flagged:  "text-red-300 bg-red-500/12 border-red-500/40",
};

export default function DocumentsAdmin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = (user as any)?.role === "admin";
  const q = trpc.ersDocuments.adminPending.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30000 });
  const review = trpc.ersDocuments.adminReview.useMutation({ onSuccess: () => q.refetch() });
  const aiCheck = trpc.ersDocuments.aiCheck.useMutation();
  const docUrl = trpc.ersDocuments.docUrl.useMutation({ onSuccess: (r) => window.open(r.url, "_blank", "noopener") });
  const decay = trpc.ersDocuments.adminRunDecay.useMutation();
  const appealsQ = trpc.ersDocuments.adminAppeals.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30000 });
  const resolveAppeal = trpc.ersDocuments.resolveAppeal.useMutation({ onSuccess: () => appealsQ.refetch() });
  const [aiFor, setAiFor] = useState<number | null>(null);

  if (!user || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
        <Lock className="w-10 h-10 text-slate-600" />
        <p className="text-slate-400">Admin access required.</p>
      </div>
    );
  }

  const rows = q.data ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={() => setLocation("/admin")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 mb-5">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin
      </button>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
          <FileCheck2 className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white leading-tight">Document gateway</h1>
          <p className="text-xs text-slate-500">Verify Tier-1 foundation docs before an SME can graduate — flag fraud to veto</p>
        </div>
        <Button size="sm" variant="outline" disabled={decay.isPending}
          className="h-8 border-[#1a2d4a] text-slate-300 gap-1.5 text-[11px]"
          onClick={() => decay.mutate()}>
          {decay.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {decay.data ? `Decayed ${decay.data.decayed}` : "Run re-verification"}
        </Button>
      </div>

      {/* Appeals queue */}
      {(appealsQ.data ?? []).length > 0 && (
        <div className="mb-4 space-y-2">
          {(appealsQ.data ?? []).map(a => (
            <div key={a.id} className="bg-amber-500/[0.06] border border-amber-500/25 rounded-xl p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-200"><Gavel className="w-3.5 h-3.5" /> Appeal · {a.listingName}</div>
                <p className="text-[12px] text-slate-300 mt-1">{a.reason}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" disabled={resolveAppeal.isPending} className="h-7 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] gap-1" onClick={() => resolveAppeal.mutate({ id: a.id, action: "resolve" })}><Check className="w-3.5 h-3.5" /> Resolve</Button>
                <Button size="sm" variant="outline" disabled={resolveAppeal.isPending} className="h-7 border-[#1a2d4a] text-slate-400 text-[11px] gap-1" onClick={() => resolveAppeal.mutate({ id: a.id, action: "reject" })}><X className="w-3.5 h-3.5" /> Reject</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {aiCheck.data && aiFor != null && (
        <div className="mb-4 text-[12px] text-cyan-200 bg-cyan-500/8 border border-cyan-500/25 rounded-lg p-3">
          <div className="flex items-center gap-1.5 font-semibold mb-1"><Sparkles className="w-3.5 h-3.5" /> AI authenticity assist (advisory)</div>
          <p className="whitespace-pre-wrap">{aiCheck.data.summary}</p>
        </div>
      )}

      {q.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-9 h-9 text-slate-700 mb-2" />
          <p className="text-slate-400 font-semibold">No documents awaiting review</p>
          <p className="text-xs text-slate-600">Documents submitted by validator-verified SMEs appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.id} className="bg-[#0a1628] border border-[#1a2d4a] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-white truncate">{r.listingName}</span>
                    <span className="text-[10px] text-slate-500">{r.tier} · {r.docType}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CHIP[r.status] ?? ""}`}>{r.status}</span>
                  </div>
                  {r.label && <div className="text-xs text-slate-400">{r.label}</div>}
                  {r.reference && (
                    r.reference.startsWith("s3:")
                      ? <button onClick={() => docUrl.mutate({ id: r.id })} disabled={docUrl.isPending} className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 mt-0.5">Open uploaded file <ExternalLink className="w-3 h-3" /></button>
                      : /^https?:\/\//i.test(r.reference)
                        ? <a href={r.reference} target="_blank" rel="noreferrer" className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 mt-0.5">Open reference <ExternalLink className="w-3 h-3" /></a>
                        : <div className="text-[11px] text-slate-500 mt-0.5 break-all">Ref: {r.reference}</div>
                  )}
                  {r.aiNote && <div className="text-[11px] text-cyan-300/80 mt-1">AI: {r.aiNote}</div>}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex gap-1.5">
                    <Button size="sm" disabled={review.isPending}
                      className="h-7 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-[11px] gap-1"
                      onClick={() => review.mutate({ id: r.id, action: "verify" })}>
                      <Check className="w-3.5 h-3.5" /> Verify
                    </Button>
                    <Button size="sm" variant="outline" disabled={review.isPending}
                      className="h-7 border-[#1a2d4a] text-slate-400 text-[11px] gap-1"
                      onClick={() => review.mutate({ id: r.id, action: "reject" })}>
                      <X className="w-3.5 h-3.5" /> Reject
                    </Button>
                    <Button size="sm" variant="outline" disabled={review.isPending}
                      className="h-7 border-red-500/30 text-red-400 text-[11px] gap-1"
                      onClick={() => review.mutate({ id: r.id, action: "flag" })}>
                      <ShieldAlert className="w-3.5 h-3.5" /> Flag
                    </Button>
                  </div>
                  <button
                    onClick={() => { setAiFor(r.listingId); aiCheck.mutate({ listingId: r.listingId }); }}
                    disabled={aiCheck.isPending}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1">
                    {aiCheck.isPending && aiFor === r.listingId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI check
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
