import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck, Building2, Leaf, Flame, BadgeCheck, Check, X,
  ExternalLink, Loader2, Inbox, RefreshCw, Lock, TrendingUp,
  UserCheck, Send, Copy,
} from "lucide-react";

type ModType = "oss" | "sme" | "green" | "viral" | "creator";

const TYPES: { key: ModType; label: string; icon: typeof Building2; hint: string }[] = [
  { key: "oss",     label: "OSS data",            icon: Building2,  hint: "One-Stop-Shop records" },
  { key: "sme",     label: "SME listings",        icon: TrendingUp, hint: "Exchange IPO onboarding" },
  { key: "green",   label: "Green reports",       icon: Leaf,       hint: "Field observations" },
  { key: "viral",   label: "Grounded Verification",    icon: Flame,      hint: "HAA submissions" },
  { key: "creator", label: "Contributor Verification", icon: BadgeCheck, hint: "Identity / portfolio" },
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

  // SME owner-claim invites
  const smeAll = trpc.moderation.smeAll.useQuery(undefined, { enabled: isAdmin && active === "sme" });
  const [inviteFor, setInviteFor] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const invite = trpc.moderation.inviteToClaim.useMutation({
    onSuccess: () => { smeAll.refetch(); setInviteFor(null); setInviteEmail(""); },
  });
  const cancelClaim = trpc.moderation.cancelClaim.useMutation({ onSuccess: () => smeAll.refetch() });
  function copyLink(url: string) { navigator.clipboard.writeText(url); setCopied(url); setTimeout(() => setCopied(null), 2000); }

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

      {/* SME listing management — owner-claim invites (all statuses) */}
      {active === "sme" && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">All SME listings · invite owner to claim</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Send the SME owner a secure link to take over management. They must sign in with the invited email to accept.</p>

          {smeAll.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
          ) : !smeAll.data || smeAll.data.length === 0 ? (
            <p className="text-xs text-slate-600">No SME listings yet.</p>
          ) : (
            <div className="space-y-3">
              {smeAll.data.map(l => {
                const claimUrl = l.transfer ? `${window.location.origin}/exchange/claim/${l.transfer.token}` : null;
                const claimed = !!l.contributorId && l.listedByType === "self";
                return (
                  <div key={l.id} className="bg-[#0a1628] border border-[#1a2d4a] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">{l.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-slate-400 capitalize">{l.status}</span>
                          <span className="text-[10px] text-slate-500">ERS {l.ers}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {l.sector} · {l.countryName}
                          {l.listedByType !== "self" && l.listedByOrg ? ` · via ${l.listedByOrg}` : ""}
                          {l.contributorId ? " · owned" : " · unclaimed"}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {!l.transfer && (
                          <Button size="sm" variant="outline" className="h-8 border-cyan-500/30 text-cyan-300 gap-1.5"
                            onClick={() => { setInviteFor(inviteFor === l.id ? null : l.id); setInviteEmail(l.contactEmail ?? ""); }}>
                            <UserCheck className="w-3.5 h-3.5" /> Invite to claim
                          </Button>
                        )}
                      </div>
                    </div>

                    {inviteFor === l.id && !l.transfer && (
                      <div className="mt-3 border-t border-white/[0.06] pt-3">
                        <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">SME owner's email</label>
                        <div className="flex gap-2">
                          <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" placeholder="owner@company.com"
                            className="bg-[#050e1c] border-[#1a2d4a] text-sm h-9" />
                          <Button size="sm" disabled={!/.+@.+\..+/.test(inviteEmail) || invite.isPending}
                            className="h-9 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 gap-1.5 shrink-0"
                            onClick={() => invite.mutate({ listingId: l.id, ownerEmail: inviteEmail })}>
                            {invite.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send invite
                          </Button>
                        </div>
                        {invite.data && invite.data.emailSent === false && (
                          <p className="text-[11px] text-amber-400 mt-1.5">Email provider not configured — share the claim link manually (appears after sending).</p>
                        )}
                        {invite.error && <p className="text-[11px] text-red-400 mt-1">{invite.error.message}</p>}
                      </div>
                    )}

                    {l.transfer && (
                      <div className="mt-3 border-t border-white/[0.06] pt-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="text-[12px] text-cyan-300 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" /> Invited <span className="font-semibold">{l.transfer.toEmail}</span>
                          </div>
                          <div className="flex gap-2">
                            {claimUrl && (
                              <Button size="sm" variant="outline" className="h-7 border-[#1a2d4a] text-slate-300 gap-1.5" onClick={() => copyLink(claimUrl)}>
                                {copied === claimUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} Copy link
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="h-7 border-red-500/30 text-red-400 gap-1.5"
                              onClick={() => cancelClaim.mutate({ transferId: l.transfer!.id })} disabled={cancelClaim.isPending}>
                              <X className="w-3 h-3" /> Cancel
                            </Button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1.5">Awaiting acceptance · expires {fmtDate(l.transfer.expiresAt)}. Share the link if the email doesn't arrive.</p>
                      </div>
                    )}
                    {claimed && !l.transfer && (
                      <p className="text-[10px] text-emerald-500/80 mt-3 border-t border-white/[0.06] pt-2">Owner-managed.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
