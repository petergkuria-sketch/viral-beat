import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { showTokenNotification } from "@/lib/tokenNotifications";
import { useViewPreference } from "@/_core/hooks/useViewPreference";
import { ViewToggle } from "@/components/ViewToggle";

// PESTEL mapped to backend category values
const PESTEL_CATEGORIES = [
  { id: "news",      label: "Political",     pestel: "P", color: "#00d4ff",  desc: "Governance, elections, policy" },
  { id: "business",  label: "Economic",      pestel: "E", color: "#34d399",  desc: "Markets, trade, inflation" },
  { id: "lifestyle", label: "Social",        pestel: "S", color: "#a78bfa",  desc: "Demographics, unrest, culture" },
  { id: "tech",      label: "Technological", pestel: "T", color: "#fbbf24",  desc: "Digital infrastructure, AI" },
  { id: "other",     label: "Environmental", pestel: "E2", color: "#86efac", desc: "Climate, resources, land" },
  { id: "education", label: "Legal",         pestel: "L", color: "#f472b6",  desc: "Courts, legislation, rights" },
] as const;

type PestelId = typeof PESTEL_CATEGORIES[number]["id"];

const PESTEL_MAP: Record<string, typeof PESTEL_CATEGORIES[number]> = Object.fromEntries(
  PESTEL_CATEGORIES.map((c) => [c.id, c])
);

