import { invokeLLM } from "../_core/llm";

// Types for news analysis
export interface NewsArticle {
  title: string;
  content: string;
  source: string;
  url?: string;
  publishedAt: Date;
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  relatedFigures?: string[];
  relatedTopics?: string[];
}

export interface SentimentAnalysisResult {
  score: number; // 0-100
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keyPhrases: string[];
  relatedFigures: string[];
  hateSpeechRisk: 'Low' | 'Moderate' | 'High' | 'Critical';
}

// Analyze text sentiment using LLM
export async function analyzeTextSentiment(text: string, context?: string): Promise<SentimentAnalysisResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a political sentiment analysis expert specializing in Kenyan politics. 
Analyze the given text and return a JSON object with:
- score: sentiment score from 0 (very negative) to 100 (very positive)
- label: "positive", "negative", or "neutral"
- confidence: confidence level from 0 to 1
- keyPhrases: array of key phrases that influenced the sentiment
- relatedFigures: array of political figures mentioned (William Ruto, Raila Odinga, Kalonzo Musyoka, Rigathi Gachagua, etc.)
- hateSpeechRisk: "Low", "Moderate", "High", or "Critical" based on inflammatory language

Consider Kenyan political context, ethnic undertones, and coded language (Swahili, Sheng).`
        },
        {
          role: "user",
          content: `Analyze this text${context ? ` (Context: ${context})` : ''}:\n\n${text}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentiment_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: { type: "number", description: "Sentiment score 0-100" },
              label: { type: "string", enum: ["positive", "negative", "neutral"] },
              confidence: { type: "number", description: "Confidence 0-1" },
              keyPhrases: { 
                type: "array", 
                items: { type: "string" },
                description: "Key phrases affecting sentiment"
              },
              relatedFigures: { 
                type: "array", 
                items: { type: "string" },
                description: "Political figures mentioned"
              },
              hateSpeechRisk: { 
                type: "string", 
                enum: ["Low", "Moderate", "High", "Critical"],
                description: "Hate speech risk level"
              }
            },
            required: ["score", "label", "confidence", "keyPhrases", "relatedFigures", "hateSpeechRisk"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const result = JSON.parse(contentStr || '{}');
    return result as SentimentAnalysisResult;
  } catch (error) {
    console.error("[NewsService] Failed to analyze sentiment:", error);
    // Return default neutral sentiment on error
    return {
      score: 50,
      label: 'neutral',
      confidence: 0.5,
      keyPhrases: [],
      relatedFigures: [],
      hateSpeechRisk: 'Low'
    };
  }
}

// Analyze hate speech using LLM with ICC framework
export async function analyzeHateSpeechWithLLM(
  text: string, 
  speaker?: string, 
  context?: string
): Promise<{
  totalScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  contextScore: number;
  speakerScore: number;
  intentScore: number;
  contentScore: number;
  extentScore: number;
  likelihoodScore: number;
  detectedTerms: Array<{
    term: string;
    language: string;
    severity: string;
    translation: string;
  }>;
  verdict: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert in hate speech analysis using the ICC/Rabat Plan of Action 6-part threshold test.
Analyze the text for potential incitement to discrimination, hostility, or violence.

The 6 factors are:
1. Context: Social and political context (score 1-10)
2. Speaker: Status and influence of the speaker (score 1-10)
3. Intent: Intent to incite audience against a target group (score 1-10)
4. Content: Content and form of the speech (score 1-10)
5. Extent: Extent of dissemination (score 1-10)
6. Likelihood: Likelihood of harm, including imminence (score 1-10)

Pay special attention to:
- Swahili hate terms: madoadoa, mende, kwekwe, wakuja, chunga kura, watajua hawajui
- Sheng terms: hatupangwingwi, kama noma noma
- Kikuyu terms: kihii, uthamaki
- Kalenjin terms: kimurkeldet, otutu labotonik, ngetiik
- Dehumanizing language comparing people to animals or pests
- Calls for violence or ethnic cleansing

Return a JSON analysis.`
        },
        {
          role: "user",
          content: `Analyze this text for hate speech:
Text: "${text}"
${speaker ? `Speaker: ${speaker}` : ''}
${context ? `Context: ${context}` : ''}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "hate_speech_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              contextScore: { type: "number" },
              speakerScore: { type: "number" },
              intentScore: { type: "number" },
              contentScore: { type: "number" },
              extentScore: { type: "number" },
              likelihoodScore: { type: "number" },
              totalScore: { type: "number" },
              riskLevel: { type: "string", enum: ["Low", "Moderate", "High", "Critical"] },
              detectedTerms: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    term: { type: "string" },
                    language: { type: "string" },
                    severity: { type: "string" },
                    translation: { type: "string" }
                  },
                  required: ["term", "language", "severity", "translation"],
                  additionalProperties: false
                }
              },
              verdict: { type: "string" }
            },
            required: ["contextScore", "speakerScore", "intentScore", "contentScore", "extentScore", "likelihoodScore", "totalScore", "riskLevel", "detectedTerms", "verdict"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const result = JSON.parse(contentStr || '{}');
    return result;
  } catch (error) {
    console.error("[NewsService] Failed to analyze hate speech:", error);
    throw error;
  }
}

// Generate mock news data for demo purposes
export function generateMockNewsData(): NewsArticle[] {
  const kenyaNewsSources = [
    "Daily Nation",
    "The Standard",
    "Star Kenya",
    "Citizen Digital",
    "KTN News",
    "NTV Kenya"
  ];

  const headlines = [
    { title: "President Ruto announces new economic measures", sentiment: 55 },
    { title: "Opposition calls for dialogue on cost of living", sentiment: 40 },
    { title: "County governments receive development funds", sentiment: 65 },
    { title: "Political tensions rise ahead of by-elections", sentiment: 35 },
    { title: "Youth employment initiative launched in Nairobi", sentiment: 70 },
    { title: "Debate over constitutional amendments continues", sentiment: 45 },
    { title: "Infrastructure projects progress in Rift Valley", sentiment: 60 },
    { title: "Civil society groups raise governance concerns", sentiment: 38 },
  ];

  return headlines.map((item, index) => ({
    title: item.title,
    content: `Full article content for: ${item.title}. This is placeholder content for demonstration purposes.`,
    source: kenyaNewsSources[index % kenyaNewsSources.length],
    publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    sentiment: {
      score: item.sentiment,
      label: item.sentiment > 55 ? 'positive' : item.sentiment < 45 ? 'negative' : 'neutral'
    }
  }));
}
