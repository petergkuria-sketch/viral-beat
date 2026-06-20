import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { getCountryConfig } from "@shared/countryConfig";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Users, MapPin, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";

interface Movement {
  id: string;
  name: string;
  status: "active" | "emerging" | "declining" | "dormant";
  focus: string;
  members: string;
  founded: string;
  region: string;
  summary: string;
  demands: string[];
  trend: "up" | "down" | "stable";
  riskLevel: "Low" | "Moderate" | "High";
}

const MOVEMENTS: Record<string, Movement[]> = {
  ke: [
    { id: "genz", name: "Gen Z Coalition", status: "active", focus: "Governance reform", members: "50,000+", founded: "2024", region: "National", summary: "Youth-led movement that led the June 2024 anti-Finance Bill protests. Succeeded in forcing withdrawal of Finance Bill 2024 and continues to push for accountability and reduced cost of living.", demands: ["Government austerity", "Transparency in public spending", "Youth employment", "Anti-corruption measures"], trend: "up", riskLevel: "Moderate" },
    { id: "azimio", name: "Azimio la Umoja", status: "active", focus: "Political opposition", members: "2M+", founded: "2022", region: "National", summary: "Coalition led by Raila Odinga challenging Ruto government on economic policy. Conducts regular mass actions and protests over cost of living and alleged electoral fraud.", demands: ["Electoral justice", "Reduction in cost of living", "Constitutional reforms"], trend: "stable", riskLevel: "Moderate" },
    { id: "shirikisho", name: "Shirikisho Movement", status: "emerging", focus: "Federal governance", members: "15,000", founded: "2023", region: "Coast", summary: "Advocates for greater devolution of power and resources to county governments, particularly in Coast and marginalized regions.", demands: ["Revenue sharing reform", "Devolution of judiciary", "Regional autonomy"], trend: "up", riskLevel: "Low" },
    { id: "mama", name: "Mama Mboga Network", status: "active", focus: "Economic justice", members: "80,000", founded: "2023", region: "Urban centers", summary: "Grassroots network of small-scale traders and informal workers advocating against hawker crackdowns and high taxes on basic goods.", demands: ["Tax relief for small traders", "Designated vending zones", "Access to micro-credit"], trend: "stable", riskLevel: "Low" },
    { id: "icc", name: "ICC Justice Watch", status: "emerging", focus: "Human rights / ICC", members: "5,000", founded: "2024", region: "National", summary: "Monitors implementation of ICC Rabat Plan obligations and pushes for accountability for 2007-08 and 2024 protest violence.", demands: ["ICC cooperation", "Accountability for protest deaths", "Reparations"], trend: "up", riskLevel: "Low" },
  ],
  ng: [
    { id: "endsars", name: "EndSARS Revival", status: "active", focus: "Police reform", members: "100,000+", founded: "2020", region: "National", summary: "Continuation of the 2020 EndSARS movement. Still demanding accountability for Lekki Toll Gate shooting and systemic police brutality.", demands: ["Dissolution of SARS", "Prosecution of officers", "Compensation for victims"], trend: "stable", riskLevel: "High" },
    { id: "obidient", name: "Obidient Movement", status: "active", focus: "Political reform", members: "5M+", founded: "2022", region: "National", summary: "Youth movement that emerged around Peter Obi's 2023 presidential campaign. Continues to push for anti-corruption governance and youth political inclusion.", demands: ["Anti-corruption governance", "Youth inclusion in politics", "Economic reform"], trend: "stable", riskLevel: "Low" },
    { id: "subsidy", name: "Fuel Subsidy Protest Network", status: "active", focus: "Economic justice", members: "200,000+", founded: "2023", region: "National", summary: "Coordinates nationwide protests against removal of fuel subsidies and its impact on cost of living for ordinary Nigerians.", demands: ["Subsidy restoration or alternatives", "Lower fuel prices", "Social safety nets"], trend: "up", riskLevel: "High" },
    { id: "niger", name: "Niger Delta Avengers", status: "dormant", focus: "Resource control", members: "Unknown", founded: "2016", region: "Niger Delta", summary: "Militant group demanding resource control. Currently dormant but monitors government compliance with pipeline agreements.", demands: ["Local control of oil revenues", "Environmental remediation", "Amnesty programme continuation"], trend: "down", riskLevel: "High" },
  ],
  za: [
    { id: "mk", name: "MK Party Surge", status: "active", focus: "Political opposition", members: "1.5M+", founded: "2023", region: "KwaZulu-Natal", summary: "Jacob Zuma's uMkhonto we Sizwe party emerged as major force in 2024 elections, particularly in KZN. Challenges ANC-DA coalition government.", demands: ["Zuma reinstatement", "Land redistribution", "Economic nationalism"], trend: "up", riskLevel: "Moderate" },
    { id: "eff-land", name: "EFF Land Campaign", status: "active", focus: "Land reform", members: "500,000+", founded: "2013", region: "National", summary: "Julius Malema's EFF leads land expropriation campaign. Coordinating land occupations and parliamentary pressure for constitutional amendment.", demands: ["Land expropriation without compensation", "Nationalisation of mines and banks", "Free education"], trend: "stable", riskLevel: "Moderate" },
    { id: "loadshedd", name: "Anti-Loadshedding Coalition", status: "declining", focus: "Energy access", members: "50,000", founded: "2022", region: "National", summary: "Coalition of civil groups pressuring government on Eskom crisis. Activity declining as loadshedding frequency has reduced in 2024.", demands: ["Stable electricity supply", "Independent power producers", "Eskom accountability"], trend: "down", riskLevel: "Low" },
  ],
  gh: [
    { id: "fixthecountry", name: "#FixTheCountry", status: "active", focus: "Governance accountability", members: "100,000+", founded: "2021", region: "National", summary: "Youth-led digital movement holding government accountable on infrastructure, corruption and economic mismanagement. Gained new momentum post-2024 NDC election win.", demands: ["Anti-corruption", "Infrastructure investment", "Job creation"], trend: "stable", riskLevel: "Low" },
    { id: "electionwatch", name: "Election Watch Ghana", status: "active", focus: "Electoral integrity", members: "20,000", founded: "2020", region: "National", summary: "Civil society coalition monitoring elections and advocating for transparent electoral processes. Active ahead of next electoral cycle.", demands: ["Transparent elections", "Electoral Commission reform", "Voter education"], trend: "stable", riskLevel: "Low" },
  ],
  et: [
    { id: "tigray", name: "Tigray Monitor", status: "active", focus: "Post-war accountability", members: "Unknown", founded: "2020", region: "Tigray", summary: "Network monitoring implementation of the Pretoria Peace Agreement and advocating for transitional justice after the 2020-22 civil war.", demands: ["Full implementation of Pretoria Agreement", "War crimes accountability", "Humanitarian access", "Reconstruction funding"], trend: "stable", riskLevel: "High" },
    { id: "oromo", name: "Oromo Civil Movement", status: "active", focus: "Political rights", members: "500,000+", founded: "2015", region: "Oromia", summary: "Broad-based movement for Oromo political rights, self-determination and accountability under Abiy Ahmed's government.", demands: ["Release of political prisoners", "Oromo self-determination", "End to Oromia conflict"], trend: "stable", riskLevel: "High" },
  ],
  sn: [
    { id: "pastef-youth", name: "Pastef Youth Wing", status: "active", focus: "Political transformation", members: "200,000+", founded: "2022", region: "National", summary: "Mobilisation arm that brought Faye/Sonko to power. Now focused on holding the new government to its anti-corruption commitments.", demands: ["Anti-corruption enforcement", "Sovereignty from France", "Youth employment"], trend: "stable", riskLevel: "Low" },
    { id: "francafrique", name: "Noo Lank (Anti-Françafrique)", status: "emerging", focus: "French influence", members: "30,000", founded: "2023", region: "Dakar", summary: "Coalition pushing for renegotiation of defence agreements with France and nationalisation of natural resources.", demands: ["Closure of French military bases", "CFA franc reform", "Resource nationalisation"], trend: "up", riskLevel: "Low" },
  ],
  tz: [
    { id: "chadema-youth", name: "CHADEMA Youth League", status: "active", focus: "Political opposition", members: "100,000", founded: "2010", region: "National", summary: "Opposition youth wing pushing for multiparty democracy and electoral reforms ahead of 2025 general election.", demands: ["Free and fair elections", "Political prisoner release", "Press freedom"], trend: "up", riskLevel: "Moderate" },
  ],
  ci: [
    { id: "fpi-youth", name: "FPI Resistance", status: "active", focus: "Opposition politics", members: "50,000", founded: "2011", region: "West / Abidjan", summary: "Supporters of Gbagbo's FPI party pushing for political reconciliation and return of exiled political figures.", demands: ["Amnesty for political prisoners", "National reconciliation", "Opposition freedom"], trend: "stable", riskLevel: "Moderate" },
  ],
  eg: [
    { id: "april6", name: "April 6 Youth Movement", status: "dormant", focus: "Political rights", members: "Unknown", founded: "2008", region: "Cairo", summary: "Founding movement of 2011 Arab Spring. Operating underground under heavy repression. Minimal visible activity.", demands: ["Democratic reform", "Release of political prisoners", "Press freedom"], trend: "down", riskLevel: "High" },
  ],
  rw: [
    { id: "fdlr", name: "FDU-Inkingi (Diaspora)", status: "active", focus: "Political pluralism", members: "Unknown", founded: "2006", region: "Diaspora", summary: "Diaspora-based opposition party operating from abroad. Calls for political pluralism and free elections in Rwanda.", demands: ["Multi-party democracy", "Release of political prisoners", "Press freedom"], trend: "stable", riskLevel: "Moderate" },
  ],
};

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "Active",    color: "#34d399", bg: "bg-green-400" },
  emerging:  { label: "Emerging", color: "#fbbf24", bg: "bg-yellow-400 animate-pulse" },
  declining: { label: "Declining",color: "#94a3b8", bg: "bg-slate-400" },
  dormant:   { label: "Dormant",  color: "#64748b", bg: "bg-slate-600" },
};

