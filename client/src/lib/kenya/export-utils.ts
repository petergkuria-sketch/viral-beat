// Export utilities for CSV and PDF generation

export interface ExportColumn {
  key: string;
  header: string;
  format?: (value: any) => string;
}

// CSV Export
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  // Create header row
  const headers = columns.map(col => `"${col.header}"`).join(",");
  
  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key];
      const formatted = col.format ? col.format(value) : value;
      // Escape quotes and wrap in quotes
      return `"${String(formatted ?? "").replace(/"/g, '""')}"`;
    }).join(",");
  });
  
  // Combine and create blob
  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Download
  downloadBlob(blob, `${filename}.csv`);
}

// PDF Export (simplified HTML-to-print approach)
export function exportToPDF(
  title: string,
  content: string,
  filename: string
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to export PDF");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          font-size: 24px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        h2 {
          font-size: 18px;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          font-size: 12px;
        }
        th {
          background: #f0f0f0;
          font-weight: bold;
        }
        .metric {
          display: inline-block;
          margin: 10px 20px 10px 0;
          padding: 10px;
          border: 2px solid #000;
        }
        .metric-label {
          font-size: 10px;
          text-transform: uppercase;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
        }
        .risk-critical { color: #dc2626; }
        .risk-high { color: #ea580c; }
        .risk-moderate { color: #ca8a04; }
        .risk-low { color: #16a34a; }
        .timestamp {
          font-size: 10px;
          color: #666;
          margin-top: 30px;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${content}
      <div class="timestamp">
        Generated: ${new Date().toLocaleString()} | Kenya Political Sentiment Tracker
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
  };
}

// Helper to download blob
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Balkanization Report Export
export function exportBalkanizationReport(regionData: any[]): void {
  const content = `
    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Kenya Kwanza</div>
        <div class="metric-value">51%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Azimio</div>
        <div class="metric-value">45%</div>
      </div>
      <div class="metric">
        <div class="metric-label">High Risk Areas</div>
        <div class="metric-value risk-critical">7</div>
      </div>
    </div>

    <h2>Regional Support Distribution</h2>
    <table>
      <thead>
        <tr>
          <th>Region</th>
          <th>Kenya Kwanza</th>
          <th>Azimio</th>
          <th>Polarization Level</th>
          <th>Risk Counties</th>
        </tr>
      </thead>
      <tbody>
        ${regionData.map(r => `
          <tr>
            <td>${r.name}</td>
            <td>${r.kk}%</td>
            <td>${r.az}%</td>
            <td class="risk-${r.risk.toLowerCase()}">${r.risk}</td>
            <td>${r.riskCounties || 0}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <h2>Analysis Summary</h2>
    <p>
      This report analyzes political support distribution across Kenya's 8 regions.
      Areas with extreme polarization (>70% support for one coalition) are flagged as high-risk
      for potential electoral tensions.
    </p>
  `;

  exportToPDF("Support Balkanization Report", content, "balkanization-report");
}

// Election Phase Report Export
export function exportElectionPhaseReport(phaseData: any): void {
  const content = `
    <h2>Current Phase: ${phaseData.currentPhase}</h2>
    
    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Kenya Kwanza Support</div>
        <div class="metric-value">${phaseData.kkSupport}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Azimio Support</div>
        <div class="metric-value">${phaseData.azSupport}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Hate Speech Alerts</div>
        <div class="metric-value risk-critical">${phaseData.hateAlerts}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Voter Engagement</div>
        <div class="metric-value">${phaseData.engagement}%</div>
      </div>
    </div>

    <h2>Key Issues Driving Sentiment</h2>
    <table>
      <thead>
        <tr>
          <th>Issue</th>
          <th>Concern Level</th>
        </tr>
      </thead>
      <tbody>
        ${phaseData.issues.map((issue: any) => `
          <tr>
            <td>${issue.name}</td>
            <td>${issue.level}%</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <h2>Phase Timeline</h2>
    <table>
      <thead>
        <tr>
          <th>Phase</th>
          <th>Status</th>
          <th>KK Support</th>
          <th>Azimio Support</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Pre-Election</td><td>Completed</td><td>48%</td><td>49%</td></tr>
        <tr><td>Campaign</td><td>Active</td><td>52%</td><td>45%</td></tr>
        <tr><td>Local Mobilization</td><td>Active</td><td>54%</td><td>43%</td></tr>
        <tr><td>Election Day</td><td>Pending</td><td>-</td><td>-</td></tr>
        <tr><td>Post-Election</td><td>Pending</td><td>-</td><td>-</td></tr>
      </tbody>
    </table>
  `;

  exportToPDF("Election Phase Report", content, "election-phase-report");
}

// Sentiment History CSV Export
export function exportSentimentHistory(data: any[], entityName: string): void {
  const columns: ExportColumn[] = [
    { key: "date", header: "Date" },
    { key: "sentiment", header: "Sentiment Score", format: (v) => `${v}%` },
    { key: "positive", header: "Positive Mentions" },
    { key: "negative", header: "Negative Mentions" },
    { key: "neutral", header: "Neutral Mentions" },
  ];

  exportToCSV(data, columns, `sentiment-history-${entityName.toLowerCase().replace(/\s+/g, "-")}`);
}

// MPs CSV Export
export function exportMPsData(mps: any[]): void {
  const columns: ExportColumn[] = [
    { key: "name", header: "Name" },
    { key: "constituency", header: "Constituency" },
    { key: "county", header: "County" },
    { key: "party", header: "Party" },
    { key: "coalition", header: "Coalition" },
    { key: "sentiment", header: "Sentiment", format: (v) => `${v}%` },
  ];

  exportToCSV(mps, columns, "parliament-sentiment-data");
}
