import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ShieldCheck, Building2, Leaf, Flame, BadgeCheck, Check, X,
  ExternalLink, Loader2, Inbox, RefreshCw, Lock, TrendingUp,
} from "lucide-react";

type ModType = "oss" | "sme" | "green" | "viral" | "creator";

const TYPES: { key: ModType; label: string; icon: typeof Building2; hint: string }[] = [
  { key: "oss",     label: "OSS data",            icon: Building2,  hint: "One-Stop-Shop records" },
  { key: "sme",     label: "SME listings",        icon: TrendingUp, hint: "Exchange IPO onboarding" },
  { key: "green",   label: "Green reports",       icon: Leaf,       hint: "Field observations" },
  { key: "viral",   label: "Viral content",       icon: Flame,      hint: "HAA submissions" },
  { key: "creator", label: "Creator verification", icon: BadgeCheck, hint: "Identity / portfolio" },
];

function fmtDate(d: string | Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ModerationDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [active, setActive] = useState<ModType>("oss");
  const [noteFor, setNoteFor] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const isAdmin = (user as any)?.role === "admin";

  const summary = trpc.moderation.summary.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30000 });
  const queue = trpc.moderation.queue.useQuery({ type: active }, { enabled: isAdmin });
  const act = trpc.moderation.act.useMutation({
    onSuccess: () => { summary.refetch(); queue.refetch(); setNoteFor(null); setNote(""); },
  });

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
        <Lock className="w-10 h-10 text-slate-600" />
        <p className="text-slate-400">Sign in as an administrator to access moderation.</p>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
        <ShieldCheck className="w-10 h-10 text-slate-600" />
        <p className="text-slate-400">Admin access required.</p>
        <Button variant="outline" className="border-[#1e3a5f] text-slate-300" onClick={() => setLocation("/dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  const counts = summary.data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">Moderation</h1>
            <p className="text-xs text-slate-500">Review every kind of user-submitted data in one place</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="border-[#1e3a5f] text-slate-400 gap-1.5"
          onClick={() => { summary.refetch(); queue.refetch(); }}>
          <RefreshCw className={`w-3.5 h-3.5 ${queue.isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 my-5">
        {TYPES.map(({ key, label, icon: Icon, hint }) => {
          const n = counts?.[key] ?? 0;
          const isActive = active === key;
          return (
            <button key={key} onClick={() => setActive(key)}
              className={`text-left rounded-xl border p-3 transition-colors ${
                isActive ? "bg-cyan-500/10 border-cyan-500/40" : "bg-[#0a1628] border-[#1a2d4a] hover:border-[#2a4a6f]"
              }`}>
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                {n > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    {n} pending
                  </span>
                )}
              </div>
              <div className={`text-sm font-bold ${isActive ? "text-white" : "text-slate-300"}`}>{label}</div>
              <div className="text-[11px] text-slate-500">{hint}</div>
            </button>
          );
        })}
      </div>

      {/* Queue */}
      <div className="space-y-3">
        {queue.isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : !queue.data || queue.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="w-9 h-9 text-slate-700 mb-2" />
            <p className="text-slate-400 font-semibold">Nothing pending here</p>
            <p className="text-xs text-slate-600">New submissions will appear for review.</p>
          </div>
        ) : (
          queue.data.map(item => (
            <div key={`${item.type}-${item.id}`} className="bg-[#0a1628] border border-[#1a2d4a] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-white truncate">{item.title}</span>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">{item.subtitle}</div>
                  {item.body && <p className="text-xs text-slate-400 mt-2 line-clamp-3">{item.body}</p>}
                  <div className="text-[10px] text-slate-600 mt-2">
                    By {item.submittedBy}{item.createdAt ? ` · ${fmtDate(item.createdAt)}` : ""}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button size="sm" disabled={act.isPending}
                    className="h-8 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 gap-1.5"
                    onClick={() => act.mutate({ type: item.type, id: item.id, action: "approve", note: note || undefined })}>
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={act.isPending}
                    className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1.5"
                    onClick={() => { if (noteFor === item.id) { act.mutate({ type: item.type, id: item.id, action: "reject", note: note || undefined }); } else { setNoteFor(item.id); setNote(""); } }}>
                    <X className="w-3.5 h-3.5" /> {noteFor === item.id ? "Confirm reject" : "Reject"}
                  </Button>
                </div>
              </div>
              {noteFor === item.id && (
                <input
                  autoFocus
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Optional reason for rejection…"
                  className="mt-3 w-full bg-[#050e1c] border border-[#1a2d4a] rounded-md text-xs p-2 text-slate-300"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
