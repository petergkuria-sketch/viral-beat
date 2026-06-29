import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Cpu, Loader2, Lock, ShieldCheck, ArrowLeft, DollarSign, Activity, CheckCircle2, Gauge,
} from "lucide-react";

const usd = (n: number) => `$${n < 0.01 ? n.toFixed(4) : n.toFixed(2)}`;
const PROVIDER_COLOR: Record<string, string> = { claude: "#d97706", openai: "#10a37f", gemini: "#4285f4" };

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Cpu; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function Table({ title, rows, keyLabel, colorKey }: {
  title: string;
  keyLabel: string;
  colorKey?: boolean;
  rows: Array<{ name: string; requests: number; successRate: number; cost: number; p95LatencyMs: number }>;
}) {
  const maxCost = Math.max(...rows.map(r => r.cost), 0.000001);
  return (
    <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1a2d4a] text-sm font-bold text-white">{title}</div>
      <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] px-4 py-2 text-[10px] uppercase tracking-wider text-slate-500 border-b border-[#0f1e35]">
        <span>{keyLabel}</span><span className="text-right">Requests</span><span className="text-right">Success</span><span className="text-right">p95 latency</span><span className="text-right">Cost</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-slate-600">No data in range.</div>
      ) : rows.map(r => (
        <div key={r.name} className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] px-4 py-2.5 items-center border-b border-[#0f1e35] last:border-0">
          <div className="flex items-center gap-2 min-w-0">
            {colorKey && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PROVIDER_COLOR[r.name] ?? "#64748b" }} />}
            <span className="text-sm text-slate-200 truncate capitalize">{r.name}</span>
          </div>
          <span className="text-right text-sm text-slate-300">{r.requests.toLocaleString()}</span>
          <span className={`text-right text-sm font-semibold ${r.successRate >= 99 ? "text-emerald-400" : r.successRate >= 90 ? "text-amber-400" : "text-red-400"}`}>{r.successRate}%</span>
          <span className="text-right text-sm text-slate-300">{r.p95LatencyMs.toLocaleString()}ms</span>
          <div className="text-right">
            <div className="text-sm font-semibold text-white">{usd(r.cost)}</div>
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mt-1">
              <div className="h-full bg-cyan-500/60" style={{ width: `${(r.cost / maxCost) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AiUsagePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [days, setDays] = useState(30);
  const isAdmin = (user as any)?.role === "admin";
  const q = trpc.aiUsage.overview.useQuery({ days }, { enabled: isAdmin });

  if (!user || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
        {!user ? <Lock className="w-10 h-10 text-slate-600" /> : <ShieldCheck className="w-10 h-10 text-slate-600" />}
        <p className="text-slate-400">{!user ? "Sign in as an administrator." : "Admin access required."}</p>
      </div>
    );
  }

  const d = q.data;
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button onClick={() => setLocation("/admin")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 mb-5">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin
      </button>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">AI usage</h1>
            <p className="text-xs text-slate-500">Spend, success rate and latency across providers</p>
          </div>
        </div>
        <div className="flex gap-1 bg-[#0a1628] border border-[#1a2d4a] rounded-lg p-0.5">
          {[7, 30, 90].map(n => (
            <button key={n} onClick={() => setDays(n)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${days === n ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white"}`}>
              {n}d
            </button>
          ))}
        </div>
      </div>

      {q.isLoading || !d ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={DollarSign} label="Total spend" value={usd(d.total.cost)} sub={`last ${d.days} days`} />
            <Stat icon={Activity} label="Requests" value={d.total.requests.toLocaleString()} />
            <Stat icon={CheckCircle2} label="Success rate" value={`${d.total.successRate}%`} />
            <Stat icon={Gauge} label="p95 latency" value={`${d.total.p95LatencyMs.toLocaleString()}ms`} sub={`avg ${d.avgLatencyMs}ms`} />
          </div>

          <Table title="By provider" keyLabel="Provider" colorKey
            rows={d.byProvider.map(p => ({ name: p.provider, requests: p.requests, successRate: p.successRate, cost: p.cost, p95LatencyMs: p.p95LatencyMs }))} />
          <Table title="By model" keyLabel="Model"
            rows={d.byModel.map(m => ({ name: m.model, requests: m.requests, successRate: m.successRate, cost: m.cost, p95LatencyMs: m.p95LatencyMs }))} />
          <Table title="By day" keyLabel="Day"
            rows={d.byDay.map(x => ({ name: x.day, requests: x.requests, successRate: x.successRate, cost: x.cost, p95LatencyMs: x.p95LatencyMs }))} />

          <p className="text-[11px] text-slate-600 text-center">
            Telemetry covers requests routed through the AI Orchestrator. Cost is estimated from per-model pricing.
          </p>
        </div>
      )}
    </div>
  );
}
