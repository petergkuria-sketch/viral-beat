import React, { useState, useMemo } from "react";

import { electionPhases, kenyaRegions, senateMembers, executiveMembers } from "@/lib/kenya/political-data";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  BarChart3,
  Megaphone,
  Vote,
  Flag
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from "recharts";

// Generate mock phase sentiment data
const generatePhaseSentimentData = () => {
  const phases = ["Pre-Election", "Campaign", "Local Mobilization"];
  return phases.map(phase => ({
    phase,
    kenyaKwanza: Math.floor(Math.random() * 20) + 40,
    azimio: Math.floor(Math.random() * 20) + 40,
    overall: Math.floor(Math.random() * 15) + 45
  }));
};

// Generate mock timeline data
const generateTimelineData = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map(month => ({
    month,
    preElection: Math.floor(Math.random() * 20) + 35,
    campaign: Math.floor(Math.random() * 25) + 40,
    mobilization: Math.floor(Math.random() * 30) + 45,
    hateSpeech: Math.floor(Math.random() * 50) + 10
  }));
};

// Generate regional mobilization data
const generateRegionalMobilization = () => {
  return kenyaRegions.map(region => ({
    region: region.name,
    mobilizationLevel: Math.floor(Math.random() * 100),
    hateSpeechIntensity: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)] as string,
    dominantCoalition: region.dominantCoalition,
    voterTurnout: Math.floor(Math.random() * 30) + 60,
    keyIssues: ["Economy", "Security", "Healthcare", "Education", "Infrastructure"][Math.floor(Math.random() * 5)]
  }));
};

const phaseIcons: Record<string, React.ReactNode> = {
  pre_election: <Calendar className="w-6 h-6" />,
  campaign: <Megaphone className="w-6 h-6" />,
  local_mobilization: <Users className="w-6 h-6" />,
  election_day: <Vote className="w-6 h-6" />,
  post_election: <Flag className="w-6 h-6" />
};

const getMobilizationColor = (level: number) => {
  if (level >= 80) return "bg-red-500";
  if (level >= 60) return "bg-orange-500";
  if (level >= 40) return "bg-amber-500";
  return "bg-emerald-500";
};

const getHateSpeechBadgeStyle = (intensity: string) => {
  switch (intensity) {
    case "critical": return "bg-red-500/10 border-red-500/20 text-red-300";
    case "high": return "bg-orange-500/10 border-orange-500/20 text-orange-300";
    case "medium": return "bg-amber-500/10 border-amber-500/20 text-amber-300";
    default: return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
  }
};

