import { useState } from "react";
import { useLocation } from "wouter";
import {
  TrendingUp, BarChart3, Shield, Newspaper, Brain, Globe,
  Check, ChevronRight, ArrowRight, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ── Personas ──────────────────────────────────────────────────────────────────

type PersonaId = "investor" | "analyst" | "ngo" | "journalist" | "researcher" | "enthusiast";

const PERSONAS: Array<{
  id: PersonaId;
  icon: React.ElementType;
  label: string;
  sub: string;
  accent: string;
  firstStop: string;
  firstPath: string;
}> = [
  { id: "investor",   icon: TrendingUp, label: "Investor",         sub: "PE · DFI · VC · infrastructure funds",       accent: "#22d3ee", firstStop: "Africa Scanner",         firstPath: "/scanner" },
  { id: "analyst",    icon: BarChart3,  label: "Policy analyst",   sub: "Government · think-tank · multilateral",      accent: "#a78bfa", firstStop: "AI Agents Hub",          firstPath: "/ai-agents" },
  { id: "ngo",        icon: Shield,     label: "NGO / humanitarian",sub: "Field ops · advocacy · reporting",            accent: "#34d399", firstStop: "Field Signals",          firstPath: "/scanner" },
  { id: "journalist", icon: Newspaper,  label: "Journalist",        sub: "Investigative · broadcast · editorial",       accent: "#fb923c", firstStop: "Intelligence Workspace", firstPath: "/intelligence" },
  { id: "researcher", icon: Brain,      label: "Researcher",        sub: "Academic · think-tank · policy studies",      accent: "#f472b6", firstStop: "Report Archive",         firstPath: "/archive" },
  { id: "enthusiast", icon: Globe,      label: "Curious citizen",   sub: "Africa-watchers · diaspora · general",        accent: "#22c55e", firstStop: "Africa Scanner",         firstPath: "/scanner" },
];

// ── African countries (curated shortlist) ─────────────────────────────────────

const COUNTRIES = [
  { code: "KE", flag: "🇰🇪", name: "Kenya" },
  { code: "NG", flag: "🇳🇬", name: "Nigeria" },
  { code: "ZA", flag: "🇿🇦", name: "South Africa" },
  { code: "GH", flag: "🇬🇭", name: "Ghana" },
  { code: "ET", flag: "🇪🇹", name: "Ethiopia" },
  { code: "TZ", flag: "🇹🇿", name: "Tanzania" },
  { code: "RW", flag: "🇷🇼", name: "Rwanda" },
  { code: "UG", flag: "🇺🇬", name: "Uganda" },
  { code: "SN", flag: "🇸🇳", name: "Senegal" },
  { code: "CI", flag: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "CM", flag: "🇨🇲", name: "Cameroon" },
  { code: "AO", flag: "🇦🇴", name: "Angola" },
  { code: "MZ", flag: "🇲🇿", name: "Mozambique" },
  { code: "ZM", flag: "🇿🇲", name: "Zambia" },
  { code: "EG", flag: "🇪🇬", name: "Egypt" },
  { code: "MA", flag: "🇲🇦", name: "Morocco" },
  { code: "DZ", flag: "🇩🇿", name: "Algeria" },
  { code: "SD", flag: "🇸🇩", name: "Sudan" },
  { code: "CD", flag: "🇨🇩", name: "DRC" },
  { code: "ML", flag: "🇲🇱", name: "Mali" },
  { code: "BF", flag: "🇧🇫", name: "Burkina Faso" },
  { code: "MG", flag: "🇲🇬", name: "Madagascar" },
  { code: "TN", flag: "🇹🇳", name: "Tunisia" },
  { code: "ZW", flag: "🇿🇼", name: "Zimbabwe" },
];

// ── PESTEL dimensions ─────────────────────────────────────────────────────────

const DIMS = [
  { id: "P",  label: "Political",            desc: "Elections, governance, stability" },
  { id: "E",  label: "Economic",             desc: "Markets, FX, fiscal policy" },
  { id: "S",  label: "Social",               desc: "Civil society, protests, movements" },
  { id: "T",  label: "Technology",           desc: "Digital policy, fintech, infrastructure" },
  { id: "En", label: "Environment",          desc: "Climate risk, energy transition" },
  { id: "L",  label: "Legal / Regulatory",   desc: "Legislation, compliance, courts" },
  { id: "IR", label: "Investor Readiness",   desc: "FDI climate, credit ratings, SEZs" },
];

// ── Alert thresholds ──────────────────────────────────────────────────────────

const THRESHOLDS = [
  { id: "breaking", label: "Breaking only",    desc: "Crises and major escalations only — minimal noise" },
  { id: "alert",    label: "Alerts + breaking", desc: "Significant developments across your focus markets" },
  { id: "normal",   label: "All signals",       desc: "Full signal feed including routine updates" },
];

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-300"
          style={{ background: i < step ? "#22d3ee" : "rgba(255,255,255,0.1)" }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState<PersonaId | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [dims, setDims] = useState<string[]>(["P", "E", "IR"]);
  const [threshold, setThreshold] = useState<string>("alert");

  const toggleCountry = (code: string) =>
    setCountries(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : prev.length < 8 ? [...prev, code] : prev
    );

  const toggleDim = (id: string) =>
    setDims(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);

  const handleNext = () => {
    if (step === 1 && !persona) { toast.error("Select your role to continue"); return; }
    if (step === 2 && countries.length === 0) { toast.error("Select at least one market"); return; }
    if (step === 3 && dims.length === 0) { toast.error("Select at least one intelligence dimension"); return; }
    if (step < 4) { setStep(s => s + 1); return; }
    handleComplete();
  };

  const handleComplete = () => {
    try {
      localStorage.setItem("vb_persona", persona || "enthusiast");
      localStorage.setItem("vb_focus_countries", JSON.stringify(countries));
      localStorage.setItem("vb_focus_dims", JSON.stringify(dims));
      localStorage.setItem("vb_alert_threshold", threshold);
      localStorage.setItem("vb_onboarded", "1");
    } catch {}
    const dest = PERSONAS.find(p => p.id === persona)?.firstPath ?? "/scanner";
    toast.success("Intelligence view configured. Welcome to ViralBeat.");
    setLocation(dest);
  };

  const activePersona = PERSONAS.find(p => p.id === persona);

  return (
    <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl">

        {/* Brand */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 bg-cyan-500 rounded-lg flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="font-bold text-white tracking-tight">ViralBeat</span>
          <span className="text-[10px] text-gray-500 ml-1">Setup — takes 90 seconds</span>
        </div>

        <ProgressBar step={step} total={4} />

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Role ── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h2 className="text-3xl font-black mb-2">What best describes your work?</h2>
              <p className="text-gray-400 mb-8">We'll configure your intelligence view for your specific needs.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PERSONAS.map(p => {
                  const Icon = p.icon;
                  const active = persona === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPersona(p.id)}
                      className={`relative text-left rounded-2xl border p-5 transition-all duration-200 ${
                        active
                          ? "border-cyan-500/60 bg-cyan-500/8 shadow-lg shadow-cyan-500/10"
                          : "border-[#1e3a5f] bg-[#0a1628] hover:border-[#2a4a7f]"
                      }`}
                    >
                      {active && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-black" />
                        </div>
                      )}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: active ? `${p.accent}22` : "rgba(255,255,255,0.05)" }}>
                        <Icon className="w-4.5 h-4.5" style={{ color: active ? p.accent : "#6b7280" }} />
                      </div>
                      <div className="font-semibold text-sm text-white mb-1">{p.label}</div>
                      <div className="text-[11px] text-gray-500 leading-snug">{p.sub}</div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Markets ── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h2 className="text-3xl font-black mb-2">Which markets matter to you?</h2>
              <p className="text-gray-400 mb-2">Select up to 8 countries. Your default view will prioritise these.</p>
              <p className="text-xs text-gray-600 mb-8 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {countries.length} selected · 8 max
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {COUNTRIES.map(c => {
                  const active = countries.includes(c.code);
                  return (
                    <button
                      key={c.code}
                      onClick={() => toggleCountry(c.code)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-150 ${
                        active
                          ? "border-cyan-500/50 bg-cyan-500/10 text-white"
                          : "border-[#1e3a5f] bg-[#0a1628] text-gray-400 hover:border-[#2a4a7f] hover:text-white"
                      }`}
                    >
                      <span className="text-base leading-none shrink-0">{c.flag}</span>
                      <span className="text-xs font-medium truncate">{c.name}</span>
                      {active && <Check className="w-3 h-3 text-cyan-400 shrink-0 ml-auto" />}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setStep(s => s + 1)}
                className="mt-4 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Skip — I'll set this later
              </button>
            </motion.div>
          )}

          {/* ── STEP 3: PESTEL dims ── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h2 className="text-3xl font-black mb-2">Which intelligence dimensions matter?</h2>
              <p className="text-gray-400 mb-8">Your signal feed will weight these dimensions more heavily.</p>
              <div className="grid gap-3">
                {DIMS.map(d => {
                  const active = dims.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      onClick={() => toggleDim(d.id)}
                      className={`flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all duration-150 ${
                        active
                          ? "border-cyan-500/50 bg-cyan-500/8"
                          : "border-[#1e3a5f] bg-[#0a1628] hover:border-[#2a4a7f]"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 font-bold text-xs transition-all ${
                        active ? "bg-cyan-500 border-cyan-500 text-black" : "border-[#1e3a5f] text-gray-500"
                      }`}>
                        {active ? <Check className="w-4 h-4" /> : d.id}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-white">{d.label}</div>
                        <div className="text-xs text-gray-500">{d.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: Alert threshold + first action ── */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h2 className="text-3xl font-black mb-2">How much signal do you want?</h2>
              <p className="text-gray-400 mb-8">Sets your watchlist alert threshold. You can change this any time.</p>

              <div className="grid gap-3 mb-10">
                {THRESHOLDS.map(t => {
                  const active = threshold === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setThreshold(t.id)}
                      className={`flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all duration-150 ${
                        active
                          ? "border-cyan-500/50 bg-cyan-500/8"
                          : "border-[#1e3a5f] bg-[#0a1628] hover:border-[#2a4a7f]"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${
                        active ? "border-cyan-400 bg-cyan-400" : "border-gray-600"
                      }`} />
                      <div>
                        <div className="font-semibold text-sm text-white">{t.label}</div>
                        <div className="text-xs text-gray-500">{t.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Summary card */}
              {activePersona && (
                <div className="rounded-2xl border border-[#1e3a5f] bg-[#0a1628] p-5 mb-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Your intelligence view</div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <div className="text-[10px] text-gray-600 mb-1">Role</div>
                      <div className="flex items-center gap-2">
                        <activePersona.icon className="w-3.5 h-3.5" style={{ color: activePersona.accent }} />
                        <span className="text-sm text-white font-medium">{activePersona.label}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 mb-1">Focus markets</div>
                      <div className="text-sm text-white font-medium">
                        {countries.length === 0 ? "All 55 nations" : countries.slice(0, 3).map(code => COUNTRIES.find(c => c.code === code)?.flag).join(" ") + (countries.length > 3 ? ` +${countries.length - 3}` : "")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 mb-1">First stop</div>
                      <div className="text-sm font-medium" style={{ color: activePersona.accent }}>
                        {activePersona.firstStop}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : setLocation("/")}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {step > 1 ? "← Back" : "← Home"}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { localStorage.setItem("vb_onboarded", "1"); setLocation("/scanner"); }}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Skip setup
            </button>
            <Button
              onClick={handleNext}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6"
            >
              {step === 4 ? (
                <>Go to {activePersona?.firstStop ?? "Dashboard"} <ArrowRight className="ml-1.5 w-4 h-4" /></>
              ) : (
                <>Continue <ChevronRight className="ml-1 w-4 h-4" /></>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
