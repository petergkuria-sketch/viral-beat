import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { CountryProfile } from "./scannerData";
import { composite, scoreColor, VERDICT_LABELS, OSS_DATA } from "./scannerData";

// ── colour helpers ────────────────────────────────────────────────────────────

const DIM_COLORS: Record<string, string> = {
  P: "#3b82f6", E: "#22c55e", S: "#84cc16",
  T: "#a855f7", En: "#06b6d4", L: "#f59e0b", IR: "#22d3ee",
};
const DIM_LABELS: Record<string, string> = {
  P: "Political", E: "Economic", S: "Social",
  T: "Technology", En: "Environmental", L: "Legal", IR: "Inv. Readiness",
};

function verdictColour(v: string) {
  if (v === "go-market") return "#22c55e";
  if (v === "monitor")   return "#84cc16";
  if (v === "caution")   return "#f59e0b";
  return "#ef4444";
}

// ── print template ────────────────────────────────────────────────────────────

function PrintBrief({
  c, sector, horizon,
}: { c: CountryProfile; sector: string; horizon: string }) {
  const comp   = composite(c);
  const color  = verdictColour(c.verdict);
  const vLabel = VERDICT_LABELS[c.verdict];
  const oss    = OSS_DATA[c.code] ?? null;
  const date   = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const topSector = c.sectors.find(s =>
    s.name.toLowerCase().includes(sector.toLowerCase().split(" ")[0])
  ) ?? c.sectors[0];
  const dims = Object.entries(c.pestelBreak) as [string, number][];

  return (
    <div style={{
      width: "794px",
      fontFamily: "system-ui, -apple-system, Arial, sans-serif",
      background: "#fff",
      color: "#1e293b",
    }}>

      {/* ── COVER ─────────────────────────────────────────────────────── */}
      <div style={{ background: "#080d1a", color: "#fff", pageBreakAfter: "always" }}>

        {/* Top nav bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/logo.png" alt="ViralBeat" style={{ height: "28px", objectFit: "contain" }} />
          </div>
          <div style={{ textAlign: "right", fontSize: "10px", color: "rgba(255,255,255,.35)", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: "rgba(255,255,255,.55)" }}>PESTEL+IR Intelligence Brief</div>
            <div>Classification: Professional · Confidential</div>
            <div>viralbeat.io · {date}</div>
          </div>
        </div>

        {/* Hero */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "28px", padding: "40px 32px 28px" }}>
          <div>
            <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#22d3ee", marginBottom: "8px" }}>
              {c.region} · Country Intelligence
            </div>
            <div style={{ fontSize: "40px", fontWeight: 900, lineHeight: 1, marginBottom: "6px" }}>
              {c.flag} {c.name}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,.4)", marginBottom: "20px" }}>
              PESTEL+IR Intelligence Brief — {date}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: `${color}18`, border: `1px solid ${color}40`,
              borderRadius: "8px", padding: "8px 16px", marginBottom: "24px",
            }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
              <span style={{ fontSize: "13px", fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {vLabel}
              </span>
            </div>

            {/* KPI row */}
            <div style={{ display: "flex", gap: "24px" }}>
              {[
                { v: String(c.pestel),  l: "PESTEL",    c: scoreColor(c.pestel) },
                { v: String(c.irs),     l: "IRS B-READY", c: scoreColor(c.irs) },
                { v: String(comp),      l: "Composite", c: color },
                { v: `${c.change30d >= 0 ? "+" : ""}${c.change30d}`, l: "30D Change", c: c.change30d >= 0 ? "#22c55e" : "#ef4444" },
              ].map(({ v, l, c: fc }) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: fc }}>{v}</div>
                  <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,.3)", marginTop: "2px" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Score ring */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{
              background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
              borderRadius: "12px", padding: "16px", textAlign: "center",
            }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="10"
                  strokeDasharray="188.5 62.8" strokeDashoffset="47.1" strokeLinecap="round"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10"
                  strokeDasharray={`${(comp / 100) * 188.5} ${251.3 - (comp / 100) * 188.5 + 62.8}`}
                  strokeDashoffset="47.1" strokeLinecap="round"/>
                <text x="50" y="46" textAnchor="middle" fontSize="22" fontWeight="900" fill={color}>{comp}</text>
                <text x="50" y="60" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,.3)">COMPOSITE</text>
              </svg>
              <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,.3)" }}>Entry Readiness</div>
            </div>

            {/* OSS badge */}
            {oss?.exists && (
              <div style={{
                background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.25)",
                borderRadius: "10px", padding: "10px 12px",
              }}>
                <div style={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(74,222,128,.6)", marginBottom: "3px" }}>One-Stop-Shop</div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#4ade80", lineHeight: 1.3 }}>{oss.name}</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,.3)", marginTop: "2px" }}>Active · {oss.services.filter(s => s.available).length}/{oss.services.length} services</div>
              </div>
            )}
          </div>
        </div>

        {/* Ticker */}
        <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.025)" }}>
          {[
            { dot: color, label: "Verdict", val: vLabel },
            { dot: "#22d3ee", label: "Composite Score", val: `${comp}/100` },
            { dot: "#a78bfa", label: "Sector", val: sector },
            { dot: "#f59e0b", label: "Horizon", val: horizon },
          ].map(({ dot, label, val }, i) => (
            <div key={i} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "12px", borderRight: i < 3 ? "1px solid rgba(255,255,255,.06)" : "none",
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: dot, flexShrink: 0 }} />
              <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,.4)" }}>{label}</span>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#fff" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PAGE 2: PESTEL BREAKDOWN ───────────────────────────────────── */}
      <div style={{ padding: "32px", pageBreakAfter: "always" }}>
        <PageHeader c={c} page={2} date={date} />

        <SectionLabel tag="Section 1" title="Composite intelligence overview" />

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", margin: "16px 0" }}>
          {[
            { l: "PESTEL score",    v: `${c.pestel}/100`, sub: "↑ Political + Tech driving", vc: scoreColor(c.pestel) },
            { l: "IRS (B-READY)",  v: `${c.irs}/100`,    sub: "2nd in Africa",               vc: scoreColor(c.irs) },
            { l: "Composite",      v: `${comp}/100`,      sub: "PESTEL ×0.6 + IRS ×0.4",     vc: color },
            { l: "Verdict",        v: vLabel,             sub: `${horizon} horizon`,           vc: color },
          ].map(({ l, v, sub, vc }) => (
            <div key={l} style={{ background: "#f8fafc", border: "0.5px solid #e2e8f0", borderRadius: "8px", padding: "12px" }}>
              <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", marginBottom: "4px" }}>{l}</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: vc }}>{v}</div>
              <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "2px" }}>{sub}</div>
            </div>
          ))}
        </div>

        <SectionLabel tag="1.1" title="PESTEL+IR dimension breakdown" small />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px" }}>
          {dims.map(([dim, val]) => {
            const dc = DIM_COLORS[dim] ?? "#64748b";
            const trend = val >= 75 ? "↑" : val >= 55 ? "→" : "↓";
            const status = val >= 75 ? "Go-Market" : val >= 60 ? "Monitor" : "Caution";
            return (
              <div key={dim} style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: "#f8fafc", border: "0.5px solid #e2e8f0",
                borderLeft: `3px solid ${dc}`, borderRadius: "0 8px 8px 0",
                padding: "10px 12px",
              }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: dc, width: "90px", flexShrink: 0 }}>
                  {dim} · {DIM_LABELS[dim]}
                </div>
                <div style={{ flex: 1, height: "4px", background: "#e2e8f0", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${val}%`, background: dc, borderRadius: "99px" }} />
                </div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: dc, width: "28px", textAlign: "right" }}>{val}</div>
                <div style={{ fontSize: "10px", color: "#64748b", width: "12px" }}>{trend}</div>
                <div style={{
                  fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                  background: `${dc}12`, color: dc, border: `1px solid ${dc}25`, whiteSpace: "nowrap",
                }}>{status}</div>
              </div>
            );
          })}
        </div>

        <SectionLabel tag="1.2" title="Executive summary" small />
        <p style={{ fontSize: "12px", color: "#334155", lineHeight: 1.65, marginTop: "10px" }}>
          {c.macroSummary}
        </p>

        <PageFooter c={c} page={2} date={date} />
      </div>

      {/* ── PAGE 3: SIGNALS + SECTOR ───────────────────────────────────── */}
      <div style={{ padding: "32px", pageBreakAfter: "always" }}>
        <PageHeader c={c} page={3} date={date} />

        <SectionLabel tag="Section 2" title="Sector entry recommendation" />

        <div style={{
          background: "#080d1a", color: "#fff", borderRadius: "12px",
          padding: "20px 24px", marginTop: "14px", marginBottom: "20px",
        }}>
          <div style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "#22d3ee", marginBottom: "6px" }}>
            Decision
          </div>
          <div style={{ fontSize: "16px", fontWeight: 900, color, marginBottom: "8px" }}>
            {vLabel.toUpperCase()} — {sector}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "12px" }}>
            {[
              { l: "Target sector", v: topSector?.name ?? sector },
              { l: "Sector score",  v: topSector ? `${topSector.score}/100` : "—" },
              { l: "Entry horizon", v: horizon },
            ].map(({ l, v }) => (
              <div key={l}>
                <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,.3)", marginBottom: "3px" }}>{l}</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,.5)", borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: "10px" }}>
            {c.change30d >= 0
              ? `Score trending ▲ +${c.change30d} over 30 days — momentum supports entry timing.`
              : `Score trending ▼ ${c.change30d} over 30 days — validate signals before committing capital.`}
          </div>
        </div>

        <SectionLabel tag="Section 3" title="Live signals — past 7 days" />

        <div style={{ marginTop: "12px" }}>
          {c.signals.slice(0, 4).map((s, i) => {
            const dc = DIM_COLORS[s.dim] ?? "#64748b";
            return (
              <div key={i} style={{
                display: "flex", gap: "12px", padding: "10px 0",
                borderBottom: i < 3 ? "0.5px solid #f1f5f9" : "none",
              }}>
                <div style={{
                  fontSize: "8px", fontWeight: 800, padding: "2px 7px", borderRadius: "4px",
                  background: `${dc}15`, color: dc, border: `1px solid ${dc}25`,
                  flexShrink: 0, marginTop: "1px", textTransform: "uppercase", letterSpacing: "0.06em",
                }}>{s.dim}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", color: "#334155", lineHeight: 1.45 }}>{s.text}</div>
                  <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>{s.source} · {s.time} · Verified</div>
                  <div style={{
                    fontSize: "10px", fontWeight: 600, marginTop: "2px",
                    color: s.impact === "pos" ? "#22c55e" : s.impact === "neg" ? "#ef4444" : "#94a3b8",
                  }}>{s.impactText}</div>
                </div>
              </div>
            );
          })}
        </div>

        <PageFooter c={c} page={3} date={date} />
      </div>

      {/* ── PAGE 4: RISKS + ATTRIBUTION + DISCLAIMER ──────────────────── */}
      <div style={{ padding: "32px" }}>
        <PageHeader c={c} page={4} date={date} />

        <SectionLabel tag="Section 4" title="Risk matrix" />

        <div style={{ border: "0.5px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", marginTop: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr", background: "#f8fafc", padding: "8px 14px", borderBottom: "0.5px solid #e2e8f0" }}>
            {["Risk", "Likelihood", "Impact", "Mitigation"].map(h => (
              <div key={h} style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>{h}</div>
            ))}
          </div>
          {c.risks.slice(0, 5).map((r, i) => {
            const impactColor = r.impact === "High" || r.impact === "Critical" ? "#ef4444" : r.impact === "Medium" ? "#f59e0b" : "#22c55e";
            return (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr",
                padding: "10px 14px", borderBottom: i < c.risks.length - 1 ? "0.5px solid #f1f5f9" : "none",
                alignItems: "start",
              }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#1e293b" }}>{r.risk}</div>
                  <div style={{ fontSize: "9px", color: "#64748b", marginTop: "1px" }}>{r.category}</div>
                </div>
                <div>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px", background: "#f1f5f9", color: "#475569" }}>{r.likelihood}</span>
                </div>
                <div>
                  <span style={{
                    fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px",
                    background: `${impactColor}12`, color: impactColor, border: `1px solid ${impactColor}25`,
                  }}>{r.impact}</span>
                </div>
                <div style={{ fontSize: "10px", color: "#475569", lineHeight: 1.4 }}>{r.mitigation}</div>
              </div>
            );
          })}
        </div>

        <SectionLabel tag="Section 5" title="Intelligence source network" />

        <div style={{
          background: "#f8fafc", border: "0.5px solid #e2e8f0",
          borderRadius: "8px", padding: "16px", marginTop: "14px",
        }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
            Verified field contributors across {c.name}'s major economic centres
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "12px" }}>
            All signals undergo ViralBeat's four-stage validation: corroboration · tier weighting · AI classification · editorial review
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
            {[
              { n: "8",  label: "Political journalists",        c: "#3b82f6" },
              { n: "12", label: "NGO programme leads",          c: "#22c55e" },
              { n: "15", label: "Civic researchers",            c: "#a855f7" },
              { n: "8",  label: "Business analysts",            c: "#f59e0b" },
              { n: "4",  label: "Government relations",         c: "#06b6d4" },
            ].map(({ n, label, c: dc }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: dc, flexShrink: 0 }} />
                <div style={{ fontSize: "10px", color: "#475569" }}>
                  <span style={{ fontWeight: 700, color: "#1e293b" }}>{n}</span> {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop: "24px", padding: "12px 14px",
          background: "#fafafa", border: "0.5px solid #f1f5f9", borderRadius: "6px",
        }}>
          <div style={{ fontSize: "9px", color: "#94a3b8", lineHeight: 1.55 }}>
            This report is based on ground-truth intelligence from verified contributors and automated signal aggregation.
            All signals undergo rigorous validation. Market conditions can change rapidly — users are advised to conduct
            additional due diligence before making material investment decisions.
            Scores are composite indices derived from PESTEL analysis and World Bank B-READY indicators.
            Methodology: viralbeat.io/about#methodology
          </div>
          <div style={{ fontSize: "9px", fontWeight: 600, color: "#64748b", marginTop: "6px" }}>
            © 2026 ViralBeat Intelligence. All rights reserved. · viralbeat.io · intelligence@viralbeat.io
          </div>
        </div>

        <PageFooter c={c} page={4} date={date} totalPages={4} />
      </div>
    </div>
  );
}

// ── shared sub-components ─────────────────────────────────────────────────────

function PageHeader({ c, page, date }: { c: CountryProfile; page: number; date: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      paddingBottom: "12px", marginBottom: "4px",
      borderBottom: "1px solid #e2e8f0",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <img src="/logo.png" alt="ViralBeat" style={{ height: "20px", objectFit: "contain" }} />
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#080d1a" }}>
          Viral<span style={{ color: "#22d3ee" }}>Beat</span> Intelligence
        </span>
      </div>
      <div style={{ fontSize: "9px", color: "#94a3b8" }}>
        {c.name} PESTEL+IR Brief · {date}
      </div>
      <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748b" }}>
        Page {page}
      </div>
    </div>
  );
}

function PageFooter({ c, page, date, totalPages = 4 }: { c: CountryProfile; page: number; date: string; totalPages?: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginTop: "24px", paddingTop: "10px",
      borderTop: "0.5px solid #e2e8f0",
    }}>
      <div style={{ fontSize: "9px", color: "#94a3b8" }}>
        viralbeat.io/methodology · intelligence@viralbeat.io
      </div>
      <div style={{ fontSize: "9px", color: "#94a3b8" }}>
        {c.name} · {date}
      </div>
      <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748b" }}>
        Page {page} of {totalPages}
      </div>
    </div>
  );
}

function SectionLabel({ tag, title, small = false }: { tag: string; title: string; small?: boolean }) {
  return (
    <div style={{ marginTop: small ? "20px" : "0", marginBottom: "0" }}>
      <div style={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "#22d3ee", marginBottom: "2px" }}>
        {tag}
      </div>
      <div style={{ fontSize: small ? "13px" : "16px", fontWeight: 700, color: "#1e293b", marginBottom: "2px" }}>{title}</div>
      <div style={{ height: "1px", background: "#e2e8f0", marginTop: "10px" }} />
    </div>
  );
}

// ── shared render helper ──────────────────────────────────────────────────────

async function renderToPDF(
  element: React.ReactElement,
  filename: string,
  onProgress?: (msg: string) => void,
) {
  onProgress?.("Preparing report…");
  const container = document.createElement("div");
  container.style.cssText = "position:absolute;left:-9999px;top:0;width:794px;";
  document.body.appendChild(container);
  const root = createRoot(container);
  await new Promise<void>(resolve => {
    root.render(element);
    setTimeout(resolve, 600);
  });
  onProgress?.("Rendering pages…");
  const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
    scale: 2, useCORS: true, allowTaint: false,
    backgroundColor: "#ffffff", logging: false, windowWidth: 794,
  });
  onProgress?.("Building PDF…");
  const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const imgW = canvas.width;
  const imgH = canvas.height;
  const pageHeightPx = Math.round((pdfH / pdfW) * imgW);
  let yOffset = 0, pageIndex = 0;
  while (yOffset < imgH) {
    if (pageIndex > 0) pdf.addPage();
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = imgW;
    sliceCanvas.height = Math.min(pageHeightPx, imgH - yOffset);
    const ctx = sliceCanvas.getContext("2d")!;
    ctx.drawImage(canvas, 0, yOffset, imgW, sliceCanvas.height, 0, 0, imgW, sliceCanvas.height);
    const sliceH = (sliceCanvas.height / imgW) * pdfW;
    pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pdfW, sliceH);
    yOffset += pageHeightPx; pageIndex++;
  }
  root.unmount();
  document.body.removeChild(container);
  pdf.save(filename);
  onProgress?.("Done");
}

// ── shared report header / footer (light pages) ───────────────────────────────

function LightPageHeader({ title, subtitle, date }: { title: string; subtitle?: string; date: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", marginBottom: "4px", borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <img src="/logo.png" alt="ViralBeat" style={{ height: "20px", objectFit: "contain" }} />
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#080d1a" }}>Viral<span style={{ color: "#22d3ee" }}>Beat</span> Intelligence</span>
      </div>
      <div style={{ fontSize: "9px", color: "#94a3b8", textAlign: "center" }}>{subtitle ?? title} · {date}</div>
      <div style={{ fontSize: "9px", color: "#94a3b8" }}>viralbeat.io</div>
    </div>
  );
}

function LightPageFooter({ page, totalPages, date }: { page: number; totalPages: number; date: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "24px", paddingTop: "10px", borderTop: "0.5px solid #e2e8f0" }}>
      <div style={{ fontSize: "9px", color: "#94a3b8" }}>viralbeat.io · intelligence@viralbeat.io</div>
      <div style={{ fontSize: "9px", color: "#94a3b8" }}>{date}</div>
      <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748b" }}>Page {page} of {totalPages}</div>
    </div>
  );
}

function Disclaimer() {
  return (
    <div style={{ marginTop: "20px", padding: "10px 14px", background: "#fafafa", border: "0.5px solid #f1f5f9", borderRadius: "6px" }}>
      <div style={{ fontSize: "9px", color: "#94a3b8", lineHeight: 1.55 }}>
        This report is an intelligence signal and analytical aid, not financial, legal, or investment advice.
        Data sourced from verified contributors and automated aggregation. Scores reflect media coverage
        and composite indicators — always conduct independent due diligence before committing capital.
        Methodology: viralbeat.io/about#methodology · © 2026 ViralBeat Intelligence.
      </div>
    </div>
  );
}

// ── TEMPLATE: Intelligence Brief (PublicBrief / ShareBriefButton) ─────────────

export interface IntelBriefData {
  countryName: string;
  countryCode: string;
  title?: string;
  overview: string;
  sentimentScore: number;
  stabilityScore: number;
  riskLevel: string;
  keyThemes?: string[];
  contributor?: string;
  affiliation?: string;
  shareUrl?: string;
  generatedAt?: string;
}

const RISK_COLORS_MAP: Record<string, string> = {
  low: "#22c55e", medium: "#f59e0b", high: "#f97316", critical: "#ef4444",
};

function PrintIntelBrief({ brief }: { brief: IntelBriefData }) {
  const date = brief.generatedAt
    ? new Date(brief.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const rc = RISK_COLORS_MAP[brief.riskLevel] ?? RISK_COLORS_MAP.medium;
  const themes: string[] = brief.keyThemes ?? [];

  return (
    <div style={{ width: "794px", fontFamily: "system-ui, Arial, sans-serif", background: "#fff", color: "#1e293b" }}>
      {/* Cover strip */}
      <div style={{ background: "#080d1a", padding: "20px 32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/logo.png" alt="ViralBeat" style={{ height: "26px", objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: `${rc}22`, border: `1px solid ${rc}44`, borderRadius: "6px", padding: "4px 12px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: rc }} />
            <span style={{ fontSize: "10px", fontWeight: 800, color: rc, textTransform: "uppercase", letterSpacing: "0.1em" }}>{brief.riskLevel} RISK</span>
          </div>
        </div>
        <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#22d3ee", marginBottom: "6px" }}>
          Africa Intelligence Brief · {brief.countryName}
        </div>
        <div style={{ fontSize: "32px", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: "6px" }}>
          {brief.title ?? `${brief.countryName} Intelligence Brief`}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,.4)" }}>Generated {date} · viralbeat.io</div>

        {/* KPI chips */}
        <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
          {[
            { l: "Sentiment", v: `${brief.sentimentScore}/100`, c: brief.sentimentScore >= 65 ? "#22c55e" : brief.sentimentScore >= 45 ? "#f59e0b" : "#ef4444" },
            { l: "Stability", v: `${brief.stabilityScore}/100`, c: brief.stabilityScore >= 65 ? "#22c55e" : brief.stabilityScore >= 45 ? "#f59e0b" : "#ef4444" },
            { l: "Risk Level", v: brief.riskLevel.toUpperCase(), c: rc },
          ].map(({ l, v, c: fc }) => (
            <div key={l} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "8px", padding: "10px 16px", minWidth: "110px" }}>
              <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,.35)", marginBottom: "4px" }}>{l}</div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: fc }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "28px 32px" }}>
        <LightPageHeader title="Intelligence Brief" subtitle={brief.countryName} date={date} />

        <div style={{ marginTop: "20px" }}>
          <div style={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "#22d3ee", marginBottom: "4px" }}>Intelligence Overview</div>
          <div style={{ height: "1px", background: "#e2e8f0", marginBottom: "14px" }} />
          <p style={{ fontSize: "12px", color: "#334155", lineHeight: 1.7 }}>{brief.overview}</p>
        </div>

        {themes.length > 0 && (
          <div style={{ marginTop: "24px" }}>
            <div style={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "#22d3ee", marginBottom: "4px" }}>Key Themes</div>
            <div style={{ height: "1px", background: "#e2e8f0", marginBottom: "12px" }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {themes.map((t, i) => (
                <span key={i} style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", background: "#f1f5f9", color: "#334155", border: "0.5px solid #e2e8f0" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {brief.contributor && (
          <div style={{ marginTop: "24px", background: "#f8fafc", border: "0.5px solid #e2e8f0", borderRadius: "8px", padding: "14px 16px" }}>
            <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", marginBottom: "4px" }}>Prepared by</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{brief.contributor}</div>
            {brief.affiliation && <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>{brief.affiliation}</div>}
          </div>
        )}

        {brief.shareUrl && (
          <div style={{ marginTop: "12px", fontSize: "10px", color: "#22d3ee" }}>
            Shareable link: viralbeat.io{brief.shareUrl}
          </div>
        )}

        <Disclaimer />
        <LightPageFooter page={1} totalPages={1} date={date} />
      </div>
    </div>
  );
}

export async function exportIntelBriefPDF(brief: IntelBriefData, onProgress?: (msg: string) => void) {
  await renderToPDF(
    <PrintIntelBrief brief={brief} />,
    `VB_Brief_${brief.countryCode.toUpperCase()}_${Date.now()}.pdf`,
    onProgress,
  );
}

// ── TEMPLATE: Intelligence Page markdown export ────────────────────────────────

function PrintIntelligence({ content, basename, date }: { content: string; basename: string; date: string }) {
  const lines = content.split("\n");

  return (
    <div style={{ width: "794px", fontFamily: "system-ui, Arial, sans-serif", background: "#fff", color: "#1e293b" }}>
      {/* Cover strip */}
      <div style={{ background: "#080d1a", padding: "20px 32px 24px", marginBottom: "0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <img src="/logo.png" alt="ViralBeat" style={{ height: "26px", objectFit: "contain" }} />
        </div>
        <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#22d3ee", marginBottom: "6px" }}>
          Africa Political Intelligence
        </div>
        <div style={{ fontSize: "26px", fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: "6px" }}>
          {basename.replace(/_/g, " ")}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,.4)" }}>{date} · viralbeat.io · Confidential</div>
      </div>

      {/* Body — render markdown lines */}
      <div style={{ padding: "28px 32px" }}>
        <LightPageHeader title={basename} date={date} />
        <div style={{ marginTop: "20px" }}>
          {lines.map((raw, i) => {
            const isH1 = /^# /.test(raw);
            const isH2 = /^## /.test(raw);
            const isH3 = /^#{3,4} /.test(raw);
            const text = raw.replace(/^#{1,4}\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/`(.*?)`/g, "$1").trim();
            if (!text) return <div key={i} style={{ height: "8px" }} />;
            if (isH1) return <div key={i} style={{ fontSize: "18px", fontWeight: 900, color: "#080d1a", marginTop: "24px", marginBottom: "6px", paddingBottom: "6px", borderBottom: "1px solid #e2e8f0" }}>{text}</div>;
            if (isH2) return <div key={i} style={{ fontSize: "14px", fontWeight: 800, color: "#22d3ee", marginTop: "20px", marginBottom: "4px" }}>{text}</div>;
            if (isH3) return <div key={i} style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginTop: "14px", marginBottom: "3px" }}>{text}</div>;
            return <p key={i} style={{ fontSize: "11px", color: "#475569", lineHeight: 1.65, margin: "0 0 6px" }}>{text}</p>;
          })}
        </div>
        <Disclaimer />
        <LightPageFooter page={1} totalPages={1} date={date} />
      </div>
    </div>
  );
}

export async function exportIntelligencePDF(content: string, basename: string, onProgress?: (msg: string) => void) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  await renderToPDF(
    <PrintIntelligence content={content} basename={basename} date={date} />,
    `${basename}.pdf`,
    onProgress,
  );
}

// ── TEMPLATE: Investment Comparison (DoingBusinessPage) ───────────────────────

export interface ComparisonCountry {
  code: string;
  name: string;
  flag: string;
  region: string;
  stabilityScore: number;
  aafctaStatus: string;
  bitCount: number;
  capitalControls: string;
  topSectors: string[];
  indicators: Record<string, number>;
}

const INDICATOR_DISPLAY: Record<string, string> = {
  businessEntry: "Business Entry",
  constructionPermits: "Construction Permits",
  electricity: "Electricity Access",
  propertyRegistration: "Property Registration",
  creditAccess: "Credit Access",
  investorProtection: "Investor Protection",
  taxCompliance: "Tax Compliance",
  tradeFacilitation: "Trade Facilitation",
  contractEnforcement: "Contract Enforcement",
  insolvencyResolution: "Insolvency Resolution",
};

function calcIRSLocal(c: ComparisonCountry) {
  const vals = Object.values(c.indicators);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}

function ScoreBar({ val, color }: { val: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "4px", background: "#e2e8f0", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${val}%`, background: color, borderRadius: "99px" }} />
      </div>
      <span style={{ fontSize: "11px", fontWeight: 700, color, width: "28px", textAlign: "right" }}>{val}</span>
    </div>
  );
}

