import { useState } from "react";
import { useLocation } from "wouter";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  EXCHANGE_SMES, boardOf, ersBand, ERS_GATE,
  type ExchangeSME,
} from "@/lib/exchangeData";
import {
  Building2, ArrowRight, TrendingUp, Plus, ShieldCheck,
  Globe, Award, BadgeCheck, Filter, X,
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
  const [, setLocation] = useLocation();
  const band = ersBand(sme.ers);
  const clickable = sme.listingId != null;
  const open = () => { if (clickable) setLocation(`/exchange/sme/${sme.listingId}`); };
  return (
    <div onClick={open}
      className={`bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 ${clickable ? "cursor-pointer hover:border-cyan-500/40 hover:bg-white/[0.05] transition-colors" : ""}`}>
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

      {sme.listedBy && (
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400 border-t border-white/[0.06] pt-3">
          <BadgeCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          Listed by <span className="text-slate-200 font-semibold">{sme.listedBy.org}</span>
          <span className="text-slate-600">·</span>
          <span className="capitalize">{sme.listedBy.type}</span>
        </div>
      )}
      {sme.sample && (
        <div className="mt-4 text-[10px] text-slate-600 border-t border-white/[0.06] pt-3">Sample listing · pending consent before public publication</div>
      )}
      {clickable && (
        <div className="mt-4 flex items-center justify-end gap-1 text-[11px] text-cyan-400 font-semibold border-t border-white/[0.06] pt-3">
          View profile <ArrowRight className="w-3.5 h-3.5" />
        </div>
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
    listingId: r.id,
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
    listedBy: r.listedByType && r.listedByType !== "self" && r.listedByOrg
      ? { type: r.listedByType as "incubator" | "accelerator", org: r.listedByOrg }
      : undefined,
    sample: false,
  }));

  // Real listings take over once they exist; the seed sample only fills an empty board.
  const all = dbListings.length ? dbListings : EXCHANGE_SMES;

  // ── Filters ──────────────────────────────────────────────────────────────
  const [fCountry, setFCountry] = useState("");
  const [fSector, setFSector] = useState("");
  const [fMinErs, setFMinErs] = useState(0);
  const [fStatus, setFStatus] = useState("");

  const countries = Array.from(new Set(all.map(s => s.country))).sort();
  const sectors = Array.from(new Set(all.map(s => s.sector))).sort();
  const statusOptions = Array.from(new Set(all.flatMap(s => s.status))).sort();
  const activeFilters = !!(fCountry || fSector || fMinErs > 0 || fStatus);

  const filtered = all.filter(s =>
    (!fCountry || s.country === fCountry) &&
    (!fSector || s.sector === fSector) &&
    s.ers >= fMinErs &&
    (!fStatus || s.status.includes(fStatus))
  );

  const openBoard = filtered.filter(s => boardOf(s) === "open");
  const capitalBoard = filtered.filter(s => boardOf(s) === "capital_ready");

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <TopNav />
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
          <div className="flex items-center justify-center gap-2 mt-5">
            <Button className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 gap-1.5" onClick={() => setLocation("/exchange/list")}>
              <Plus className="w-4 h-4" /> List your SME
            </Button>
            <Button variant="outline" className="border-white/15 text-slate-300 hover:bg-white/5" onClick={() => setLocation("/exchange/mine")}>
              My listings
            </Button>
            <Button variant="outline" className="border-white/15 text-slate-300 hover:bg-white/5" onClick={() => setLocation("/exchange/messages")}>
              Messages
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-xl p-3 mb-6 flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1"><Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter</div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Country</label>
            <select value={fCountry} onChange={e => setFCountry(e.target.value)} className="bg-[#050e1c] border border-[#1a2d4a] rounded-md text-xs h-8 px-2 min-w-[130px]">
              <option value="">All countries</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Sector</label>
            <select value={fSector} onChange={e => setFSector(e.target.value)} className="bg-[#050e1c] border border-[#1a2d4a] rounded-md text-xs h-8 px-2 min-w-[130px]">
              <option value="">All sectors</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Status</label>
            <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="bg-[#050e1c] border border-[#1a2d4a] rounded-md text-xs h-8 px-2 min-w-[130px]">
              <option value="">Any status</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Min ERS: {fMinErs}</label>
            <input type="range" min={0} max={100} step={5} value={fMinErs} onChange={e => setFMinErs(Number(e.target.value))} className="accent-cyan-400 w-32 h-8" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[11px] text-slate-500">{filtered.length} of {all.length}</span>
            {activeFilters && (
              <button onClick={() => { setFCountry(""); setFSector(""); setFMinErs(0); setFStatus(""); }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
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
