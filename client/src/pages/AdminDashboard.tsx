import { useAuth } from "@/_core/hooks/useAuth";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Shield, Activity, Users, Database, Server, AlertTriangle, Cpu,
  CheckCircle, Clock, TrendingUp, Loader2, RefreshCw,
  Search, ChevronLeft, ChevronRight, UserCog, Crown, LayoutDashboard
} from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { RegistrationTrendsChart } from "@/components/RegistrationTrendsChart";
import { RegistrationSourceChart } from "@/components/RegistrationSourceChart";
import { formatDistanceToNow } from "date-fns";

type Tab = "overview" | "users";

const TIER_STYLE: Record<string, { label: string; color: string }> = {
  free:       { label: "Free",       color: "text-gray-400 border-gray-600" },
  analyst:    { label: "Analyst",    color: "text-blue-400 border-blue-600" },
  enterprise: { label: "Enterprise", color: "text-purple-400 border-purple-600" },
};

const ROLE_STYLE: Record<string, { label: string; color: string }> = {
  user:  { label: "User",  color: "text-gray-300 border-gray-600" },
  admin: { label: "Admin", color: "text-yellow-400 border-yellow-600" },
};

function UsersTab() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<"all" | "user" | "admin">("all");
  const [tier, setTier] = useState<"all" | "free" | "analyst" | "enterprise">("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "lastSignedIn" | "name">("createdAt");

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = trpc.admin.listUsers.useQuery({
    page, limit: 20, search: debouncedSearch || undefined, role, tier, sortBy, sortDir: "desc",
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="pl-9 bg-[#050b1a] border-[#1e3a5f] text-white"
          />
        </div>
        <div className="flex gap-2">
          {(["all","user","admin"] as const).map(r => (
            <button key={r} onClick={() => { setRole(r); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize
                ${role === r ? "bg-purple-600 border-purple-500 text-white" : "border-[#1e3a5f] text-gray-400 hover:border-purple-500/50"}`}>
              {r === "all" ? "All Roles" : r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["all","free","analyst","enterprise"] as const).map(t => (
            <button key={t} onClick={() => { setTier(t); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize
                ${tier === t ? "bg-blue-600 border-blue-500 text-white" : "border-[#1e3a5f] text-gray-400 hover:border-blue-500/50"}`}>
              {t === "all" ? "All Plans" : t}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          {(["createdAt","lastSignedIn","name"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all
                ${sortBy === s ? "bg-cyan-700 border-cyan-500 text-white" : "border-[#1e3a5f] text-gray-400"}`}>
              {s === "createdAt" ? "Joined" : s === "lastSignedIn" ? "Last Active" : "Name"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-400">
        {total.toLocaleString()} user{total !== 1 ? "s" : ""} found
      </div>

      {/* Table */}
      <Card className="bg-[#0d1e36] border-[#1e3a5f]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-400 py-16">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e3a5f] text-gray-400 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-left px-4 py-3">Role</th>
                    <th className="text-left px-4 py-3">Plan</th>
                    <th className="text-left px-4 py-3">Login Method</th>
                    <th className="text-left px-4 py-3">Joined</th>
                    <th className="text-left px-4 py-3">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id}
                      className={`border-b border-[#1e3a5f]/50 hover:bg-[#050b1a]/60 transition-colors ${i % 2 === 0 ? "" : "bg-[#050b1a]/20"}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold shrink-0">
                            {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white truncate max-w-[180px]">{u.name ?? "—"}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[180px]">{u.email ?? "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${ROLE_STYLE[u.role]?.color ?? ""}`}>
                          {u.role === "admin" && <Crown className="w-3 h-3 mr-1 inline" />}
                          {ROLE_STYLE[u.role]?.label ?? u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${TIER_STYLE[u.subscriptionTier]?.color ?? ""}`}>
                          {TIER_STYLE[u.subscriptionTier]?.label ?? u.subscriptionTier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-300 capitalize">{u.loginMethod ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatDistanceToNow(new Date(u.lastSignedIn), { addSuffix: true })}
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
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-[#1e3a5f]"
              disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" className="border-[#1e3a5f]"
              disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch admin stats
  const { data: stats, isLoading, refetch } = trpc.admin.getSystemStats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
    refetchInterval: autoRefresh ? 10000 : false, // Auto-refresh every 10 seconds
  });

  useEffect(() => {
    if (stats) {
      setLastRefresh(new Date());
    }
  }, [stats]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center">
        <BackToDashboard />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center p-6">
        <Card className="bg-[#0d1e36] border-[#1e3a5f] max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="w-12 h-12 mx-auto text-red-500" />
            <p className="text-gray-400">Please sign in to access the admin dashboard.</p>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center p-6">
        <Card className="bg-[#0d1e36] border-[#1e3a5f] max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500" />
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-gray-400">
              You don't have permission to access the admin dashboard.
            </p>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="border-[#1e3a5f]"
            >
              Go Back Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const systemHealth = stats?.systemHealth || {
    apiStatus: "unknown",
    dbStatus: "unknown",
    uptime: 0,
  };

  const userMetrics = stats?.userMetrics || {
    totalUsers: 0,
    activeUsers: 0,
    totalRequests: 0,
    topEndpoints: [],
  };

  const rateLimitViolations = stats?.rateLimitViolations || [];

  return (
    <div className="min-h-screen bg-[#050b1a] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-400">System monitoring and analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/ai-usage")}
              className="border-[#1e3a5f] gap-2">
              <Cpu className="w-4 h-4" /> AI Usage
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/moderation")}
              className="border-[#1e3a5f] gap-2">
              <Shield className="w-4 h-4" /> Moderation
            </Button>
            {activeTab === "overview" && (
              <>
                <div className="text-sm text-gray-400">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="border-[#1e3a5f]">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={autoRefresh ? "bg-green-600" : "border-[#1e3a5f]"}
                >
                  {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 border-b border-[#1e3a5f] pb-0">
          {([
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "users",    label: "Users",    icon: UserCog },
          ] as { id: Tab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all
                ${activeTab === id
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"}`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Recent users — quick view. For full management, ban controls and role changes:</p>
              <Button size="sm" onClick={() => setLocation("/admin/users")}
                className="bg-purple-600 hover:bg-purple-700 gap-2">
                <Users className="w-4 h-4" /> Full User Management →
              </Button>
            </div>
            <UsersTab />
          </div>
        )}

        {activeTab === "overview" && <>

        {/* System Health */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-[#0d1e36] border-[#1e3a5f]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">API Status</CardTitle>
              <Server className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {systemHealth.apiStatus === "healthy" ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-2xl font-bold text-green-500">Healthy</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-2xl font-bold text-red-500">Down</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1e36] border-[#1e3a5f]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              <Database className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {systemHealth.dbStatus === "connected" ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-2xl font-bold text-green-500">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-2xl font-bold text-red-500">Disconnected</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1e36] border-[#1e3a5f]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Clock className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Since last restart
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Registration Trends Chart */}
        <RegistrationTrendsChart />

        {/* Registration Source Chart */}
        <RegistrationSourceChart />

        {/* User Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-[#0d1e36] border-[#1e3a5f]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userMetrics.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1e36] border-[#1e3a5f]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{userMetrics.activeUsers}</div>
              <p className="text-xs text-gray-400 mt-1">
                Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1e36] border-[#1e3a5f]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userMetrics.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-gray-400 mt-1">
                Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1e36] border-[#1e3a5f]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rate Limit Violations</CardTitle>
              <AlertTriangle className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{rateLimitViolations.length}</div>
              <p className="text-xs text-gray-400 mt-1">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Endpoints */}
        <Card className="bg-[#0d1e36] border-[#1e3a5f]">
          <CardHeader>
            <CardTitle>Top API Endpoints</CardTitle>
            <CardDescription>Most frequently accessed endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userMetrics.topEndpoints.length > 0 ? (
                userMetrics.topEndpoints.map((endpoint: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[#050b1a]">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-cyan-500 text-cyan-500">
                        #{index + 1}
                      </Badge>
                      <span className="font-mono text-sm">{endpoint.path}</span>
                    </div>
                    <span className="text-gray-400">{endpoint.count} requests</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No endpoint data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rate Limit Violations */}
        <Card className="bg-[#0d1e36] border-[#1e3a5f]">
          <CardHeader>
            <CardTitle>Recent Rate Limit Violations</CardTitle>
            <CardDescription>Users who exceeded API rate limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rateLimitViolations.length > 0 ? (
                rateLimitViolations.map((violation: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[#050b1a]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="font-medium">{violation.userId || violation.ip}</span>
                      </div>
                      <div className="text-sm text-gray-400">{violation.endpoint}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-500">{violation.attempts} attempts</div>
                      <div className="text-xs text-gray-400">{new Date(violation.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No violations in the last 24 hours
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        </> /* end overview */}
      </div>
    </div>
  );
}
