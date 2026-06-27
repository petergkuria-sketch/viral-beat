import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScannerAlertPanel } from "@/components/ScannerAlertPanel";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowLeft, Bell, Download, GitCompare, Lock,
  TrendingUp, TrendingDown, ArrowUpRight, ChevronRight,
  Building2, CheckCircle2, XCircle, Globe, Phone, Mail,
  Clock, Shield, Zap, MapPin, ExternalLink,
  Share2, Copy, Check, Twitter, Linkedin,
} from "lucide-react";
import {
  COUNTRIES, OSS_DATA, composite, scoreColor, VERDICT_LABELS,
  type CountryProfile, type Verdict, type OSSFacility,
} from "@/lib/scannerData";

// ── helpers ──────────────────────────────────────────────────────────────────

const DIM_LABELS: Record<string, string> = {
  P:"Political", E:"Economic", S:"Social", T:"Technology",
  En:"Environmental", L:"Legal", IR:"Investment Readiness",
};

const DIM_COLORS: Record<string, string> = {
  P:"#3b82f6", E:"#22c55e", S:"#84cc16", T:"#a855f7", En:"#06b6d4", L:"#f59e0b", IR:"#00d4ff",
};

function verdictStyle(v: Verdict) {
  const map: Record<Verdict, string> = {
    "go-market": "bg-green-500/15 text-green-400 border-green-500/40",
    "monitor":   "bg-lime-500/15  text-lime-400  border-lime-500/40",
    "caution":   "bg-amber-500/15 text-amber-400 border-amber-500/40",
    "no-go":     "bg-red-500/15   text-red-400   border-red-500/40",
  };
  return map[v];
}

function GaugeCircle({ score, color }: { score: number; color: string }) {
  const r = 52, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ * 0.75;
  const gap = circ - dash;
  return (
    <svg width="140" height="120" viewBox="0 0 140 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a2d4a" strokeWidth="10"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
        strokeDashoffset={circ * 0.375} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${gap + circ * 0.25}`}
        strokeDashoffset={circ * 0.375} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="26" fontWeight="800" fill={color}>{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="8" fill="#64748b">COMPOSITE</text>
    </svg>
  );
}

const DIM_SIGNAL_MAP: Partial<Record<string, string>> = {
  P:"bg-blue-500/20 text-blue-400",
  E:"bg-green-500/20 text-green-400",
  S:"bg-lime-500/20 text-lime-400",
  T:"bg-purple-500/20 text-purple-400",
  En:"bg-cyan-500/20 text-cyan-400",
  L:"bg-amber-500/20 text-amber-400",
  IR:"bg-[#00d4ff]/20 text-[#00d4ff]",
};

// ── sub-views ─────────────────────────────────────────────────────────────────

function OverviewTab({ c }: { c: CountryProfile }) {
  const [activeDim, setActiveDim] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-2 gap-3">
      {(Object.entries(c.pestelBreak) as [string, number][]).map(([dim, val]) => {
        const color = DIM_COLORS[dim] ?? "#64748b";
        const isActive = activeDim === dim;
        return (
          <div
            key={dim} onClick={() => setActiveDim(isActive ? null : dim)}
            className={`bg-[#0a1628] rounded-lg p-3 border cursor-pointer transition-all ${isActive ? "border-cyan-500/50 bg-cyan-500/5" : "border-[#1a2d4a] hover:border-[#2a3d5a]"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-slate-400">{dim} · {DIM_LABELS[dim]}</span>
              <span className="text-lg font-extrabold" style={{ color }}>{val}</span>
            </div>
            <div className="h-[3px] bg-slate-800 rounded-full mb-2">
              <div className="h-full rounded-full" style={{ width: `${val}%`, background: color }} />
            </div>
            <p className={`text-[10px] text-slate-500 leading-relaxed transition-all overflow-hidden ${isActive ? "max-h-40" : "max-h-8"}`}>
              {c.pestelSnippets[dim as keyof typeof c.pestelSnippets]}
            </p>
            {!isActive && <p className="text-[10px] text-cyan-500/70 mt-0.5">Click to expand →</p>}
          </div>
        );
      })}
    </div>
  );
}

