/**
 * Divisive Content Detection System
 * Analyzes news articles and comments for divisive, inflammatory, and polarizing content
 */

export interface DivisiveAnalysis {
  divisiveScore: number; // 0-100
  riskLevel: "critical" | "high" | "medium" | "low";
  detectedPatterns: DetectedPattern[];
  targetedGroups: string[];
  inflammatoryTerms: string[];
  polarizationIndicators: PolarizationIndicator[];
  recommendations: string[];
}

export interface DetectedPattern {
  pattern: string;
  category: "ethnic" | "political" | "religious" | "economic" | "regional";
  severity: "critical" | "high" | "medium" | "low";
  context: string;
  count: number;
}

export interface PolarizationIndicator {
  type: "us_vs_them" | "dehumanization" | "conspiracy" | "call_to_action" | "historical_grievance";
  description: string;
  severity: number; // 1-10
}

// Divisive language patterns specific to Kenya
const DIVISIVE_PATTERNS = {
  ethnic: {
    patterns: [
      /\b(kikuyu|kalenjin|luo|luhya|kamba|meru|kisii|mijikenda)\s+(must|should|will|cannot)\b/gi,
      /\b(our people|their people|those people|these people)\b/gi,
      /\b(tribal|tribalism|tribe|kabila)\b/gi,
      /\b(mt\.?\s*kenya|rift valley|nyanza|western|coast)\s+(region|people|community)\b/gi,
    ],
    weight: 3,
  },
  political: {
    patterns: [
      /\b(kenya kwanza|azimio|jubilee|odm|uda)\s+(thieves?|corrupt|criminals?)\b/gi,
      /\b(must go|step down|resign|impeach)\b/gi,
      /\b(revolution|uprising|resist|fight back)\b/gi,
      /\b(sellout|traitor|betrayer|puppet)\b/gi,
      /\b(deep state|system|establishment)\b/gi,
    ],
    weight: 2.5,
  },
  economic: {
    patterns: [
      /\b(rich|poor|elite|common man|hustler|dynasty)\b/gi,
      /\b(stealing|looting|corruption|theft)\b/gi,
      /\b(tax|finance bill|cost of living|unga|fuel)\b/gi,
      /\b(unemployment|jobless|youth|opportunities)\b/gi,
    ],
    weight: 2,
  },
  regional: {
    patterns: [
      /\b(marginalized|neglected|forgotten|abandoned)\s+(region|area|county|community)\b/gi,
      /\b(development|resources|allocation|share)\b/gi,
      /\b(settlers?|migrants?|outsiders?|foreigners?)\b/gi,
      /\b(ancestral|historical|land rights?)\b/gi,
    ],
    weight: 2.5,
  },
  religious: {
    patterns: [
      /\b(christian|muslim|hindu|atheist)\s+(nation|country|values)\b/gi,
      /\b(sharia|church|mosque|temple)\s+(state|government|politics)\b/gi,
    ],
    weight: 2,
  },
};

// Inflammatory terms that escalate tensions
const INFLAMMATORY_TERMS: Record<string, { severity: number; context: string }> = {
  "must go": { severity: 7, context: "Call for removal of political figures" },
  "revolution": { severity: 8, context: "Call for radical change" },
  "uprising": { severity: 9, context: "Call for civil unrest" },
  "fight back": { severity: 7, context: "Encouragement of resistance" },
  "take to streets": { severity: 8, context: "Call for protests" },
  "enough is enough": { severity: 6, context: "Expression of frustration" },
  "blood": { severity: 9, context: "Reference to violence" },
  "war": { severity: 9, context: "Conflict language" },
  "destroy": { severity: 8, context: "Violent intent" },
  "eliminate": { severity: 9, context: "Call for removal/violence" },
  "thieves": { severity: 6, context: "Accusation of corruption" },
  "criminals": { severity: 6, context: "Criminalization of opponents" },
  "traitors": { severity: 7, context: "Accusation of betrayal" },
  "enemies": { severity: 8, context: "Dehumanization" },
  "parasites": { severity: 8, context: "Dehumanization" },
  "vermin": { severity: 9, context: "Severe dehumanization" },
  "cockroaches": { severity: 10, context: "Genocide-linked language" },
  "snakes": { severity: 7, context: "Dehumanization" },
};

