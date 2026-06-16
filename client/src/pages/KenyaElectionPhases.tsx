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
  if (level >= 40) return "bg-yellow-500";
  return "bg-green-500";
};

const getHateSpeechColor = (intensity: string) => {
  switch (intensity) {
    case "critical": return "bg-red-600 text-white";
    case "high": return "bg-red-400 text-white";
    case "medium": return "bg-yellow-500 text-black";
    default: return "bg-green-500 text-white";
  }
};

export default function ElectionPhases() {
  const [selectedPhase, setSelectedPhase] = useState<string>("campaign");
  const [viewMode, setViewMode] = useState<"overview" | "timeline" | "regional">("overview");

  const phaseSentimentData = useMemo(() => generatePhaseSentimentData(), []);
  const timelineData = useMemo(() => generateTimelineData(), []);
  const regionalData = useMemo(() => generateRegionalMobilization(), []);

  const currentPhase = electionPhases.find(p => p.id === selectedPhase);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b-2 border-border pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8" />
            <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase">Election Phase Tracker</h2>
          </div>
          <p className="text-muted-foreground font-mono">
            Track sentiment across Pre-election, Campaign, and Local Mobilization phases.
          </p>
        </div>

        {/* Phase Selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {electionPhases.map(phase => (
            <button
              key={phase.id}
              onClick={() => setSelectedPhase(phase.id)}
              className={`brutalist-card text-left transition-all ${
                selectedPhase === phase.id 
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-background hover:bg-secondary"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {phaseIcons[phase.type]}
                {phase.isActive && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                )}
              </div>
              <div className="font-mono text-sm font-bold">{phase.name}</div>
              <div className={`text-xs mt-1 ${selectedPhase === phase.id ? "opacity-70" : "text-muted-foreground"}`}>
                {phase.isActive ? "Active" : "Inactive"}
              </div>
            </button>
          ))}
        </div>

        {/* Current Phase Details */}
        {currentPhase && (
          <div className="brutalist-card bg-secondary">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {phaseIcons[currentPhase.type]}
                  {currentPhase.name}
                  {currentPhase.isActive && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-mono">ACTIVE</span>
                  )}
                </h3>
                <p className="text-muted-foreground mt-1">{currentPhase.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("overview")}
            className={`px-4 py-2 font-mono text-sm border-2 border-border transition-colors ${
              viewMode === "overview" ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-4 py-2 font-mono text-sm border-2 border-border transition-colors ${
              viewMode === "timeline" ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode("regional")}
            className={`px-4 py-2 font-mono text-sm border-2 border-border transition-colors ${
              viewMode === "regional" ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
            }`}
          >
            Regional Mobilization
          </button>
        </div>

        {/* Overview Mode */}
        {viewMode === "overview" && (
          <div className="space-y-6">
            {/* Coalition Sentiment by Phase */}
            <div className="brutalist-card bg-background">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Coalition Sentiment by Phase
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={phaseSentimentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="phase" tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                    <YAxis tick={{ fontSize: 12, fontFamily: 'monospace' }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        fontFamily: 'monospace', 
                        fontSize: '12px',
                        border: '2px solid #000',
                        borderRadius: 0
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="kenyaKwanza" name="Kenya Kwanza" fill="#EAB308" />
                    <Bar dataKey="azimio" name="Azimio" fill="#F97316" />
                    <Bar dataKey="overall" name="Overall" fill="#374151" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Phase Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="brutalist-card bg-yellow-50">
                <div className="text-xs font-mono uppercase text-yellow-800">Kenya Kwanza Support</div>
                <div className="text-3xl font-bold text-yellow-900">52%</div>
                <div className="flex items-center gap-1 text-xs text-yellow-700">
                  <TrendingUp className="w-3 h-3" />
                  +3% from last phase
                </div>
              </div>
              <div className="brutalist-card bg-orange-50">
                <div className="text-xs font-mono uppercase text-orange-800">Azimio Support</div>
                <div className="text-3xl font-bold text-orange-900">45%</div>
                <div className="flex items-center gap-1 text-xs text-orange-700">
                  <TrendingDown className="w-3 h-3" />
                  -2% from last phase
                </div>
              </div>
              <div className="brutalist-card bg-red-50">
                <div className="text-xs font-mono uppercase text-red-800">Hate Speech Alerts</div>
                <div className="text-3xl font-bold text-red-900">127</div>
                <div className="flex items-center gap-1 text-xs text-red-700">
                  <AlertTriangle className="w-3 h-3" />
                  23 critical
                </div>
              </div>
              <div className="brutalist-card bg-green-50">
                <div className="text-xs font-mono uppercase text-green-800">Voter Engagement</div>
                <div className="text-3xl font-bold text-green-900">68%</div>
                <div className="flex items-center gap-1 text-xs text-green-700">
                  <Activity className="w-3 h-3" />
                  High activity
                </div>
              </div>
            </div>

            {/* Key Issues by Phase */}
            <div className="brutalist-card bg-background">
              <h3 className="font-mono font-bold uppercase mb-4">Key Issues Driving Sentiment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { issue: "Cost of Living", score: 85, trend: "up" },
                  { issue: "Unemployment", score: 72, trend: "stable" },
                  { issue: "Healthcare Access", score: 68, trend: "up" },
                  { issue: "Security", score: 65, trend: "down" },
                  { issue: "Education", score: 58, trend: "stable" },
                  { issue: "Infrastructure", score: 52, trend: "up" }
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-secondary">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-bold">{item.issue}</span>
                      {item.trend === "up" && <TrendingUp className="w-4 h-4 text-red-500" />}
                      {item.trend === "down" && <TrendingDown className="w-4 h-4 text-green-500" />}
                      {item.trend === "stable" && <Minus className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className="h-2 bg-background">
                      <div 
                        className="h-full bg-foreground"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-mono">{item.score}% concern level</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timeline Mode */}
        {viewMode === "timeline" && (
          <div className="space-y-6">
            <div className="brutalist-card bg-background">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Sentiment Timeline (2024)
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                    <YAxis tick={{ fontSize: 12, fontFamily: 'monospace' }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        fontFamily: 'monospace', 
                        fontSize: '12px',
                        border: '2px solid #000',
                        borderRadius: 0
                      }} 
                    />
                    <Legend />
                    <Area type="monotone" dataKey="preElection" name="Pre-Election" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="campaign" name="Campaign" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="mobilization" name="Mobilization" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="brutalist-card bg-background">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Hate Speech Incidents Over Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                    <YAxis tick={{ fontSize: 12, fontFamily: 'monospace' }} />
                    <Tooltip 
                      contentStyle={{ 
                        fontFamily: 'monospace', 
                        fontSize: '12px',
                        border: '2px solid #000',
                        borderRadius: 0
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hateSpeech" 
                      name="Hate Speech Incidents"
                      stroke="#EF4444" 
                      strokeWidth={2}
                      dot={{ fill: '#EF4444' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Regional Mobilization Mode */}
        {viewMode === "regional" && (
          <div className="space-y-6">
            <div className="brutalist-card bg-foreground text-background">
              <h3 className="font-mono font-bold uppercase mb-2">Regional Mobilization Index</h3>
              <p className="text-sm opacity-70 mb-4">
                Tracking grassroots political activity and support balkanization across Kenya's 8 regions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regionalData.map((region, i) => (
                <div key={i} className="brutalist-card bg-background">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {region.region} Region
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-mono ${
                          region.dominantCoalition === "Kenya Kwanza" ? "bg-yellow-100 text-yellow-800" :
                          region.dominantCoalition === "Azimio" ? "bg-orange-100 text-orange-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {region.dominantCoalition}
                        </span>
                        <span className={`px-2 py-1 text-xs font-mono ${getHateSpeechColor(region.hateSpeechIntensity)}`}>
                          {region.hateSpeechIntensity.toUpperCase()} RISK
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{region.mobilizationLevel}%</div>
                      <div className="text-xs text-muted-foreground font-mono">Mobilization</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span>Mobilization Level</span>
                        <span>{region.mobilizationLevel}%</span>
                      </div>
                      <div className="h-3 bg-secondary">
                        <div 
                          className={`h-full ${getMobilizationColor(region.mobilizationLevel)}`}
                          style={{ width: `${region.mobilizationLevel}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span>Projected Voter Turnout</span>
                        <span>{region.voterTurnout}%</span>
                      </div>
                      <div className="h-3 bg-secondary">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${region.voterTurnout}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <span className="text-xs font-mono text-muted-foreground">Key Issue: </span>
                      <span className="text-xs font-mono font-bold">{region.keyIssues}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Balkanization Alert */}
            <div className="brutalist-card bg-red-50 border-red-500">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-red-800">Support Balkanization Alert</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Strong regional polarization detected. Nyanza and Western regions show 85%+ Azimio support, 
                    while Rift Valley and Central show 80%+ Kenya Kwanza support. This pattern mirrors 
                    historical ethnic voting blocs and increases risk of post-election tensions.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-2 py-1 bg-red-200 text-red-800 text-xs font-mono">HIGH POLARIZATION</span>
                    <span className="px-2 py-1 bg-red-200 text-red-800 text-xs font-mono">ETHNIC BLOC VOTING</span>
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
