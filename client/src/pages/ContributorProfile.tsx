import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BadgeCheck, FileText, Eye, Coins, Shield, Edit3,
  Globe, Users, Newspaper, Microscope, Megaphone,
  RefreshCw, AlertCircle, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AFFILIATION_ICONS: Record<string, React.ElementType> = {
  journalist:  Newspaper,
  researcher:  Microscope,
  ngo:         Users,
  activist:    Megaphone,
  independent: Globe,
};

const AFFILIATION_LABELS: Record<string, string> = {
  journalist:  "Journalist",
  researcher:  "Researcher",
  ngo:         "NGO",
  activist:    "Activist",
  independent: "Independent Analyst",
};

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  free:       { label: "Observer",      color: "text-slate-400",  bg: "bg-slate-400/10" },
  analyst:    { label: "Analyst",       color: "text-cyan-400",   bg: "bg-cyan-400/10" },
  enterprise: { label: "Correspondent", color: "text-indigo-400", bg: "bg-indigo-400/10" },
};

const RISK_COLOR: Record<string, string> = {
  low: "text-emerald-400", medium: "text-amber-400", high: "text-orange-400", critical: "text-red-400",
};

// ── Own profile (editable) ────────────────────────────────────────────────────

function OwnProfile() {
  const { data: profile, refetch, isLoading } = trpc.contributor.getMyProfile.useQuery();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: "", affiliation: "", affiliationType: "independent" as const, bio: "", profileSlug: "",
  });

  const updateMutation = trpc.contributor.updateProfile.useMutation({
    onSuccess: () => { refetch(); setEditing(false); },
  });

  function startEdit() {
    setForm({
      displayName: profile?.displayName ?? user?.name ?? "",
      affiliation: profile?.affiliation ?? "",
      affiliationType: profile?.affiliationType ?? "independent",
      bio: profile?.bio ?? "",
      profileSlug: profile?.profileSlug ?? "",
    });
    setEditing(true);
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
    </div>
  );

  const tierCfg = TIER_CONFIG[user?.subscriptionTier ?? "free"] ?? TIER_CONFIG.free;
  const AffIcon = AFFILIATION_ICONS[profile?.affiliationType ?? "independent"] ?? Globe;

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="bg-card border border-border/50 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 border border-cyan-500/20 flex items-center justify-center text-xl font-black text-cyan-400">
              {(profile?.displayName ?? user?.name ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-100">
                  {profile?.displayName ?? user?.name ?? "Contributor"}
                </h2>
                {profile?.isVerified ? (
                  <BadgeCheck className="w-5 h-5 text-cyan-400" aria-label="Verified contributor" />
                ) : null}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", tierCfg.bg, tierCfg.color)}>
                  {tierCfg.label}
                </span>
                {profile?.affiliationType && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <AffIcon className="w-3 h-3" />
                    {AFFILIATION_LABELS[profile.affiliationType]}
                  </span>
                )}
              </div>
              {profile?.affiliation && (
                <p className="text-sm text-slate-400 mt-1">{profile.affiliation}</p>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={startEdit}
            className="border-white/10 text-slate-300 hover:text-white gap-2">
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </Button>
        </div>

        {profile?.bio && (
          <p className="mt-4 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-4">
            {profile.bio}
          </p>
        )}

        {profile?.profileSlug && (
          <p className="mt-3 text-[11px] text-slate-500 font-mono">
            viralbeat.io/contributor/{profile.profileSlug}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Coins,    label: "Signal Credits", value: profile?.signalCredits ?? 0,  color: "text-amber-400" },
          { icon: FileText, label: "Briefs Shared",  value: profile?.briefsShared ?? 0,   color: "text-cyan-400" },
          { icon: Eye,      label: "Total Views",    value: "—",                            color: "text-indigo-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 text-center">
            <stat.icon className={cn("w-4 h-4 mx-auto mb-2", stat.color)} />
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Signal Credits explainer */}
      <div className="bg-amber-400/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
        <Coins className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-bold text-amber-400 mb-1">Signal Credits</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Earn 5 credits every time you share a brief. Credits unlock premium brief generation,
            bulk data exports, and priority API access. Submit verified field signals to earn 20 credits each.
          </p>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-card border border-cyan-500/20 rounded-2xl p-6 space-y-4">
          <h3 className="font-black text-slate-100">Edit Profile</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Display Name</label>
              <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Profile URL slug</label>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <span className="text-[11px] text-slate-500 shrink-0">viralbeat.io/contributor/</span>
                <input value={form.profileSlug} onChange={e => setForm(f => ({ ...f, profileSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                  className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none ml-1" placeholder="your-slug" />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Affiliation</label>
              <input value={form.affiliation} onChange={e => setForm(f => ({ ...f, affiliation: e.target.value }))}
                placeholder="Organisation / publication / institution"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Role type</label>
              <select value={form.affiliationType}
                onChange={e => setForm(f => ({ ...f, affiliationType: e.target.value as any }))}
                className="w-full bg-[#0d1525] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50">
                {Object.entries(AFFILIATION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Bio (max 600 chars)</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, 600) }))}
              rows={3} placeholder="What you work on, your focus areas, your region..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 resize-none" />
            <p className="text-[10px] text-slate-600 mt-1 text-right">{form.bio.length}/600</p>
          </div>

          <div className="flex gap-2">
            <Button size="sm"
              onClick={() => updateMutation.mutate(form)}
              disabled={updateMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold gap-2">
              {updateMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}
              className="border-white/10 text-slate-400 gap-2">
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Shared briefs list */}
      <SharedBriefsList />
    </div>
  );
}

function SharedBriefsList() {
  const { data: briefs, isLoading } = trpc.briefs.myBriefs.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="h-20 flex items-center justify-center"><RefreshCw className="w-4 h-4 animate-spin text-slate-500" /></div>;
  if (!briefs?.length) return (
    <div className="bg-card border border-border/50 rounded-2xl p-8 text-center">
      <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
      <p className="text-slate-400 text-sm">No shared briefs yet.</p>
      <p className="text-slate-500 text-xs mt-1">Open any country in Africa Intelligence and click <strong className="text-slate-400">Share Brief</strong>.</p>
      <Button size="sm" variant="outline" className="mt-4 border-white/10 text-slate-300"
        onClick={() => setLocation("/africa")}>Browse Africa Intelligence</Button>
    </div>
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Shared Briefs</h3>
      {briefs.map((b: any) => (
        <a key={b.id} href={`/brief/${b.id}`} target="_blank" rel="noreferrer"
          className="block bg-card border border-border/50 rounded-xl p-4 hover:border-white/20 transition-all group">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-cyan-400 transition-colors">{b.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-500">
                  {new Date(b.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                  <Eye className="w-2.5 h-2.5" /> {b.viewCount ?? 0}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn("text-[10px] font-bold", RISK_COLOR[b.riskLevel] ?? "text-slate-400")}>
                {(b.riskLevel ?? "").toUpperCase()}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">{b.sentimentScore}/100</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

// ── Public profile by slug ────────────────────────────────────────────────────

function PublicContributorProfile({ slug }: { slug: string }) {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading, error } = trpc.contributor.getBySlug.useQuery({ slug });

  if (isLoading) return (
    <div className="min-h-screen bg-[#050b1a] flex items-center justify-center">
      <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <h2 className="text-xl font-black text-white">Profile not found</h2>
      <Button onClick={() => setLocation("/")} variant="outline" className="border-white/10 text-slate-300">Home</Button>
    </div>
  );

  const tierCfg = TIER_CONFIG[profile.subscriptionTier ?? "free"] ?? TIER_CONFIG.free;
  const AffIcon = AFFILIATION_ICONS[profile.affiliationType ?? "independent"] ?? Globe;

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <div className="border-b border-white/5 bg-[#080d1a]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button onClick={() => setLocation("/")} className="text-cyan-400 font-black text-sm hover:text-cyan-300">VIRALBEAT</button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Profile card */}
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 border border-cyan-500/20 flex items-center justify-center text-xl font-black text-cyan-400 shrink-0">
              {(profile.displayName ?? profile.name ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-slate-100">{profile.displayName ?? profile.name}</h1>
                {profile.isVerified ? <BadgeCheck className="w-5 h-5 text-cyan-400" /> : null}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", tierCfg.bg, tierCfg.color)}>
                  {tierCfg.label}
                </span>
                {profile.affiliationType && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <AffIcon className="w-3 h-3" />
                    {AFFILIATION_LABELS[profile.affiliationType]}
                  </span>
                )}
              </div>
              {profile.affiliation && <p className="text-sm text-slate-400 mt-1">{profile.affiliation}</p>}
            </div>
          </div>
          {profile.bio && <p className="mt-4 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-4">{profile.bio}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Briefs Published", value: profile.totalBriefs ?? 0,  icon: FileText, color: "text-cyan-400" },
            { label: "Total Views",      value: profile.totalViews ?? 0,   icon: Eye,      color: "text-indigo-400" },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 text-center">
              <s.icon className={cn("w-4 h-4 mx-auto mb-2", s.color)} />
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
              <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Recent briefs */}
        {profile.recentBriefs?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Published Briefs</h3>
            {profile.recentBriefs.map((b: any) => (
              <a key={b.id} href={`/brief/${b.id}`} target="_blank" rel="noreferrer"
                className="block bg-card border border-border/50 rounded-xl p-4 hover:border-white/20 transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-cyan-400 transition-colors">{b.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(b.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      · <Eye className="w-2.5 h-2.5 inline" /> {b.viewCount ?? 0}
                    </p>
                  </div>
                  <span className={cn("text-[10px] font-bold shrink-0", RISK_COLOR[b.riskLevel] ?? "text-slate-400")}>
                    {(b.riskLevel ?? "").toUpperCase()}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="text-center pt-4">
          <Button onClick={() => setLocation("/")} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
            Explore ViralBeat Intelligence
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Router entry ──────────────────────────────────────────────────────────────

export default function ContributorProfile() {
  const { slug } = useParams<{ slug?: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // /contributor/me → own profile
  if (!slug || slug === "me") {
    if (!user) {
      window.location.href = getLoginUrl();
      return null;
    }
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> Contributor Profile
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Your intelligence identity on ViralBeat</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setLocation("/africa")}
            className="border-white/10 text-slate-300 hover:text-white gap-2">
            <Globe className="w-3.5 h-3.5" /> Africa Intelligence
          </Button>
        </div>
        <div className="p-4 sm:p-6 max-w-2xl">
          <OwnProfile />
        </div>
      </div>
    );
  }

  // /contributor/:slug → public profile
  return <PublicContributorProfile slug={slug} />;
}

// make getLoginUrl available
import { getLoginUrl } from "@/const";