// Polarization indicators
const POLARIZATION_PATTERNS: Record<string, PolarizationIndicator> = {
  us_vs_them: {
    type: "us_vs_them",
    description: "Creates division between groups",
    severity: 7,
  },
  dehumanization: {
    type: "dehumanization",
    description: "Reduces opponents to less than human",
    severity: 9,
  },
  conspiracy: {
    type: "conspiracy",
    description: "Promotes unfounded conspiracy theories",
    severity: 6,
  },
  call_to_action: {
    type: "call_to_action",
    description: "Encourages aggressive action",
    severity: 8,
  },
  historical_grievance: {
    type: "historical_grievance",
    description: "Invokes past conflicts to inflame current tensions",
    severity: 7,
  },
};

// Kenyan ethnic groups and regions for targeting detection
const KENYAN_GROUPS = [
  "Kikuyu", "Kalenjin", "Luo", "Luhya", "Kamba", "Meru", "Kisii", "Mijikenda",
  "Maasai", "Turkana", "Somali", "Pokot", "Samburu", "Taita", "Embu",
  "Mt. Kenya", "Rift Valley", "Nyanza", "Western", "Coast", "North Eastern",
  "Nairobi", "Central", "Eastern",
];

/**
 * Analyze text for divisive content
 */
export function analyzeDivisiveContent(text: string): DivisiveAnalysis {
  const lowerText = text.toLowerCase();
  const detectedPatterns: DetectedPattern[] = [];
  const targetedGroups: string[] = [];
  const inflammatoryTerms: string[] = [];
  const polarizationIndicators: PolarizationIndicator[] = [];
  
  let totalScore = 0;
  let patternCount = 0;

  // Check divisive patterns
  Object.entries(DIVISIVE_PATTERNS).forEach(([category, config]) => {
    config.patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          detectedPatterns.push({
            pattern: match,
            category: category as DetectedPattern["category"],
            severity: config.weight >= 2.5 ? "high" : "medium",
            context: `Detected ${category} divisive language`,
            count: 1,
          });
          totalScore += config.weight * 5;
          patternCount++;
        });
      }
    });
  });

  // Check inflammatory terms
  Object.entries(INFLAMMATORY_TERMS).forEach(([term, info]) => {
    if (lowerText.includes(term.toLowerCase())) {
      inflammatoryTerms.push(term);
      totalScore += info.severity * 2;
      patternCount++;
    }
  });

  // Check for targeted groups
  KENYAN_GROUPS.forEach(group => {
    const groupLower = group.toLowerCase();
    if (lowerText.includes(groupLower)) {
      // Check if group is mentioned in negative context
      const negativeContextPatterns = [
        new RegExp(`${groupLower}\\s+(are|is|must|should|will|cannot|never)`, 'i'),
        new RegExp(`(hate|against|attack|blame|accuse)\\s+.*${groupLower}`, 'i'),
        new RegExp(`${groupLower}\\s+.*?(problem|issue|threat|enemy)`, 'i'),
      ];
      
      for (const pattern of negativeContextPatterns) {
        if (pattern.test(lowerText)) {
          if (!targetedGroups.includes(group)) {
            targetedGroups.push(group);
            totalScore += 10;
          }
          break;
        }
      }
    }
  });

  // Check polarization indicators
  // Us vs Them
  if (/\b(we|us|our)\b.*\b(they|them|their)\b/i.test(text) || 
      /\b(our people|their people|those people)\b/i.test(text)) {
    polarizationIndicators.push(POLARIZATION_PATTERNS.us_vs_them);
    totalScore += 15;
  }

  // Dehumanization
  if (/\b(cockroach|vermin|pest|animal|dog|snake|rat|parasite)\b/i.test(text)) {
    polarizationIndicators.push(POLARIZATION_PATTERNS.dehumanization);
    totalScore += 25;
  }

  // Conspiracy
  if (/\b(deep state|illuminati|secret|plot|scheme|rigged|stolen)\b/i.test(text)) {
    polarizationIndicators.push(POLARIZATION_PATTERNS.conspiracy);
    totalScore += 10;
  }

  // Call to action
  if (/\b(rise up|take action|fight|resist|protest|strike|boycott)\b/i.test(text)) {
    polarizationIndicators.push(POLARIZATION_PATTERNS.call_to_action);
    totalScore += 15;
  }

  // Historical grievance
  if (/\b(2007|post-election|pev|violence|massacre|genocide|injustice)\b/i.test(text)) {
    polarizationIndicators.push(POLARIZATION_PATTERNS.historical_grievance);
    totalScore += 15;
  }

  // Normalize score to 0-100
  const divisiveScore = Math.min(100, Math.round(totalScore));

  // Determine risk level
  let riskLevel: DivisiveAnalysis["riskLevel"];
  if (divisiveScore >= 80) {
    riskLevel = "critical";
  } else if (divisiveScore >= 60) {
    riskLevel = "high";
  } else if (divisiveScore >= 40) {
    riskLevel = "medium";
  } else {
    riskLevel = "low";
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (riskLevel === "critical") {
    recommendations.push("Immediate review required - content may incite violence");
    recommendations.push("Consider flagging for NCIC review");
    recommendations.push("Monitor engagement closely for escalation");
  } else if (riskLevel === "high") {
    recommendations.push("Content requires editorial review");
    recommendations.push("Monitor comment section for hate speech");
    recommendations.push("Consider adding context or fact-check labels");
  } else if (riskLevel === "medium") {
    recommendations.push("Monitor for escalation in comments");
    recommendations.push("Consider pre-moderation of comments");
  }

  if (targetedGroups.length > 0) {
    recommendations.push(`Alert: ${targetedGroups.join(", ")} communities may be targeted`);
  }

  return {
    divisiveScore,
    riskLevel,
    detectedPatterns,
    targetedGroups,
    inflammatoryTerms,
    polarizationIndicators,
    recommendations,
  };
}

