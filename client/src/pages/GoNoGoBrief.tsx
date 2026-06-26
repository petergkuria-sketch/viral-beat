import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Download, FileText, Loader2, Check, X,
  AlertTriangle, TrendingUp, Shield, Zap, Clock,
} from "lucide-react";
import jsPDF from "jspdf";
import {
  COUNTRIES, composite, scoreColor, VERDICT_LABELS,
  type CountryProfile, type Verdict,
} from "@/lib/scannerData";

// ── brief data generator ──────────────────────────────────────────────────────

const SECTOR_LIST = [
  "Fintech / Mobile Money", "Agri-tech & Food Processing", "Clean Energy",
  "Logistics & Infrastructure", "Healthcare & MedTech", "Financial Services",
  "Mining & Extractives", "Manufacturing", "Real Estate / PropTech",
  "Consumer & FMCG", "Media & Entertainment", "Oil & Gas Services",
  "Digital Services & GovTech", "Tourism & Hospitality",
];

function generateBriefContent(c: CountryProfile, sector: string, horizon: string) {
  const comp = composite(c);
  const topSector = c.sectors.find(s => s.name.toLowerCase().includes(sector.toLowerCase().split(" ")[0]))
    ?? c.sectors[0];
  const topRisks = c.risks.slice(0, 3);
  const verdict = c.verdict;

  const verdictText: Record<Verdict, { headline: string; colour: string; icon: string }> = {
    "go-market": { headline: "GO-MARKET — Strong Entry Signal", colour: "#22c55e", icon: "✅" },
    "monitor":   { headline: "GO-MARKET — Entry Recommended, Monitor Closely", colour: "#84cc16", icon: "✅" },
    "caution":   { headline: "CAUTION — Conditional Go, Monitor Before Committing", colour: "#f59e0b", icon: "⚠️" },
    "no-go":     { headline: "NO-GO — Await Stabilisation", colour: "#ef4444", icon: "🚫" },
  };

  const timing: Record<string, string> = {
    "3 months": "Immediate entry — now is the optimal window given current score trajectory.",
    "6 months": "Short-horizon entry — deploy exploratory capital within 2 months; full commitment by month 6.",
    "12 months": "Standard horizon — commence market intelligence phase now; commit after 2nd-quarter signal review.",
    "24 months": "Long horizon — establish local partnerships and regulatory relationships now; capital deployment in 18–24 months.",
  };

  return {
    verdict: verdictText[verdict],
    comp, sector: topSector,
    timing: timing[horizon] ?? timing["12 months"],
    topRisks,
  };
}

// ── PDF export ────────────────────────────────────────────────────────────────

