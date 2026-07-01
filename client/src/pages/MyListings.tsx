import { useState } from "react";
import { useLocation } from "wouter";
import { TopNav } from "@/components/TopNav";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ersBand, boardOf, verificationBadge, type VerificationLevel } from "@/lib/exchangeData";
import {
  Building2, Plus, Pencil, Loader2, Lock, Inbox, ArrowLeft, Clock, CheckCircle2, XCircle,
  Send, Copy, Check, X, UserCheck,
} from "lucide-react";

const STATUS_STYLE: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending:  { label: "Pending review", cls: "text-amber-400 bg-amber-500/10 border-amber-500/25", icon: Clock },
  approved: { label: "Published",      cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", icon: CheckCircle2 },
  rejected: { label: "Not approved",   cls: "text-red-400 bg-red-500/10 border-red-500/25", icon: XCircle },
};

export default function MyListings() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const mine = trpc.exchange.listMine.useQuery(undefined, { enabled: !!user });
  const transfers = trpc.exchange.myTransfers.useQuery(undefined, { enabled: !!user });

  const [openFor, setOpenFor] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const initiate = trpc.exchange.initiateTransfer.useMutation({
    onSuccess: () => { transfers.refetch(); setOpenFor(null); setEmail(""); },
  });
  const cancel = trpc.exchange.cancelTransfer.useMutation({ onSuccess: () => transfers.refetch() });

  const transferByListing = new Map<number, NonNullable<typeof transfers.data>[number]>();
  (transfers.data ?? []).forEach(t => transferByListing.set(t.listingId, t));

  function copy(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return <div className="min-h-screen bg-[#050b1a] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>;
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-4 text-center px-4">
        <Lock className="w-10 h-10 text-slate-600" />
        <h2 className="text-xl font-black text-white">Sign in to manage your listings</h2>
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

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight">My listings</h1>
              <p className="text-xs text-slate-500">Manage, update, and transfer your SME Exchange listings</p>
            </div>
          </div>
          <Button className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 gap-1.5" onClick={() => setLocation("/exchange/list")}>
            <Plus className="w-4 h-4" /> New listing
          </Button>
        </div>

        {mine.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
        ) : !mine.data || mine.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="w-9 h-9 text-slate-700 mb-2" />
            <p className="text-slate-400 font-semibold mb-1">No listings yet</p>
            <p className="text-xs text-slate-600 mb-4">List your SME to appear on the exchange.</p>
            <Button className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 gap-1.5" onClick={() => setLocation("/exchange/list")}>
              <Plus className="w-4 h-4" /> List your SME
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {mine.data.map(l => {
              const st = STATUS_STYLE[l.status] ?? STATUS_STYLE.pending;
              const StIcon = st.icon;
              const band = ersBand(l.ers ?? 0);
              const vlevel = ((l as any).verificationLevel as VerificationLevel) ?? "unverified";
              const vbadge = verificationBadge(vlevel);
              const onCapital = boardOf({ ers: l.ers ?? 0, verificationLevel: vlevel }) === "capital_ready";
              const onBehalf = l.listedByType !== "self";
              const pending = transferByListing.get(l.id);
              const claimUrl = pending ? `${window.location.origin}/exchange/claim/${pending.token}` : null;
              return (
                <div key={l.id} className="bg-[#0a1628] border border-[#1a2d4a] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base font-bold text-white truncate">{l.name}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>
                          <StIcon className="w-3 h-3" /> {st.label}
                        </span>
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          title={vbadge.hint}
                          style={{ color: vbadge.color, background: `${vbadge.color}14`, borderColor: `${vbadge.color}33` }}>
                          {vbadge.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {l.sector} · {l.countryName} · {onCapital ? "Capital-Ready board" : "Open Innovation board"}
                        {onBehalf && l.listedByOrg ? ` · via ${l.listedByOrg} (${l.listedByType})` : ""}
                      </div>
                      {l.status === "rejected" && l.reviewNote && (
                        <p className="text-[11px] text-red-400/90 mt-1.5">Reviewer note: {l.reviewNote}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-2xl font-black leading-none" style={{ color: band.color }}>{l.ers ?? 0}</div>
                        <div className="text-[9px] uppercase tracking-widest text-slate-500">ERS</div>
                      </div>
                      <div className="flex gap-2">
                        {onBehalf && !pending && (
                          <Button size="sm" variant="outline" className="h-8 border-cyan-500/30 text-cyan-300 gap-1.5"
                            onClick={() => { setOpenFor(openFor === l.id ? null : l.id); setEmail(""); }}>
                            <UserCheck className="w-3.5 h-3.5" /> Transfer to owner
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-8 border-[#1a2d4a] text-slate-300 gap-1.5"
                          onClick={() => setLocation(`/exchange/list/${l.id}`)}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Transfer initiation form */}
                  {onBehalf && openFor === l.id && !pending && (
                    <div className="mt-3 border-t border-white/[0.06] pt-3">
                      <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">SME owner's email</label>
                      <div className="flex gap-2">
                        <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="owner@company.com"
                          className="bg-[#050e1c] border-[#1a2d4a] text-sm h-9" />
                        <Button size="sm" disabled={!/.+@.+\..+/.test(email) || initiate.isPending}
                          className="h-9 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 gap-1.5 shrink-0"
                          onClick={() => initiate.mutate({ listingId: l.id, ownerEmail: email })}>
                          {initiate.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send invite
                        </Button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">The owner is emailed an invite and must sign in to take over management.</p>
                      {initiate.error && <p className="text-[11px] text-red-400 mt-1">{initiate.error.message}</p>}
                    </div>
                  )}

                  {/* Pending transfer state */}
                  {pending && (
                    <div className="mt-3 border-t border-white/[0.06] pt-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-[12px] text-cyan-300 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5" /> Transfer invited to <span className="font-semibold">{pending.toEmail}</span>
                        </div>
                        <div className="flex gap-2">
                          {claimUrl && (
                            <Button size="sm" variant="outline" className="h-7 border-[#1a2d4a] text-slate-300 gap-1.5"
                              onClick={() => copy(claimUrl)}>
                              {copied === claimUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} Copy link
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 border-red-500/30 text-red-400 gap-1.5"
                            onClick={() => cancel.mutate({ transferId: pending.id })} disabled={cancel.isPending}>
                            <X className="w-3 h-3" /> Cancel
                          </Button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1.5">Awaiting acceptance · link expires {new Date(pending.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}. Share the link if the email doesn't arrive.</p>
                    </div>
                  )}

                  {l.status === "approved" && !pending && openFor !== l.id && (
                    <p className="text-[10px] text-slate-600 mt-3 border-t border-white/[0.06] pt-2">
                      Editing a published listing returns it to review and hides it until re-approved.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
