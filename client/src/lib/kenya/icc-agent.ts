import { z } from "zod";

// ICC / Rabat Plan of Action 6-Part Threshold Test
export interface ICCHateSpeechAnalysis {
  context: {
    score: number; // 1-10
    analysis: string;
    description: "Social and political context";
  };
  speaker: {
    score: number; // 1-10
    analysis: string;
    description: "Status and influence of the speaker";
  };
  intent: {
    score: number; // 1-10
    analysis: string;
    description: "Intent to incite audience against a target group";
  };
  content: {
    score: number; // 1-10
    analysis: string;
    description: "Content and form of the speech";
  };
  extent: {
    score: number; // 1-10
    analysis: string;
    description: "Extent of dissemination";
  };
  likelihood: {
    score: number; // 1-10
    analysis: string;
    description: "Likelihood of harm, including imminence";
  };
  totalScore: number; // 6-60
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  verdict: string;
  detectedTerms: DetectedHateTerm[];
  languageAnalysis: LanguageAnalysis;
}

export interface DetectedHateTerm {
  term: string;
  translation: string;
  language: 'English' | 'Swahili' | 'Sheng' | 'Kikuyu' | 'Kalenjin' | 'Meru' | 'Luo';
  targetCommunity: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: string;
}

export interface LanguageAnalysis {
  primaryLanguage: string;
  containsCodeSwitching: boolean;
  dialectsDetected: string[];
}

// Comprehensive Kenya Hate Speech Lexicon based on NCIC Hatelex
export const KENYA_HATE_LEXICON: Record<string, {
  translation: string;
  language: DetectedHateTerm['language'];
  target: string;
  severity: DetectedHateTerm['severity'];
  context: string;
}> = {
  // English Terms
  "fumigation": {
    translation: "Mete violence on non-locals",
    language: "English",
    target: "Non-local communities",
    severity: "critical",
    context: "Call to violence against migrants"
  },
  "uncircumcised": {
    translation: "Derogatory term for Luo/Turkana",
    language: "English",
    target: "Luo, Turkana communities",
    severity: "high",
    context: "Cultural attack on communities"
  },
  "eliminate": {
    translation: "Kill members of opposing community",
    language: "English",
    target: "Political opponents",
    severity: "critical",
    context: "Direct call to violence"
  },
  
  // Swahili Terms
  "madoadoa": {
    translation: "Spots/stains - referring to non-locals",
    language: "Swahili",
    target: "Non-local communities",
    severity: "critical",
    context: "Dehumanizing term used to incite ethnic cleansing"
  },
  "mende": {
    translation: "Cockroach",
    language: "Swahili",
    target: "Political opponents",
    severity: "critical",
    context: "Dehumanizing term associated with genocide rhetoric"
  },
  "kwekwe": {
    translation: "Weeds",
    language: "Swahili",
    target: "Immigrant communities",
    severity: "high",
    context: "Implies strangers should be eliminated"
  },
  "wakuja": {
    translation: "Those who come/immigrants",
    language: "Swahili",
    target: "Immigrant communities",
    severity: "medium",
    context: "Othering language against settlers"
  },
  "wabara": {
    translation: "People from upcountry",
    language: "Swahili",
    target: "Upcountry communities at Coast",
    severity: "medium",
    context: "Regional discrimination"
  },
  "chunga kura": {
    translation: "Guard the vote",
    language: "Swahili",
    target: "Political opponents",
    severity: "high",
    context: "Rallying call that can incite election violence"
  },
  "watajua hawajui": {
    translation: "They will know they don't know",
    language: "Swahili",
    target: "Political opponents",
    severity: "high",
    context: "Veiled threat of retaliation"
  },
  "chinja kafir": {
    translation: "Kill the infidel",
    language: "Swahili",
    target: "Security agents, non-Muslims",
    severity: "critical",
    context: "Direct incitement to violence"
  },
  "kaffir": {
    translation: "Infidel/non-believer",
    language: "Swahili",
    target: "Non-Muslim communities",
    severity: "high",
    context: "Religious discrimination"
  },
  "watu wa kurusha mawe": {
    translation: "Stone throwers",
    language: "Swahili",
    target: "Luo community",
    severity: "medium",
    context: "Stereotyping a community as violent"
  },

  // Sheng Terms
  "hatupangwingwi": {
    translation: "No one can arrange/control us",
    language: "Sheng",
    target: "Kikuyu, Luo dynasties",
    severity: "medium",
    context: "Political defiance, can escalate tensions"
  },
  "kama noma noma": {
    translation: "If it's bad, it's bad",
    language: "Sheng",
    target: "Political opponents",
    severity: "high",
    context: "Implies willingness for violent confrontation"
  },
  "linda kura": {
    translation: "Protect the vote",
    language: "Sheng",
    target: "Political opponents",
    severity: "high",
    context: "Can incite election violence"
  },
  "operation linda kura": {
    translation: "Operation protect the vote",
    language: "Sheng",
    target: "Political opponents",
    severity: "high",
    context: "Organized election interference call"
  },

  // Kikuyu Terms
  "kihii": {
    translation: "Uncircumcised boy",
    language: "Kikuyu",
    target: "Luo, Turkana communities",
    severity: "high",
    context: "Demeaning term attacking manhood"
  },
  "uthamaki ni witu": {
    translation: "The kingdom is ours",
    language: "Kikuyu",
    target: "Non-Kikuyu communities",
    severity: "high",
    context: "Ethnic supremacist rhetoric"
  },
  "uthamaki": {
    translation: "Kingdom/rulership",
    language: "Kikuyu",
    target: "Non-Kikuyu communities",
    severity: "medium",
    context: "Implies Kikuyu entitlement to power"
  },

  // Kalenjin Terms
  "kimurkeldet": {
    translation: "Brown teeth",
    language: "Kalenjin",
    target: "Kikuyu community",
    severity: "medium",
    context: "Derogatory term implying poor hygiene"
  },
  "otutu labotonik": {
    translation: "Uproot the weed",
    language: "Kalenjin",
    target: "Non-Kalenjin communities",
    severity: "critical",
    context: "Call for ethnic cleansing"
  },
  "ngetiik": {
    translation: "Uncircumcised",
    language: "Kalenjin",
    target: "Luo community",
    severity: "high",
    context: "Demeaning cultural attack"
  },

  // Meru Terms
  "mwiji": {
    translation: "Uncircumcised man",
    language: "Meru",
    target: "Luo, Turkana communities",
    severity: "high",
    context: "Cultural attack on communities"
  },

  // Additional coded terms
  "42 vs 1": {
    translation: "42 tribes against one (Kikuyu)",
    language: "Sheng",
    target: "Kikuyu community",
    severity: "high",
    context: "Divisive ethnic rhetoric"
  },
  "kabila adui": {
    translation: "Enemy tribe",
    language: "Swahili",
    target: "Various ethnic groups",
    severity: "critical",
    context: "Direct ethnic targeting"
  },
  "wapinzani": {
    translation: "Opponents (used pejoratively)",
    language: "Swahili",
    target: "Political opponents",
    severity: "low",
    context: "Can escalate in charged contexts"
  }
};