function ConfidenceBar({ upvotes, total }: { upvotes: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((upvotes / total) * 100);
  const color = pct >= 70 ? "#34d399" : pct >= 40 ? "#fbbf24" : "#f87171";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-medium tabular-nums" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

function SignalCard({
  signal,
  onVote,
  myVote,
  isVoting,
}: {
  signal: any;
  onVote: (id: number, vote: "upvote" | "downvote") => void;
  myVote?: "upvote" | "downvote";
  isVoting: boolean;
}) {
  const cat = PESTEL_MAP[signal.category] ?? PESTEL_MAP["news"];
  const total = (signal.upvoteCount ?? 0) + (signal.downvoteCount ?? 0);
  const upvotes = signal.upvoteCount ?? 0;

  const statusLabel: Record<string, string> = {
    pending: "Awaiting Validation",
    accepted: "Confirmed",
    verified_viral: "Triangulated",
    rejected: "Disputed",
    spam: "Flagged",
  };
  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    accepted: "bg-green-500/15 text-green-400 border-green-500/30",
    verified_viral: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
    spam: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-black"
              style={{ background: `${cat.color}22`, color: cat.color, border: `1px solid ${cat.color}40` }}
            >
              {cat.pestel}
            </span>
            <span className="text-[11px] font-medium text-slate-400">{cat.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${statusColor[signal.status] ?? statusColor.pending}`}>
              {statusLabel[signal.status] ?? "Pending"}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2">
            {signal.title || signal.contentUrl}
          </p>
          {signal.submitterAnalysis && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{signal.submitterAnalysis}</p>
          )}
          {signal.description && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              <span className="text-slate-600">Scope: </span>{signal.description}
            </p>
          )}
        </div>
      </div>

      <ConfidenceBar upvotes={upvotes} total={total} />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">{total} validator{total !== 1 ? "s" : ""}</span>
        {signal.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => onVote(signal.id, "upvote")}
              disabled={!!myVote || isVoting}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                myVote === "upvote"
                  ? "bg-green-500/20 border-green-500/50 text-green-400"
                  : "border-green-500/30 text-green-400 hover:bg-green-500/10 disabled:opacity-40"
              }`}
            >
              ✓ Confirm
            </button>
            <button
              onClick={() => onVote(signal.id, "downvote")}
              disabled={!!myVote || isVoting}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                myVote === "downvote"
                  ? "bg-red-500/20 border-red-500/50 text-red-400"
                  : "border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
              }`}
            >
              ✗ Dispute
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HumansAsAgents() {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useViewPreference("haa", "feed");
  const [myVotes, setMyVotes] = useState<Record<number, "upvote" | "downvote">>({});
  const [votingId, setVotingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: "",
    category: "news" as PestelId,
    contentUrl: "",
    description: "",
    submitterAnalysis: "",
  });

  const { data: haaStats } = trpc.haa.getMyHaaStats.useQuery(undefined, { enabled: !!user });
  const { data: pendingSignals, refetch: refetchSignals } = trpc.haa.getSubmissions.useQuery({ status: "pending", limit: 20 });
  const { data: mySubmissions, refetch: refetchMine } = trpc.haa.getMySubmissions.useQuery({ limit: 20 }, { enabled: !!user });

  const submitMutation = trpc.haa.submitViralContent.useMutation({
    onSuccess: (data) => {
      toast.success(`Field report submitted. +${data.vbtAwarded} VBT earned.`);
      showTokenNotification("earn_upvote_received", { amount: data.vbtAwarded, newBalance: data.vbtAwarded, description: "Field intelligence report" });
      setForm({ title: "", category: "news", contentUrl: "", description: "", submitterAnalysis: "" });
      refetchSignals();
      refetchMine();
    },
    onError: (e) => toast.error(e.message),
  });

  const voteMutation = trpc.haa.voteOnSubmission.useMutation({
    onSuccess: (_, vars) => {
      setMyVotes((prev) => ({ ...prev, [vars.submissionId]: vars.vote }));
      setVotingId(null);
      refetchSignals();
      toast.success(vars.vote === "upvote" ? "Signal confirmed. +50 VBT" : "Signal disputed.");
    },
    onError: (e) => {
      setVotingId(null);
      toast.error(e.message);
    },
  });

  const handleVote = (submissionId: number, vote: "upvote" | "downvote") => {
    if (!user) { window.location.href = getLoginUrl(); return; }
    setVotingId(submissionId);
    voteMutation.mutate({ submissionId, vote });
  };

  const handleSubmit = () => {
    if (!user) { window.location.href = getLoginUrl(); return; }
    if (!form.title.trim()) { toast.error("Signal topic is required"); return; }
    if (!form.contentUrl.trim()) { toast.error("Source URL is required"); return; }

    submitMutation.mutate({
      contentUrl: form.contentUrl,
      category: form.category as any,
      title: form.title,
      description: form.description,
      submitterAnalysis: form.submitterAnalysis,
    });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-border/50 px-4 sm:px-6 py-4 bg-card/40 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100">Field Contributors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submit, validate & triangulate ground-truth signals from across Africa. Earn VBT tokens.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/haa/leaderboard")}
            className="text-xs px-3 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors"
          >
            Leaderboard
          </button>
          <ViewToggle
            options={[{ value: "feed", label: "Feed" }, { value: "mine", label: "My Reports" }]}
            current={view}
            onChange={setView}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

          {/* Stats row */}
          {user && haaStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Validations", value: haaStats.totalSubmissions, color: "#00d4ff" },
                { label: "Confirmed", value: haaStats.acceptedSubmissions, color: "#34d399" },
                { label: "Accuracy Rate", value: `${haaStats.acceptanceRate ?? 0}%`, color: "#a78bfa" },
                { label: "VBT Earned", value: haaStats.totalVbtEarned, color: "#fbbf24" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border/50 bg-card/60 p-4 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">{s.label}</span>
                  <span className="text-2xl font-black" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Signal feed / my reports */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300">
                  {view === "feed"
                    ? `Signals Awaiting Validation (${pendingSignals?.length ?? 0})`
                    : `My Field Reports (${mySubmissions?.length ?? 0})`}
                </h2>
              </div>

              {view === "feed" && (
                <>
                  {!pendingSignals?.length && (
                    <div className="rounded-xl border border-border/50 bg-card/40 p-8 text-center text-slate-500 text-sm">
                      No signals pending validation. Submit a field report below.
                    </div>
                  )}
                  {pendingSignals?.map((s) => (
                    <SignalCard
                      key={s.id}
                      signal={s}
                      onVote={handleVote}
                      myVote={myVotes[s.id]}
                      isVoting={votingId === s.id}
                    />
                  ))}
                </>
              )}

              {view === "mine" && (
                <>
                  {!user && (
                    <div className="rounded-xl border border-border/50 bg-card/40 p-8 text-center text-slate-500 text-sm">
                      <a href={getLoginUrl()} className="text-cyan-400 underline">Sign in</a> to see your reports.
                    </div>
                  )}
                  {user && !mySubmissions?.length && (
                    <div className="rounded-xl border border-border/50 bg-card/40 p-8 text-center text-slate-500 text-sm">
                      You haven't submitted any field reports yet.
                    </div>
                  )}
                  {mySubmissions?.map((s) => (
                    <SignalCard
                      key={s.id}
                      signal={s}
                      onVote={handleVote}
                      myVote={myVotes[s.id]}
                      isVoting={votingId === s.id}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Submit field report */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-4 sticky top-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-200">Submit Field Report</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Share ground-truth intelligence for community triangulation.
                  </p>
                </div>

                {/* PESTEL category pills */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-2 block">PESTEL Category</label>
                  <div className="flex flex-wrap gap-2">
                    {PESTEL_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setForm({ ...form, category: c.id as PestelId })}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                        style={
                          form.category === c.id
                            ? { background: `${c.color}22`, borderColor: `${c.color}60`, color: c.color }
                            : { borderColor: "rgba(255,255,255,0.08)", color: "#64748b" }
                        }
                      >
                        <span
                          className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-black"
                          style={form.category === c.id ? { background: `${c.color}33`, color: c.color } : { background: "#1e293b", color: "#475569" }}
                        >
                          {c.pestel}
                        </span>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Signal Topic *</label>
                    <input
                      type="text"
                      placeholder="e.g. Kenya parliament motion on land taxation..."
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-slate-900/60 border border-border/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Source / Evidence URL *</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={form.contentUrl}
                      onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
                      className="w-full bg-slate-900/60 border border-border/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                    />
                    <p className="text-[11px] text-slate-600 mt-1">News article, government document, official statement</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Geographic Scope</label>
                    <input
                      type="text"
                      placeholder="e.g. Kenya · East Africa · National"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full bg-slate-900/60 border border-border/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Intelligence Analysis</span>
                      <span className="text-yellow-500/80 font-normal">+200 VBT</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="What is the political significance? Who are the key actors? What is the likely trajectory? Risk implications..."
                      value={form.submitterAnalysis}
                      onChange={(e) => setForm({ ...form, submitterAnalysis: e.target.value })}
                      className="w-full bg-slate-900/60 border border-border/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                    />
                    <p className="text-[11px] text-slate-600 mt-1">50+ chars earns double reward</p>
                  </div>
                </div>

                {/* Reward preview */}
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Submission reward</p>
                    <p className="text-lg font-black text-yellow-400">
                      {form.submitterAnalysis.length > 50 ? "200" : "100"} VBT
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">+50 VBT per validation you receive</p>
                  </div>
                  <div className="text-2xl">🔍</div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="w-full py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 transition-all disabled:opacity-60"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Field Report"}
                </button>

                {!user && (
                  <p className="text-xs text-center text-slate-500">
                    <a href={getLoginUrl()} className="text-cyan-400 underline">Sign in</a> to submit intelligence reports
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-xl border border-border/50 bg-card/40 p-5">
            <h3 className="text-sm font-bold text-slate-300 mb-4">How Signal Validation Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  step: "01",
                  title: "Submit Field Report",
                  body: "Field analysts submit political signals with source evidence and PESTEL classification. Earn 100–200 VBT on submission.",
                  color: "#00d4ff",
                },
                {
                  step: "02",
                  title: "Community Validates",
                  body: "Other analysts confirm or dispute the signal. 3+ confirmations moves it to Confirmed status. Earn 50 VBT per confirmation you give.",
                  color: "#a78bfa",
                },
                {
                  step: "03",
                  title: "Triangulated Intelligence",
                  body: "Signals confirmed from multiple independent sources reach Triangulated status — the highest confidence tier, fed into the AI engine.",
                  color: "#34d399",
                },
              ].map((s) => (
                <div key={s.step} className="flex gap-3">
                  <span
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black mt-0.5"
                    style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}30` }}
                  >
                    {s.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
