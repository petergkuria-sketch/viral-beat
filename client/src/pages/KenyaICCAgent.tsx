import React, { useState } from "react";

import { analyzeTextWithICC, ICCHateSpeechAnalysis, KENYA_HATE_LEXICON, getAllLanguages } from "@/lib/kenya/icc-agent";
import { AlertTriangle, CheckCircle, Info, Search, BookOpen, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ICCAgent() {
  const [inputText, setInputText] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState<ICCHateSpeechAnalysis | null>(null);
  const [showLexicon, setShowLexicon] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");

  const handleAnalyze = () => {
    if (!inputText) return;
    const analysis = analyzeTextWithICC(inputText, speaker, context);
    setResult(analysis);
  };

  const languages = getAllLanguages();

  const filteredLexicon = Object.entries(KENYA_HATE_LEXICON).filter(([_, info]) =>
    selectedLanguage === "all" || info.language === selectedLanguage
  );

  const inputClass = "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-white/20";

  const getRiskLevelStyle = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical': return 'bg-red-500/20 border border-red-500/30 text-red-300';
      case 'High': return 'bg-orange-500/20 border border-orange-500/30 text-orange-300';
      case 'Moderate': return 'bg-amber-500/20 border border-amber-500/30 text-amber-300';
      default: return 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300';
    }
  };

  const getSeverityBadgeStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/20 text-red-300';
      case 'high': return 'bg-orange-500/10 border-orange-500/20 text-orange-300';
      case 'medium': return 'bg-amber-500/10 border-amber-500/20 text-amber-300';
      default: return 'bg-white/5 border-white/10 text-slate-400';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-slate-400" />
          <div>
            <h1 className="text-xl font-black text-slate-100">ICC Hate Speech Agent</h1>
            <p className="text-slate-400 text-sm mt-0.5 max-w-3xl">
              Analyzes text based on the Rabat Plan of Action's 6-part threshold test. Now with enhanced detection for <strong className="text-slate-300">Swahili, Sheng, Kikuyu, Kalenjin, Meru, and Luo</strong> hate speech terms from the NCIC Hatelex.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Input Section */}
          <div className="space-y-5">
            <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300">Speaker Identity (Optional)</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. President Ruto, MP, Influencer..."
                  value={speaker}
                  onChange={(e) => setSpeaker(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300">Context (Optional)</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Election Rally, Twitter Thread, Broadcast..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300">Speech / Text Content <span style={{ color: '#f87171' }}>*</span></label>
                <textarea
                  className={cn(inputClass, "min-h-[200px] resize-none")}
                  placeholder="Paste the speech or text here for analysis... Supports English, Swahili, Sheng, and local dialects."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!inputText}
                className="w-full py-3 bg-white/10 border border-white/20 text-slate-100 rounded-xl text-sm font-bold hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Run Analysis
              </button>
            </div>

            {/* Sample Texts */}
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <div className="text-xs font-bold text-slate-400 mb-3">Sample Texts for Testing</div>
              <div className="space-y-2">
                <button
                  onClick={() => setInputText("Hawa madoadoa lazima waondoke kwetu. Wabara wote waende kwao.")}
                  className="text-xs text-left hover:bg-white/5 p-2 rounded-xl border border-border/50 w-full transition-colors text-slate-300"
                >
                  🇰🇪 Swahili: "Hawa madoadoa lazima waondoke..."
                </button>
                <button
                  onClick={() => setInputText("Hatupangwingwi! Kama noma noma, kama mbaya mbaya. Uthamaki ni witu.")}
                  className="text-xs text-left hover:bg-white/5 p-2 rounded-xl border border-border/50 w-full transition-colors text-slate-300"
                >
                  🗣️ Sheng/Kikuyu: "Hatupangwingwi! Kama noma..."
                </button>
                <button
                  onClick={() => setInputText("These cockroaches must be fumigated. We need to eliminate all outsiders from our land.")}
                  className="text-xs text-left hover:bg-white/5 p-2 rounded-xl border border-border/50 w-full transition-colors text-slate-300"
                >
                  🇬🇧 English: "These cockroaches must be fumigated..."
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-card border border-border/50 rounded-2xl p-5 min-h-[400px] relative">
            {!result ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <Info className="w-16 h-16 mb-4" />
                <p className="text-sm">Waiting for input...</p>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={cn(
                  "p-4 rounded-2xl text-center",
                  getRiskLevelStyle(result.riskLevel)
                )}>
                  <div className="text-xs mb-1 opacity-80">Risk Level Assessment</div>
                  <div className="text-4xl font-black tracking-widest">{result.riskLevel}</div>
                  <div className="text-sm mt-2 opacity-80">Score: {result.totalScore}/60</div>
                </div>

                {/* Language Analysis */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-300">Language Analysis</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Primary:</span>{" "}
                      <span className="font-bold text-slate-200">{result.languageAnalysis.primaryLanguage}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Code-switching:</span>{" "}
                      <span className="font-bold text-slate-200">{result.languageAnalysis.containsCodeSwitching ? "Yes" : "No"}</span>
                    </div>
                    {result.languageAnalysis.dialectsDetected.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-slate-400">Dialects:</span>{" "}
                        <span className="font-bold text-slate-200">{result.languageAnalysis.dialectsDetected.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detected Terms */}
                {result.detectedTerms.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-bold text-red-300">Detected Hate Terms ({result.detectedTerms.length})</span>
                    </div>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                      {result.detectedTerms.map((term, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-2 text-xs">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-red-300">"{term.term}"</span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-full text-xs border",
                              getSeverityBadgeStyle(term.severity)
                            )}>
                              {term.severity}
                            </span>
                          </div>
                          <div className="text-slate-400 mt-1">
                            <span>[{term.language}]</span> {term.translation}
                          </div>
                          <div className="text-red-400 mt-1">Target: {term.targetCommunity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-300 border-b border-border/50 pb-2">Threshold Breakdown</h3>

                  {[
                    { key: 'context', label: '1. Context' },
                    { key: 'speaker', label: '2. Speaker' },
                    { key: 'intent', label: '3. Intent' },
                    { key: 'content', label: '4. Content' },
                    { key: 'extent', label: '5. Extent' },
                    { key: 'likelihood', label: '6. Likelihood' },
                  ].map((item) => {
                    // @ts-ignore
                    const metric = result[item.key];
                    return (
                      <div key={item.key} className="grid grid-cols-12 gap-2 items-center text-sm">
                        <div className="col-span-4 text-xs font-bold text-slate-400">{item.label}</div>
                        <div className="col-span-6">
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${metric.score * 10}%` }}
                            />
                          </div>
                        </div>
                        <div className="col-span-2 text-right font-bold text-slate-200 text-xs">{metric.score}/10</div>
                        <div className="col-span-12 text-xs text-slate-400 pl-4 border-l border-border/50 ml-1">
                          {metric.analysis}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
                  <h4 className="text-xs font-bold text-slate-400 mb-2">Final Verdict</h4>
                  <p className="font-medium text-slate-200">{result.verdict}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hate Speech Lexicon Reference */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowLexicon(!showLexicon)}
            className="w-full p-4 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-slate-400" />
              <span className="font-bold text-slate-300">Kenya Hate Speech Lexicon Reference (NCIC)</span>
            </div>
            {showLexicon ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {showLexicon && (
            <div className="p-5">
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedLanguage("all")}
                  className={cn(
                    "px-3 py-1 text-xs rounded-xl border transition-colors",
                    selectedLanguage === "all" ? "bg-white/10 border-white/20 text-slate-100" : "bg-card border-border/50 text-slate-400 hover:bg-white/5"
                  )}
                >
                  All Languages
                </button>
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={cn(
                      "px-3 py-1 text-xs rounded-xl border transition-colors",
                      selectedLanguage === lang ? "bg-white/10 border-white/20 text-slate-100" : "bg-card border-border/50 text-slate-400 hover:bg-white/5"
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="p-2 text-left text-xs text-slate-400 font-bold border-b border-border/50">Term</th>
                      <th className="p-2 text-left text-xs text-slate-400 font-bold border-b border-border/50">Translation</th>
                      <th className="p-2 text-left text-xs text-slate-400 font-bold border-b border-border/50">Language</th>
                      <th className="p-2 text-left text-xs text-slate-400 font-bold border-b border-border/50">Target</th>
                      <th className="p-2 text-left text-xs text-slate-400 font-bold border-b border-border/50">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLexicon.map(([term, info]) => (
                      <tr key={term} className="hover:bg-white/5 border-b border-border/50">
                        <td className="p-2 font-bold text-slate-200">{term}</td>
                        <td className="p-2 text-slate-400">{info.translation}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs">{info.language}</span>
                        </td>
                        <td className="p-2 text-xs text-slate-400">{info.target}</td>
                        <td className="p-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs border",
                            getSeverityBadgeStyle(info.severity)
                          )}>
                            {info.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-xs text-slate-400">
                Source: National Cohesion and Integration Commission (NCIC) - Hatelex: A Lexicon of Hate Speech Terms in Kenya (2022)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

}
