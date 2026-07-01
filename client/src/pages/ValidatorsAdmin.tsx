import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { ShieldCheck, Loader2, Lock, ArrowLeft, Inbox, Check, X, Copy } from "lucide-react";

export default function ValidatorsAdmin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = (user as any)?.role === "admin";
  const q = trpc.ersValidation.adminPending.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30000 });
  const [lastLink, setLastLink] = useState<string | null>(null);
  const setStatus = trpc.ersValidation.adminSetStatus.useMutation({
    onSuccess: (r) => { if (r.scoreUrl) setLastLink(r.scoreUrl); q.refetch(); },
  });

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
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white leading-tight">Validator approvals</h1>
          <p className="text-xs text-slate-500">Approve independent validators before they can score an SME</p>
        </div>
      </div>

      {lastLink && (
        <div className="mb-4 flex items-center gap-2 text-[12px] text-emerald-300 bg-emerald-500/8 border border-emerald-500/25 rounded-lg p-3">
          <Check className="w-4 h-4 shrink-0" />
          <span className="truncate flex-1">Approved. Scoring link (also emailed): <span className="text-emerald-200">{lastLink}</span></span>
          <button onClick={() => navigator.clipboard?.writeText(lastLink)} className="text-emerald-300 hover:text-emerald-100"><Copy className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {q.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-9 h-9 text-slate-700 mb-2" />
          <p className="text-slate-400 font-semibold">No validators pending approval</p>
          <p className="text-xs text-slate-600">Nominations from SME owners appear here for vetting.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.id} className="bg-[#0a1628] border border-[#1a2d4a] rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-white truncate">{r.name}</span>
                  <span className="text-[10px] text-slate-500">→ validating</span>
                  <span className="text-[11px] font-semibold text-cyan-300 truncate">{r.listingName}</span>
                </div>
                <div className="text-xs text-slate-400">{r.email}{r.org ? ` · ${r.org}` : ""}</div>
                {(r.expertise || r.relationship) && (
                  <div className="text-[11px] text-slate-500 mt-1">
                    {r.expertise ? <>Expertise: {r.expertise}. </> : null}
                    {r.relationship ? <>Relationship: {r.relationship}.</> : null}
                  </div>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" disabled={setStatus.isPending}
                  className="h-7 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-[11px] gap-1"
                  onClick={() => setStatus.mutate({ id: r.id, action: "approve" })}>
                  <Check className="w-3.5 h-3.5" /> Approve
                </Button>
                <Button size="sm" variant="outline" disabled={setStatus.isPending}
                  className="h-7 border-[#1a2d4a] text-slate-400 text-[11px] gap-1"
                  onClick={() => setStatus.mutate({ id: r.id, action: "reject" })}>
                  <X className="w-3.5 h-3.5" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
