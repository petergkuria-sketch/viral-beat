import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { trpc } from "@/lib/trpc";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type TickerSeverity = "breaking" | "normal";

interface TickerItem {
  id: string;
  severity: TickerSeverity;
  flag: string;
  country: string;
  headline: string;
  deltaLabel?: string;      // e.g. "▲ +6 pts" or "Monitor → Go-Market"
  deltaDir?: "up" | "down"; // colours the delta
  verdict?: string;         // current verdict label for normal items
  verdictKey?: "go-market" | "monitor" | "caution" | "no-go";
  source: string;
  timeAgo: string;
}

// ── Seed data (replaced by live feed once agent is wired) ─────────────────────

const SEED_ITEMS: TickerItem[] = [
  // Breaking items — these hijack the ticker
  {
    id: "b1", severity: "breaking",
    flag: "🇰🇪", country: "Kenya",
    headline: "S&P upgrades sovereign rating BB− → BB — fiscal consolidation cited",
    deltaLabel: "▲ +6 pts composite", deltaDir: "up",
    source: "S&P", timeAgo: "2 min ago",
  },
  {
    id: "b2", severity: "breaking",
    flag: "🇳🇬", country: "Nigeria",
    headline: "IMF approves $3.4B ECF facility — FX reform conditions met",
    deltaLabel: "▲ Caution → Monitor", deltaDir: "up",
    source: "IMF", timeAgo: "18 min ago",
  },
  // Normal items
  {
    id: "n1", severity: "normal",
    flag: "🇷🇼", country: "Rwanda",
    headline: "Kigali hosts inaugural Africa AI Summit — 40 nations represented",
    verdictKey: "go-market", verdict: "Go-Market",
    source: "RDB", timeAgo: "3w ago",
  },
  {
    id: "n2", severity: "normal",
    flag: "🇲🇦", country: "Morocco",
    headline: "Green hydrogen MOU signed with EU — €2.8B investment pipeline",
    verdictKey: "go-market", verdict: "Go-Market",
    source: "Morocco Energy Ministry", timeAgo: "2w ago",
  },
  {
    id: "n3", severity: "normal",
    flag: "🇿🇲", country: "Zambia",
    headline: "Copper production hits 830k tonnes — 10-year high under new mine expansions",
    verdictKey: "monitor", verdict: "Monitor",
    source: "Zambia Chamber of Mines", timeAgo: "3w ago",
  },
  {
    id: "n4", severity: "normal",
    flag: "🇨🇮", country: "Côte d'Ivoire",
    headline: "Abidjan port container terminal expansion complete — capacity +40%",
    verdictKey: "monitor", verdict: "Monitor",
    source: "Port Autonome d'Abidjan", timeAgo: "2w ago",
  },
  {
    id: "n5", severity: "normal",
    flag: "🇳🇦", country: "Namibia",
    headline: "TotalEnergies confirms $9B Orange Basin FID — first oil 2029",
    verdictKey: "monitor", verdict: "Monitor",
    source: "TotalEnergies", timeAgo: "2w ago",
  },
  {
    id: "n6", severity: "normal",
    flag: "🇬🇭", country: "Ghana",
    headline: "IMF ECF fourth review completed — $360M tranche released",
    verdictKey: "monitor", verdict: "Monitor",
    source: "IMF", timeAgo: "1w ago",
  },
  {
    id: "n7", severity: "normal",
    flag: "🇧🇼", country: "Botswana",
    headline: "Duma government's first budget — infrastructure and digital economy focus",
    verdictKey: "monitor", verdict: "Monitor",
    source: "Ministry of Finance", timeAgo: "1m ago",
  },
  {
    id: "n8", severity: "normal",
    flag: "🇸🇳", country: "Senegal",
    headline: "GTA LNG first cargo delivered — BP confirms production ramp",
    verdictKey: "monitor", verdict: "Monitor",
    source: "BP", timeAgo: "1m ago",
  },
];

// ── Verdict chip colours ──────────────────────────────────────────────────────

const VERDICT_CHIP: Record<string, string> = {
  "go-market": "bg-green-500/15 text-green-400 border border-green-500/30",
  "monitor":   "bg-lime-500/15 text-lime-400 border border-lime-500/30",
  "caution":   "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  "no-go":     "bg-red-500/15 text-red-400 border border-red-500/30",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function BreakingItem({ item }: { item: TickerItem }) {
  return (
    <span className="inline-flex items-center gap-2 mr-10 whitespace-nowrap">
      <span className="text-sm">{item.flag}</span>
      <span className="text-xs font-bold text-white">{item.country}</span>
      <span className="text-white/20 text-xs">·</span>
      <span className="text-xs text-white/75">{item.headline}</span>
      {item.deltaLabel && (
        <span className={`text-[11px] font-bold ${item.deltaDir === "up" ? "text-green-400" : "text-red-400"}`}>
          {item.deltaLabel}
        </span>
      )}
      <span className="text-[10px] text-white/30 border border-white/10 px-1.5 py-px rounded">
        {item.source}
      </span>
      <span className="text-[10px] text-red-400/60">{item.timeAgo}</span>
    </span>
  );
}