export default function ElectionPhases() {
  const [selectedPhase, setSelectedPhase] = useState<string>("campaign");
  const [viewMode, setViewMode] = useState<"overview" | "timeline" | "regional">("overview");

  const phaseSentimentData = useMemo(() => generatePhaseSentimentData(), []);
  const timelineData = useMemo(() => generateTimelineData(), []);
  const regionalData = useMemo(() => generateRegionalMobilization(), []);

  const currentPhase = electionPhases.find(p => p.id === selectedPhase);

  const chartTooltipStyle = {
    backgroundColor: '#0d1525',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#e2e8f0'
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-slate-400" />
          <div>
            <h1 className="text-xl font-black text-slate-100">Election Phase Tracker</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Track sentiment across Pre-election, Campaign, and Local Mobilization phases.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Phase Selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {electionPhases.map(phase => (
            <button
              key={phase.id}
              onClick={() => setSelectedPhase(phase.id)}
              className={`bg-card border rounded-2xl p-4 text-left transition-all ${
                selectedPhase === phase.id
                  ? "border-white/20 bg-white/10"
                  : "border-border/50 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                {phaseIcons[phase.type]}
                {phase.isActive && (
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                )}
              </div>
              <div className={`text-sm font-bold ${selectedPhase === phase.id ? 'text-slate-100' : 'text-slate-300'}`}>{phase.name}</div>
              <div className={`text-xs mt-1 ${selectedPhase === phase.id ? "text-slate-300" : "text-slate-500"}`}>
                {phase.isActive ? "Active" : "Inactive"}
              </div>
            </button>
          ))}
        </div>

        {/* Current Phase Details */}
        {currentPhase && (
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span className="text-slate-400">{phaseIcons[currentPhase.type]}</span>
                  {currentPhase.name}
                  {currentPhase.isActive && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">Active</span>
                  )}
                </h3>
                <p className="text-slate-400 mt-1">{currentPhase.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("overview")}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
              viewMode === "overview" ? "bg-white/10 border-white/20 text-slate-100" : "bg-card border-border/50 text-slate-400 hover:bg-white/5"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
              viewMode === "timeline" ? "bg-white/10 border-white/20 text-slate-100" : "bg-card border-border/50 text-slate-400 hover:bg-white/5"
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode("regional")}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
              viewMode === "regional" ? "bg-white/10 border-white/20 text-slate-100" : "bg-card border-border/50 text-slate-400 hover:bg-white/5"
            }`}
          >
            Regional Mobilization
          </button>
        </div>

        {/* Overview Mode */}
        {viewMode === "overview" && (
          <div className="space-y-5">
            {/* Coalition Sentiment by Phase */}
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Coalition Sentiment by Phase
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={phaseSentimentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="phase" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend />
                    <Bar dataKey="kenyaKwanza" name="Kenya Kwanza" fill="#fbbf24" />
                    <Bar dataKey="azimio" name="Azimio" fill="#f97316" />
                    <Bar dataKey="overall" name="Overall" fill="#818cf8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Phase Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-amber-500/20 rounded-2xl p-5">
                <div className="text-xs text-slate-400 mb-1">Kenya Kwanza Support</div>
                <div className="text-3xl font-bold text-amber-300">52%</div>
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                  +3% from last phase
                </div>
              </div>
              <div className="bg-card border border-orange-500/20 rounded-2xl p-5">
                <div className="text-xs text-slate-400 mb-1">Azimio Support</div>
                <div className="text-3xl font-bold text-orange-300">45%</div>
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <TrendingDown className="w-3 h-3" />
                  -2% from last phase
                </div>
              </div>
              <div className="bg-card border border-red-500/20 rounded-2xl p-5">
                <div className="text-xs text-slate-400 mb-1">Hate Speech Alerts</div>
                <div className="text-3xl font-bold text-red-300">127</div>
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  23 critical
                </div>
              </div>
              <div className="bg-card border border-emerald-500/20 rounded-2xl p-5">
                <div className="text-xs text-slate-400 mb-1">Voter Engagement</div>
                <div className="text-3xl font-bold text-emerald-300">68%</div>
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <Activity className="w-3 h-3" />
                  High activity
                </div>
              </div>
            </div>

            {/* Key Issues by Phase */}
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-4">Key Issues Driving Sentiment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { issue: "Cost of Living", score: 85, trend: "up" },
                  { issue: "Unemployment", score: 72, trend: "stable" },
                  { issue: "Healthcare Access", score: 68, trend: "up" },
                  { issue: "Security", score: 65, trend: "down" },
                  { issue: "Education", score: 58, trend: "stable" },
                  { issue: "Infrastructure", score: 52, trend: "up" }
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-200">{item.issue}</span>
                      {item.trend === "up" && <TrendingUp className="w-4 h-4" style={{ color: '#f87171' }} />}
                      {item.trend === "down" && <TrendingDown className="w-4 h-4" style={{ color: '#34d399' }} />}
                      {item.trend === "stable" && <Minus className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{item.score}% concern level</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timeline Mode */}
        {viewMode === "timeline" && (
          <div className="space-y-5">
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Sentiment Timeline (2024)
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend />
                    <Area type="monotone" dataKey="preElection" name="Pre-Election" stroke="#818cf8" fill="#818cf8" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="campaign" name="Campaign" stroke="#34d399" fill="#34d399" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="mobilization" name="Mobilization" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Hate Speech Incidents Over Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="hateSpeech"
                      name="Hate Speech Incidents"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={{ fill: '#f87171' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Regional Mobilization Mode */}
        {viewMode === "regional" && (
          <div className="space-y-5">
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="font-bold text-slate-200 mb-2">Regional Mobilization Index</h3>
              <p className="text-sm text-slate-400">
                Tracking grassroots political activity and support balkanization across Kenya's 8 regions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regionalData.map((region, i) => (
                <div key={i} className="bg-card border border-border/50 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-slate-100 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {region.region} Region
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${
                          region.dominantCoalition === "Kenya Kwanza" ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                          region.dominantCoalition === "Azimio" ? "bg-orange-500/10 border-orange-500/20 text-orange-300" :
                          "bg-white/5 border-white/10 text-slate-400"
                        }`}>
                          {region.dominantCoalition}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getHateSpeechBadgeStyle(region.hateSpeechIntensity)}`}>
                          {region.hateSpeechIntensity.toUpperCase()} Risk
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-100">{region.mobilizationLevel}%</div>
                      <div className="text-xs text-slate-400">Mobilization</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Mobilization Level</span>
                        <span className="text-slate-200">{region.mobilizationLevel}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getMobilizationColor(region.mobilizationLevel)}`}
                          style={{ width: `${region.mobilizationLevel}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Projected Voter Turnout</span>
                        <span className="text-slate-200">{region.voterTurnout}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${region.voterTurnout}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <span className="text-xs text-slate-400">Key Issue: </span>
                      <span className="text-xs font-bold text-slate-200">{region.keyIssues}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Balkanization Alert */}
            <div className="bg-card border border-red-500/30 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 flex-shrink-0" style={{ color: '#f87171' }} />
                <div>
                  <h4 className="font-bold text-red-300">Support Balkanization Alert</h4>
                  <p className="text-sm text-red-400 mt-1">
                    Strong regional polarization detected. Nyanza and Western regions show 85%+ Azimio support,
                    while Rift Valley and Central show 80%+ Kenya Kwanza support. This pattern mirrors
                    historical ethnic voting blocs and increases risk of post-election tensions.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 border border-red-500/20 text-red-300">High Polarization</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 border border-red-500/20 text-red-300">Ethnic Bloc Voting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
