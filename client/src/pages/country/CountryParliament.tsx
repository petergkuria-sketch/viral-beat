import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { getCountryConfig } from "@shared/countryConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Users, Search, Filter, Shield,
  TrendingUp, TrendingDown, Minus, Building,
} from "lucide-react";

// ── Static party data per country ──────────────────────────────────────────────

interface Party { name: string; abbr: string; seats: number; color: string; ideology: string }
interface Member { name: string; party: string; constituency: string; region: string; gender: "M" | "F" }

const PARTIES: Record<string, Party[]> = {
  ke: [
    { name: "United Democratic Alliance",       abbr: "UDA",   seats: 159, color: "#f59e0b", ideology: "Centre-right" },
    { name: "Jubilee Party",                    abbr: "JP",    seats: 31,  color: "#3b82f6", ideology: "Centre" },
    { name: "Orange Democratic Movement",       abbr: "ODM",   seats: 27,  color: "#f97316", ideology: "Centre-left" },
    { name: "Wiper Democratic Movement",        abbr: "WDM",   seats: 20,  color: "#22c55e", ideology: "Centre-left" },
    { name: "FORD-Kenya",                       abbr: "FK",    seats: 9,   color: "#a78bfa", ideology: "Social democrat" },
    { name: "Others / Independents",            abbr: "IND",   seats: 53,  color: "#64748b", ideology: "Various" },
  ],
  ng: [
    { name: "All Progressives Congress",        abbr: "APC",   seats: 178, color: "#22c55e", ideology: "Conservative" },
    { name: "Peoples Democratic Party",         abbr: "PDP",   seats: 116, color: "#ef4444", ideology: "Centre-left" },
    { name: "Labour Party",                     abbr: "LP",    seats: 35,  color: "#f59e0b", ideology: "Social democrat" },
    { name: "New Nigeria Peoples Party",        abbr: "NNPP",  seats: 19,  color: "#a78bfa", ideology: "Populist" },
    { name: "Others",                           abbr: "OTH",   seats: 12,  color: "#64748b", ideology: "Various" },
  ],
  za: [
    { name: "African National Congress",        abbr: "ANC",   seats: 159, color: "#22c55e", ideology: "Centre-left" },
    { name: "Democratic Alliance",              abbr: "DA",    seats: 87,  color: "#3b82f6", ideology: "Liberal" },
    { name: "uMkhonto we Sizwe",               abbr: "MKP",   seats: 58,  color: "#ef4444", ideology: "Left-wing" },
    { name: "Economic Freedom Fighters",        abbr: "EFF",   seats: 39,  color: "#dc2626", ideology: "Far-left" },
    { name: "Inkatha Freedom Party",            abbr: "IFP",   seats: 17,  color: "#f59e0b", ideology: "Conservative" },
    { name: "Others",                           abbr: "OTH",   seats: 40,  color: "#64748b", ideology: "Various" },
  ],
  gh: [
    { name: "National Democratic Congress",     abbr: "NDC",   seats: 183, color: "#22c55e", ideology: "Social democrat" },
    { name: "New Patriotic Party",              abbr: "NPP",   seats: 88,  color: "#3b82f6", ideology: "Liberal-conservative" },
    { name: "Others / Independents",            abbr: "IND",   seats: 4,   color: "#64748b", ideology: "Various" },
  ],
  et: [
    { name: "Prosperity Party",                 abbr: "PP",    seats: 410, color: "#22c55e", ideology: "Centre" },
    { name: "National Movement of Amhara",      abbr: "NAMA",  seats: 8,   color: "#f59e0b", ideology: "Nationalist" },
    { name: "Others",                           abbr: "OTH",   seats: 129, color: "#64748b", ideology: "Various" },
  ],
  sn: [
    { name: "Pastef",                           abbr: "PASTEF",seats: 130, color: "#f97316", ideology: "Left-wing" },
    { name: "Benno Bokk Yakaar",               abbr: "BBY",   seats: 20,  color: "#a78bfa", ideology: "Centre" },
    { name: "Others",                           abbr: "OTH",   seats: 15,  color: "#64748b", ideology: "Various" },
  ],
  tz: [
    { name: "Chama Cha Mapinduzi",             abbr: "CCM",   seats: 255, color: "#22c55e", ideology: "Centre-left" },
    { name: "Chadema",                          abbr: "CHADEMA",seats: 20, color: "#3b82f6", ideology: "Centre" },
    { name: "Others",                           abbr: "OTH",   seats: 118, color: "#64748b", ideology: "Various" },
  ],
  ci: [
    { name: "Rassemblement des Houphouëtistes", abbr: "RHDP", seats: 137, color: "#f97316", ideology: "Centre-right" },
    { name: "Others",                           abbr: "OTH",   seats: 68,  color: "#64748b", ideology: "Various" },
  ],
  eg: [
    { name: "Republican People's Party",        abbr: "RPP",   seats: 316, color: "#22c55e", ideology: "Nationalist" },
    { name: "Others",                           abbr: "OTH",   seats: 280, color: "#64748b", ideology: "Various" },
  ],
  rw: [
    { name: "Rwandan Patriotic Front",          abbr: "RPF",   seats: 40,  color: "#22c55e", ideology: "Centre" },
    { name: "PSD",                              abbr: "PSD",   seats: 5,   color: "#3b82f6", ideology: "Social democrat" },
    { name: "PDC",                              abbr: "PDC",   seats: 3,   color: "#f59e0b", ideology: "Christian democrat" },
    { name: "Others",                           abbr: "OTH",   seats: 32,  color: "#64748b", ideology: "Various" },
  ],
};

