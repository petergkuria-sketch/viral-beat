import type { AIUsage, ProviderName } from "../types";

// USD per 1,000,000 tokens. Matched by model-id prefix (date suffixes ignored).
// Update here when prices change — single source for cost computation.
interface Price { in: number; out: number }

const PRICES: Array<{ match: RegExp; price: Price }> = [
  // Anthropic
  { match: /^claude-fable-5/i,    price: { in: 10,   out: 50 } },
  { match: /^claude-mythos-5/i,   price: { in: 10,   out: 50 } },
  { match: /^claude-opus-4/i,     price: { in: 5,    out: 25 } },
  { match: /^claude-sonnet-4/i,   price: { in: 3,    out: 15 } },
  { match: /^claude-haiku-4/i,    price: { in: 1,    out: 5  } },
  { match: /^claude-3-5-haiku/i,  price: { in: 0.8,  out: 4  } },
  { match: /^claude-3-5-sonnet/i, price: { in: 3,    out: 15 } },
  // OpenAI
  { match: /^gpt-4o-mini/i,       price: { in: 0.15, out: 0.6 } },
  { match: /^gpt-4o/i,            price: { in: 2.5,  out: 10 } },
  { match: /^gpt-4\.1-mini/i,     price: { in: 0.4,  out: 1.6 } },
  { match: /^gpt-4\.1/i,          price: { in: 2,    out: 8  } },
  { match: /^o3-mini/i,           price: { in: 1.1,  out: 4.4 } },
  { match: /^o3/i,                price: { in: 2,    out: 8  } },
  // Moonshot (Kimi) — international, USD/1M. Verify against current Moonshot pricing.
  { match: /^kimi-k2/i,           price: { in: 0.6,  out: 2.5 } },
  { match: /^kimi/i,              price: { in: 0.6,  out: 2.5 } },
  { match: /^moonshot-v1-128k/i,  price: { in: 2.0,  out: 5.0 } },
  { match: /^moonshot-v1-32k/i,   price: { in: 0.8,  out: 2.4 } },
  { match: /^moonshot-v1-8k/i,    price: { in: 0.2,  out: 2.0 } },
  { match: /^moonshot/i,          price: { in: 0.2,  out: 2.0 } },
];

/** Computes USD cost for a completed call. Unknown models cost 0 (logged anyway). */
export function computeCost(_provider: ProviderName, model: string | undefined, usage: AIUsage): number {
  if (!model) return 0;
  const entry = PRICES.find(p => p.match.test(model));
  if (!entry) return 0;
  const cost = (usage.promptTokens / 1_000_000) * entry.price.in
             + (usage.completionTokens / 1_000_000) * entry.price.out;
  // round to 6 dp (matches the DB decimal scale)
  return Math.round(cost * 1e6) / 1e6;
}
