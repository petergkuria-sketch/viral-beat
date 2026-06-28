import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ersBand, ERS_GATE } from "@/lib/exchangeData";
import {
  Building2, ArrowLeft, Globe, Award, BadgeCheck, MapPin, Users, Calendar,
  Loader2, AlertTriangle, ExternalLink, TrendingUp,
} from "lucide-react";

function Pillar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default function ExchangeListing() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const q = trpc.exchange.getPublic.useQuery({ id }, { enabled: !Number.isNaN(id) });

  if (q.isLoading) {
    return <div className="min-h-screen bg-[#050b1a] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>;
  }
  if (q.error || !q.data) {
    return (
      <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-3 text-center px-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <h2 className="text-xl font-black text-white">Listing not found</h2>
        <p className="text-sm text-slate-400">This SME may not be published yet.</p>
        <Button variant="outline" className="border-[#1a2d4a] text-slate-300" onClick={() => setLocation("/exchange")}>Back to the Exchange</Button>
      </div>
    );
  }

  const l = q.data;
  const band = ersBand(l.ers);
  const onCapital = l.ers >= ERS_GATE;

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => setLocation("/exchange")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to the Exchange
        </button>

        {/* Hero */}
        <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-2xl p-6 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-1">{l.sector} · {l.countryName}</div>
              <h1 className="text-3xl font-black leading-tight">{l.name}</h1>
              {l.location && <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1"><MapPin className="w-3.5 h-3.5" /> {l.location}</div>}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold border"
                  style={{ color: band.color, background: `${band.color}14`, borderColor: `${band.color}33` }}>{band.label}</span>
                <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold border"
                  style={{ color: onCapital ? "#afa9ec" : "#5dcaa5", background: onCapital ? "rgba(127,119,221,.12)" : "rgba(29,158,117,.12)", borderColor: onCapital ? "rgba(127,119,221,.3)" : "rgba(29,158,117,.3)" }}>
                  {onCapital ? "Capital-Ready board" : "Open Innovation board"}
                </span>
                {l.statusTags.map(s => (
                  <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-slate-300">{s}</span>
                ))}
              </div>
            </div>
            <div className="text-center shrink-0">
              <div className="text-5xl font-black leading-none" style={{ color: band.color }}>{l.ers}</div>
              <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-1">ERS</div>
            </div>
          </div>

          {/* quick facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {l.foundedYear ? <Fact icon={Calendar} label="Founded" value={String(l.foundedYear)} /> : null}
            {l.employees ? <Fact icon={Users} label="Employees" value={l.employees} /> : null}
            {l.ownership ? <Fact icon={BadgeCheck} label="Ownership" value={l.ownership} /> : null}
            {l.website ? (
              <a href={l.website} target="_blank" rel="noreferrer" className="block">
                <Fact icon={Globe} label="Website" value="Visit" accent />
              </a>
            ) : null}
          </div>
        </div>

        {/* Summary */}
        {l.summary && (
          <Section title="About">
            <p className="text-sm text-slate-300 leading-relaxed">{l.summary}</p>
            {l.products && <p className="text-sm text-slate-400 mt-3"><span className="text-slate-500">Products:</span> {l.products}</p>}
          </Section>
        )}

        {/* ERS breakdown */}
        <Section title="Enterprise Readiness Score" icon={TrendingUp}>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            <Pillar label="Governance" value={l.governance} color={band.color} />
            <Pillar label="Financial health" value={l.financial} color={band.color} />
            <Pillar label="Innovation capacity" value={l.innovation} color={band.color} />
            <Pillar label="Market reach" value={l.market} color={band.color} />
          </div>
          <p className="text-[11px] text-slate-600 mt-4">Self-assessed score, pending verification by ViralBeat's on-the-ground network.</p>
        </Section>

        {/* Markets / certs / awards */}
        {(l.exportMarkets.length || l.certifications.length || l.awards.length) ? (
          <Section title="Track record">
            <div className="space-y-3 text-sm">
              {l.exportMarkets.length > 0 && (
                <Row icon={Globe} color="#22d3ee" label="Export markets" value={l.exportMarkets.join(", ")} />
              )}
              {l.certifications.length > 0 && (
                <Row icon={BadgeCheck} color="#34d399" label="Certifications" value={l.certifications.join(", ")} />
              )}
              {l.awards.length > 0 && (
                <Row icon={Award} color="#fbbf24" label="Recognition" value={l.awards.join(", ")} />
              )}
            </div>
          </Section>
        ) : null}

        {/* Attribution */}
        {l.listedByType !== "self" && l.listedByOrg && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#0a1628] border border-[#1a2d4a] rounded-xl p-4">
            <BadgeCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            Listed by <span className="text-slate-200 font-semibold">{l.listedByOrg}</span>
            <span className="text-slate-600">·</span><span className="capitalize">{l.listedByType}</span>
          </div>
        )}

        <p className="text-center text-[11px] text-slate-600 mt-6">Phase 1 · discovery only · no capital handled through the platform</p>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value, accent }: { icon: typeof Globe; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 mb-1"><Icon className="w-3 h-3" /> {label}</div>
      <div className={`text-sm font-semibold ${accent ? "text-cyan-400 flex items-center gap-1" : "text-white"}`}>
        {value}{accent && <ExternalLink className="w-3 h-3" />}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: typeof Globe; children: React.ReactNode }) {
  return (
    <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-2xl p-6 mb-5">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-4 h-4 text-cyan-400" />}
        <h2 className="text-sm font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Row({ icon: Icon, color, label, value }: { icon: typeof Globe; color: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
      <span className="text-slate-400">{label}: <span className="text-slate-200">{value}</span></span>
    </div>
  );
}
