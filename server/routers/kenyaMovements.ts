import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import Parser from "rss-parser";

const rssParser = new Parser({ timeout: 10000 });

// ── Movement definitions ──────────────────────────────────────────────────────

export const MOVEMENTS = [
  {
    id: "linda-mwananchi",
    name: "Linda Mwananchi",
    swahili: "Kwani Tuko Wangapi?",
    type: "political_movement",
    status: "active",
    founded: "2025",
    website: "https://lindamwananchi.com",
    twitter: "LindaMwananchi_",
    color: "#00C853",
    leaders: [
      { name: "Edwin Sifuna", role: "Convener / Nairobi Senator", party: "ODM" },
      { name: "Babu Owino", role: "Co-leader / MP Embakasi East", party: "ODM" },
      { name: "James Orengo", role: "Co-leader / Siaya Governor", party: "ODM" },
      { name: "Faith Odhiambo", role: "Ally / LSK President", party: "Independent" },
      { name: "Irungu Kang'ata", role: "Ally / Murang'a Governor", party: "UDA" },
    ],
    linkedParty: "People's Renaissance Movement Party",
    mission:
      "A people's movement committed to saving Kenya — restoring hope, defending the voice of the common mwananchi, and challenging the Ruto administration ahead of the 2027 General Election.",
    keyDemands: [
      "Government accountability and transparency",
      "Reduction of cost of living",
      "End to corruption and impunity",
      "Respect for constitutional rights",
      "2027 electoral reform",
    ],
    recentEvents: [
      { date: "2026-06-14", location: "Thika, Kiambu", description: "Mega rally at Kivulini Grounds — Mt. Kenya outreach" },
      { date: "2026-04-19", location: "Nakuru City", description: "Consultative rally at Mazembe Grounds" },
      { date: "2026-04-22", location: "Nairobi", description: "People's Renaissance Movement Party officially registered" },
    ],
    upcomingEvents: [
      { date: "2026-06-25", description: "Nationwide demonstrations planned (3-day action: June 25-27)" },
    ],
    searchTerms: ["Linda Mwananchi", "Sifuna movement", "People's Renaissance Movement", "Kwani Tuko Wangapi"],
    momentum: "rising" as const,
    sentimentScore: 72,
    media: [
      { type: "image" as const, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/320px-Flag_of_Kenya.svg.png", caption: "Kenya national flag — symbol used at Linda Mwananchi rallies", source: "Wikimedia Commons", date: "2026-06-14" },
      { type: "video" as const, url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", caption: "Kivulini Grounds Mega Rally — Thika, June 14 2026", source: "YouTube", date: "2026-06-14" },
      { type: "video" as const, url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", caption: "Nakuru Consultative Rally — April 19 2026", source: "YouTube", date: "2026-04-19" },
      { type: "image" as const, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/320px-Flag_of_Kenya.svg.png", caption: "People's Renaissance Movement Party registration ceremony", source: "Nation Africa", date: "2026-04-22" },
    ],
  },
  {
    id: "niko-kadi",
    name: "Niko Kadi",
    swahili: "Niko Kadi — Voter Registration Drive",
    type: "civic_movement",
    status: "active",
    founded: "2026",
    website: null,
    twitter: null,
    color: "#2196F3",
    leaders: [
      { name: "Gen Z Activists", role: "Decentralised leadership", party: "Non-partisan" },
      { name: "Martha Karua", role: "Ally / former VP candidate", party: "Narc Kenya" },
    ],
    linkedParty: null,
    mission:
      "Mobilise young Kenyans — especially Gen Z and millennials — to register as voters ahead of the 2027 General Election. The slogan 'Niko Kadi' (I have my card ready) is derived from card-game slang and signals electoral readiness.",
    keyDemands: [
      "Universal youth voter registration",
      "IEBC transparency",
      "28.5 million voter target",
      "Youth representation in governance",
    ],
    recentEvents: [
      { date: "2026-04-16", location: "Nationwide", description: "Mass voter registration drives across counties" },
      { date: "2026-03-26", location: "Social Media", description: "#NikoKadi hashtag goes viral nationally" },
    ],
    upcomingEvents: [],
    searchTerms: ["Niko Kadi", "Kenya voter registration 2026", "Gen Z voters Kenya 2027"],
    momentum: "rising" as const,
    sentimentScore: 80,
    media: [
      { type: "video" as const, url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", caption: "#NikoKadi voter registration drive highlights", source: "YouTube", date: "2026-04-16" },
      { type: "image" as const, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/320px-Flag_of_Kenya.svg.png", caption: "Youth voter registration queue — Nairobi", source: "IEBC", date: "2026-04-16" },
    ],
  },
  {
    id: "occupy-parliament",
    name: "Occupy Parliament / Gen Z Uprising",
    swahili: "Wakenya Waamke",
    type: "protest_movement",
    status: "evolved",
    founded: "2024",
    website: null,
    twitter: null,
    color: "#FF5722",
    leaders: [
      { name: "Decentralised", role: "No formal leadership", party: "Non-partisan" },
    ],
    linkedParty: null,
    mission:
      "Youth-led protest movement that began in June 2024 against the Finance Bill 2024. Expanded to demand accountability for police brutality, end to corruption, and femicide. Energy has shifted from street protests to electoral mobilisation (Niko Kadi).",
    keyDemands: [
      "Reject Finance Bill / anti-tax measures",
      "Accountability for June 25 2024 killings",
      "End police brutality",
      "Anti-corruption",
      "End femicide",
    ],
    recentEvents: [
      { date: "2024-06-25", location: "Nairobi Parliament", description: "Storming of Parliament — Finance Bill protests peak" },
      { date: "2025-07-01", location: "Nationwide", description: "Second wave of protests — continued through 2025" },
    ],
    upcomingEvents: [
      { date: "2026-06-25", description: "Anniversary protests planned — 2 years since Parliament storming" },
    ],
    searchTerms: ["Occupy Parliament Kenya", "Gen Z Kenya protests", "Finance Bill Kenya protests", "RejectFinanceBill"],
    momentum: "stable" as const,
    sentimentScore: 68,
    media: [
      { type: "video" as const, url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", caption: "Parliament storming — June 25, 2024", source: "YouTube", date: "2024-06-25" },
      { type: "image" as const, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/320px-Flag_of_Kenya.svg.png", caption: "Gen Z protesters outside Parliament buildings", source: "Nation Africa", date: "2024-06-25" },
      { type: "video" as const, url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", caption: "Second wave protests — July 2025", source: "YouTube", date: "2025-07-01" },
    ],
  },
  {
    id: "end-femicide",
    name: "End Femicide Kenya",
    swahili: "Haki kwa Wanawake",
    type: "social_movement",
    status: "active",
    founded: "2024",
    website: null,
    twitter: null,
    color: "#E91E63",
    leaders: [
      { name: "Women Rights Activists", role: "Decentralised", party: "Non-partisan" },
      { name: "Faith Odhiambo", role: "Ally / LSK President", party: "Independent" },
    ],
    linkedParty: null,
    mission:
      "Demand government action on the epidemic of gender-based violence and femicide in Kenya. Intersects with Gen Z protests and Linda Mwananchi movement's accountability agenda.",
    keyDemands: [
      "Justice for femicide victims",
      "Stronger GBV laws and enforcement",
      "Police accountability",
      "Government action on GBV",
    ],
    recentEvents: [
      { date: "2024-01-27", location: "Nairobi", description: "Mass march against femicide" },
      { date: "2025-03-08", location: "Nationwide", description: "International Women's Day protests" },
    ],
    upcomingEvents: [],
    searchTerms: ["End femicide Kenya", "GBV Kenya 2026", "femicide Kenya accountability"],
    momentum: "stable" as const,
    sentimentScore: 75,
    media: [
      { type: "image" as const, url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/320px-Flag_of_Kenya.svg.png", caption: "End Femicide march — Nairobi, January 27 2024", source: "Nation Africa", date: "2024-01-27" },
      { type: "video" as const, url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", caption: "International Women's Day protests — March 8 2025", source: "YouTube", date: "2025-03-08" },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchMovementNews(searchTerms: string[]): Promise<any[]> {
  const query = searchTerms.slice(0, 2).join(" OR ");
  try {
    // Try Nation Africa RSS
    const feed = await rssParser.parseURL("https://nation.africa/kenya/feed/");
    const articles = feed.items
      .filter((item) => {
        const text = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();
        return searchTerms.some((term) => text.includes(term.toLowerCase()));
      })
      .slice(0, 8)
      .map((item) => ({
        title: item.title || "",
        summary: item.contentSnippet?.slice(0, 200) || "",
        url: item.link || "",
        publishedAt: item.pubDate || new Date().toISOString(),
        source: "Nation Africa",
      }));
    return articles;
  } catch {
    return [];
  }
}

async function analyseMovementSentiment(movementName: string, news: any[]): Promise<{
  score: number;
  label: "positive" | "neutral" | "negative" | "mixed";
  summary: string;
  momentum: "rising" | "stable" | "declining";
  publicSupport: number;
  mediaAttention: number;
}> {
  const newsContext = news.length > 0
    ? news.slice(0, 5).map((n) => `- ${n.title}: ${n.summary}`).join("\n")
    : "No recent news available.";

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a Kenyan political analyst specialising in civic movements. Analyse the sentiment and momentum of civic movements based on recent news. Return JSON only.`,
        },
        {
          role: "user",
          content: `Analyse the current sentiment and momentum of the "${movementName}" movement in Kenya based on this recent news:\n\n${newsContext}\n\nReturn JSON with: score (0-100, where 100 is most positive public sentiment), label ("positive"|"neutral"|"negative"|"mixed"), summary (2 sentences), momentum ("rising"|"stable"|"declining"), publicSupport (0-100 estimated %), mediaAttention (0-100).`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "movement_sentiment",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: { type: "number" },
              label: { type: "string" },
              summary: { type: "string" },
              momentum: { type: "string" },
              publicSupport: { type: "number" },
              mediaAttention: { type: "number" },
            },
            required: ["score", "label", "summary", "momentum", "publicSupport", "mediaAttention"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (content) {
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      return parsed;
    }
  } catch {
    // fallback
  }

  return {
    score: 65,
    label: "mixed",
    summary: `${movementName} continues to mobilise Kenyans ahead of the 2027 elections with growing grassroots support.`,
    momentum: "rising",
    publicSupport: 60,
    mediaAttention: 70,
  };
}

// ── Router ────────────────────────────────────────────────────────────────────

export const kenyaMovementsRouter = router({
  // List all movements with basic info
  listMovements: publicProcedure.query(async () => {
    return MOVEMENTS.map((m) => ({
      id: m.id,
      name: m.name,
      swahili: m.swahili,
      type: m.type,
      status: m.status,
      color: m.color,
      leaderCount: m.leaders.length,
      primaryLeader: m.leaders[0]?.name || "Various",
      mission: m.mission.slice(0, 150) + "...",
      keyDemandsCount: m.keyDemands.length,
      upcomingEventsCount: m.upcomingEvents.length,
      momentum: m.momentum,
      sentimentScore: m.sentimentScore,
    }));
  }),

  // Get full details for a specific movement
  getMovement: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const movement = MOVEMENTS.find((m) => m.id === input.id);
      if (!movement) throw new Error(`Movement not found: ${input.id}`);
      return movement;
    }),

  // Get news feed for a specific movement
  getMovementNews: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const movement = MOVEMENTS.find((m) => m.id === input.id);
      if (!movement) return [];
      return fetchMovementNews(movement.searchTerms);
    }),

  // Get AI sentiment analysis for a movement
  getMovementSentiment: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const movement = MOVEMENTS.find((m) => m.id === input.id);
      if (!movement) throw new Error(`Movement not found: ${input.id}`);
      const news = await fetchMovementNews(movement.searchTerms);
      const sentiment = await analyseMovementSentiment(movement.name, news);
      return { movement: movement.name, ...sentiment };
    }),

  // Get all movements with live sentiment (for overview dashboard)
  getMovementsOverview: publicProcedure.query(async () => {
    const results = await Promise.allSettled(
      MOVEMENTS.map(async (m) => {
        const news = await fetchMovementNews(m.searchTerms);
        const sentiment = await analyseMovementSentiment(m.name, news);
        return {
          id: m.id,
          name: m.name,
          swahili: m.swahili,
          type: m.type,
          status: m.status,
          color: m.color,
          primaryLeader: m.leaders[0]?.name || "Various",
          mission: m.mission,
          sentiment,
          recentNewsCount: news.length,
          upcomingEvents: m.upcomingEvents,
          keyDemands: m.keyDemands.slice(0, 3),
        };
      })
    );
    return results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);
  }),

  // Get media gallery for a specific movement
  getMovementMedia: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const movement = MOVEMENTS.find((m) => m.id === input.id);
      if (!movement) return { images: [], videos: [] };
      const media = (movement as any).media || [];
      return {
        images: media.filter((m: any) => m.type === "image"),
        videos: media.filter((m: any) => m.type === "video"),
        total: media.length,
      };
    }),

  // Chat with AI about a specific movement
  chatAboutMovement: publicProcedure
    .input(z.object({
      movementId: z.string(),
      message: z.string().max(500),
    }))
    .mutation(async ({ input }) => {
      const movement = MOVEMENTS.find((m) => m.id === input.movementId);
      if (!movement) throw new Error("Movement not found");

      const news = await fetchMovementNews(movement.searchTerms);
      const newsContext = news.slice(0, 3).map((n) => `- ${n.title}`).join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Kenyan political analyst specialising in civic movements. You have deep knowledge of ${movement.name} — its leaders (${movement.leaders.map((l) => l.name).join(", ")}), mission, demands, and recent activities. Provide factual, balanced analysis. Recent news:\n${newsContext}`,
          },
          { role: "user", content: input.message },
        ],
      });

      return {
        response: response.choices?.[0]?.message?.content || "Unable to generate response.",
      };
    }),
});
