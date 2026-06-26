import { jsPDF } from "jspdf";

interface BriefData {
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

export function exportBriefPDF(brief: BriefData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210; // A4 width
  const margin = 18;
  const contentW = W - margin * 2;
  let y = 0;

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(8, 13, 26); // #080d1a
  doc.rect(0, 0, W, 28, "F");

  doc.setTextColor(34, 211, 238); // cyan-400
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("VIRALBEAT", margin, 11);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("The Africa Intelligence Beat for Decision Makers", margin, 17);
  doc.text("viralbeat.io/about#methodology", margin, 22);

  // Risk badge (top right)
  const riskColors: Record<string, [number, number, number]> = {
    low: [52, 211, 153], medium: [251, 191, 36],
    high: [251, 146, 60], critical: [248, 113, 113],
  };
  const rc = riskColors[brief.riskLevel] ?? riskColors.medium;
  doc.setFillColor(...rc);
  doc.roundedRect(W - margin - 28, 7, 28, 10, 2, 2, "F");
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text((brief.riskLevel ?? "unknown").toUpperCase() + " RISK", W - margin - 14, 13.5, { align: "center" });

  y = 38;

  // ── Country title ────────────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${brief.countryName} Intelligence Brief`, margin, y);
  y += 8;

  const date = brief.generatedAt
    ? new Date(brief.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated ${date} · Data sourced from Nation Africa, The Standard, Citizen Digital`, margin, y);
  y += 12;

  // ── KPI row ──────────────────────────────────────────────────────────────────
  const kpis = [
    { label: "Sentiment Score", value: `${brief.sentimentScore}/100` },
    { label: "Stability Score", value: `${brief.stabilityScore}/100` },
    { label: "Risk Level",      value: (brief.riskLevel ?? "—").toUpperCase() },
  ];
  const kpiW = contentW / 3;
  kpis.forEach((kpi, i) => {
    const x = margin + i * kpiW;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y, kpiW - 3, 20, 2, 2, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label.toUpperCase(), x + 5, y + 7);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, x + 5, y + 16);
  });
  y += 28;

  // ── Overview ─────────────────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("INTELLIGENCE OVERVIEW", margin, y);
  y += 5;

  doc.setDrawColor(34, 211, 238);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentW, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  const overviewLines = doc.splitTextToSize(brief.overview ?? "", contentW);
  doc.text(overviewLines, margin, y);
  y += overviewLines.length * 5 + 8;

  // ── Key themes ───────────────────────────────────────────────────────────────
  if (brief.keyThemes && brief.keyThemes.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("KEY THEMES", margin, y);
    y += 5;
    doc.setDrawColor(34, 211, 238);
    doc.line(margin, y, margin + contentW, y);
    y += 6;

    brief.keyThemes.forEach(theme => {
      doc.setFillColor(34, 211, 238);
      doc.circle(margin + 2, y - 1.5, 1.2, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(theme, margin + 6, y);
      y += 6;
    });
    y += 4;
  }

  // ── Contributor attribution ──────────────────────────────────────────────────
  if (brief.contributor) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentW, 18, 2, 2, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("PREPARED BY", margin + 4, y + 6);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(brief.contributor, margin + 4, y + 12);
    if (brief.affiliation) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(brief.affiliation, margin + 4, y + 16.5);
    }
    y += 24;
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  const pageH = 297;
  doc.setFillColor(8, 13, 26);
  doc.rect(0, pageH - 18, W, 18, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("© ViralBeat · viralbeat.io", margin, pageH - 10);
  doc.text("Methodology: viralbeat.io/about#methodology", margin, pageH - 6);

  if (brief.shareUrl) {
    doc.setTextColor(34, 211, 238);
    doc.text(`Shareable brief: viralbeat.io${brief.shareUrl}`, W - margin, pageH - 8, { align: "right" });
  }

  doc.setTextColor(71, 85, 105);
  doc.text(
    "Data sourced from RSS feeds updated every 4 hours. Scores reflect editorial media coverage only. See methodology for limitations.",
    margin, pageH - 22,
    { maxWidth: contentW }
  );

  // ── Save ─────────────────────────────────────────────────────────────────────
  doc.save(`viralbeat-${brief.countryCode.toLowerCase()}-brief-${Date.now()}.pdf`);
}
