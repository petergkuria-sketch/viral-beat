import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { getCountryConfig } from "@shared/countryConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Search, Filter, Users } from "lucide-react";

interface SenateParty { name: string; abbr: string; seats: number; color: string }
interface Senator { name: string; party: string; county: string; gender: "M" | "F"; role?: string }

const SENATE_DATA: Record<string, { chamber: string; parties: SenateParty[]; totalSeats: number }> = {
  ke: {
    chamber: "Senate",
    totalSeats: 67,
    parties: [
      { name: "United Democratic Alliance", abbr: "UDA",  seats: 33, color: "#f59e0b" },
      { name: "Orange Democratic Movement", abbr: "ODM",  seats: 16, color: "#f97316" },
      { name: "Jubilee Party",              abbr: "JP",   seats: 5,  color: "#3b82f6" },
      { name: "Wiper",                      abbr: "WDM",  seats: 4,  color: "#22c55e" },
      { name: "Others",                     abbr: "OTH",  seats: 9,  color: "#64748b" },
    ],
  },
  ng: {
    chamber: "Senate",
    totalSeats: 109,
    parties: [
      { name: "All Progressives Congress",  abbr: "APC",  seats: 59, color: "#22c55e" },
      { name: "Peoples Democratic Party",   abbr: "PDP",  seats: 36, color: "#ef4444" },
      { name: "Labour Party",               abbr: "LP",   seats: 8,  color: "#f59e0b" },
      { name: "Others",                     abbr: "OTH",  seats: 6,  color: "#64748b" },
    ],
  },
  za: {
    chamber: "National Council of Provinces",
    totalSeats: 90,
    parties: [
      { name: "African National Congress",  abbr: "ANC",  seats: 29, color: "#22c55e" },
      { name: "Democratic Alliance",        abbr: "DA",   seats: 21, color: "#3b82f6" },
      { name: "uMkhonto we Sizwe",         abbr: "MKP",  seats: 15, color: "#ef4444" },
      { name: "Economic Freedom Fighters", abbr: "EFF",  seats: 9,  color: "#dc2626" },
      { name: "Others",                    abbr: "OTH",  seats: 16, color: "#64748b" },
    ],
  },
  et: {
    chamber: "House of the Federation",
    totalSeats: 153,
    parties: [
      { name: "Prosperity Party",           abbr: "PP",   seats: 110, color: "#22c55e" },
      { name: "Others",                     abbr: "OTH",  seats: 43,  color: "#64748b" },
    ],
  },
};

const COUNTIES: Record<string, string[]> = {
  ke: ["Nairobi", "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta", "Garissa", "Wajir",
       "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka-Nithi", "Embu", "Kitui", "Machakos", "Makueni",
       "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu",
       "Trans Nzoia", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru",
       "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia",
       "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira"],
  ng: ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
       "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo",
       "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
       "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
       "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"],
  za: ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
       "Mpumalanga", "North West", "Northern Cape", "Western Cape"],
  et: ["Afar", "Amhara", "Benishangul-Gumuz", "Dire Dawa", "Gambela", "Harari",
       "Oromia", "Sidama", "Somali", "SNNPR", "Tigray"],
  default: ["District 1", "District 2", "District 3", "District 4", "District 5",
             "District 6", "District 7", "District 8", "District 9", "District 10"],
};

const FIRST = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","William","Barbara",
               "David","Susan","Richard","Jessica","Joseph","Sarah","Thomas","Karen","Charles","Nancy",
               "Amina","Fatima","Mohamed","Aisha","Ibrahim","Hassan","Khadija","Ali","Omar","Zainab"];
const LAST  = ["Ochieng","Njoroge","Kamau","Wanjiku","Otieno","Mwangi","Abubakar","Adeyemi","Okafor",
               "Nkosi","Dlamini","Molefe","Mensah","Asante","Boateng","Tesfaye","Haile","Bekele",
               "Diallo","Traore","Keita","Coulibaly","Ndiaye","Fall","Sow","Mbaye","Diop","Gueye"];

