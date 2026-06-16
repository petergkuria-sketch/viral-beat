import React from "react";

import { FileText, Download, Calendar } from "lucide-react";

export default function Reports() {
  const reports = [
    { id: 1, title: "Weekly Sentiment Analysis: Rift Valley Region", date: "Oct 24, 2025", type: "PDF", size: "2.4 MB" },
    { id: 2, title: "Hate Speech Monitoring Report: Q3 2025", date: "Oct 01, 2025", type: "PDF", size: "5.1 MB" },
    { id: 3, title: "Opposition Coalition Performance Review", date: "Sep 15, 2025", type: "PDF", size: "1.8 MB" },
    { id: 4, title: "Social Media Impact on By-Elections", date: "Aug 30, 2025", type: "PDF", size: "3.2 MB" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-8">
        <div className="border-b-2 border-border pb-6">
          <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase">Intelligence Reports</h2>
          <p className="text-muted-foreground font-mono mt-2">Downloadable detailed analysis and archives.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="brutalist-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:bg-secondary transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary text-primary-foreground border-2 border-border">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight group-hover:underline decoration-2 underline-offset-4">{report.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {report.date}</span>
                    <span className="px-1.5 py-0.5 border border-border bg-white text-black">{report.type}</span>
                    <span>{report.size}</span>
                  </div>
                </div>
              </div>
              
              <button className="brutalist-btn w-full md:w-auto flex items-center justify-center gap-2 text-sm">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
