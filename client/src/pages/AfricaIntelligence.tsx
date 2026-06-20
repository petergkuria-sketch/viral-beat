import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe, MapPin, TrendingUp, Shield, Users, Newspaper,
  AlertTriangle, CheckCircle, ChevronRight, RefreshCw,
} from "lucide-react";
import { ShareBriefButton } from "@/components/ShareBriefButton";
import { AFRICAN_COUNTRIES, AFRICAN_REGIONS, getCountriesByRegion } from "../../../shared/africanCountries";

const RISK_COLOR: Record<string, string> = {
  low:      "bg-green-500/20 text-green-400 border-green-500/30",
  medium:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high:     "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const SENTIMENT_COLOR = (score: number) =>
  score >= 60 ? "text-green-400" : score >= 40 ? "text-yellow-400" : "text-red-400";

// ── Hub page (no country selected) ───────────────────────────────────────────

function AfricaHub() {
  const [, setLocation] = useLocation();
  const { data: overview } = trpc.africa.getContinentOverview.useQuery();

  const sentimentMap = new Map(
    (overview?.sentiments || []).map(s => [s.countryCode, s])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="w-6 h-6 text-cyan-400" />
          Africa Intelligence
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Political intelligence, civic movements, and sentiment analysis for all 55 African nations.
        </p>
      </div>

      {AFRICAN_REGIONS.map(region => (
        <div key={region}>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {region}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {getCountriesByRegion(region).map(c => {
              const s = sentimentMap.get(c.code);
              return (
                <button
                  key={c.code}
                  onClick={() => setLocation(`/africa/${c.code}`)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#0d1e36] border border-[#1e3a5f] hover:border-cyan-500/50 hover:bg-[#0d2846] transition-all text-left group"
                >
                  <span className="text-xl leading-none">{c.flag}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate group-hover:text-cyan-300 transition-colors">
                      {c.name}
                    </div>
                    {s ? (
                      <div className={`text-[10px] font-semibold ${RISK_COLOR[s.riskLevel].split(" ")[1]}`}>
                        {s.riskLevel}
                      </div>
                    ) : c.hasRichData ? (
                      <div className="text-[10px] text-cyan-400">Rich data</div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Country page ──────────────────────────────────────────────────────────────

function CountryPage({ code }: { code: string }) {
  const [, setLocation] = useLocation();
  const countryMeta = AFRICAN_COUNTRIES.find(c => c.code === code.toUpperCase());

  const { data: brief, isLoading: briefLoading, refetch } =
    trpc.africa.getCountryBrief.useQuery({ countryCode: code.toUpperCase() });
  const { data: news, isLoading: newsLoading } =
    trpc.africa.getCountryNews.useQuery({ countryCode: code.toUpperCase() });
  const { data: contributorProfile } = trpc.contributor.getMyProfile.useQuery(undefined, {
    retry: false,
  });

  if (!countryMeta) {
    return (
      <div className="text-center py-20 text-gray-400">
        Unknown country code "{code}".{" "}
        <button className="text-cyan-400 hover:underline" onClick={() => setLocation("/africa")}>
          Back to Africa hub
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => setLocation("/africa")}
            className="text-xs text-gray-500 hover:text-cyan-400 flex items-center gap-1 mb-2"
          >
            Africa Intelligence <ChevronRight className="w-3 h-3" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">{countryMeta.flag}</span>
            {countryMeta.name}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {countryMeta.capital} · {countryMeta.region} · {countryMeta.languages.join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {brief && !briefLoading && (
            <ShareBriefButton
              brief={{
                countryCode: code.toUpperCase(),
                countryName: countryMeta?.name ?? code,
                title: `${countryMeta?.name ?? code} Intelligence Brief`,
                overview: brief.overview ?? "",
                sentimentScore: brief.sentimentScore ?? 0,
                stabilityScore: brief.stabilityScore ?? 0,
                riskLevel: brief.riskLevel ?? "medium",
                keyThemes: brief.keyThemes ?? [],
              }}
              contributorName={contributorProfile?.displayName ?? undefined}
              affiliation={contributorProfile?.affiliation ?? undefined}
            />
          )}
          <Button variant="ghost" size="sm"
            className="text-gray-400 hover:text-cyan-300"
            onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* If Kenya — deep-link to the richer Kenya pages */}
      {countryMeta.hasRichData && code.toUpperCase() === "KE" && (
        <Card className="bg-cyan-500/10 border-cyan-500/30">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <span className="text-sm text-cyan-300">
              Kenya has detailed intelligence with live parliament, sentiment tracker, and movements.
            </span>
            <Button
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold ml-4 shrink-0"
              onClick={() => setLocation("/country/ke")}
            >
              Open Kenya Intelligence
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI bar */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Stability"
          value={briefLoading ? null : brief?.stabilityScore ?? "—"}
          suffix="/100"
          icon={<Shield className="w-4 h-4 text-blue-400" />}
          loading={briefLoading}
        />
        <KpiCard
          label="Public Sentiment"
          value={briefLoading ? null : brief?.sentimentScore ?? "—"}
          suffix="/100"
          icon={<TrendingUp className="w-4 h-4 text-purple-400" />}
          loading={briefLoading}
        />
        <KpiCard
          label="Risk Level"
          value={briefLoading ? null : brief?.riskLevel ?? "—"}
          icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
          loading={briefLoading}
          badge
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-[#0d1e36] border border-[#1e3a5f]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="figures">Key Figures</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {briefLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 bg-[#0d1e36]" />
              <Skeleton className="h-16 bg-[#0d1e36]" />
            </div>
          ) : brief ? (
            <>
              <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-300">Political Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-200 leading-relaxed">{brief.overview}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span className="text-gray-400">Government: <span className="text-white">{brief.governmentType}</span></span>
                    <span className="text-gray-400">Head of State: <span className="text-white">{brief.headOfState}</span></span>
                    <span className="text-gray-400">Economy: <span className="text-white capitalize">{brief.economicOutlook}</span></span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-300">Recent Significant Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {brief.recentEvents.map((e: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-1.5">
                {brief.keyThemes.map((t: string) => (
                  <Badge key={t} variant="outline" className="border-[#2e4a6f] text-gray-300 text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* Key Figures */}
        <TabsContent value="figures" className="mt-4">
          {briefLoading ? (
            <Skeleton className="h-40 bg-[#0d1e36]" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(brief?.keyFigures || []).map((f: any, i: number) => (
                <Card key={i} className="bg-[#0d1e36] border-[#1e3a5f]">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#050b1a] border border-[#1e3a5f] flex items-center justify-center text-lg shrink-0">
                      <Users className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{f.name}</div>
                      <div className="text-xs text-gray-400 truncate">{f.title} · {f.party}</div>
                    </div>
                    <SentimentDot sentiment={f.sentiment} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Movements */}
        <TabsContent value="movements" className="mt-4 space-y-3">
          {briefLoading ? (
            <Skeleton className="h-32 bg-[#0d1e36]" />
          ) : (
            (brief?.civicMovements || []).map((m: any, i: number) => (
              <Card key={i} className="bg-[#0d1e36] border-[#1e3a5f]">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{m.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        m.status === "active" ? "border-green-500/40 text-green-400" :
                        m.status === "emerging" ? "border-yellow-500/40 text-yellow-400" :
                        "border-gray-600 text-gray-400"
                      }`}
                    >
                      {m.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">{m.summary}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* News */}
        <TabsContent value="news" className="mt-4 space-y-3">
          {newsLoading ? (
            <Skeleton className="h-40 bg-[#0d1e36]" />
          ) : (news?.articles || []).length === 0 ? (
            <Card className="bg-[#0d1e36] border-[#1e3a5f] border-dashed">
              <CardContent className="py-10 text-center text-gray-500 text-sm">
                No configured RSS feeds for {countryMeta.name} yet.
              </CardContent>
            </Card>
          ) : (
            news?.articles.map((a: any, i: number) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Card className="bg-[#0d1e36] border-[#1e3a5f] hover:border-cyan-500/40 transition-colors">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white hover:text-cyan-300 transition-colors line-clamp-2">
                          {a.title}
                        </div>
                        {a.summary && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.summary}</p>
                        )}
                      </div>
                      <Newspaper className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                      <span>{a.source}</span>
                      {a.publishedAt && <span>{new Date(a.publishedAt).toLocaleDateString()}</span>}
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function KpiCard({ label, value, suffix, icon, loading, badge }: {
  label: string;
  value: number | string | null;
  suffix?: string;
  icon: React.ReactNode;
  loading?: boolean;
  badge?: boolean;
}) {
  return (
    <Card className="bg-[#0d1e36] border-[#1e3a5f]">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 uppercase tracking-wide mb-1">
          {icon} {label}
        </div>
        {loading ? (
          <Skeleton className="h-6 w-16 bg-[#1e3a5f]" />
        ) : badge && typeof value === "string" ? (
          <Badge className={`${RISK_COLOR[value] || "bg-gray-700 text-gray-300"} border capitalize text-xs`}>
            {value}
          </Badge>
        ) : (
          <div className={`text-xl font-bold ${typeof value === "number" ? SENTIMENT_COLOR(value as number) : "text-white"}`}>
            {value}{suffix}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SentimentDot({ sentiment }: { sentiment: string }) {
  const color = sentiment === "positive" ? "bg-green-400" : sentiment === "negative" ? "bg-red-400" : "bg-yellow-400";
  return (
    <div className="shrink-0 ml-auto flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] text-gray-500 capitalize">{sentiment}</span>
    </div>
  );
}

// ── Router entry point ────────────────────────────────────────────────────────

export default function AfricaIntelligence() {
  const params = useParams<{ code?: string }>();
  const code = params.code;

  return (
    <div className="min-h-screen bg-[#050b1a] text-white p-5">
      <div className="max-w-5xl mx-auto">
        <BackToDashboard />
        <div className="mt-4">
          {code ? <CountryPage code={code} /> : <AfricaHub />}
        </div>
      </div>
    </div>
  );
}
