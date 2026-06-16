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

  return (
    <div className="space-y-6">
      <div className="space-y-8">
        <div className="border-b-2 border-border pb-6">
          <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 md:w-10 md:h-10" />
            ICC Hate Speech Agent
          </h2>
          <p className="text-muted-foreground font-mono mt-2 max-w-3xl">
            Analyzes text based on the Rabat Plan of Action's 6-part threshold test. Now with enhanced detection for <strong>Swahili, Sheng, Kikuyu, Kalenjin, Meru, and Luo</strong> hate speech terms from the NCIC Hatelex.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="font-mono font-bold uppercase text-sm">Speaker Identity (Optional)</label>
              <input 
                type="text" 
                className="w-full brutalist-input"
                placeholder="e.g. President Ruto, MP, Influencer..."
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-mono font-bold uppercase text-sm">Context (Optional)</label>
              <input 
                type="text" 
                className="w-full brutalist-input"
                placeholder="e.g. Election Rally, Twitter Thread, Broadcast..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono font-bold uppercase text-sm">Speech / Text Content <span className="text-red-500">*</span></label>
              <textarea 
                className="w-full brutalist-input min-h-[200px] resize-none"
                placeholder="Paste the speech or text here for analysis... Supports English, Swahili, Sheng, and local dialects."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={!inputText}
              className="w-full brutalist-btn flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-5 h-5" />
              Run Analysis
            </button>

            {/* Sample Texts */}
            <div className="bg-secondary/50 border border-border p-4">
              <div className="font-mono text-xs uppercase font-bold mb-2 text-muted-foreground">Sample Texts for Testing</div>
              <div className="space-y-2">
                <button 
                  onClick={() => setInputText("Hawa madoadoa lazima waondoke kwetu. Wabara wote waende kwao.")}
                  className="text-xs font-mono text-left hover:bg-secondary p-2 border border-border w-full transition-colors"
                >
                  🇰🇪 Swahili: "Hawa madoadoa lazima waondoke..."
                </button>
                <button 
                  onClick={() => setInputText("Hatupangwingwi! Kama noma noma, kama mbaya mbaya. Uthamaki ni witu.")}
                  className="text-xs font-mono text-left hover:bg-secondary p-2 border border-border w-full transition-colors"
                >
                  🗣️ Sheng/Kikuyu: "Hatupangwingwi! Kama noma..."
                </button>
                <button 
                  onClick={() => setInputText("These cockroaches must be fumigated. We need to eliminate all outsiders from our land.")}
                  className="text-xs font-mono text-left hover:bg-secondary p-2 border border-border w-full transition-colors"
                >
                  🇬🇧 English: "These cockroaches must be fumigated..."
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-secondary/30 border-2 border-border p-6 min-h-[400px] relative">
            {!result ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <Info className="w-16 h-16 mb-4" />
                <p className="font-mono text-sm uppercase">Waiting for input...</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={cn(
                  "p-4 border-2 border-border text-center",
                  result.riskLevel === 'Critical' ? "bg-red-600 text-white" :
                  result.riskLevel === 'High' ? "bg-orange-500 text-white" :
                  result.riskLevel === 'Moderate' ? "bg-yellow-400 text-black" : "bg-green-500 text-white"
                )}>
                  <div className="font-mono text-xs uppercase mb-1">Risk Level Assessment</div>
                  <div className="text-4xl font-bold font-mono uppercase tracking-widest">{result.riskLevel}</div>
                  <div className="font-mono text-sm mt-2">Score: {result.totalScore}/60</div>
                </div>

                {/* Language Analysis */}
                <div className="bg-white border-2 border-border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4" />
                    <span className="font-mono text-xs uppercase font-bold">Language Analysis</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Primary:</span>{" "}
                      <span className="font-bold">{result.languageAnalysis.primaryLanguage}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Code-switching:</span>{" "}
                      <span className="font-bold">{result.languageAnalysis.containsCodeSwitching ? "Yes" : "No"}</span>
                    </div>
                    {result.languageAnalysis.dialectsDetected.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Dialects:</span>{" "}
                        <span className="font-bold">{result.languageAnalysis.dialectsDetected.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detected Terms */}
                {result.detectedTerms.length > 0 && (
                  <div className="bg-red-50 border-2 border-red-300 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="font-mono text-xs uppercase font-bold text-red-800">Detected Hate Terms ({result.detectedTerms.length})</span>
                    </div>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                      {result.detectedTerms.map((term, idx) => (
                        <div key={idx} className="bg-white p-2 border border-red-200 text-xs">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-red-900">"{term.term}"</span>
                            <span className={cn(
                              "px-1.5 py-0.5 font-mono uppercase",
                              term.severity === 'critical' ? "bg-red-600 text-white" :
                              term.severity === 'high' ? "bg-orange-500 text-white" :
                              term.severity === 'medium' ? "bg-yellow-400 text-black" : "bg-gray-300"
                            )}>
                              {term.severity}
                            </span>
                          </div>
                          <div className="text-muted-foreground mt-1">
                            <span className="font-mono">[{term.language}]</span> {term.translation}
                          </div>
                          <div className="text-red-700 mt-1">Target: {term.targetCommunity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="font-mono font-bold uppercase border-b-2 border-border pb-2">Threshold Breakdown</h3>
                  
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
                        <div className="col-span-4 font-mono font-bold uppercase text-xs">{item.label}</div>
                        <div className="col-span-6">
                          <div className="h-2 w-full bg-gray-200 border border-border relative">
                            <div 
                              className="h-full bg-primary absolute top-0 left-0" 
                              style={{ width: `${metric.score * 10}%` }}
                            />
                          </div>
                        </div>
                        <div className="col-span-2 font-mono text-right font-bold">{metric.score}/10</div>
                        <div className="col-span-12 text-xs text-muted-foreground pl-4 border-l-2 border-border ml-1">
                          {metric.analysis}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white border-2 border-border p-4 mt-4">
                  <h4 className="font-mono font-bold uppercase text-xs mb-2 text-muted-foreground">Final Verdict</h4>
                  <p className="font-sans font-medium">{result.verdict}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hate Speech Lexicon Reference */}
        <div className="border-2 border-border">
          <button 
            onClick={() => setShowLexicon(!showLexicon)}
            className="w-full p-4 bg-secondary flex items-center justify-between hover:bg-secondary/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5" />
              <span className="font-mono font-bold uppercase">Kenya Hate Speech Lexicon Reference (NCIC)</span>
            </div>
            {showLexicon ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {showLexicon && (
            <div className="p-4 bg-white">
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedLanguage("all")}
                  className={cn(
                    "px-3 py-1 text-xs font-mono border-2 border-border transition-colors",
                    selectedLanguage === "all" ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
                  )}
                >
                  All Languages
                </button>
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={cn(
                      "px-3 py-1 text-xs font-mono border-2 border-border transition-colors",
                      selectedLanguage === lang ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="p-2 text-left font-mono uppercase text-xs border border-border">Term</th>
                      <th className="p-2 text-left font-mono uppercase text-xs border border-border">Translation</th>
                      <th className="p-2 text-left font-mono uppercase text-xs border border-border">Language</th>
                      <th className="p-2 text-left font-mono uppercase text-xs border border-border">Target</th>
                      <th className="p-2 text-left font-mono uppercase text-xs border border-border">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLexicon.map(([term, info]) => (
                      <tr key={term} className="hover:bg-secondary/30">
                        <td className="p-2 border border-border font-bold">{term}</td>
                        <td className="p-2 border border-border text-muted-foreground">{info.translation}</td>
                        <td className="p-2 border border-border">
                          <span className="px-2 py-0.5 bg-secondary text-xs font-mono">{info.language}</span>
                        </td>
                        <td className="p-2 border border-border text-xs">{info.target}</td>
                        <td className="p-2 border border-border">
                          <span className={cn(
                            "px-2 py-0.5 text-xs font-mono uppercase",
                            info.severity === 'critical' ? "bg-red-600 text-white" :
                            info.severity === 'high' ? "bg-orange-500 text-white" :
                            info.severity === 'medium' ? "bg-yellow-400 text-black" : "bg-green-300"
                          )}>
                            {info.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-xs text-muted-foreground font-mono">
                Source: National Cohesion and Integration Commission (NCIC) - Hatelex: A Lexicon of Hate Speech Terms in Kenya (2022)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