function generateSenators(code: string, parties: SenateParty[], counties: string[]): Senator[] {
  const senators: Senator[] = [];
  let idx = 0;
  const ROLES = ["Committee Chair", "Deputy Chair", "Whip", "Minority Whip", ""];
  for (const party of parties) {
    for (let i = 0; i < party.seats; i++) {
      const gender: "M" | "F" = idx % 4 === 1 ? "F" : "M";
      senators.push({
        name: `${FIRST[(idx * 7 + i) % FIRST.length]} ${LAST[(idx * 11 + i) % LAST.length]}`,
        party: party.abbr,
        county: counties[idx % counties.length],
        gender,
        role: ROLES[idx % ROLES.length] || undefined,
      });
      idx++;
    }
  }
  return senators;
}

export default function CountrySenate() {
  const { code = "ke" } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const country = getCountryConfig(code);
  const config = SENATE_DATA[code.toLowerCase()];
  const counties = COUNTIES[code.toLowerCase()] ?? COUNTIES.default;
  const [search, setSearch] = useState("");
  const [partyFilter, setPartyFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PER_PAGE = 25;

  if (!country) return <div className="p-6 text-muted-foreground">Country not found.</div>;

  if (!config) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <button onClick={() => setLocation(`/country/${code}`)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-3 h-3" /> {country.name} Overview
        </button>
        <div className="text-center py-20 text-muted-foreground">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{country.name} does not have a bicameral legislature.</p>
        </div>
      </div>
    );
  }

  const senators = useMemo(() =>
    generateSenators(code.toLowerCase(), config.parties, counties), [code]);

  const filtered = useMemo(() => senators.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.county.toLowerCase().includes(q);
    const matchParty = partyFilter === "all" || s.party === partyFilter;
    return matchSearch && matchParty;
  }), [senators, search, partyFilter]);

  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const partyMap = Object.fromEntries(config.parties.map(p => [p.abbr, p]));

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
              <Shield className="w-5 h-5 text-purple-400" />
              {country.name} — {config.chamber}
            </h1>
            <p className="text-xs text-muted-foreground">{config.totalSeats} seats · {config.parties.length} parties</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Seat bar */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h2 className="font-black text-sm mb-4">Seat Distribution</h2>
          <div className="flex h-6 rounded-full overflow-hidden gap-px mb-3">
            {config.parties.map(p => (
              <div key={p.abbr} style={{ width: `${(p.seats / config.totalSeats) * 100}%`, background: p.color }} title={`${p.name}: ${p.seats}`} />
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-2">
            {config.parties.map(p => (
              <div key={p.abbr} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                <span className="text-xs font-semibold">{p.abbr}</span>
                <span className="text-xs text-muted-foreground">{p.seats} ({Math.round(p.seats / config.totalSeats * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/30 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Search senators or county…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:border-primary/50" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {["all", ...config.parties.map(p => p.abbr)].map(abbr => {
                const party = partyMap[abbr];
                return (
                  <button key={abbr} onClick={() => { setPartyFilter(abbr); setPage(0); }}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${partyFilter === abbr ? "border-primary" : "border-border/50 text-muted-foreground hover:border-primary/40"}`}
                    style={partyFilter === abbr && party ? { background: `${party.color}20`, color: party.color, borderColor: party.color } : {}}>
                    {abbr === "all" ? "All" : abbr}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  {["Senator","Party","County","Role","Gender"].map(h => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${h === "Role" ? "hidden sm:table-cell" : ""} ${h === "County" ? "hidden md:table-cell" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((s, i) => {
                  const party = partyMap[s.party];
                  return (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                      className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3">
                        {party ? (
                          <Badge className="text-[10px]" style={{ background: `${party.color}20`, color: party.color, borderColor: `${party.color}40` }}>
                            {s.party}
                          </Badge>
                        ) : <span className="text-xs text-muted-foreground">{s.party}</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{s.county}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{s.role ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${s.gender === "F" ? "text-pink-400" : "text-blue-400"}`}>
                          {s.gender === "F" ? "Female" : "Male"}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{filtered.length} senators · page {page + 1} of {totalPages || 1}</span>
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