// Additional patterns for detection
const VIOLENCE_PATTERNS = [
  /\b(kill|murder|slaughter|burn|destroy|eliminate|remove|cleanse)\b/gi,
  /\b(ua|chinja|angamiza|teketeza|ondoa)\b/gi, // Swahili violence words
  /\b(death to|die|must go|send back|go home)\b/gi
];

const DEHUMANIZATION_PATTERNS = [
  /\b(cockroach|vermin|pest|animal|dog|snake|rat)\b/gi,
  /\b(mende|panya|nyoka|mbwa)\b/gi // Swahili animal terms used derogatorily
];

export const analyzeTextWithICC = (
  text: string, 
  speakerInfo?: string, 
  contextInfo?: string
): ICCHateSpeechAnalysis => {
  const lowerText = text.toLowerCase();
  const detectedTerms: DetectedHateTerm[] = [];
  const dialectsDetected: string[] = [];
  
  // Scan for hate speech terms
  Object.entries(KENYA_HATE_LEXICON).forEach(([term, info]) => {
    if (lowerText.includes(term.toLowerCase())) {
      detectedTerms.push({
        term,
        translation: info.translation,
        language: info.language,
        targetCommunity: info.target,
        severity: info.severity,
        context: info.context
      });
      if (!dialectsDetected.includes(info.language)) {
        dialectsDetected.push(info.language);
      }
    }
  });

  // Check for violence patterns
  let violenceScore = 0;
  VIOLENCE_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      violenceScore += matches.length * 2;
    }
  });

  // Check for dehumanization patterns
  let dehumanizationScore = 0;
  DEHUMANIZATION_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      dehumanizationScore += matches.length * 3;
    }
  });

  // Determine primary language
  const swahiliIndicators = ['na', 'wa', 'ya', 'ni', 'kwa', 'la', 'za'];
  const swahiliCount = swahiliIndicators.filter(w => 
    lowerText.split(/\s+/).includes(w)
  ).length;
  
  const primaryLanguage = swahiliCount > 3 ? 'Swahili' : 
    dialectsDetected.length > 0 ? dialectsDetected[0] : 'English';

  // 1. Context Analysis
  let contextScore = 3;
  let contextAnalysis = "Routine political discourse.";
  if (contextInfo?.toLowerCase().includes("election") || contextInfo?.toLowerCase().includes("rally")) {
    contextScore += 3;
    contextAnalysis = "High-stakes political environment (election/rally).";
  }
  if (detectedTerms.some(t => t.severity === 'critical')) {
    contextScore += 3;
    contextAnalysis += " Contains historically charged terminology.";
  }
  if (lowerText.includes("2007") || lowerText.includes("post-election") || lowerText.includes("pev")) {
    contextScore += 2;
    contextAnalysis += " References 2007/08 post-election violence period.";
  }

  // 2. Speaker Analysis
  let speakerScore = 4;
  let speakerAnalysis = "Public figure or politician.";
  if (speakerInfo?.toLowerCase().includes("president") || speakerInfo?.toLowerCase().includes("ruto") || speakerInfo?.toLowerCase().includes("raila")) {
    speakerScore = 9;
    speakerAnalysis = "High-profile national leader with significant influence.";
  } else if (speakerInfo?.toLowerCase().includes("mp") || speakerInfo?.toLowerCase().includes("governor") || speakerInfo?.toLowerCase().includes("senator")) {
    speakerScore = 7;
    speakerAnalysis = "Regional leader with moderate influence.";
  } else if (speakerInfo?.toLowerCase().includes("influencer") || speakerInfo?.toLowerCase().includes("blogger")) {
    speakerScore = 6;
    speakerAnalysis = "Social media influencer with online reach.";
  }

  // 3. Intent Analysis
  let intentScore = 2 + Math.min(violenceScore, 6);
  let intentAnalysis = "Likely rhetorical.";
  if (violenceScore > 4) {
    intentScore = Math.min(9, intentScore);
    intentAnalysis = "Clear intent to incite hostility or violence.";
  } else if (detectedTerms.length > 0) {
    intentScore = Math.max(intentScore, 5);
    intentAnalysis = "Uses coded language that may incite ethnic tensions.";
  }

  // 4. Content Analysis
  let contentScore = 2 + Math.min(dehumanizationScore, 6);
  let contentAnalysis = "General criticism.";
  
  const criticalTerms = detectedTerms.filter(t => t.severity === 'critical');
  const highTerms = detectedTerms.filter(t => t.severity === 'high');
  
  if (criticalTerms.length > 0) {
    contentScore = 9;
    contentAnalysis = `Contains critical hate speech terms: ${criticalTerms.map(t => t.term).join(", ")}.`;
  } else if (highTerms.length > 0) {
    contentScore = 7;
    contentAnalysis = `Contains high-severity terms: ${highTerms.map(t => t.term).join(", ")}.`;
  } else if (detectedTerms.length > 0) {
    contentScore = 5;
    contentAnalysis = `Contains potentially inflammatory terms: ${detectedTerms.map(t => t.term).join(", ")}.`;
  }

  // 5. Extent Analysis
  let extentScore = 5;
  let extentAnalysis = "Public statement with potential wide reach.";
  if (contextInfo?.toLowerCase().includes("twitter") || contextInfo?.toLowerCase().includes("social media")) {
    extentScore = 7;
    extentAnalysis = "Social media post with viral potential.";
  }
  if (contextInfo?.toLowerCase().includes("rally") || contextInfo?.toLowerCase().includes("broadcast")) {
    extentScore = 8;
    extentAnalysis = "Mass media or public rally with immediate wide reach.";
  }

  // 6. Likelihood of Harm
  let likelihoodScore = 2;
  let likelihoodAnalysis = "Low immediate risk.";
  
  if (contextScore > 6 && intentScore > 6) {
    likelihoodScore = 8;
    likelihoodAnalysis = "High likelihood of triggering unrest due to context and intent.";
  } else if (criticalTerms.length > 0) {
    likelihoodScore = 7;
    likelihoodAnalysis = "Elevated risk due to use of historically charged terminology.";
  } else if (highTerms.length > 0 && contextScore > 5) {
    likelihoodScore = 6;
    likelihoodAnalysis = "Moderate risk in current political climate.";
  }

  const totalScore = contextScore + speakerScore + intentScore + contentScore + extentScore + likelihoodScore;
  
  let riskLevel: ICCHateSpeechAnalysis["riskLevel"] = "Low";
  if (totalScore > 45) riskLevel = "Critical";
  else if (totalScore > 35) riskLevel = "High";
  else if (totalScore > 25) riskLevel = "Moderate";

  const languageAnalysis: LanguageAnalysis = {
    primaryLanguage,
    containsCodeSwitching: dialectsDetected.length > 1,
    dialectsDetected
  };

  return {
    context: { score: contextScore, analysis: contextAnalysis, description: "Social and political context" },
    speaker: { score: speakerScore, analysis: speakerAnalysis, description: "Status and influence of the speaker" },
    intent: { score: intentScore, analysis: intentAnalysis, description: "Intent to incite audience against a target group" },
    content: { score: contentScore, analysis: contentAnalysis, description: "Content and form of the speech" },
    extent: { score: extentScore, analysis: extentAnalysis, description: "Extent of dissemination" },
    likelihood: { score: likelihoodScore, analysis: likelihoodAnalysis, description: "Likelihood of harm, including imminence" },
    totalScore,
    riskLevel,
    verdict: `The speech registers a ${riskLevel} risk level (${totalScore}/60) on the ICC/Rabat threshold. ${likelihoodAnalysis}`,
    detectedTerms,
    languageAnalysis
  };
};

// Export lexicon for reference display
export const getHateLexiconByLanguage = (language?: string) => {
  if (!language) return KENYA_HATE_LEXICON;
  
  return Object.fromEntries(
    Object.entries(KENYA_HATE_LEXICON).filter(([_, info]) => 
      info.language.toLowerCase() === language.toLowerCase()
    )
  );
};

export const getAllLanguages = () => {
  const languages = new Set(Object.values(KENYA_HATE_LEXICON).map(info => info.language));
  return Array.from(languages);
};
