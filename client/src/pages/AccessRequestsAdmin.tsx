import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { KeyRound, Loader2, Lock, ShieldCheck, ArrowLeft, Inbox } from "lucide-react";

const STATUS: Record<string, string> = {
  new:       "text-amber-400 bg-amber-500/10 border-amber-500/25",
  contacted: "text-cyan-300 bg-cyan-500/10 border-cyan-500/25",
  closed:    "text-slate-500 bg-white/[0.04] border-white/10",
};
const TIER: Record<string, string> = {
  bronze:  "text-amber-400 bg-amber-500/10 border-amber-500/25",
  premium: "text-purple-300 bg-purple-500/12 border-purple-500/30",
};

export default function AccessRequestsAdmin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = (user as any)?.role === "admin";
  const q = trpc.access.list.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30000 });
  const setStatus = trpc.access.setStatus.useMutation({ onSuccess: () => q.refetch() });

  if (!user || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
        {!user ? <Lock className="w-10 h-10 text-slate-600" /> : <ShieldCheck className="w-10 h-10 text-slate-600" />}
        <p className="text-slate-400">{!user ? "Sign in as an administrator." : "Admin access required."}</p>
      </div>
    );
  }

  const rows = q.data ?? [];
  const counts = {
    total: rows.length,
    bronze: rows.filter(r => r.tier === "bronze").length,
    premium: rows.filter(r => r.tier === "premium").length,
    open: rows.filter(r => r.status === "new").length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button onClick={() => setLocation("/admin")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 mb-5">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin
      </button>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white leading-tight">Access requests</h1>
          <p className="text-xs text-slate-500">Price-discovery demand for Bronze &amp; Premium</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[["Total", counts.total], ["Bronze", counts.bronze], ["Premium", counts.premium], ["New", counts.open]].map(([l, n]) => (
          <div key={l} className="bg-[#0a1628] border border-[#1a2d4a] rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{l}</div>
            <div className="text-2xl font-black text-white">{n as number}</div>
          </div>
        ))}
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-9 h-9 text-slate-700 mb-2" />
          <p className="text-slate-400 font-semibold">No access requests yet</p>
          <p className="text-xs text-slate-600">They'll appear here as people request Bronze / Premium.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.id} className="bg-[#0a1628] border border-[#1a2d4a] rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-white truncate">{r.email}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${TIER[r.tier] ?? ""}`}>{r.tier}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS[r.status] ?? ""}`}>{r.status}</span>
                </div>
                {r.message && <p className="text-xs text-slate-400 mt-1">{r.message}</p>}
                <div className="text-[10px] text-slate-600 mt-1">{new Date(r.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {(["contacted", "closed"] as const).map(s => (
                  <Button key={s} size="sm" variant="outline" disabled={setStatus.isPending || r.status === s}
                    className="h-7 border-[#1a2d4a] text-slate-300 capitalize text-[11px]"
                    onClick={() => setStatus.mutate({ id: r.id, status: s })}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
