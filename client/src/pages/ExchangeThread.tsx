import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ArrowLeft, Loader2, Lock, Send, Check, X, ShieldAlert, Building2, AlertTriangle,
} from "lucide-react";

const INTENT_LABEL: Record<string, string> = { collaboration: "Collaboration", supply_chain: "Supply chain", capital: "Capital" };
const TYPE_LABEL: Record<string, string> = { dfi: "DFI", pe_vc: "PE / VC", angel: "Angel", strategic: "Strategic", other: "Investor" };

export default function ExchangeThread() {
  const params = useParams<{ id: string }>();
  const introId = Number(params.id);
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [draft, setDraft] = useState("");

  const thread = trpc.exchangeThreads.getThread.useQuery({ introId }, { enabled: !!user && !Number.isNaN(introId), refetchInterval: 8000 });
  const respond = trpc.exchangeThreads.respond.useMutation({ onSuccess: () => thread.refetch() });
  const post = trpc.exchangeThreads.postMessage.useMutation({ onSuccess: () => { setDraft(""); thread.refetch(); } });

  if (loading || (user && thread.isLoading)) {
    return <div className="min-h-screen bg-[#050b1a] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>;
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-4 text-center px-4">
        <Lock className="w-10 h-10 text-slate-600" />
        <h2 className="text-xl font-black text-white">Sign in to view this conversation</h2>
        <Button className="bg-cyan-500 text-[#04222b] font-bold" onClick={() => { window.location.href = getLoginUrl(); }}>Sign in</Button>
      </div>
    );
  }
  if (thread.error || !thread.data) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-3 text-center px-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <h2 className="text-xl font-black text-white">Conversation unavailable</h2>
        <Button variant="outline" className="border-[#1a2d4a] text-slate-300" onClick={() => setLocation("/exchange/messages")}>Back to conversations</Button>
      </div>
    );
  }

  const t = thread.data;
  const counterparty = t.myRole === "investor" ? t.listingName : (t.investorOrg || t.investorName || TYPE_LABEL[t.investorType]);

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => setLocation("/exchange/messages")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Conversations
        </button>

        {/* Header */}
        <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-xl p-4 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">{counterparty}</div>
              <div className="text-[11px] text-slate-500">
                {INTENT_LABEL[t.intent] ?? t.intent}
                {t.myRole === "sme" ? ` · ${TYPE_LABEL[t.investorType]}` : ` · re: ${t.listingName}`}
                {" · "}{t.status}
              </div>
            </div>
          </div>
        </div>

        {/* Scam-safety banner */}
        <div className="flex items-start gap-2 text-[11px] text-amber-300 bg-amber-500/8 border border-amber-500/25 rounded-lg p-2.5 mb-3">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Stay on-platform. ViralBeat never handles funds in Phase 1 — never pay any fee to connect or "release" an investment. Report anyone who asks.
        </div>

        {/* Pending — SME owner decision */}
        {t.canRespond && (
          <div className="bg-[#0a1628] border border-cyan-500/30 rounded-xl p-4 mb-3">
            <p className="text-sm text-slate-300 mb-3">{counterparty} wants to connect about your listing. Accept to open a conversation, or decline.</p>
            <div className="flex gap-2">
              <Button size="sm" disabled={respond.isPending} className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 gap-1.5"
                onClick={() => respond.mutate({ introId, action: "accept" })}><Check className="w-3.5 h-3.5" /> Accept</Button>
              <Button size="sm" variant="outline" disabled={respond.isPending} className="border-red-500/30 text-red-400 gap-1.5"
                onClick={() => respond.mutate({ introId, action: "decline" })}><X className="w-3.5 h-3.5" /> Decline</Button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-2.5 mb-3">
          {t.messages.map(m => (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${m.mine ? "bg-cyan-500/15 border border-cyan-500/25 text-cyan-50" : "bg-[#0a1628] border border-[#1a2d4a] text-slate-200"}`}>
                <div className="text-[10px] uppercase tracking-wider mb-1 opacity-60">{m.role === "investor" ? "Investor" : "SME"}</div>
                <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
                <div className="text-[10px] opacity-50 mt-1">{new Date(m.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        {t.status === "declined" ? (
          <p className="text-center text-xs text-slate-600 py-3">This request was declined. The conversation is closed.</p>
        ) : t.canPost ? (
          <div className="flex gap-2">
            <Input value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && draft.trim()) { e.preventDefault(); post.mutate({ introId, body: draft.trim() }); } }}
              placeholder="Write a message…" className="bg-[#0a1628] border-[#1a2d4a] text-sm h-10" />
            <Button disabled={!draft.trim() || post.isPending} className="h-10 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 shrink-0"
              onClick={() => post.mutate({ introId, body: draft.trim() })}>
              {post.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        ) : t.myRole === "investor" && t.status === "pending" ? (
          <p className="text-center text-xs text-slate-600 py-3">Waiting for the SME to accept your request.</p>
        ) : null}
      </div>
    </div>
  );
}
