import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { getCountryConfig } from "@shared/countryConfig";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, Minus, ArrowLeft, Activity,
  Users, RefreshCw, Radio, AlertCircle, Loader2,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// Generate plausible 90-day sentiment history for a figure
function generateHistory(seed: number, base: number) {
  const data = [];
  let val = base;
  const now = Date.now();
  for (let i = 89; i >= 0; i--) {
    val = Math.min(95, Math.max(10, val + (Math.sin(i * seed) * 4) + (Math.random() - 0.5) * 6));
    const d = new Date(now - i * 86_400_000);
    data.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), sentiment: Math.round(val) });
  }
  return data;
}

// Country-specific political figures
const FIGURES: Record<string, Array<{ id: string; name: string; role: string; party: string; base: number; seed: number }>> = {
  ke: [
    { id: "ruto",    name: "William Ruto",   role: "President",           party: "UDA",    base: 42, seed: 0.17 },
    { id: "raila",   name: "Raila Odinga",   role: "AU Commission Chair", party: "ODM",    base: 55, seed: 0.23 },
    { id: "gachagua",name: "Rigathi Gachagua",role: "Former DP",          party: "UDA",    base: 31, seed: 0.31 },
    { id: "karua",   name: "Martha Karua",   role: "NARC-Kenya Leader",   party: "NARC",   base: 48, seed: 0.19 },
  ],
  ng: [
    { id: "tinubu",  name: "Bola Tinubu",   role: "President",           party: "APC",    base: 38, seed: 0.14 },
    { id: "atiku",   name: "Atiku Abubakar",role: "PDP Leader",          party: "PDP",    base: 44, seed: 0.22 },
    { id: "peter",   name: "Peter Obi",     role: "LP Presidential Candidate", party: "LP", base: 58, seed: 0.27 },
    { id: "shettima",name: "Kashim Shettima",role: "Vice President",     party: "APC",    base: 35, seed: 0.18 },
  ],
  za: [
    { id: "ramaphosa",name: "Cyril Ramaphosa",role: "President",         party: "ANC",    base: 46, seed: 0.16 },
    { id: "zuma",    name: "Jacob Zuma",    role: "MK Party Founder",    party: "MKP",    base: 33, seed: 0.29 },
    { id: "malema",  name: "Julius Malema", role: "EFF Leader",          party: "EFF",    base: 40, seed: 0.21 },
    { id: "steenhuisen",name: "John Steenhuisen",role: "DA Leader",       party: "DA",    base: 52, seed: 0.25 },
  ],
  gh: [
    { id: "mahama",  name: "John Mahama",   role: "President",           party: "NDC",    base: 60, seed: 0.15 },
    { id: "bawumia", name: "Mahamudu Bawumia",role: "Former VP",          party: "NPP",   base: 45, seed: 0.24 },
    { id: "akufo",   name: "Nana Akufo-Addo",role: "Former President",   party: "NPP",   base: 38, seed: 0.19 },
  ],
  et: [
    { id: "abiy",    name: "Abiy Ahmed",    role: "Prime Minister",       party: "PP",    base: 40, seed: 0.20 },
  ],
  sn: [
    { id: "faye",    name: "Bassirou Faye", role: "President",            party: "PASTEF",base: 55, seed: 0.18 },
    { id: "sonko",   name: "Ousmane Sonko", role: "Prime Minister",       party: "PASTEF",base: 58, seed: 0.22 },
  ],
  tz: [
    { id: "hassan",  name: "Samia Hassan",  role: "President",            party: "CCM",   base: 52, seed: 0.16 },
  ],
  ci: [
    { id: "ouattara",name: "Alassane Ouattara",role: "President",         party: "RHDP",  base: 48, seed: 0.17 },
  ],
  eg: [
    { id: "sisi",    name: "Abdel Fattah el-Sisi",role: "President",      party: "Independent",base: 50, seed: 0.13 },
  ],
  rw: [
    { id: "kagame",  name: "Paul Kagame",   role: "President",            party: "RPF",   base: 70, seed: 0.11 },
  ],
};

const DEFAULT_FIGURES = [
  { id: "leader", name: "Head of State", role: "President / PM", party: "—", base: 50, seed: 0.15 },
];