// Generate seeded mock members
function generateMembers(code: string, parties: Party[], total: number): Member[] {
  const REGIONS: Record<string, string[]> = {
    ke: ["Nairobi", "Kiambu", "Nakuru", "Mombasa", "Kisumu", "Uasin Gishu", "Machakos", "Kakamega", "Meru", "Kilifi"],
    ng: ["Lagos", "Abuja FCT", "Kano", "Rivers", "Ogun", "Kaduna", "Anambra", "Delta", "Oyo", "Imo"],
    za: ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Limpopo", "Mpumalanga", "Free State", "North West", "Northern Cape"],
    gh: ["Greater Accra", "Ashanti", "Northern", "Western", "Volta", "Eastern", "Central", "Brong-Ahafo"],
    default: ["Region A", "Region B", "Region C", "Region D", "Region E"],
  };
  const regions = REGIONS[code] ?? REGIONS.default;
  const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Barbara", "David", "Susan", "Richard", "Jessica", "Joseph", "Sarah", "Thomas", "Karen", "Charles", "Nancy"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Young", "Lee"];

  const members: Member[] = [];
  let idx = 0;
  for (const party of parties) {
    for (let i = 0; i < party.seats; i++) {
      const gender: "M" | "F" = idx % 3 === 2 ? "F" : "M";
      const fn = firstNames[(idx * 7 + i) % firstNames.length];
      const ln = lastNames[(idx * 13 + i) % lastNames.length];
      members.push({
        name: `${fn} ${ln}`,
        party: party.abbr,
        constituency: `Constituency ${idx + 1}`,
        region: regions[idx % regions.length],
        gender,
      });
      idx++;
    }
  }
  return members;
}

export default function CountryParliament() {
  const { code = "ke" } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const country = getCountryConfig(code);
  const parties = PARTIES[code.toLowerCase()] ?? [];
  const totalSeats = country?.legislature.seats ?? parties.reduce((a, b) => a + b.seats, 0);
  const members = useMemo(() => generateMembers(code.toLowerCase(), parties, totalSeats), [code]);

  const [search, setSearch] = useState("");
  const [partyFilter, setPartyFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PER_PAGE = 30;

  const filtered = useMemo(() => {
    return members.filter(m => {
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.constituency.toLowerCase().includes(search.toLowerCase());
      const matchParty = partyFilter === "all" || m.party === partyFilter;
      return matchSearch && matchParty;
    });
  }, [members, search, partyFilter]);

  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  if (!country) {
    return <div className="p-6 text-muted-foreground">Country not found.</div>;
  }

  const chamber = country.legislature.lowerHouse ?? "Parliament";
  const partyMap = Object.fromEntries(parties.map(p => [p.abbr, p]));

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <button
          onClick={() => setLocation(`/country/${code}`)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> {country.name} Overview
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{country.flag}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-400" />
              {country.name} — {chamber}
            </h1>
            <p className="text-xs text-muted-foreground">
              {totalSeats} seats · {parties.length} parties
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">

        {/* Seat distribution bar */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h2 className="font-black text-sm mb-4">Seat Distribution</h2>
          <div className="flex h-7 rounded-full overflow-hidden gap-px mb-4">
            {parties.map(p => (
              <div
                key={p.abbr}
                title={`${p.name}: ${p.seats} seats`}
                style={{ width: `${(p.seats / totalSeats) * 100}%`, background: p.color }}
              />
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {parties.map(p => (
              <div key={p.abbr} className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
                <div className="min-w-0">
                  <span className="text-xs font-semibold">{p.abbr}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">{p.seats} seats ({Math.round(p.seats / totalSeats * 100)}%)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Majority indicator */}
          <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Simple majority threshold: <strong className="text-foreground">{Math.ceil(totalSeats / 2) + 1} seats</strong>
              {parties[0] && parties[0].seats >= Math.ceil(totalSeats / 2) + 1
                ? <span className="ml-2 text-green-400 font-semibold">— {parties[0].abbr} holds majority</span>
                : <span className="ml-2 text-yellow-400 font-semibold">— No single-party majority</span>}
            </span>
          </div>
        </div>

        {/* Members table */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/30 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search members or constituency…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <button
                onClick={() => { setPartyFilter("all"); setPage(0); }}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${partyFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-primary/40"}`}
              >
                All
              </button>
              {parties.map(p => (
                <button
                  key={p.abbr}
                  onClick={() => { setPartyFilter(p.abbr); setPage(0); }}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${partyFilter === p.abbr ? "border-primary" : "border-border/50 text-muted-foreground hover:border-primary/40"}`}
                  style={partyFilter === p.abbr ? { background: `${p.color}20`, color: p.color, borderColor: p.color } : {}}
                >
                  {p.abbr}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Member</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Party</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Constituency</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Region</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gender</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((m, i) => {
                  const party = partyMap[m.party];
                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.01 }}
                      className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3">
                        {party ? (
                          <Badge
                            className="text-[10px]"
                            style={{ background: `${party.color}20`, color: party.color, borderColor: `${party.color}40` }}
                          >
                            {m.party}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{m.party}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{m.constituency}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{m.region}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${m.gender === "F" ? "text-pink-400" : "text-blue-400"}`}>
                          {m.gender === "F" ? "Female" : "Male"}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {filtered.length} members · page {page + 1} of {totalPages || 1}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-7 text-xs">Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="h-7 text-xs">Next</Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
