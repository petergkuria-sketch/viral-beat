import { useAuth } from "@/_core/hooks/useAuth";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Activity, Users, Database, Server, AlertTriangle, 
  CheckCircle, Clock, TrendingUp, Loader2, RefreshCw 
} from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { RegistrationTrendsChart } from "@/components/RegistrationTrendsChart";
import { RegistrationSourceChart } from "@/components/RegistrationSourceChart";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
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
            <div className="text-sm text-gray-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-[#1e3a5f]"
            >
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
          </div>
        </div>

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
      </div>
    </div>
  );
}