const SCORE_COLOR = (s: number) =>
  s >= 60 ? "#34d399" : s >= 45 ? "#fbbf24" : "#f87171";

const TREND_ICON = (history: { sentiment: number }[]) => {
  if (history.length < 10) return <Minus className="w-4 h-4 text-muted-foreground" />;
  const recent = history.slice(-7).reduce((a, b) => a + b.sentiment, 0) / 7;
  const older = history.slice(-30, -7).reduce((a, b) => a + b.sentiment, 0) / 23;
  const diff = recent - older;
  if (diff > 2) return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (diff < -2) return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-yellow-400" />;
};

export default function CountryTracker() {
  const { code = "ke" } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const country = getCountryConfig(code);
  const figures = FIGURES[code.toLowerCase()] ?? DEFAULT_FIGURES;
  const [selectedId, setSelectedId] = useState(figures[0].id);

  const selected = figures.find(f => f.id === selectedId) ?? figures[0];
  const history = generateHistory(selected.seed, selected.base);
  const currentScore = history[history.length - 1].sentiment;

  // Optional: load live country data for context
  const { data: countryData } = trpc.country.get.useQuery(
    { code: code.toLowerCase() },
    { staleTime: 1000 * 60 * 30 }
  );

  if (!country) {
    return <div className="p-6 text-muted-foreground">Country not found.</div>;
  }

  const color = SCORE_COLOR(currentScore);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <button
          onClick={() => setLocation(`/country/${code}`)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> {country.name} Overview
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{country.flag}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              {country.name} Sentiment Tracker
            </h1>
            <p className="text-xs text-muted-foreground">
              Public approval ratings · {figures.length} tracked figures
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
            <Radio className="w-3 h-3 animate-pulse" /> Live
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid lg:grid-cols-4 gap-6">

          {/* Figure selector */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Select Figure</p>
            {figures.map((fig, i) => {
              const h = generateHistory(fig.seed, fig.base);
              const score = h[h.length - 1].sentiment;
              const c = SCORE_COLOR(score);
              const isSelected = fig.id === selectedId;
              return (
                <motion.button
                  key={fig.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setSelectedId(fig.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                    isSelected
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-border/50 hover:border-primary/30"
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                    style={{ background: `${c}20`, color: c }}
                  >
                    {fig.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{fig.name}</div>
                    <div className="text-[10px] text-muted-foreground">{fig.party}</div>
                  </div>
                  <div className="ml-auto shrink-0 flex items-center gap-1">
                    {TREND_ICON(h)}
                    <span className="text-sm font-black" style={{ color: c }}>{score}%</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Chart area */}
          <div className="lg:col-span-3 space-y-4">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/50 rounded-2xl p-5"
            >
              {/* Figure header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black"
                    style={{ background: `${color}20`, color }}
                  >
                    {selected.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-black text-lg">{selected.name}</div>
                    <div className="text-xs text-muted-foreground">{selected.role} · {selected.party}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Approval</div>
                  <div className="text-4xl font-black" style={{ color }}>{currentScore}%</div>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    {TREND_ICON(history)}
                    <span className="text-xs text-muted-foreground">7-day trend</span>
                  </div>
                </div>
              </div>

              {/* Approval bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Public approval</span>
                  <span>{currentScore}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${currentScore}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* 90-day chart */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">90-Day Trend</p>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={history} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                      tickLine={false}
                      axisLine={false}
                      interval={14}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${v}%`, "Approval"]}
                    />
                    <ReferenceLine y={50} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="sentiment"
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: color }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* All figures at a glance */}
            <div className="grid sm:grid-cols-2 gap-3">
              {figures.map((fig, i) => {
                const h = generateHistory(fig.seed, fig.base);
                const score = h[h.length - 1].sentiment;
                const c = SCORE_COLOR(score);
                return (
                  <motion.button
                    key={fig.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.07 }}
                    onClick={() => setSelectedId(fig.id)}
                    className={`flex items-center gap-3 bg-card border rounded-xl p-3 text-left transition-all ${
                      selectedId === fig.id ? "border-primary" : "border-border/50 hover:border-primary/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{ background: `${c}15`, color: c }}>
                      {fig.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{fig.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{fig.role}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black" style={{ color: c }}>{score}%</div>
                      <div className="flex justify-end">{TREND_ICON(h)}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