const COMPARISON_COLORS = ["#22d3ee", "#a855f7", "#f59e0b"];

function PrintComparison({ countries, date }: { countries: ComparisonCountry[]; date: string }) {
  return (
    <div style={{ width: "794px", fontFamily: "system-ui, Arial, sans-serif", background: "#fff", color: "#1e293b" }}>
      {/* Header */}
      <div style={{ background: "#080d1a", padding: "20px 32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <img src="/logo.png" alt="ViralBeat" style={{ height: "26px", objectFit: "contain" }} />
        </div>
        <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#22d3ee", marginBottom: "6px" }}>
          Africa Investment Comparison
        </div>
        <div style={{ fontSize: "28px", fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: "6px" }}>
          {countries.map(c => `${c.flag} ${c.name}`).join(" vs ")}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,.4)" }}>{date} · B-READY Investment Readiness Comparison · viralbeat.io</div>

        {/* IRS summary row */}
        <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
          {countries.map((c, idx) => (
            <div key={c.code} style={{ background: "rgba(255,255,255,.05)", border: `1px solid ${COMPARISON_COLORS[idx]}44`, borderRadius: "8px", padding: "10px 16px", flex: 1 }}>
              <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,.35)", marginBottom: "4px" }}>{c.name} IRS</div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: COMPARISON_COLORS[idx] }}>{calcIRSLocal(c)}</div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,.3)", marginTop: "2px" }}>Stability {c.stabilityScore} · {c.aafctaStatus}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "28px 32px" }}>
        <LightPageHeader title="Investment Comparison" date={date} />

        <div style={{ marginTop: "20px" }}>
          <div style={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "#22d3ee", marginBottom: "4px" }}>Indicator Breakdown</div>
          <div style={{ height: "1px", background: "#e2e8f0", marginBottom: "14px" }} />

          {/* Indicator table */}
          <div style={{ border: "0.5px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: `2fr ${countries.map(() => "1fr").join(" ")}`, background: "#f8fafc", padding: "8px 14px", borderBottom: "0.5px solid #e2e8f0" }}>
              <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>Indicator</div>
              {countries.map((c, idx) => (
                <div key={c.code} style={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: COMPARISON_COLORS[idx] }}>{c.flag} {c.name}</div>
              ))}
            </div>
            {Object.entries(INDICATOR_DISPLAY).map(([key, label], i) => (
              <div key={key} style={{ display: "grid", gridTemplateColumns: `2fr ${countries.map(() => "1fr").join(" ")}`, padding: "9px 14px", borderBottom: i < Object.keys(INDICATOR_DISPLAY).length - 1 ? "0.5px solid #f1f5f9" : "none", alignItems: "center" }}>
                <div style={{ fontSize: "10px", color: "#475569" }}>{label}</div>
                {countries.map((c, idx) => (
                  <ScoreBar key={c.code} val={c.indicators[key] ?? 0} color={COMPARISON_COLORS[idx]} />
                ))}
              </div>
            ))}
          </div>

          {/* Country profiles */}
          <div style={{ marginTop: "20px" }}>
            <div style={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "#22d3ee", marginBottom: "4px" }}>Country Profiles</div>
            <div style={{ height: "1px", background: "#e2e8f0", marginBottom: "14px" }} />
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${countries.length},1fr)`, gap: "12px" }}>
              {countries.map((c, idx) => (
                <div key={c.code} style={{ background: "#f8fafc", border: `1px solid ${COMPARISON_COLORS[idx]}33`, borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: COMPARISON_COLORS[idx], marginBottom: "4px" }}>{c.flag} {c.name}</div>
                  <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "8px" }}>{c.region}</div>
                  {[
                    ["IRS Score", calcIRSLocal(c)],
                    ["Stability", c.stabilityScore],
                    ["AfCFTA", c.aafctaStatus],
                    ["Capital Controls", c.capitalControls],
                    ["BIT Treaties", c.bitCount],
                  ].map(([l, v]) => (
                    <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "9px", color: "#94a3b8" }}>{l}</span>
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "#334155" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: "6px", fontSize: "9px", color: "#64748b" }}>
                    Top sectors: {c.topSectors.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Disclaimer />
        <LightPageFooter page={1} totalPages={1} date={date} />
      </div>
    </div>
  );
}

export async function exportComparisonPDF(countries: ComparisonCountry[], onProgress?: (msg: string) => void) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const names = countries.map(c => c.name.substring(0, 4)).join("-");
  await renderToPDF(
    <PrintComparison countries={countries} date={date} />,
    `VB_Comparison_${names}_${new Date().getFullYear()}.pdf`,
    onProgress,
  );
}

// ── TEMPLATE: Kenya political report ─────────────────────────────────────────

function PrintKenyaReport({ title, content, date }: { title: string; content: string; date: string }) {
  return (
    <div style={{ width: "794px", fontFamily: "system-ui, Arial, sans-serif", background: "#fff", color: "#1e293b" }}>
      <div style={{ background: "#080d1a", padding: "20px 32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <img src="/logo.png" alt="ViralBeat" style={{ height: "26px", objectFit: "contain" }} />
        </div>
        <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#22d3ee", marginBottom: "6px" }}>
          Kenya Political Intelligence
        </div>
        <div style={{ fontSize: "26px", fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: "6px" }}>{title}</div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,.4)" }}>{date} · Kenya Sentiment Tracker · viralbeat.io</div>
      </div>
      <div style={{ padding: "28px 32px" }}>
        <LightPageHeader title={title} date={date} />
        <div style={{ marginTop: "20px" }}>
          {/* Render the HTML content in an iframe-like div — strip HTML tags for clean text */}
          <div dangerouslySetInnerHTML={{ __html: content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") }} />
        </div>
        <Disclaimer />
        <LightPageFooter page={1} totalPages={1} date={date} />
      </div>
    </div>
  );
}

export async function exportKenyaReportPDF(title: string, htmlContent: string, filename: string, onProgress?: (msg: string) => void) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  await renderToPDF(
    <PrintKenyaReport title={title} content={htmlContent} date={date} />,
    `${filename}.pdf`,
    onProgress,
  );
}

// ── Go/No-Go Brief export function ───────────────────────────────────────────

export async function exportBriefPDF(
  c: CountryProfile,
  sector: string,
  horizon: string,
  onProgress?: (msg: string) => void,
) {
  const filename = `VB_${c.name.replace(/\s+/g, "_")}_${sector.replace(/\s+/g, "_").substring(0, 12)}_${new Date().getFullYear()}.pdf`;
  await renderToPDF(<PrintBrief c={c} sector={sector} horizon={horizon} />, filename, onProgress);
  onProgress?.("Done");
}