function SignalsTab({ c }: { c: CountryProfile }) {
  return (
    <div className="space-y-0">
      {c.signals.map((s, i) => (
        <div key={i} className="border-b border-[#0a1525] py-3 last:border-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${DIM_SIGNAL_MAP[s.dim] ?? "bg-slate-700 text-slate-400"}`}>{s.dim}</span>
            <span className="text-[10px] text-slate-500">{s.source}</span>
            <span className="ml-auto text-[10px] text-slate-600">{s.time}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{s.text}</p>
          <p className={`text-[10px] mt-1 font-medium ${s.impact === "pos" ? "text-green-400" : s.impact === "neg" ? "text-red-400" : "text-slate-500"}`}>
            {s.impactText}
          </p>
        </div>
      ))}
      {c.signals.length === 0 && (
        <p className="text-slate-500 text-xs py-4">No recent signals.</p>
      )}
    </div>
  );
}

function SectorsTab({ c, onBrief }: { c: CountryProfile; onBrief: (sector: string) => void }) {
  return (
    <div className="space-y-0">
      {c.sectors.map((s, i) => {
        const color = scoreColor(s.score);
        return (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#0a1525] last:border-0">
            <span className="flex-1 text-sm text-slate-300">{s.name}</span>
            <div className="w-20 h-[3px] bg-slate-800 rounded-full">
              <div className="h-full rounded-full" style={{ width: `${s.score}%`, background: color }} />
            </div>
            <span className="text-sm font-bold w-7 text-right" style={{ color }}>{s.score}</span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold uppercase ${
              s.verdict === "go" ? "bg-green-500/10 text-green-400 border-green-500/30"
              : s.verdict === "caution" ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}>{s.verdict}</span>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-slate-500 hover:text-cyan-400 px-2"
              onClick={() => onBrief(s.name)}>
              Plan <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function RisksTab({ c }: { c: CountryProfile }) {
  return (
    <div className="space-y-3">
      {c.risks.map((r, i) => {
        const isCritical = (r.impact as string) === "Critical";
        const impactColor = r.impact === "High" || isCritical ? "#ef4444" : r.impact === "Medium" ? "#f59e0b" : "#22c55e";
        return (
          <div key={i} className="bg-[#0a1628] rounded-lg p-4 border border-[#1a2d4a]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase" style={{ background: impactColor + "20", color: impactColor, border: `1px solid ${impactColor}40` }}>
                {r.category}
              </span>
              <span className="font-semibold text-sm text-slate-200">{r.risk}</span>
            </div>
            <div className="flex gap-4 mb-2">
              <span className="text-[10px] text-slate-500">Likelihood: <strong className="text-slate-400">{r.likelihood}</strong></span>
              <span className="text-[10px] text-slate-500">Impact: <strong style={{ color: impactColor }}>{r.impact}</strong></span>
            </div>
            <div className="text-[11px] text-slate-500">
              Mitigation: <span className="text-slate-300">{r.mitigation}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Share Sheet ───────────────────────────────────────────────────────────────
function ShareSheet({ c, comp, color, oss, onClose }: {
  c: CountryProfile; comp: number; color: string;
  oss: OSSFacility | null; onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/scanner/${c.code}`
    : `https://viralbeat.io/scanner/${c.code}`;

  const verdictColor: Record<Verdict, string> = {
    "go-market": "#22c55e", monitor: "#84cc16", caution: "#f59e0b", "no-go": "#ef4444",
  };
  const vc = verdictColor[c.verdict];

  const shareText = `${c.flag} ${c.name} — ViralBeat Africa Intelligence Scanner\n\nComposite: ${comp}/100 · Verdict: ${VERDICT_LABELS[c.verdict]}\nPESTEL: ${c.pestel} · IRS (B-READY): ${c.irs}${oss?.exists ? ` · OSS: ${oss.name}` : ""}\n\n${url}`;

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function nativeShare() {
    if (navigator.share) {
      navigator.share({
        title: `${c.name} — ViralBeat Intelligence Profile`,
        text: `${c.flag} ${c.name} · Composite ${comp}/100 · ${VERDICT_LABELS[c.verdict]}`,
        url,
      }).catch(() => {});
    } else {
      copyLink();
    }
  }

  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(
    `${c.flag} ${c.name} Investment Intelligence — Composite ${comp}/100 · ${VERDICT_LABELS[c.verdict]}\n\nPESTEL ${c.pestel} · B-READY IRS ${c.irs}${oss?.exists ? " · OSS Active" : ""}\n\nFull profile via @ViralBeatHQ\n${url}`
  )}`;

  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-[#080d1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 text-white/30 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
          <Check className="w-4 h-4 opacity-0" />{/* spacer */}
          <span className="sr-only">Close</span>
          <svg className="w-4 h-4 absolute top-1.5 right-1.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
        </button>

        {/* Preview card */}
        <div className="p-5">
          <div className="text-[9px] font-black tracking-[2px] text-white/30 uppercase mb-3">Share preview</div>
          <div className="bg-[#030712] border border-white/8 rounded-xl p-4 mb-5">
            {/* Card header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-[#0a1628] border border-white/10 flex items-center justify-center">
                <span className="text-xs font-black text-cyan-400">VB</span>
              </div>
              <div>
                <div className="text-[9px] font-bold text-white/30 uppercase tracking-wide">ViralBeat · Africa Scanner</div>
              </div>
            </div>
            {/* Country hero */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl leading-none">{c.flag}</span>
              <div>
                <div className="font-black text-base text-white leading-tight">{c.name}</div>
                <div className="text-[10px] text-white/40">{c.region} · {c.capital} · {c.currency}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-lg font-black" style={{ color: vc }}>{VERDICT_LABELS[c.verdict]}</div>
                <div className="text-[9px] text-white/30 uppercase">Verdict</div>
              </div>
            </div>
            {/* Stat row */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: "PESTEL", value: c.pestel, c: scoreColor(c.pestel) },
                { label: "B-READY", value: c.irs,    c: scoreColor(c.irs)    },
                { label: "Composite", value: comp,   c: color                },
                { label: "OSS",    value: oss?.exists ? "✓" : "—", c: oss?.exists ? "#22c55e" : "#374151" },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.04] rounded-lg p-2 text-center">
                  <div className="text-sm font-black" style={{ color: s.c }}>{s.value}</div>
                  <div className="text-[8px] text-white/25 uppercase tracking-wide mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {/* Top signals preview */}
            {c.signals.slice(0, 2).map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                <div className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40 shrink-0 mt-0.5">{s.dim}</div>
                <p className="text-[9px] text-white/50 leading-snug line-clamp-1">{s.text}</p>
              </div>
            ))}
            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-[9px] text-white/20">viralbeat.io/scanner/{c.code.toLowerCase()}</span>
              <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Africa Intelligence</span>
            </div>
          </div>

          {/* Share actions */}
          <div className="space-y-2">
            {/* Copy link */}
            <button
              onClick={copyLink}
              className="w-full flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 rounded-xl px-4 py-3 transition-colors group"
            >
              {copied
                ? <Check className="w-4 h-4 text-green-400 shrink-0" />
                : <Copy className="w-4 h-4 text-white/40 group-hover:text-white/70 shrink-0" />
              }
              <span className="text-sm text-white/70 group-hover:text-white flex-1 text-left transition-colors">
                {copied ? "Copied!" : "Copy link"}
              </span>
              <span className="text-[10px] text-white/20 font-mono truncate max-w-[140px]">{url.replace("https://", "")}</span>
            </button>

            {/* X / Twitter */}
            <a
              href={xUrl} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 rounded-xl px-4 py-3 transition-colors group"
            >
              <svg className="w-4 h-4 text-white/50 group-hover:text-white shrink-0 transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span className="text-sm text-white/70 group-hover:text-white flex-1 text-left transition-colors">Share on X</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/20" />
            </a>

            {/* LinkedIn */}
            <a
              href={liUrl} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 rounded-xl px-4 py-3 transition-colors group"
            >
              <svg className="w-4 h-4 text-[#0a66c2] group-hover:text-[#2d8ac2] shrink-0 transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              <span className="text-sm text-white/70 group-hover:text-white flex-1 text-left transition-colors">Share on LinkedIn</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/20" />
            </a>

            {/* Native share (mobile) */}
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={nativeShare}
                className="w-full flex items-center gap-3 bg-cyan-500/[0.08] hover:bg-cyan-500/[0.14] border border-cyan-500/20 rounded-xl px-4 py-3 transition-colors"
              >
                <Share2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-sm text-cyan-300 flex-1 text-left">More options…</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── One-Stop-Shop Panel ───────────────────────────────────────────────────────
function OSSPanel({ oss, isSubscribed }: { oss: OSSFacility; isSubscribed: boolean }) {
  const [showContacts, setShowContacts] = useState(false);
  const [activeTab, setActiveTab] = useState<"services" | "offers" | "zones">("services");

  const digitalCount  = oss.services.filter(s => s.available && s.digitalPortal).length;
  const availableCount = oss.services.filter(s => s.available).length;
  const fastestDays   = Math.min(...oss.services.filter(s => s.avgDays !== null).map(s => s.avgDays as number));

  return (
    <div className="space-y-4">

      {/* Header card */}
      <div className="bg-[#0a1628] rounded-xl border border-[#1a2d4a] p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-[9px] font-black tracking-[2px] text-emerald-400 uppercase">One-Stop-Shop</span>
              {oss.exists
                ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Active</span>
                : <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">Not established</span>
              }
            </div>
            <h3 className="text-sm font-bold text-white leading-snug">{oss.name}</h3>
            {oss.established && (
              <p className="text-[10px] text-slate-500 mt-0.5">Est. {oss.established} · {oss.legalBasis}</p>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-4">{oss.mandate}</p>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Services",  value: `${availableCount}/${oss.services.length}`, color: "#22c55e" },
            { label: "Digital",   value: `${digitalCount}`, color: "#00d4ff" },
            { label: "Fastest",   value: fastestDays === Infinity ? "N/A" : `${fastestDays}d`, color: "#a855f7" },
          ].map(s => (
            <div key={s.label} className="bg-[#050b1a] rounded-lg p-2.5 text-center border border-[#1a2d4a]">
              <div className="text-base font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-600 uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Location + web */}
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 text-[10px] text-slate-500">
            <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-slate-600" />
            <span>{oss.location}</span>
          </div>
          {oss.operatingHours && (
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Clock className="w-3 h-3 shrink-0 text-slate-600" />
              <span>{oss.operatingHours}</span>
            </div>
          )}
          {oss.website && (
            <a href={oss.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors">
              <Globe className="w-3 h-3 shrink-0" />
              <span className="truncate">{oss.website.replace("https://", "")}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border border-[#1a2d4a] rounded-lg overflow-hidden">
        {(["services", "offers", "zones"] as const).map(t => (
          <button
            key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors ${
              activeTab === t ? "bg-cyan-500/15 text-cyan-400" : "text-slate-500 hover:text-slate-300 bg-[#0a1628]"
            }`}
          >
            {t === "services" ? "Services" : t === "offers" ? "Offers" : "Zones"}
          </button>
        ))}
      </div>

      {/* Services list */}
      {activeTab === "services" && (
        <div className="bg-[#0a1628] rounded-xl border border-[#1a2d4a] overflow-hidden">
          {oss.services.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${i < oss.services.length - 1 ? "border-b border-[#0f1e35]" : ""}`}>
              {s.available
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                : <XCircle className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              }
              <span className={`text-xs flex-1 ${s.available ? "text-slate-300" : "text-slate-600"}`}>{s.name}</span>
              {s.available && s.digitalPortal && (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Online</span>
              )}
              {s.available && s.avgDays !== null && (
                <span className="text-[9px] text-slate-500 shrink-0">{s.avgDays}d</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Offers list */}
      {activeTab === "offers" && (
        <div className="bg-[#0a1628] rounded-xl border border-[#1a2d4a] p-4 space-y-2.5">
          {oss.offers.map((o, i) => (
            <div key={i} className="flex gap-2.5">
              <Zap className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">{o}</p>
            </div>
          ))}
        </div>
      )}

      {/* Linked zones */}
      {activeTab === "zones" && (
        <div className="bg-[#0a1628] rounded-xl border border-[#1a2d4a] p-4 space-y-2">
          {oss.linkedZones?.length ? oss.linkedZones.map((z, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0" />
              {z}
            </div>
          )) : (
            <p className="text-xs text-slate-500">No linked zones recorded.</p>
          )}
        </div>
      )}

      {/* B-READY note */}
      <div className="bg-[#050b1a] rounded-lg border border-[#1a2d4a] px-4 py-3">
        <div className="text-[9px] font-black tracking-[2px] text-slate-500 uppercase mb-1">B-READY Assessment</div>
        <p className="text-[10px] text-slate-400 leading-relaxed">{oss.bReadyNote}</p>
        <p className="text-[9px] text-slate-600 mt-1">Last verified: {new Date(oss.lastVerified).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
      </div>

      {/* Contact details — gated */}
      <div className="bg-[#0a1628] rounded-xl border border-[#1a2d4a] overflow-hidden">
        <button
          onClick={() => isSubscribed && setShowContacts(v => !v)}
          className={`w-full flex items-center justify-between px-4 py-3 ${isSubscribed ? "cursor-pointer hover:bg-white/[0.03]" : "cursor-default"} transition-colors`}
        >
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-400">Contact Details</span>
            {isSubscribed
              ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-bold">Analyst</span>
              : <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">Subscribers only</span>
            }
          </div>
          {isSubscribed
            ? <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showContacts ? "rotate-90" : ""}`} />
            : <Lock className="w-3.5 h-3.5 text-slate-600" />
          }
        </button>

        {!isSubscribed && (
          <div className="px-4 pb-4 pt-1 border-t border-[#0f1e35]">
            <p className="text-[10px] text-slate-500 leading-relaxed mb-2">
              Direct contacts for {oss.contacts.length} OSS officer{oss.contacts.length !== 1 ? "s" : ""} are visible to Analyst and Enterprise subscribers.
            </p>
            <Button size="sm" className="h-7 text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30">
              Upgrade to Analyst →
            </Button>
          </div>
        )}

        {isSubscribed && showContacts && (
          <div className="border-t border-[#0f1e35]">
            {oss.contacts.map((c, i) => (
              <div key={i} className={`px-4 py-3 ${i < oss.contacts.length - 1 ? "border-b border-[#0f1e35]" : ""}`}>
                <div className="font-semibold text-xs text-white mb-0.5">{c.name}</div>
                <div className="text-[10px] text-slate-500 mb-2">{c.title}</div>
                <div className="space-y-1">
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors">
                    <Mail className="w-3 h-3" /> {c.email}
                  </a>
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-[10px] text-slate-400 hover:text-white transition-colors">
                    <Phone className="w-3 h-3" /> {c.phone}
                  </a>
                  {c.directLine && (
                    <a href={`tel:${c.directLine}`} className="flex items-center gap-2 text-[10px] text-slate-400 hover:text-white transition-colors">
                      <Phone className="w-3 h-3 text-emerald-400" /> {c.directLine} <span className="text-emerald-400/70">(direct)</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ForecastTab() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Lock className="w-10 h-10 text-slate-600 mb-3" />
      <p className="font-semibold text-slate-300 mb-1">12-Month Forecast — Analyst Plan Required</p>
      <p className="text-xs text-slate-500 mb-4 max-w-xs">
        Access 12-month composite score trajectory, election risk windows, and sector timing recommendations.
      </p>
      <Button size="sm" className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30">
        Upgrade to Analyst →
      </Button>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function CountryIntelProfile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const params = useParams<{ code: string }>();
  const code = params.code?.toUpperCase() ?? "";

  const found = COUNTRIES.find(x => x.code === code);
  if (!found) {
    setLocation("/scanner");
    return null;
  }
  const c = found;
  const comp = composite(c);
  const color = scoreColor(comp);
  const isSubscribed = user?.subscriptionTier === "analyst" || user?.subscriptionTier === "enterprise";
  const oss = OSS_DATA[c.code] ?? null;
  const [showShare, setShowShare] = useState(false);

  function handleBrief(sector = "") {
    const qs = sector ? `?sector=${encodeURIComponent(sector)}` : "";
    setLocation(`/scanner/${c.code}/brief${qs}`);
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-slate-200">
      {showShare && (
        <ShareSheet c={c} comp={comp} color={color} oss={oss} onClose={() => setShowShare(false)} />
      )}

      {/* Nav */}
      <div className="bg-[#0a1628] border-b border-[#1a2d4a] px-6 py-2.5 flex items-center gap-3">
        <button onClick={() => setLocation("/scanner")} className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-cyan-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Scanner
        </button>
        <span className="text-[#1a2d4a]">/</span>
        <span className="text-[11px] text-cyan-400 font-semibold">{c.flag} {c.name} — {c.code} — {c.region}</span>
        <div className="ml-auto flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-[10px] border-[#1a2d4a] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400 gap-1.5">
                <Bell className="w-3 h-3" />+ Watchlist / Alerts
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[360px] p-0 bg-[#050b1a] border-[#1a2d4a]">
              <ScannerAlertPanel defaultCode={c.code} />
            </SheetContent>
          </Sheet>
          <Button size="sm" variant="outline" className="h-7 text-[10px] border-[#1a2d4a] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400 gap-1.5"
            onClick={() => setLocation(`/scanner`)}>
            <GitCompare className="w-3 h-3" />Compare
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px] border-[#1a2d4a] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400 gap-1.5"
            onClick={() => setShowShare(true)}>
            <Share2 className="w-3 h-3" />Share
          </Button>
          <Button size="sm" className="h-7 text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 gap-1.5"
            onClick={() => handleBrief()}>
            <Download className="w-3 h-3" />Export Brief
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="px-6 py-4 border-b border-[#0f1e35] flex items-center gap-4 flex-wrap">
        <div className="text-5xl leading-none">{c.flag}</div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">{c.name}</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {c.region} · Pop. {c.population} · Capital: {c.capital} · Currency: {c.currency}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            GDP {c.gdp} · FDI Inflow {c.fdi} (2023) · AfCFTA signatory
          </p>
        </div>
        <div className="flex items-center gap-6 ml-auto flex-wrap">
          <div className="text-center">
            <div className="text-2xl font-extrabold" style={{ color: scoreColor(c.pestel) }}>{c.pestel}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">PESTEL Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold" style={{ color: scoreColor(c.irs) }}>{c.irs}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">IRS (B-READY)</div>
          </div>
          <div className="text-center">
            {oss?.exists
              ? <div className="flex items-center gap-1 justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><span className="text-2xl font-extrabold text-emerald-400">OSS</span></div>
              : <div className="flex items-center gap-1 justify-center"><XCircle className="w-5 h-5 text-slate-600" /><span className="text-2xl font-extrabold text-slate-600">OSS</span></div>
            }
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">
              {oss?.exists ? "Active" : "Not found"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold" style={{ color }}>{comp}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Composite</div>
          </div>
          <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${
            c.verdict === "go-market" ? "bg-green-500/15 border-green-500/40"
            : c.verdict === "monitor" ? "bg-lime-500/15 border-lime-500/40"
            : c.verdict === "caution" ? "bg-amber-500/15 border-amber-500/40"
            : "bg-red-500/15 border-red-500/40"
          }`}>
            <span className="text-xl font-extrabold uppercase" style={{ color }}>
              {VERDICT_LABELS[c.verdict]}
            </span>
            <span className="text-[9px] text-slate-500 mt-0.5">
              Updated 2h ago · {c.change30d >= 0 ? `▲ +${c.change30d}` : `▼ ${c.change30d}`} (30d)
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex" style={{ minHeight: "calc(100vh - 200px)" }}>

        {/* Main content */}
        <div className="flex-1 border-r border-[#0f1e35] overflow-hidden">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="w-full rounded-none border-b border-[#0f1e35] bg-[#0a1628] h-auto p-0 justify-start">
              {["overview","signals","sectors","risks","investment","forecast"].map(t => (
                <TabsTrigger key={t} value={t}
                  className="rounded-none px-5 py-2.5 text-xs capitalize border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent text-slate-500 hover:text-slate-300">
                  {t === "signals"    ? `Live Signals (${c.signals.length})`
                  : t === "investment" ? "Investment Facilitation"
                  : t.charAt(0).toUpperCase() + t.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
              <TabsContent value="overview"><OverviewTab c={c} /></TabsContent>
              <TabsContent value="signals"><SignalsTab c={c} /></TabsContent>
              <TabsContent value="sectors"><SectorsTab c={c} onBrief={handleBrief} /></TabsContent>
              <TabsContent value="risks"><RisksTab c={c} /></TabsContent>
              <TabsContent value="investment">
                {oss ? (
                  <OSSPanel oss={oss} isSubscribed={isSubscribed} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Building2 className="w-10 h-10 text-slate-700 mb-3" />
                    <p className="font-semibold text-slate-400 mb-1">No OSS data for {c.name}</p>
                    <p className="text-xs text-slate-500 max-w-xs">
                      One-Stop-Shop coverage is being expanded. Data for this country is not yet in the ViralBeat database.
                    </p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="forecast"><ForecastTab /></TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 p-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>

          {/* Gauge */}
          <div className="bg-[#0a1628] rounded-lg border border-[#1a2d4a] p-4 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Entry Readiness</p>
            <div className="flex justify-center">
              <GaugeCircle score={comp} color={color} />
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${verdictStyle(c.verdict)}`}>
              {VERDICT_LABELS[c.verdict]}
            </span>
            <p className="text-[10px] text-slate-500 mt-2">{c.macroSummary.substring(0, 120)}…</p>
          </div>

          {/* Timeline */}
          <div className="bg-[#0a1628] rounded-lg border border-[#1a2d4a] p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Key Upcoming Events</p>
            <div className="space-y-3">
              {c.timeline.map((e, i) => {
                const dotColor = e.type === "positive" ? "#22c55e" : e.type === "warning" ? "#f59e0b" : e.type === "critical" ? "#ef4444" : "#64748b";
                return (
                  <div key={i} className="flex gap-2.5">
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: dotColor }} />
                    <div>
                      <div className="text-[9px] text-slate-600">{e.date}</div>
                      <div className="text-[11px] text-slate-400 leading-snug">{e.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prospector actions */}
          <div className="bg-[#0a1628] rounded-lg border border-[#1a2d4a] p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Prospector Actions</p>
            <div className="space-y-2">
              <Button className="w-full h-8 text-xs bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 justify-start"
                onClick={() => handleBrief(c.sectors[0]?.name)}>
                <ArrowUpRight className="w-3.5 h-3.5 mr-2" />
                {c.sectors[0]?.name ?? "Top Sector"} Entry Plan
              </Button>
              <Button className="w-full h-8 text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 justify-start"
                onClick={() => handleBrief()}>
                <Download className="w-3.5 h-3.5 mr-2" />
                Export Investor Brief (PDF)
              </Button>
              <Button className="w-full h-8 text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 justify-start"
                onClick={() => setLocation("/scanner")}>
                <GitCompare className="w-3.5 h-3.5 mr-2" />
                Peer Comparison
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full h-8 text-xs border-[#1a2d4a] text-slate-400 hover:bg-slate-800 justify-start">
                    <Bell className="w-3.5 h-3.5 mr-2" />
                    Set Score Alert
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[360px] p-0 bg-[#050b1a] border-[#1a2d4a]">
                  <ScannerAlertPanel defaultCode={c.code} />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Trend bars */}
          <div className="bg-[#0a1628] rounded-lg border border-[#1a2d4a] p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">9-Month Trend</p>
            <div className="flex items-end gap-1 h-14">
              {c.trend.map((v, i) => {
                const min = Math.min(...c.trend), max = Math.max(...c.trend);
                const h = Math.round(8 + ((v - min) / (max - min + 1)) * 48);
                return (
                  <div key={i} title={String(v)} className="flex-1 rounded-sm relative group"
                    style={{ height: h, background: scoreColor(v) + "70" }}>
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-slate-600 opacity-0 group-hover:opacity-100">{v}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {c.change30d >= 0
                ? <span className="text-green-400">▲ Improving — +{c.change30d} pts in 30 days</span>
                : <span className="text-red-400">▼ Declining — {c.change30d} pts in 30 days</span>
              }
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