function NormalItem({ item }: { item: TickerItem }) {
  return (
    <span className="inline-flex items-center gap-1.5 mr-9 whitespace-nowrap">
      <span className="text-sm">{item.flag}</span>
      <span className="text-xs font-bold text-white">{item.country}</span>
      <span className="text-[11px] text-white/50">{item.headline}</span>
      {item.verdictKey && item.verdict && (
        <span className={`text-[9px] font-bold px-1.5 py-px rounded-full ${VERDICT_CHIP[item.verdictKey] ?? ""}`}>
          {item.verdict}
        </span>
      )}
      <span className="text-[10px] text-white/25">{item.source} · {item.timeAgo}</span>
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function IntelligenceTicker() {
  const { data: live } = trpc.scannerAgent.tickerList.useQuery(undefined, {
    refetchInterval: 60_000, // re-check every 60s
    staleTime: 30_000,
  });

  // Map DB rows → local TickerItem shape; fall back to seeds while DB is empty
  function mapLive(rows: typeof live): TickerItem[] {
    if (!rows || (rows.breaking.length === 0 && rows.normal.length === 0)) return SEED_ITEMS;
    const map = (r: (typeof rows.breaking)[number]): TickerItem => ({
      id: String(r.id),
      severity: r.severity as TickerSeverity,
      flag: r.countryFlag,
      country: r.countryName,
      headline: r.headline,
      deltaLabel: r.deltaLabel ?? undefined,
      deltaDir: (r.deltaDir as "up" | "down") ?? undefined,
      verdict: r.verdictLabel ?? undefined,
      verdictKey: (r.verdictKey as TickerItem["verdictKey"]) ?? undefined,
      source: r.source,
      timeAgo: timeAgo(r.createdAt),
    });
    return [...rows.breaking.map(map), ...rows.normal.map(map)];
  }

  const allItems    = mapLive(live);
  const breakingItems = allItems.filter(i => i.severity === "breaking");
  const normalItems   = allItems.filter(i => i.severity === "normal");
  const isBreaking    = breakingItems.length > 0;

  const [dismissed, setDismissed] = useState(false);
  // Pause on hover
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.animationPlayState = paused ? "paused" : "running";
  }, [paused]);

  if (dismissed) return null;

  // Duplicate items for seamless loop
  const breakingLoop = [...breakingItems, ...breakingItems];
  const normalLoop   = [...normalItems, ...normalItems];

  if (isBreaking) {
    return (
      <div
        className="flex items-center h-[30px] bg-black border-b border-red-500/30 overflow-hidden relative z-40 select-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* BREAKING badge */}
        <div className="flex items-center gap-1.5 h-full px-3 bg-red-600 shrink-0 relative z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[9px] font-black tracking-[2px] text-white">BREAKING</span>
          {/* fade edge */}
          <span className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-red-600 to-transparent pointer-events-none" />
        </div>

        {/* Scrolling content */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={trackRef}
            className="inline-flex"
            style={{ animation: "ticker-scroll 38s linear infinite" }}
          >
            {breakingLoop.map((item, i) => (
              <BreakingItem key={`${item.id}-${i}`} item={item} />
            ))}
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 px-2 h-full flex items-center text-white/30 hover:text-white transition-colors"
          aria-label="Dismiss breaking ticker"
        >
          <X className="w-3 h-3" />
        </button>

        <style>{`
          @keyframes ticker-scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    );
  }

  // Normal state
  return (
    <div
      className="flex items-center h-[28px] bg-white/[0.015] border-b border-cyan-500/10 overflow-hidden relative z-40 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* LIVE badge */}
      <div className="flex items-center gap-1.5 h-full px-3 bg-cyan-500/10 border-r border-cyan-500/15 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[8px] font-bold tracking-[2px] text-cyan-400">LIVE</span>
      </div>

      {/* Scrolling content */}
      <div className="flex-1 overflow-hidden pl-3">
        <div
          ref={trackRef}
          className="inline-flex items-center"
          style={{ animation: "ticker-scroll 55s linear infinite" }}
        >
          {normalLoop.map((item, i) => (
            <>
              <NormalItem key={`${item.id}-${i}`} item={item} />
              {i < normalLoop.length - 1 && (
                <span key={`sep-${i}`} className="text-white/10 mr-9 text-xs">◆</span>
              )}
            </>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