function exportPDF(c: CountryProfile, sector: string, horizon: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const { comp } = generateBriefContent(c, sector, horizon);
  const W = 210, M = 18;

  // Header bar
  doc.setFillColor(10, 22, 40);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(0, 212, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("VIRAL BEAT  ·  AFRICA INTELLIGENCE SCANNER", M, 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("GO / NO-GO INVESTOR BRIEF  ·  CONFIDENTIAL", M, 17);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}`, M, 23);

  // Country hero
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(`${c.flag} ${c.name}`, M, 42);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(`${c.region}  ·  Population ${c.population}  ·  GDP ${c.gdp}  ·  FDI ${c.fdi}`, M, 50);

  // Score row
  doc.setFillColor(10, 22, 40);
  doc.rect(M, 54, 170, 16, "F");
  const scores = [
    { label: "Composite Index", val: String(comp) },
    { label: "PESTEL Score", val: String(c.pestel) },
    { label: "IRS (B-READY)", val: String(c.irs) },
    { label: "30D Change", val: c.change30d >= 0 ? `+${c.change30d}` : String(c.change30d) },
    { label: "Verdict", val: VERDICT_LABELS[c.verdict].toUpperCase() },
  ];
  scores.forEach((s, i) => {
    const x = M + i * 34;
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 212, 255);
    doc.text(s.val, x, 63);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
    doc.text(s.label, x, 68);
  });

  // Divider
  doc.setDrawColor(26, 45, 74); doc.setLineWidth(0.4); doc.line(M, 74, W - M, 74);

  // Verdict section
  const bd = generateBriefContent(c, sector, horizon);
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(34, 197, 94);
  doc.text(`${bd.verdict.icon}  DECISION: ${bd.verdict.headline}`, M, 82);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
  const summaryLines = doc.splitTextToSize(c.macroSummary, 170);
  doc.text(summaryLines, M, 90);

  let y = 90 + summaryLines.length * 5 + 6;

  // Macro summary
  doc.setDrawColor(26, 45, 74); doc.line(M, y, W - M, y); y += 8;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text("SECTOR ENTRY RECOMMENDATION", M, y); y += 7;
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
  doc.text(`Target Sector: ${sector}`, M, y); y += 5;
  doc.text(`Investment Horizon: ${horizon}`, M, y); y += 5;
  doc.text(`Timing: ${bd.timing}`, M, y); y += 10;

  // PESTEL breakdown
  doc.setDrawColor(26, 45, 74); doc.line(M, y, W - M, y); y += 8;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text("PESTEL + IR DIMENSION SCORES", M, y); y += 7;
  const dims: [string, string][] = [["P","Political"],["E","Economic"],["S","Social"],["T","Technology"],["En","Environmental"],["L","Legal"],["IR","Inv. Readiness"]];
  dims.forEach(([dim, label], i) => {
    const val = c.pestelBreak[dim as keyof typeof c.pestelBreak];
    const col = i % 2 === 0 ? M : M + 85;
    if (i % 2 === 0 && i > 0) y += 7;
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
    doc.text(`${label}:`, col, y);
    doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text(String(val), col + 38, y);
    doc.setFillColor(26, 45, 74);
    doc.rect(col + 44, y - 3.5, 30, 3, "F");
    const barColor = val >= 75 ? [34,197,94] : val >= 60 ? [132,204,22] : val >= 45 ? [245,158,11] : [239,68,68];
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    doc.rect(col + 44, y - 3.5, (val / 100) * 30, 3, "F");
  });
  y += 12;

  // Top risks
  doc.setDrawColor(26, 45, 74); doc.line(M, y, W - M, y); y += 8;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text("TOP RISKS & MITIGATION", M, y); y += 7;
  c.risks.forEach(r => {
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(239, 68, 68);
    doc.text(`${r.category}: ${r.risk}  [Likelihood: ${r.likelihood} | Impact: ${r.impact}]`, M, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
    const mLines = doc.splitTextToSize(`Mitigation: ${r.mitigation}`, 170);
    doc.text(mLines, M, y); y += mLines.length * 4 + 4;
  });

  // Footer
  doc.setFillColor(10, 22, 40);
  doc.rect(0, 277, W, 20, "F");
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
  doc.text("This brief is generated by Viral Beat Africa Intelligence Scanner. It is an intelligence signal, not financial or investment advice.", M, 284);
  doc.text("Scores are composite indices derived from PESTEL analysis and World Bank B-READY indicators. © 2026 Viral Beat.", M, 289);

  doc.save(`VB_GoNoGo_${c.name}_${sector.substring(0,12).replace(/\s/g,"_")}_${new Date().getFullYear()}.pdf`);
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function GoNoGoBrief() {
  const [, setLocation] = useLocation();
  const params = useParams<{ code: string }>();
  const code = params.code?.toUpperCase() ?? "";
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const defaultSector = searchParams.get("sector") ?? "";

  const found = COUNTRIES.find(x => x.code === code);
  if (!found) {
    setLocation("/scanner");
    return null;
  }
  const c = found;
  const comp = composite(c);
  const color = scoreColor(comp);

  const [sector, setSector] = useState(defaultSector || c.sectors[0]?.name || SECTOR_LIST[0]);
  const [horizon, setHorizon] = useState("12 months");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const brief = generateBriefContent(c, sector, horizon);

  function handleGenerate() {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1400);
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-slate-200">

      {/* Nav */}
      <div className="bg-[#0a1628] border-b border-[#1a2d4a] px-6 py-2.5 flex items-center gap-3">
        <button onClick={() => setLocation(`/scanner/${c.code}`)}
          className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-cyan-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />{c.name} Deep Dive
        </button>
        <span className="text-[#1a2d4a]">/</span>
        <span className="text-[11px] text-cyan-400 font-semibold">Go / No-Go Brief Generator</span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" className="h-7 text-[10px] border-[#1a2d4a] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400 gap-1.5"
            onClick={() => setLocation("/scanner")}>
            ← All Markets
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[340px_1fr] min-h-[calc(100vh-44px)]">

        {/* Config panel */}
        <div className="bg-[#0a1628] border-r border-[#1a2d4a] p-5 space-y-5">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Target Country</p>
            <div className="flex items-center gap-2 p-3 bg-[#050b1a] rounded-lg border border-[#1a2d4a]">
              <span className="text-2xl">{c.flag}</span>
              <div>
                <div className="font-semibold text-sm text-slate-100">{c.name}</div>
                <div className="text-[10px] text-slate-500">{c.region} · Composite {comp}</div>
              </div>
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded border ${
                c.verdict === "go-market" ? "bg-green-500/15 text-green-400 border-green-500/40"
                : c.verdict === "monitor" ? "bg-lime-500/15 text-lime-400 border-lime-500/40"
                : c.verdict === "caution" ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
                : "bg-red-500/15 text-red-400 border-red-500/40"
              }`}>{VERDICT_LABELS[c.verdict]}</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Target Sector</p>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger className="bg-[#050b1a] border-[#1a2d4a] text-slate-200 text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a1628] border-[#1a2d4a] text-slate-200">
                {Array.from(new Set([...c.sectors.map(s => s.name), ...SECTOR_LIST])).map(s => (
                  <SelectItem key={s} value={s} className="text-xs hover:bg-[#1a2d4a]">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Investment Horizon</p>
            <div className="grid grid-cols-2 gap-1.5">
              {["3 months","6 months","12 months","24 months"].map(h => (
                <button key={h} onClick={() => setHorizon(h)}
                  className={`text-[11px] py-2 rounded border transition-colors ${
                    horizon === h ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 font-semibold" : "border-[#1a2d4a] text-slate-500 hover:border-cyan-500/30 hover:text-slate-300"
                  }`}>
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* PESTEL preview */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">PESTEL + IR Scores</p>
            <div className="space-y-1.5">
              {(Object.entries(c.pestelBreak) as [string, number][]).map(([dim, val]) => (
                <div key={dim} className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-500 w-[70px] flex-shrink-0">
                    {dim === "P" ? "Political" : dim === "E" ? "Economic" : dim === "S" ? "Social" : dim === "T" ? "Technology" : dim === "En" ? "Environmental" : dim === "L" ? "Legal" : "Inv. Ready"}
                  </span>
                  <div className="flex-1 h-[3px] bg-slate-800 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${val}%`, background: scoreColor(val) }} />
                  </div>
                  <span className="text-[9px] font-semibold w-5 text-right" style={{ color: scoreColor(val) }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="w-full h-9 text-sm font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 gap-2"
            onClick={handleGenerate} disabled={generating}>
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Brief…</> : <><Zap className="w-4 h-4" />Generate Brief</>}
          </Button>
        </div>

        {/* Brief output */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 44px)" }}>
          {!generated && !generating && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <FileText className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-slate-400 font-semibold mb-1">Ready to Generate</p>
              <p className="text-xs text-slate-600 max-w-xs">Configure your sector and horizon on the left, then click Generate Brief to produce your Go/No-Go investor memo.</p>
            </div>
          )}

          {generating && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 space-y-3">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              <p className="text-slate-300 font-semibold">Generating Intelligence Brief…</p>
              <div className="space-y-1 text-xs text-slate-500">
                <p>✓ Loading PESTEL signals</p>
                <p>✓ Processing B-READY indicators</p>
                <p className="text-cyan-400 animate-pulse">⟳ Structuring Go/No-Go analysis…</p>
              </div>
            </div>
          )}

          {generated && (
            <div className="max-w-3xl">

              {/* Brief header */}
              <div className="bg-[#0a1628] rounded-xl border border-[#1a2d4a] overflow-hidden mb-5">
                <div className="bg-[#050b1a] px-6 py-4 flex items-center justify-between border-b border-[#1a2d4a]">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Viral Beat · Africa Intelligence Scanner</p>
                    <h2 className="text-lg font-bold text-white">Go / No-Go Investor Brief</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{c.name} · {sector} · Horizon: {horizon} · {new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}</p>
                  </div>
                  <Button className="h-8 text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 gap-1.5"
                    onClick={() => exportPDF(c, sector, horizon)}>
                    <Download className="w-3.5 h-3.5" />Export PDF
                  </Button>
                </div>

                {/* Verdict banner */}
                <div className="px-6 py-4 flex items-center gap-4" style={{ background: brief.verdict.colour + "12", borderBottom: `1px solid ${brief.verdict.colour}30` }}>
                  <div className="text-3xl">{brief.verdict.icon}</div>
                  <div>
                    <div className="text-xl font-extrabold" style={{ color: brief.verdict.colour }}>{brief.verdict.headline}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{brief.timing}</div>
                  </div>
                  <div className="ml-auto text-center">
                    <div className="text-3xl font-extrabold" style={{ color }}>{comp}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Composite</div>
                  </div>
                </div>

                {/* Score row */}
                <div className="grid grid-cols-4 divide-x divide-[#1a2d4a] border-b border-[#1a2d4a]">
                  {[
                    { label: "PESTEL Score", val: c.pestel, color: scoreColor(c.pestel) },
                    { label: "IRS (B-READY)", val: c.irs, color: scoreColor(c.irs) },
                    { label: "30D Change", val: c.change30d >= 0 ? `+${c.change30d}` : String(c.change30d), color: c.change30d >= 0 ? "#22c55e" : "#ef4444" },
                    { label: "Sector Score", val: brief.sector?.score ?? "–", color: scoreColor(brief.sector?.score ?? 0) },
                  ].map((s, i) => (
                    <div key={i} className="py-3 text-center">
                      <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.val}</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Macro context */}
              <Section title="Country Context" icon={<Shield className="w-4 h-4" />}>
                <p className="text-sm text-slate-300 leading-relaxed">{c.macroSummary}</p>
              </Section>

              {/* PESTEL breakdown */}
              <Section title="PESTEL + IR Dimension Analysis" icon={<TrendingUp className="w-4 h-4" />}>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(c.pestelBreak) as [string, number][]).map(([dim, val]) => {
                    const dimLabel = { P:"Political", E:"Economic", S:"Social", T:"Technology", En:"Environmental", L:"Legal", IR:"Investment Readiness" }[dim] ?? dim;
                    return (
                      <div key={dim} className="bg-[#050b1a] rounded-lg p-3 border border-[#0f1e35]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold text-slate-400">{dimLabel}</span>
                          <span className="text-base font-extrabold" style={{ color: scoreColor(val) }}>{val}</span>
                        </div>
                        <div className="h-[3px] bg-slate-800 rounded-full mb-2">
                          <div className="h-full rounded-full" style={{ width: `${val}%`, background: scoreColor(val) }} />
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          {c.pestelSnippets[dim as keyof typeof c.pestelSnippets]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Sector recommendation */}
              <Section title={`Sector Entry: ${sector}`} icon={<Zap className="w-4 h-4" />}>
                {brief.sector && (
                  <div className="bg-[#050b1a] rounded-lg p-4 border border-[#0f1e35] mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-200">{brief.sector.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold" style={{ color: scoreColor(brief.sector.score) }}>{brief.sector.score}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${
                          brief.sector.verdict === "go" ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : brief.sector.verdict === "caution" ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}>{brief.sector.verdict}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">Investment Horizon: <strong className="text-slate-200">{horizon}</strong></p>
                    <p className="text-xs text-slate-400 mt-1">{brief.timing}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Key Opportunities</p>
                  <div className="space-y-1.5">
                    {c.opportunities.map((o, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />{o}
                      </div>
                    ))}
                  </div>
                </div>
              </Section>

              {/* Key risks + mitigation */}
              <Section title="Risk Matrix & Mitigation" icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}>
                <div className="space-y-3">
                  {c.risks.map((r, i) => {
                    const impactColor = r.impact === "High" ? "#ef4444" : r.impact === "Medium" ? "#f59e0b" : "#22c55e";
                    return (
                      <div key={i} className="bg-[#050b1a] rounded-lg p-4 border border-[#0f1e35]">
                        <div className="flex items-start gap-3 mb-2">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase flex-shrink-0 mt-0.5"
                            style={{ background: impactColor + "20", color: impactColor, border: `1px solid ${impactColor}40` }}>
                            {r.category}
                          </span>
                          <span className="font-semibold text-sm text-slate-200">{r.risk}</span>
                        </div>
                        <div className="flex gap-6 mb-2">
                          <span className="text-[10px] text-slate-500">Likelihood: <strong className="text-slate-400">{r.likelihood}</strong></span>
                          <span className="text-[10px] text-slate-500">Impact: <strong style={{ color: impactColor }}>{r.impact}</strong></span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          <span className="text-slate-400 font-medium">Mitigation:</span> {r.mitigation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Timeline */}
              <Section title="Key Event Timeline" icon={<Clock className="w-4 h-4" />}>
                <div className="space-y-3">
                  {c.timeline.map((e, i) => {
                    const dotColor = e.type === "positive" ? "#22c55e" : e.type === "warning" ? "#f59e0b" : e.type === "critical" ? "#ef4444" : "#64748b";
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                          {i < c.timeline.length - 1 && <div className="w-px flex-1 bg-[#1a2d4a]" />}
                        </div>
                        <div className="pb-3">
                          <p className="text-[10px] text-slate-500 mb-0.5">{e.date}</p>
                          <p className="text-sm text-slate-300">{e.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Footer disclaimer */}
              <div className="mt-5 p-4 bg-[#0a1628] rounded-lg border border-[#1a2d4a] text-[10px] text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-500 mb-1">Disclaimer</p>
                This brief is generated by the Viral Beat Africa Intelligence Scanner. It is an intelligence signal and analytical aid, not financial, legal, or investment advice. Composite scores are derived from PESTEL analysis weighted with World Bank B-READY indicators. Always conduct independent due diligence before committing capital. © 2026 Viral Beat.
              </div>

              {/* Export row */}
              <div className="mt-4 flex gap-3">
                <Button className="flex-1 h-9 text-sm bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 gap-2"
                  onClick={() => exportPDF(c, sector, horizon)}>
                  <Download className="w-4 h-4" />Export PDF Brief
                </Button>
                <Button variant="outline" className="flex-1 h-9 text-sm border-[#1a2d4a] text-slate-400 hover:bg-slate-800 gap-2"
                  onClick={() => setLocation(`/scanner/${c.code}`)}>
                  <ArrowLeft className="w-4 h-4" />Back to {c.name} Profile
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#0a1628] rounded-xl border border-[#1a2d4a] overflow-hidden mb-4">
      <div className="px-5 py-3 border-b border-[#0f1e35] flex items-center gap-2">
        <span className="text-cyan-400">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
