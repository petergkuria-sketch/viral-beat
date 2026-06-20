import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Shield, Users, Search, ChevronLeft, ChevronRight, ArrowLeft,
  Crown, Ban, CheckCircle, UserCog, TrendingUp, RefreshCw,
  X, AlertTriangle, Mail, Calendar, Clock, Lock, Unlock,
  ChevronDown, Filter, SlidersHorizontal,
} from "lucide-react";

// ─── Style maps ──────────────────────────────────────────────────────────────
const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  free:       { label: "Free",       cls: "border-gray-600 text-gray-400" },
  analyst:    { label: "Analyst",    cls: "border-blue-600 text-blue-400" },
  enterprise: { label: "Enterprise", cls: "border-purple-600 text-purple-400" },
};
const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  user:  { label: "User",  cls: "border-gray-600 text-gray-300" },
  admin: { label: "Admin", cls: "border-yellow-500 text-yellow-400" },
};
const METHOD_COLOR: Record<string, string> = {
  google: "text-blue-400",
  email:  "text-green-400",
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 8 }: { name?: string | null; size?: number }) {
  const initials = (name ?? "?")[0].toUpperCase();
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-purple-500 to-cyan-500
        flex items-center justify-center text-xs font-bold text-white shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Ban Modal ────────────────────────────────────────────────────────────────
function BanModal({
  user,
  onClose,
  onConfirm,
}: {
  user: { id: number; name?: string | null };
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0d1e36] border border-red-800 rounded-2xl p-6 w-full max-w-md space-y-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <Ban className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-black">Ban {user.name ?? "User"}</h2>
        </div>
        <p className="text-sm text-gray-400">This will immediately revoke their access. You can unban them at any time.</p>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Reason (required)</label>
          <Input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Spam, abuse of platform…"
            className="bg-[#050b1a] border-[#1e3a5f] text-white"
            autoFocus
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" className="border-[#1e3a5f]" onClick={onClose}>Cancel</Button>
          <Button disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}
            className="bg-red-600 hover:bg-red-700 text-white">
            Confirm Ban
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── User Detail Drawer ───────────────────────────────────────────────────────
function UserDrawer({
  userId,
  onClose,
  onRefresh,
}: {
  userId: number;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { user: me } = useAuth();
  const [showBanModal, setShowBanModal] = useState(false);
  const utils = trpc.useUtils();

  const { data: u, isLoading, refetch } = trpc.admin.getUser.useQuery({ id: userId });

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { refetch(); onRefresh(); },
  });
  const updateTier = trpc.admin.updateUserTier.useMutation({
    onSuccess: () => { refetch(); onRefresh(); },
  });
  const ban = trpc.admin.banUser.useMutation({
    onSuccess: () => { setShowBanModal(false); refetch(); onRefresh(); },
  });
  const unban = trpc.admin.unbanUser.useMutation({
    onSuccess: () => { refetch(); onRefresh(); },
  });

  const isSelf = me?.id === userId;
  const busy = updateRole.isPending || updateTier.isPending || ban.isPending || unban.isPending;

  return (
    <>
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-[#0a1628] border-l border-[#1e3a5f] shadow-2xl flex flex-col">

        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]">
          <h2 className="font-black text-base flex items-center gap-2">
            <UserCog className="w-4 h-4 text-purple-400" /> User Detail
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : !u ? (
            <p className="text-gray-400 text-center py-8">User not found.</p>
          ) : (
            <>
              {/* Identity */}
              <div className="flex items-center gap-4">
                <Avatar name={u.name} size={12} />
                <div>
                  <div className="font-black text-lg">{u.name ?? "—"}</div>
                  <div className="text-sm text-gray-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {u.email ?? "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">ID #{u.id}</div>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={ROLE_BADGE[u.role]?.cls}>
                  {u.role === "admin" && <Crown className="w-3 h-3 mr-1" />}
                  {ROLE_BADGE[u.role]?.label}
                </Badge>
                <Badge variant="outline" className={TIER_BADGE[u.subscriptionTier]?.cls}>
                  {TIER_BADGE[u.subscriptionTier]?.label}
                </Badge>
                {u.isBanned && (
                  <Badge variant="outline" className="border-red-700 text-red-400">
                    <Ban className="w-3 h-3 mr-1" /> Banned
                  </Badge>
                )}
              </div>

              {/* Ban reason */}
              {u.isBanned && u.banReason && (
                <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-3 text-sm text-red-300">
                  <span className="font-semibold">Ban reason: </span>{u.banReason}
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Calendar, label: "Joined",      value: format(new Date(u.createdAt), "dd MMM yyyy") },
                  { icon: Clock,    label: "Last Active",  value: formatDistanceToNow(new Date(u.lastSignedIn), { addSuffix: true }) },
                  { icon: UserCog,  label: "Login Method", value: u.loginMethod ?? "—" },
                  { icon: Lock,     label: "Visibility",   value: u.profileVisibility },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-[#0d1e36] border border-[#1e3a5f] rounded-xl p-3">
                    <div className="text-[10px] text-gray-400 uppercase mb-1 flex items-center gap-1">
                      <Icon className="w-3 h-3" /> {label}
                    </div>
                    <div className="text-sm font-semibold capitalize">{value}</div>
                  </div>
                ))}
              </div>

              {/* ── Role control ── */}
              <div className="bg-[#0d1e36] border border-[#1e3a5f] rounded-xl p-4 space-y-3">
                <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Role</div>
                <div className="flex gap-2">
                  {(["user", "admin"] as const).map(r => (
                    <button key={r}
                      disabled={busy || isSelf || u.role === r}
                      onClick={() => updateRole.mutate({ id: u.id, role: r })}
                      className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-all capitalize
                        ${u.role === r
                          ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                          : "border-[#1e3a5f] text-gray-400 hover:border-yellow-500/50 disabled:opacity-40 disabled:cursor-not-allowed"}`}>
                      {r === "admin" && <Crown className="w-3 h-3 inline mr-1" />}{r}
                    </button>
                  ))}
                </div>
                {isSelf && <p className="text-xs text-yellow-500/70">You cannot change your own role.</p>}
              </div>

              {/* ── Plan control ── */}
              <div className="bg-[#0d1e36] border border-[#1e3a5f] rounded-xl p-4 space-y-3">
                <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Plan</div>
                <div className="flex gap-2">
                  {(["free", "analyst", "enterprise"] as const).map(t => (
                    <button key={t}
                      disabled={busy || u.subscriptionTier === t}
                      onClick={() => updateTier.mutate({ id: u.id, tier: t })}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all capitalize
                        ${u.subscriptionTier === t
                          ? `${TIER_BADGE[t].cls} bg-white/5`
                          : "border-[#1e3a5f] text-gray-400 hover:border-purple-500/50 disabled:opacity-40 disabled:cursor-not-allowed"}`}>
                      {TIER_BADGE[t].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Ban control ── */}
              {!isSelf && (
                <div className="bg-[#0d1e36] border border-[#1e3a5f] rounded-xl p-4 space-y-3">
                  <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Access</div>
                  {u.isBanned ? (
                    <Button onClick={() => unban.mutate({ id: u.id })} disabled={busy}
                      className="w-full bg-green-700 hover:bg-green-600 text-white gap-2">
                      <Unlock className="w-4 h-4" /> Unban User
                    </Button>
                  ) : (
                    <Button onClick={() => setShowBanModal(true)} disabled={busy}
                      variant="outline" className="w-full border-red-800 text-red-400 hover:bg-red-950/40 gap-2">
                      <Ban className="w-4 h-4" /> Ban User
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Overlay */}
      <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />

      {/* Ban modal */}
      {showBanModal && u && (
        <BanModal
          user={u}
          onClose={() => setShowBanModal(false)}
          onConfirm={reason => ban.mutate({ id: u.id, reason })}
        />
      )}
    </>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <Card className="bg-[#0d1e36] border-[#1e3a5f]">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-black">{value.toLocaleString()}</div>
          <div className="text-xs text-gray-400">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [search, setSearch]               = useState("");
  const [debouncedSearch, setDebounced]   = useState("");
  const [page, setPage]                   = useState(1);
  const [role, setRole]                   = useState<"all" | "user" | "admin">("all");
  const [tier, setTier]                   = useState<"all" | "free" | "analyst" | "enterprise">("all");
  const [banned, setBanned]               = useState<"all" | "active" | "banned">("all");
  const [sortBy, setSortBy]               = useState<"createdAt" | "lastSignedIn" | "name">("createdAt");
  const [sortDir, setSortDir]             = useState<"asc" | "desc">("desc");
  const [selectedId, setSelectedId]       = useState<number | null>(null);
  const [showFilters, setShowFilters]     = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Map "banned" filter to isBanned param
  const isBannedFilter =
    banned === "banned" ? true : banned === "active" ? false : undefined;

  const { data, isLoading, refetch } = trpc.admin.listUsers.useQuery({
    page,
    limit: 25,
    search: debouncedSearch || undefined,
    role,
    tier,
    sortBy,
    sortDir,
  }, { enabled: !!user && user.role === "admin" });

  const rows = data?.users ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  // client-side ban filter (listUsers doesn't have isBanned param yet — filter here)
  const filtered = isBannedFilter === undefined ? rows : rows.filter(u => u.isBanned === isBannedFilter);

  // Summary counts from current page (rough — full counts would need separate query)
  const adminCount = rows.filter(u => u.role === "admin").length;
  const bannedCount = rows.filter(u => u.isBanned).length;

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
    </div>
  );

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="bg-[#0d1e36] border-[#1e3a5f] max-w-sm text-center p-8 space-y-4">
          <AlertTriangle className="w-10 h-10 mx-auto text-yellow-500" />
          <h2 className="text-xl font-black">Access Denied</h2>
          <Button onClick={() => setLocation("/admin")} variant="outline" className="border-[#1e3a5f]">
            Back to Admin
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/admin")}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm">
              <ArrowLeft className="w-4 h-4" /> Admin
            </button>
            <span className="text-gray-600">/</span>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-black">User Management</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-[#1e3a5f] gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Users"   value={total}      icon={Users}        color="bg-purple-500/20 text-purple-400" />
          <StatCard label="Admins"        value={adminCount}  icon={Crown}        color="bg-yellow-500/20 text-yellow-400" />
          <StatCard label="Banned"        value={bannedCount} icon={Ban}          color="bg-red-500/20 text-red-400" />
          <StatCard label="Showing"       value={filtered.length} icon={Filter}   color="bg-cyan-500/20 text-cyan-400" />
        </div>

        {/* Search + filter bar */}
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="pl-9 bg-[#0d1e36] border-[#1e3a5f] text-white placeholder:text-gray-500"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)}
              className={`border-[#1e3a5f] gap-2 ${showFilters ? "border-purple-500 text-purple-400" : "text-gray-400"}`}>
              <SlidersHorizontal className="w-4 h-4" /> Filters
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex flex-wrap gap-4 pt-1 pb-2">
                  {/* Role */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Role</div>
                    <div className="flex gap-1.5">
                      {(["all","user","admin"] as const).map(r => (
                        <button key={r} onClick={() => { setRole(r); setPage(1); }}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all capitalize
                            ${role === r ? "bg-yellow-600/20 border-yellow-500 text-yellow-400" : "border-[#1e3a5f] text-gray-400 hover:border-yellow-500/40"}`}>
                          {r === "all" ? "All" : r}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Plan */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Plan</div>
                    <div className="flex gap-1.5">
                      {(["all","free","analyst","enterprise"] as const).map(t => (
                        <button key={t} onClick={() => { setTier(t); setPage(1); }}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all capitalize
                            ${tier === t ? "bg-blue-600/20 border-blue-500 text-blue-400" : "border-[#1e3a5f] text-gray-400 hover:border-blue-500/40"}`}>
                          {t === "all" ? "All" : TIER_BADGE[t].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Status */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Status</div>
                    <div className="flex gap-1.5">
                      {(["all","active","banned"] as const).map(s => (
                        <button key={s} onClick={() => { setBanned(s); setPage(1); }}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all capitalize
                            ${banned === s
                              ? s === "banned" ? "bg-red-600/20 border-red-500 text-red-400"
                                : "bg-green-600/20 border-green-500 text-green-400"
                              : "border-[#1e3a5f] text-gray-400 hover:border-gray-500"}`}>
                          {s === "all" ? "All" : s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table */}
        <Card className="bg-[#0d1e36] border-[#1e3a5f]">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-gray-400 py-20 space-y-2">
                <Users className="w-10 h-10 mx-auto opacity-20" />
                <p>No users match your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e3a5f] text-[10px] text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-3 w-[280px]">
                        <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-gray-300 transition-colors">
                          User {sortBy === "name" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3">Role</th>
                      <th className="text-left px-4 py-3">Plan</th>
                      <th className="text-left px-4 py-3">Method</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">
                        <button onClick={() => toggleSort("createdAt")} className="flex items-center gap-1 hover:text-gray-300 transition-colors">
                          Joined {sortBy === "createdAt" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3">
                        <button onClick={() => toggleSort("lastSignedIn")} className="flex items-center gap-1 hover:text-gray-300 transition-colors">
                          Last Active {sortBy === "lastSignedIn" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                        </button>
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr key={u.id}
                        onClick={() => setSelectedId(u.id)}
                        className={`border-b border-[#1e3a5f]/40 cursor-pointer transition-colors
                          ${selectedId === u.id ? "bg-purple-500/10" : i % 2 === 0 ? "hover:bg-[#050b1a]/60" : "bg-[#050b1a]/25 hover:bg-[#050b1a]/60"}`}>
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} size={8} />
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate">{u.name ?? "—"}</div>
                              <div className="text-xs text-gray-400 truncate max-w-[180px]">{u.email ?? "—"}</div>
                            </div>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs ${ROLE_BADGE[u.role]?.cls}`}>
                            {u.role === "admin" && <Crown className="w-2.5 h-2.5 mr-1" />}
                            {ROLE_BADGE[u.role]?.label}
                          </Badge>
                        </td>
                        {/* Plan */}
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs ${TIER_BADGE[u.subscriptionTier]?.cls}`}>
                            {TIER_BADGE[u.subscriptionTier]?.label}
                          </Badge>
                        </td>
                        {/* Method */}
                        <td className="px-4 py-3 capitalize">
                          <span className={`text-xs ${METHOD_COLOR[u.loginMethod ?? ""] ?? "text-gray-400"}`}>
                            {u.loginMethod ?? "—"}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          {u.isBanned ? (
                            <span className="flex items-center gap-1 text-xs text-red-400">
                              <Ban className="w-3 h-3" /> Banned
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          )}
                        </td>
                        {/* Joined */}
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {format(new Date(u.createdAt), "dd MMM yyyy")}
                        </td>
                        {/* Last active */}
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {formatDistanceToNow(new Date(u.lastSignedIn), { addSuffix: true })}
                        </td>
                        {/* Action */}
                        <td className="px-4 py-3">
                          <Button size="sm" variant="ghost"
                            className="text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-7 px-2"
                            onClick={e => { e.stopPropagation(); setSelectedId(u.id); }}>
                            Manage →
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>{total.toLocaleString()} total · page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-[#1e3a5f]"
              disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {/* Page number pills */}
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all
                    ${page === p ? "bg-purple-600 border-purple-500 text-white" : "border-[#1e3a5f] text-gray-400 hover:border-purple-500/50"}`}>
                  {p}
                </button>
              );
            })}
            {pages > 7 && <span className="self-center text-gray-600">…</span>}
            <Button size="sm" variant="outline" className="border-[#1e3a5f]"
              disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* User detail drawer */}
      <AnimatePresence>
        {selectedId !== null && (
          <UserDrawer
            userId={selectedId}
            onClose={() => setSelectedId(null)}
            onRefresh={() => refetch()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
