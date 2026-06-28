import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Building2, Loader2, Lock, Check, AlertTriangle, UserCheck,
} from "lucide-react";

export default function ClaimListing() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  const transfer = trpc.exchange.getTransfer.useQuery({ token }, { enabled: token.length > 10 });
  const claim = trpc.exchange.claimTransfer.useMutation({
    onSuccess: () => setLocation("/exchange/mine"),
  });

  if (loading || transfer.isLoading) {
    return <div className="min-h-screen bg-[#050b1a] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>;
  }

  if (transfer.error || !transfer.data) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-3 text-center px-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <h2 className="text-xl font-black text-white">Invalid transfer link</h2>
        <p className="text-sm text-slate-400 max-w-sm">This invitation link is not valid. Ask the incubator or accelerator to resend it.</p>
        <Button variant="outline" className="border-[#1a2d4a] text-slate-300" onClick={() => setLocation("/exchange")}>Go to the Exchange</Button>
      </div>
    );
  }

  const t = transfer.data;
  const inactive = t.status !== "pending";

  return (
    <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#0a1628] border border-[#1a2d4a] rounded-2xl p-7 text-center">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-6 h-6 text-cyan-400" />
        </div>
        <h1 className="text-xl font-black mb-1">Take over management</h1>
        <p className="text-sm text-slate-400 mb-1">
          {t.listedByOrg ? <><span className="text-slate-200 font-semibold">{t.listedByOrg}</span> invited you to manage</> : "You've been invited to manage"}
        </p>
        <p className="text-lg font-bold text-white mb-5">{t.listingName}</p>

        {inactive ? (
          <div className="rounded-lg bg-amber-500/8 border border-amber-500/25 p-3 text-sm text-amber-300">
            This invitation is {t.status}. Ask for a fresh invite if you still need access.
          </div>
        ) : !user ? (
          <>
            <div className="flex items-start gap-2 text-[12px] text-slate-400 bg-[#050e1c] border border-[#1a2d4a] rounded-lg p-3 mb-4 text-left">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p>You must sign in before taking over. The invite was sent to <span className="text-slate-200">{t.toEmail}</span> — sign in with that account for a clean match.</p>
            </div>
            <Button className="w-full bg-cyan-500 text-[#04222b] font-bold" onClick={() => { window.location.href = getLoginUrl(); }}>
              Sign in to continue
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-2 text-[12px] text-slate-400 bg-[#050e1c] border border-[#1a2d4a] rounded-lg p-3 mb-4 text-left">
              <UserCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p>Accepting transfers full management of this listing to your account. The incubator/accelerator will no longer manage it.</p>
            </div>
            {claim.error && <p className="text-xs text-red-400 mb-3">{claim.error.message}</p>}
            <Button className="w-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 gap-2"
              disabled={claim.isPending} onClick={() => claim.mutate({ token })}>
              {claim.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Accepting…</> : <><Check className="w-4 h-4" /> Accept &amp; take over</>}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
