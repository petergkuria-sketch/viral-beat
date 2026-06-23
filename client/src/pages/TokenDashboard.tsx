/**
 * Contribution Credits — simplified replacement for VBT Token Economy.
 * Staking, P2P trading, blockchain migration, and marketplace all removed.
 * This page shows a contributor's signal submission history and credit balance only.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Award, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function ContributionCredits() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: balance, isLoading: balanceLoading } = trpc.tokens.getBalance.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: transactionsData } = trpc.tokens.getTransactionHistory.useQuery(
    { limit: 20, offset: 0, type: "earned" },
    { enabled: !!user }
  );

  if (authLoading || balanceLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/40 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-sm w-full text-center">
          <p className="text-slate-300 font-semibold mb-2">Sign in to view your contributions</p>
          <button
            onClick={() => (window.location.href = getLoginUrl())}
            className="mt-4 w-full py-2 rounded-lg bg-cyan-500 text-slate-900 font-bold text-sm"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const earnedTx = (transactionsData?.transactions ?? []).filter(t => t.amount > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">

      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/70 px-6 py-4">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-cyan-400" />
          <div>
            <h1 className="text-base font-bold text-white">Contribution Credits</h1>
            <p className="text-[11px] text-slate-500">Earned by submitting and validating intelligence signals</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Balance card */}
        <div className="bg-slate-900 border border-cyan-500/25 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Your Credits</p>
            <p className="text-4xl font-black text-cyan-400">{(balance?.balance ?? 0).toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1">All-time earned: {(balance?.totalEarned ?? 0).toLocaleString()}</p>
          </div>
          <div className="text-right space-y-2">
            <button
              onClick={() => navigate("/intelligence")}
              className="block w-full px-4 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/25 transition-colors"
            >
              Run Intelligence Pipeline
            </button>
            <button
              onClick={() => navigate("/haa")}
              className="block w-full px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-xs font-semibold hover:border-slate-500 hover:text-slate-200 transition-colors"
            >
              Submit a Field Signal
            </button>
          </div>
        </div>

        {/* How to earn */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">How You Earn Credits</p>
          <div className="space-y-2">
            {[
              { action: "Submit a field signal",              points: "+100–200" },
              { action: "Signal validated by 3+ analysts",   points: "+500" },
              { action: "First to report trending signal",   points: "+1000" },
              { action: "Daily login streak",                points: "+10" },
              { action: "Forum thread contribution",        points: "+10–50" },
            ].map(row => (
              <div key={row.action} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-0">
                <span className="text-slate-400">{row.action}</span>
                <span className="font-bold text-emerald-400">{row.points}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity log */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <p className="text-xs font-bold text-slate-400">Contribution Activity</p>
          </div>
          <div className="divide-y divide-slate-800/60">
            {earnedTx.length === 0 && (
              <div className="px-4 py-10 text-center">
                <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No contributions yet</p>
                <p className="text-xs text-slate-600 mt-1">Submit your first field signal to start earning</p>
              </div>
            )}
            {earnedTx.map(tx => (
              <div key={tx.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-300">{tx.description}</p>
                  <p className="text-[10px] text-slate-600">{formatDate(tx.createdAt)}</p>
                </div>
                <span className="text-sm font-bold text-emerald-400 flex-shrink-0">+{tx.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
