import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  EXCHANGE_SMES, boardOf, ersBand, ERS_GATE,
  type ExchangeSME,
} from "@/lib/exchangeData";
import {
  Building2, ArrowRight, TrendingUp, Plus, ShieldCheck,
  Globe, Award, BadgeCheck,
} from "lucide-react";

function PillarBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-semibold">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function SMECard({ sme }: { sme: ExchangeSME }) {
  const band = ersBand(sme.ers);
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-lg font-black text-white truncate">{sme.name}</div>
          <div className="text-xs text-slate-500">{sme.sector} · {sme.location.split(",").slice(-1)[0].trim()}, {sme.country}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-3xl font-black" style={{ color: band.color }}>{sme.ers}</div>
          <div className="text-[9px] uppercase tracking-widest text-slate-500">ERS</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 mb-4">
        <PillarBar label="Governance" value={sme.pillars.governance} color={band.color} />
        <PillarBar label="Financial" value={sme.pillars.financial} color={band.color} />
        <PillarBar label="Innovation" value={sme.pillars.innovation} color={band.color} />
        <PillarBar label="Market reach" value={sme.pillars.market} color={band.color} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold border"
          style={{ color: band.color, background: `${band.color}14`, borderColor: `${band.color}33` }}>
          {band.label}
        </span>
        {sme.status.map(s => (
          <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-slate-300">{s}</span>
        ))}
      </div>

      <p className="text-sm text-slate-400 leading-relaxed mb-4">{sme.summary}</p>

      <div className="space-y-2 text-xs">
        {sme.exportMarkets && (
          <div className="flex items-start gap-2"><Globe className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
            <span className="text-slate-400">Export markets: <span className="text-slate-300">{sme.exportMarkets.join(", ")}</span></span></div>
        )}
        {sme.certifications && (
          <div className="flex items-start gap-2"><BadgeCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-slate-400">Certifications: <span className="text-slate-300">{sme.certifications.join(", ")}</span></span></div>
        )}
        {sme.awards && (
          <div className="flex items-start gap-2"><Award className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <span className="text-slate-400">Recognition: <span className="text-slate-300">{sme.awards.slice(0, 3).join(", ")}</span></span></div>
        )}
      </div>

      {sme.sample && (
        <div className="mt-4 text-[10px] text-slate-600 border-t border-white/[0.06] pt-3">Sample listing · pending consent before public publication</div>
      )}
    </div>
  );
}

export default function ExchangeHub() {
  const [, setLocation] = useLocation();
  const approved = trpc.exchange.listApproved.useQuery();

  // Approved DB listings (live) merged with the seed sample.
  const dbListings: ExchangeSME[] = (approved.data ?? []).map(r => ({
    id: `db-${r.id}`,
    name: r.name,
    sector: r.sector,
    country: r.countryName,
    countryCode: r.countryCode,
    location: r.location ?? r.countryName,
    ers: r.ers ?? 0,
    pillars: {
      governance: r.governance ?? 0, financial: r.financial ?? 0,
      innovation: r.innovation ?? 0, market: r.market ?? 0,
    },
    status: (r.statusTags as string[]) ?? [],
    summary: r.summary ?? "",
    products: r.products ?? undefined,
    certifications: (r.certifications as string[]) ?? undefined,
    exportMarkets: (r.exportMarkets as string[]) ?? undefined,
    awards: (r.awards as string[]) ?? undefined,
    sample: false,
  }));

  const all = [...dbListings, ...EXCHANGE_SMES];
  const openBoard = all.filter(s => boardOf(s) === "open");
  const capitalBoard = all.filter(s => boardOf(s) === "capital_ready");

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-cyan-500/8 border border-cyan-500/22 rounded-full px-3.5 py-1.5 text-xs text-cyan-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Phase 1 · Discovery only · no capital handled
          </div>
          <h1 className="text-4xl font-black mb-3" style={{ fontFamily: "Georgia, serif" }}>
            SME Discovery &amp; <span className="text-cyan-400">Open Innovation Exchange</span>
          </h1>
          <p className="text-slate-400">
            A stock-market-style ladder for African enterprise. SMEs build a verified Enterprise Readiness Score
            and graduate from the open floor to the capital-ready board at ERS {ERS_GATE}.
          </p>
        </div>

        {/* Two boards */}
        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-5 items-start">

          {/* Open board */}
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-bold text-emerald-300">Open Innovation board</div>
              <span className="text-[11px] text-emerald-300/80 bg-emerald-500/10 rounded-full px-2.5 py-0.5">ERS &lt; {ERS_GATE}</span>
            </div>
            <div className="text-xs text-slate-500 mb-4">Discovery &amp; collaboration · capacity building</div>
            {openBoard.length > 0 ? (
              <div className="space-y-4">{openBoard.map(s => <SMECard key={s.id} sme={s} />)}</div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                <Plus className="w-7 h-7 text-slate-700 mx-auto mb-2" />
                <div className="text-sm font-semibold text-slate-400 mb-1">Be the first on the floor</div>
                <p className="text-xs text-slate-500 mb-4">List your SME, complete the governance checklist, and build your ERS toward graduation.</p>
                <Button size="sm" className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 gap-1.5"
                  onClick={() => setLocation("/exchange/list")}>
                  <Plus className="w-3.5 h-3.5" /> List your SME
                </Button>
              </div>
            )}
          </div>

          {/* Graduation gate */}
          <div className="hidden lg:flex flex-col items-center justify-center gap-2 pt-16">
            <div className="text-[11px] text-amber-400 text-center leading-tight">graduate<br />ERS {ERS_GATE}</div>
            <ArrowRight className="w-6 h-6 text-amber-400" />
          </div>

          {/* Capital-ready board */}
          <div className="rounded-2xl border border-purple-500/30 bg-purple-500/[0.05] p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-bold text-purple-300">Capital-Ready board</div>
              <span className="text-[11px] text-purple-300/80 bg-purple-500/12 rounded-full px-2.5 py-0.5">ERS {ERS_GATE}+</span>
            </div>
            <div className="text-xs text-slate-500 mb-4">Investor screening · partner matchmaking</div>
            {capitalBoard.length > 0 ? (
              <div className="space-y-4">{capitalBoard.map(s => <SMECard key={s.id} sme={s} />)}</div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-500">
                No capital-ready listings yet.
              </div>
            )}
          </div>
        </div>

        {/* Audience lanes */}
        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {[
            { icon: Building2, t: "For SMEs", d: "Get discovered, build a verified track record, access capital." },
            { icon: TrendingUp, t: "For enterprises", d: "Post innovation bounties, fill supply-chain gaps." },
            { icon: ShieldCheck, t: "For investors & DFIs", d: "Screen verified SMEs by country, sector and ERS." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <Icon className="w-5 h-5 text-cyan-400 mb-2" />
              <div className="text-sm font-bold text-white mb-1">{t}</div>
              <div className="text-xs text-slate-400">{d}</div>
            </div>
          ))}
        </div>

        <div className="text-center text-[11px] text-slate-600 mt-8 border-t border-white/[0.06] pt-5">
          Phase 1 discovery only · scores verified by ViralBeat's on-the-ground network · sample listings shown
        </div>
      </div>
    </div>
  );
}