/**
 * Calculate comment section divisiveness
 */
export function analyzeCommentDivisiveness(comments: string[]): {
  overallScore: number;
  hateSpeechCount: number;
  divisiveCount: number;
  neutralCount: number;
  positiveCount: number;
} {
  let hateSpeechCount = 0;
  let divisiveCount = 0;
  let neutralCount = 0;
  let positiveCount = 0;
  let totalScore = 0;

  comments.forEach(comment => {
    const analysis = analyzeDivisiveContent(comment);
    totalScore += analysis.divisiveScore;

    if (analysis.riskLevel === "critical") {
      hateSpeechCount++;
    } else if (analysis.riskLevel === "high" || analysis.riskLevel === "medium") {
      divisiveCount++;
    } else if (analysis.divisiveScore < 20) {
      // Check for positive sentiment
      if (/\b(peace|unity|together|love|support|agree|good|great|thank)\b/i.test(comment)) {
        positiveCount++;
      } else {
        neutralCount++;
      }
    } else {
      neutralCount++;
    }
  });

  return {
    overallScore: comments.length > 0 ? Math.round(totalScore / comments.length) : 0,
    hateSpeechCount,
    divisiveCount,
    neutralCount,
    positiveCount,
  };
}

/**
 * Rank articles by divisiveness
 */
export function rankByDivisiveness<T extends { divisiveScore: number }>(
  articles: T[]
): T[] {
  return [...articles].sort((a, b) => b.divisiveScore - a.divisiveScore);
}

/**
 * Get trending divisive topics from text corpus
 */
export function extractDivisiveTopics(texts: string[]): { topic: string; count: number; severity: number }[] {
  const topicCounts: Record<string, { count: number; severity: number }> = {};

  const topicPatterns = [
    { pattern: /finance bill/gi, topic: "Finance Bill", severity: 8 },
    { pattern: /tax|taxes/gi, topic: "Taxation", severity: 7 },
    { pattern: /land\s+(dispute|issue|rights?)/gi, topic: "Land Issues", severity: 9 },
    { pattern: /impeachment?/gi, topic: "Impeachment", severity: 8 },
    { pattern: /corruption/gi, topic: "Corruption", severity: 7 },
    { pattern: /tribal|tribalism/gi, topic: "Tribalism", severity: 9 },
    { pattern: /election|voting|ballot/gi, topic: "Elections", severity: 8 },
    { pattern: /protest|demonstration/gi, topic: "Protests", severity: 7 },
    { pattern: /unemployment|jobless/gi, topic: "Unemployment", severity: 6 },
    { pattern: /cost of living|unga|fuel/gi, topic: "Cost of Living", severity: 7 },
  ];

  texts.forEach(text => {
    topicPatterns.forEach(({ pattern, topic, severity }) => {
      const matches = text.match(pattern);
      if (matches) {
        if (!topicCounts[topic]) {
          topicCounts[topic] = { count: 0, severity };
        }
        topicCounts[topic].count += matches.length;
      }
    });
  });

  return Object.entries(topicCounts)
    .map(([topic, data]) => ({ topic, ...data }))
    .sort((a, b) => b.count - a.count);
}
