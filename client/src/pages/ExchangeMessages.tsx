import { useLocation } from "wouter";
import { TopNav } from "@/components/TopNav";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  MessageSquare, Loader2, Lock, Inbox, ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle,
} from "lucide-react";

const STATUS: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending:  { label: "Pending", cls: "text-amber-400 bg-amber-500/10 border-amber-500/25", icon: Clock },
  accepted: { label: "Open",    cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", icon: CheckCircle2 },
  declined: { label: "Declined",cls: "text-slate-500 bg-white/[0.04] border-white/10", icon: XCircle },
};
const INTENT_LABEL: Record<string, string> = { collaboration: "Collaboration", supply_chain: "Supply chain", capital: "Capital" };

export default function ExchangeMessages() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const threads = trpc.exchangeThreads.myThreads.useQuery(undefined, { enabled: !!user, refetchInterval: 20000 });

  if (loading) return <div className="min-h-screen bg-[#050b1a] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>;
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-4 text-center px-4">
        <Lock className="w-10 h-10 text-slate-600" />
        <h2 className="text-xl font-black text-white">Sign in to view your conversations</h2>
        <Button className="bg-cyan-500 text-[#04222b] font-bold" onClick={() => { window.location.href = getLoginUrl(); }}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <TopNav />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => setLocation("/exchange")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to the Exchange
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight">Conversations</h1>
            <p className="text-xs text-slate-500">Safe, on-platform messages between investors and SMEs</p>
          </div>
        </div>

        {threads.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
        ) : !threads.data || threads.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="w-9 h-9 text-slate-700 mb-2" />
            <p className="text-slate-400 font-semibold mb-1">No conversations yet</p>
            <p className="text-xs text-slate-600">Express interest in a listing, or wait for an investor to reach out.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {threads.data.map(t => {
              const st = STATUS[t.status] ?? STATUS.pending;
              const StIcon = st.icon;
              return (
                <button key={t.introId} onClick={() => setLocation(`/exchange/thread/${t.introId}`)}
                  className="w-full text-left bg-[#0a1628] border border-[#1a2d4a] rounded-xl p-4 hover:border-cyan-500/40 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{t.counterparty}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>
                          <StIcon className="w-3 h-3" /> {st.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {t.role === "investor" ? "You → " : "Interest in "}{t.listingName} · {INTENT_LABEL[t.intent] ?? t.intent} · {t.role === "investor" ? "as investor" : "your listing"}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