const RISK_STYLE: Record<string, string> = {
  Low:      "text-green-400",
  Moderate: "text-yellow-400",
  High:     "text-red-400",
};

export default function CountryMovements() {
  const { code = "ke" } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const country = getCountryConfig(code);
  const movements = MOVEMENTS[code.toLowerCase()] ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  if (!country) return <div className="p-6 text-muted-foreground">Country not found.</div>;

  const statuses = ["all", "active", "emerging", "declining", "dormant"];
  const filtered = filter === "all" ? movements : movements.filter(m => m.status === filter);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <button onClick={() => setLocation(`/country/${code}`)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="w-3 h-3" /> {country.name} Overview
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{country.flag}</span>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              {country.name} Civic Movements
            </h1>
            <p className="text-xs text-muted-foreground">{movements.length} tracked movements</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {statuses.map(s => {
            const style = s !== "all" ? STATUS_STYLE[s] : null;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize ${filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-primary/40"}`}>
                {s}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No movements tracked for {country.name} yet.</p>
          </div>
        )}

        {filtered.map((mv, i) => {
          const ss = STATUS_STYLE[mv.status];
          const isOpen = expanded === mv.id;
          return (
            <motion.div key={mv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : mv.id)} className="w-full text-left p-5 hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${ss.bg}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-black text-base">{mv.name}</h3>
                      <Badge className="text-[10px]" style={{ background: `${ss.color}15`, color: ss.color, borderColor: `${ss.color}30` }}>
                        {ss.label}
                      </Badge>
                      <span className={`text-xs font-semibold ${RISK_STYLE[mv.riskLevel]}`}>{mv.riskLevel} Risk</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{mv.focus}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{mv.members}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{mv.region}</span>
                      <span>Est. {mv.founded}</span>
                    </div>
                    {!isOpen && <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{mv.summary}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {mv.trend === "up" && <TrendingUp className="w-4 h-4 text-green-400" />}
                    {mv.trend === "down" && <TrendingDown className="w-4 h-4 text-red-400" />}
                    {mv.trend === "stable" && <Minus className="w-4 h-4 text-yellow-400" />}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
              </button>

              {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-5 space-y-4 border-t border-border/30 pt-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{mv.summary}</p>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Key Demands</p>
                    <ul className="space-y-1.5">
                      {mv.demands.map((d, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: ss.color }} />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
