// Shared data layer for Africa Intelligence Scanner, Country Deep Dive, and Brief Generator.
// Static seed data — wire to tRPC endpoints when backend is ready.

export interface PestelBreak {
  P: number; E: number; S: number; T: number; En: number; L: number; IR: number;
}

export interface RiskItem {
  category: string;
  risk: string;
  likelihood: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High" | "Critical";
  mitigation: string;
}

export interface SectorScore {
  name: string;
  score: number;
  verdict: "enter" | "watch" | "avoid";
}

export interface TimelineEvent {
  date: string;
  text: string;
  type: "positive" | "neutral" | "warning" | "critical";
}

export interface SignalItem {
  dim: "P" | "E" | "S" | "T" | "En" | "L" | "IR";
  text: string;
  impact: "pos" | "neg" | "neu";
  impactText: string;
  source: string;
  time: string;
}

export type Verdict = "strong-buy" | "buy" | "watch" | "avoid";

export interface CountryProfile {
  code: string;
  flag: string;
  name: string;
  region: string;
  population: string;
  capital: string;
  currency: string;
  gdp: string;
  fdi: string;
  pestel: number;
  irs: number;
  trend: number[];
  change30d: number;
  verdict: Verdict;
  opportunities: string[];
  pestelBreak: PestelBreak;
  pestelSnippets: Record<keyof PestelBreak, string>;
  risks: RiskItem[];
  sectors: SectorScore[];
  timeline: TimelineEvent[];
  signals: SignalItem[];
  macroSummary: string;
}

export function composite(c: Pick<CountryProfile, "pestel" | "irs">) {
  return Math.round(c.pestel * 0.6 + c.irs * 0.4);
}

export function scoreColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 60) return "#84cc16";
  if (score >= 45) return "#f59e0b";
  return "#ef4444";
}

export const VERDICT_LABELS: Record<Verdict, string> = {
  "strong-buy": "Strong Buy",
  "buy": "Buy",
  "watch": "Watch",
  "avoid": "Avoid",
};

export const COUNTRIES: CountryProfile[] = [
  {
    code: "RWA", flag: "🇷🇼", name: "Rwanda", region: "East Africa",
    population: "14M", capital: "Kigali", currency: "RWF",
    gdp: "$14B", fdi: "$430M",
    pestel: 82, irs: 79, change30d: 3.2, trend: [55,60,65,68,72,75,78,80,82],
    verdict: "strong-buy",
    macroSummary: "Rwanda maintains Africa's strongest governance trajectory, anchored by the Kigali Innovation City SEZ and a digital services export strategy. Political stability is high; the presidency retains broad public mandate. Investment climate leads Sub-Saharan Africa on B-READY indicators.",
    opportunities: ["Digital governance services", "Agri-fintech & precision agriculture", "MICE tourism & hospitality", "Green bonds & climate finance"],
    pestelBreak: { P:85, E:78, S:72, T:80, En:76, L:81, IR:79 },
    pestelSnippets: {
      P: "Single-party dominance provides policy continuity. Zero tolerance for corruption institutionalised. Regional security role growing via EAC.",
      E: "GDP growth 7.2%. Services sector expanding. Limited commodity exposure. Landlocked premium on logistics costs.",
      S: "High literacy rate (78%). Genocide reconciliation model cited globally. Gender parity in parliament — world-leading.",
      T: "Kigali Smart City framework active. Drone delivery corridor operational. 4G coverage 96% of population.",
      En: "Forest cover recovering. NDC commitments ahead of schedule. Methane extraction from Lake Kivu an energy differentiator.",
      L: "Arbitration Centre operational since 2021. IP framework aligned to ARIPO. Land tenure reform complete.",
      IR: "B-READY Rank #1 East Africa. Strong on regulatory quality and market access. Weak on cross-border trade infrastructure.",
    },
    risks: [
      { category:"Political", risk:"Regional tension with DRC", likelihood:"Medium", impact:"Medium", mitigation:"Structure force majeure clauses; monitor M23 corridor quarterly." },
      { category:"Economic", risk:"Landlocked logistics premium", likelihood:"High", impact:"Medium", mitigation:"Partner with local logistics firms; use Dar es Salaam + Mombasa dual routing." },
      { category:"Social", risk:"Skills shortage in deep tech", likelihood:"Medium", impact:"Low", mitigation:"Partnership with CMU-Africa and UR for talent pipeline development." },
    ],
    sectors: [
      { name:"Digital Services & GovTech", score:93, verdict:"enter" },
      { name:"Agri-fintech", score:88, verdict:"enter" },
      { name:"MICE Tourism & Hospitality", score:84, verdict:"enter" },
      { name:"Clean Energy", score:79, verdict:"enter" },
      { name:"Financial Services", score:73, verdict:"enter" },
      { name:"Manufacturing & SEZ", score:68, verdict:"watch" },
    ],
    timeline: [
      { date:"Sep 2026", text:"EAC digital trade corridor pilot launch", type:"positive" },
      { date:"Jan 2027", text:"Kigali Innovation City Phase 2 opens", type:"positive" },
      { date:"Jul 2029", text:"Presidential Election (Kagame era continuity expected)", type:"neutral" },
    ],
    signals: [
      { dim:"T", text:"Rwanda launches Pan-African AI regulatory sandbox in partnership with AU Commission.", impact:"pos", impactText:"▲ Tech investment signal", source:"RDB Official", time:"1d ago" },
      { dim:"E", text:"IMF Article IV consultation confirms 7.2% GDP growth projection for 2026.", impact:"pos", impactText:"▲ Macro stability confirmed", source:"IMF", time:"3d ago" },
      { dim:"L", text:"Kigali International Arbitration Centre handles record 42 cross-border disputes in Q2.", impact:"pos", impactText:"▲ Legal risk reduced", source:"KIAC", time:"1w ago" },
    ],
  },
  {
    code: "KEN", flag: "🇰🇪", name: "Kenya", region: "East Africa",
    population: "56M", capital: "Nairobi", currency: "KES",
    gdp: "$118B", fdi: "$830M",
    pestel: 79, irs: 74, change30d: 1.8, trend: [60,63,66,70,72,74,75,76,79],
    verdict: "strong-buy",
    macroSummary: "Kenya is East Africa's commercial gateway and the continent's leading fintech ecosystem. The M-Pesa mobile money infrastructure anchors a $12B+ digital payments market. IMF program on track. 2027 election cycle beginning to introduce political risk premium, but fundamentals remain strongest in Sub-Saharan Africa outside Rwanda.",
    opportunities: ["M-Pesa fintech ecosystem", "Nairobi Silicon Savannah", "East Africa logistics hub", "Agro-processing & cold chain", "Green bonds & climate finance"],
    pestelBreak: { P:74, E:80, S:75, T:88, En:70, L:76, IR:74 },
    pestelSnippets: {
      P: "Ruto administration stable. Devolution framework provides local governance buffer. 2027 election cycle opening — watch from Jan 2027.",
      E: "GDP growth 5.2%. Largest economy in EAC. IMF program on track. External debt at 67% of GDP — manageable but elevated.",
      S: "Young median age (20). Urban migration accelerating. Gen-Z political activism a new governance factor post-2023 protests.",
      T: "Highest mobile money penetration globally. Nairobi ranked Africa's #1 tech hub. AWS, Google, Microsoft all have cloud nodes.",
      En: "Geothermal energy meets 47% of electricity demand. Climate adaptation policy advanced vs. peers. Drought risk in ASAL counties.",
      L: "Arbitration Act 2025 reform passed. IP framework improving. Land tenure complexity remains highest barrier to entry for real estate.",
      IR: "B-READY Rank #4 Sub-Saharan Africa. Strong on regulatory quality. Weak on starting a business (bureaucratic lag). Improving.",
    },
    risks: [
      { category:"Political", risk:"2027 election cycle uncertainty", likelihood:"Medium", impact:"Medium", mitigation:"Structure exit clauses in JV agreements; monitor from Jan 2027." },
      { category:"Economic", risk:"External debt servicing pressure", likelihood:"Medium", impact:"High", mitigation:"USD-denominated contracts with KES indexing; hedge via local bank instruments." },
      { category:"Regulatory", risk:"Fintech regulatory overhang", likelihood:"Low", impact:"High", mitigation:"Engage CBK regulatory sandbox early; join Kenya Bankers Association working group." },
      { category:"Social", risk:"Gen-Z political mobilisation", likelihood:"Medium", impact:"Medium", mitigation:"Community benefit commitments; hire local talent at 60%+ threshold." },
    ],
    sectors: [
      { name:"Fintech / Mobile Money", score:91, verdict:"enter" },
      { name:"Agri-tech & Food Processing", score:82, verdict:"enter" },
      { name:"Clean Energy / Geothermal", score:79, verdict:"enter" },
      { name:"Logistics & Port Infrastructure", score:75, verdict:"enter" },
      { name:"Healthcare & MedTech", score:71, verdict:"enter" },
      { name:"Real Estate / PropTech", score:62, verdict:"watch" },
      { name:"Mining & Extractives", score:55, verdict:"watch" },
    ],
    timeline: [
      { date:"Aug 2026", text:"IMF 5th review — disbursement $410M expected", type:"positive" },
      { date:"Oct 2026", text:"NSE REIT rules effective — property market opens", type:"positive" },
      { date:"Jan 2027", text:"Pre-election political risk window opens", type:"warning" },
      { date:"Aug 2027", text:"General Election", type:"critical" },
    ],
    signals: [
      { dim:"T", text:"CBK approves digital lending framework revision — reduces KYC friction for fintechs.", impact:"pos", impactText:"▲ Fintech entry readiness up", source:"CBK Official Gazette", time:"2h ago" },
      { dim:"P", text:"Treasury CS signals supplementary budget focused on infrastructure.", impact:"pos", impactText:"▲ Positive for infra investors", source:"Business Daily Africa", time:"4h ago" },
      { dim:"E", text:"KES strengthened 2.1% vs USD on IMF review completion.", impact:"pos", impactText:"▲ Currency stability signal", source:"Reuters Africa", time:"6h ago" },
      { dim:"P", text:"Opposition coalition announces boycott in 12 county assemblies.", impact:"neg", impactText:"▼ Minor political friction", source:"The Standard", time:"3d ago" },
    ],
  },
  {
    code: "GHA", flag: "🇬🇭", name: "Ghana", region: "West Africa",
    population: "34M", capital: "Accra", currency: "GHS",
    gdp: "$72B", fdi: "$580M",
    pestel: 76, irs: 71, change30d: 0.5, trend: [58,60,62,65,67,70,72,73,76],
    verdict: "buy",
    macroSummary: "Ghana is the natural AfCFTA gateway into West Africa and ECOWAS's most business-friendly market. IMF program stabilising after 2023 debt restructuring. Strong democratic tradition; 2024 election transition completed peacefully. Cocoa value chain modernisation creating agri-tech openings. Currency volatility the primary risk for USD-exposed investors.",
    opportunities: ["AfCFTA trade gateway", "Cocoa value chain tech", "Oil & gas services", "Fintech & mobile banking", "Film & creative economy"],
    pestelBreak: { P:78, E:65, S:76, T:72, En:68, L:75, IR:71 },
    pestelSnippets: {
      P: "8th successive peaceful election. Mahama administration focused on economic recovery. Strong democratic institutions.",
      E: "Post-restructuring recovery underway. Cedi stabilising. IMF Extended Credit Facility on track. Oil revenues recovering.",
      S: "High mobile penetration. Growing middle class. Accra a regional cultural hub. Youth unemployment elevated.",
      T: "Accra Tech Hub emerging. E-Levy mobile money framework established. Weak rural connectivity outside Accra/Kumasi.",
      En: "Coastal flooding risk growing. Artisanal mining (galamsey) damaging water systems — ESG risk for investors.",
      L: "Ghana Arbitration Centre functional. Companies Act 2019 modernised. Land registration improving but slow.",
      IR: "B-READY Rank #8 Sub-Saharan Africa. Strong on 'Getting Credit'. Currency hedging complexity adds friction.",
    },
    risks: [
      { category:"Economic", risk:"Currency (GHS) volatility", likelihood:"High", impact:"High", mitigation:"USD/GHS hedging instruments; invoice in USD; retain local GHS float only for opex." },
      { category:"Economic", risk:"IMF program slippage risk", likelihood:"Low", impact:"High", mitigation:"Monitor quarterly IMF review outcomes; build 6-month cash reserve." },
      { category:"Environmental", risk:"Galamsey water contamination — ESG flag", likelihood:"High", impact:"Medium", mitigation:"ESG disclosure: avoid agri supply chains in Ashanti/Western Region without traceability." },
    ],
    sectors: [
      { name:"Trade & Logistics (AfCFTA)", score:85, verdict:"enter" },
      { name:"Agri-tech / Cocoa Chain", score:80, verdict:"enter" },
      { name:"Fintech", score:74, verdict:"enter" },
      { name:"Oil & Gas Services", score:69, verdict:"watch" },
      { name:"Real Estate", score:60, verdict:"watch" },
    ],
    timeline: [
      { date:"Dec 2026", text:"IMF Extended Credit Facility — 4th review", type:"neutral" },
      { date:"Mar 2027", text:"AfCFTA Accra Secretariat Phase 2 protocol ratification", type:"positive" },
      { date:"Dec 2028", text:"Presidential Election", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"GHS holds at 13.2/USD for 3rd consecutive week — IMF stabilisation working.", impact:"pos", impactText:"▲ Currency risk reducing", source:"BoG", time:"1d ago" },
      { dim:"IR", text:"Ghana climbs 3 places in AfDB Ease of Doing Business index 2026.", impact:"pos", impactText:"▲ IRS improving", source:"AfDB", time:"4d ago" },
    ],
  },
  {
    code: "MAR", flag: "🇲🇦", name: "Morocco", region: "North Africa",
    population: "38M", capital: "Rabat", currency: "MAD",
    gdp: "$142B", fdi: "$1.9B",
    pestel: 74, irs: 73, change30d: 2.1, trend: [54,57,60,63,66,68,70,72,74],
    verdict: "buy",
    macroSummary: "Morocco has positioned itself as Africa's bridge to Europe and is the continent's largest automotive manufacturing hub. Green hydrogen strategy targeting EU export market. Strong institutional framework and investment promotion agency (AMDIE). Political system stable under the monarchy. Water scarcity the defining structural risk.",
    opportunities: ["Green hydrogen & renewables export", "Automotive & aerospace manufacturing", "Africa-Europe logistics corridor", "Digital services & nearshoring", "Tourism & hospitality"],
    pestelBreak: { P:70, E:76, S:72, T:75, En:65, L:74, IR:73 },
    pestelSnippets: {
      P: "Constitutional monarchy provides long-term stability. Palace-led reform model. Western Sahara issue managed diplomatically.",
      E: "Largest economy in North Africa ex-Algeria. EU free trade agreement. Automotive exports $10B+ annually.",
      S: "Education reform ongoing. Urban-rural divide significant. French-Arabic bilingual business environment.",
      T: "Casablanca Finance City a regional fintech hub. 5G rollout underway. Strong nearshore digital services sector.",
      En: "Water stress HIGH — agriculture sector dependent on rainfed systems. Renewable energy 42% of mix and rising.",
      L: "Investment Charter 2023 modernised. Arbitration framework functional. IP protection improving.",
      IR: "B-READY Rank #3 North Africa. Strong on market access. Improving on starting a business (online portal).",
    },
    risks: [
      { category:"Environmental", risk:"Water scarcity — structural", likelihood:"High", impact:"High", mitigation:"Avoid water-intensive agriculture investments. Green hydrogen requires seawater desalination strategy." },
      { category:"Political", risk:"Western Sahara sovereignty dispute", likelihood:"Low", impact:"Medium", mitigation:"Avoid projects in disputed territory. Maintain operational base in Rabat/Casablanca." },
    ],
    sectors: [
      { name:"Green Hydrogen & Renewables", score:88, verdict:"enter" },
      { name:"Automotive & Aerospace", score:84, verdict:"enter" },
      { name:"Digital Services / Nearshore", score:82, verdict:"enter" },
      { name:"Logistics & Ports", score:78, verdict:"enter" },
      { name:"Tourism & Hospitality", score:72, verdict:"enter" },
      { name:"Agriculture", score:45, verdict:"avoid" },
    ],
    timeline: [
      { date:"Nov 2026", text:"Morocco-EU Green Hydrogen framework agreement signing", type:"positive" },
      { date:"Jun 2027", text:"Casablanca Finance City Phase 3 expansion", type:"positive" },
    ],
    signals: [
      { dim:"E", text:"Morocco signs 3.2GW green hydrogen offtake agreement with European energy consortium.", impact:"pos", impactText:"▲ Strategic investment signal", source:"AMDIE", time:"2d ago" },
    ],
  },
  {
    code: "SEN", flag: "🇸🇳", name: "Senegal", region: "West Africa",
    population: "18M", capital: "Dakar", currency: "XOF",
    gdp: "$31B", fdi: "$440M",
    pestel: 67, irs: 63, change30d: 4.5, trend: [48,50,52,54,56,58,60,63,67],
    verdict: "buy",
    macroSummary: "Senegal is in the most dynamic window in its investment history following first oil production in 2024. The new Faye-Sonko administration has adopted a pragmatic investment stance. The score is rising rapidly (+4.5 in 30 days) — a rare early-mover window. WAEMU franc stability removes currency hedging complexity.",
    opportunities: ["Oil & gas services (new producer)", "WAEMU financial hub", "Dakar port logistics", "Agriculture & fisheries", "Creative economy & tourism"],
    pestelBreak: { P:65, E:68, S:68, T:60, En:62, L:66, IR:63 },
    pestelSnippets: {
      P: "Democratic transition completed. Faye admin stabilising. Casamance conflict low-level but monitored.",
      E: "First oil producer since 2024. GDP growth acceleration underway. IMF engagement constructive.",
      S: "Young population. Strong Francophone cultural identity. Urban migration to Dakar accelerating.",
      T: "Dakar tech scene emerging. Francophone fintech hub forming. Connectivity improving but rural gap wide.",
      En: "Coastal erosion significant in Dakar region. Groundnut basin drought risk. Offshore oil ESG framework still forming.",
      L: "OHADA legal framework (standardised across 17 West African nations) — significant legal certainty advantage.",
      IR: "Infrastructure gap the primary IRS drag. Regulatory quality improving post-election. OHADA advantage underpriced by investors.",
    },
    risks: [
      { category:"Political", risk:"New administration policy uncertainty", likelihood:"Medium", impact:"Medium", mitigation:"Engage through CNES (employer federation); monitor petroleum code amendments closely." },
      { category:"Infrastructure", risk:"Infrastructure gap vs. ambition", likelihood:"High", impact:"Medium", mitigation:"Factor 2× logistics timeline into project planning; use Dakar as hub, distribute later." },
    ],
    sectors: [
      { name:"Oil & Gas Services", score:84, verdict:"enter" },
      { name:"Port & Trade Logistics", score:77, verdict:"enter" },
      { name:"Agro-processing", score:72, verdict:"enter" },
      { name:"Fintech (WAEMU)", score:68, verdict:"watch" },
      { name:"Tourism", score:65, verdict:"watch" },
    ],
    timeline: [
      { date:"Oct 2026", text:"First Sangomar field full production — 100k bpd target", type:"positive" },
      { date:"Mar 2027", text:"Dakar Port expansion Phase 2 completion", type:"positive" },
    ],
    signals: [
      { dim:"E", text:"Sangomar oil field reaches 80k bpd — ahead of schedule. Government petroleum revenue projections upgraded.", impact:"pos", impactText:"▲ Macro trajectory improving", source:"Petrosen", time:"6h ago" },
      { dim:"IR", text:"Senegal ratifies revised OHADA Uniform Act on Commercial Law — improves contract enforcement.", impact:"pos", impactText:"▲ IRS legal pillar up", source:"OHADA Secretariat", time:"2d ago" },
    ],
  },
  {
    code: "ZAF", flag: "🇿🇦", name: "South Africa", region: "Southern Africa",
    population: "63M", capital: "Pretoria", currency: "ZAR",
    gdp: "$373B", fdi: "$5.2B",
    pestel: 65, irs: 70, change30d: -1.2, trend: [72,70,69,68,67,66,66,65,65],
    verdict: "watch",
    macroSummary: "South Africa remains Africa's most sophisticated financial market but is under structural stress. The GNU coalition is fragile. Load shedding has reduced to Stage 1–2 but infrastructure deficit is systemic. Johannesburg retains its position as Africa's financial capital and the JSE is the continent's only investment-grade exchange. Score declining slowly — monitor before new commitments.",
    opportunities: ["JSE-listed instruments & PE", "Renewable energy (Just Transition)", "Mining technology", "Financial services export", "Film & creative sector"],
    pestelBreak: { P:58, E:66, S:60, T:74, En:55, L:70, IR:70 },
    pestelSnippets: {
      P: "GNU coalition (ANC+DA) fragile. Policy coherence risk if coalition breaks. Ramaphosa era continuity uncertain.",
      E: "Africa's most sophisticated economy. Manufacturing base eroding. Unemployment 33% — structural.",
      S: "Highest inequality globally (Gini 0.63). Service delivery protests ongoing. Crime remains deterrent for FDI.",
      T: "Strongest tech talent base in Africa. Cape Town a credible AI/data hub. Connectivity world-class.",
      En: "Load shedding reduced but grid fragile. Coal transition politically complex. Water infrastructure deteriorating.",
      L: "Constitutional Court independent and respected. Contract enforcement strong. BEE compliance adds complexity.",
      IR: "JSE and financial infrastructure world-class. BEE/BBBEE compliance is the primary IRS friction point.",
    },
    risks: [
      { category:"Political", risk:"GNU coalition breakdown", likelihood:"Medium", impact:"High", mitigation:"Diversify SA exposure across sectors; maintain ZAR hedge; watch Q3 2027 budget vote." },
      { category:"Infrastructure", risk:"Grid instability (load shedding)", likelihood:"Medium", impact:"High", mitigation:"Procure onsite solar + battery backup; add generator capex to project budgets." },
      { category:"Social", risk:"Crime & security cost", likelihood:"High", impact:"Medium", mitigation:"Factor 3-5% security premium into opex; locate in secure business parks." },
    ],
    sectors: [
      { name:"Financial Services (JSE)", score:82, verdict:"enter" },
      { name:"Mining Technology", score:77, verdict:"enter" },
      { name:"Renewable Energy (IPP)", score:74, verdict:"enter" },
      { name:"Tech & Digital Services", score:70, verdict:"enter" },
      { name:"Manufacturing", score:52, verdict:"watch" },
      { name:"Retail & Consumer", score:48, verdict:"watch" },
    ],
    timeline: [
      { date:"Nov 2026", text:"Medium Term Budget Policy Statement — GNU coalition fiscal test", type:"warning" },
      { date:"May 2027", text:"Eskom grid stability review — load shedding Stage 0 target", type:"neutral" },
      { date:"May 2029", text:"General Election", type:"neutral" },
    ],
    signals: [
      { dim:"P", text:"DA withdraws from GNU budget subcommittee — coalition tension rising.", impact:"neg", impactText:"▼ Political risk elevated", source:"Daily Maverick", time:"1d ago" },
      { dim:"En", text:"Eskom announces 60-day load shedding Stage 0 — grid stability improving.", impact:"pos", impactText:"▲ Infrastructure risk reduced", source:"Eskom", time:"3d ago" },
    ],
  },
  {
    code: "ETH", flag: "🇪🇹", name: "Ethiopia", region: "East Africa",
    population: "128M", capital: "Addis Ababa", currency: "ETB",
    gdp: "$156B", fdi: "$890M",
    pestel: 58, irs: 52, change30d: -3.1, trend: [68,65,62,58,55,53,52,54,58],
    verdict: "watch",
    macroSummary: "Ethiopia is Africa's 2nd largest population and a manufacturing powerhouse (industrial parks model), but PESTEL score has declined sharply from 2022 highs due to post-Tigray reconstruction complexity and ethnic tension in Amhara and Oromia regions. Score stabilising in 2026. The risk-reward profile suits patient capital with 5+ year horizon.",
    opportunities: ["Industrial parks & manufacturing", "Agro-processing (coffee, cut flowers)", "Addis logistics hub", "Hydropower & clean energy", "Telecoms (post-liberalisation)"],
    pestelBreak: { P:48, E:60, S:58, T:55, En:65, L:52, IR:52 },
    pestelSnippets: {
      P: "Post-Tigray reconstruction ongoing. Amhara region instability persisting. Abiy admin under pressure. Monitor sub-national conflict signals.",
      E: "Largest manufacturing FDI destination in Africa (2019–2022). Industrial parks model working. IMF program being negotiated.",
      S: "Second largest population in Africa. Ethnic federalism creates social complexity. Addis Ababa cosmopolitan and safe.",
      T: "Ethio Telecom monopoly broken — Safaricom entry. Addis tech scene emerging slowly.",
      En: "GERD hydropower online — energy security improving. Coffee belt climate change risk growing.",
      L: "Legal framework improving but enforcement inconsistent outside Addis. FX repatriation restrictions easing.",
      IR: "B-READY improving but FX controls and repatriation restrictions the key IRS drags.",
    },
    risks: [
      { category:"Political", risk:"Sub-national armed conflict (Amhara/Oromia)", likelihood:"Medium", impact:"High", mitigation:"Operational base Addis only; avoid supply chain through conflict zones." },
      { category:"Economic", risk:"FX shortage and repatriation restrictions", likelihood:"High", impact:"High", mitigation:"Negotiate FX repatriation terms in investment agreement before commitment." },
    ],
    sectors: [
      { name:"Manufacturing & Industrial Parks", score:72, verdict:"enter" },
      { name:"Agro-processing", score:68, verdict:"watch" },
      { name:"Telecoms", score:62, verdict:"watch" },
      { name:"Hydropower & Energy", score:60, verdict:"watch" },
      { name:"Financial Services", score:44, verdict:"avoid" },
    ],
    timeline: [
      { date:"Dec 2026", text:"IMF Extended Credit Facility negotiations expected to conclude", type:"neutral" },
      { date:"Jun 2027", text:"Addis Industrial Parks Phase 3 — 50k jobs target", type:"positive" },
    ],
    signals: [
      { dim:"P", text:"Amhara regional government signs peace framework with federal forces.", impact:"pos", impactText:"▲ Conflict risk reducing", source:"Ethiopian Herald", time:"2d ago" },
      { dim:"E", text:"IMF staff-level agreement reached on $3.4B ECF program.", impact:"pos", impactText:"▲ Macro stability signal", source:"IMF Press Release", time:"4d ago" },
    ],
  },
  {
    code: "NGA", flag: "🇳🇬", name: "Nigeria", region: "West Africa",
    population: "220M", capital: "Abuja", currency: "NGN",
    gdp: "$477B", fdi: "$2.1B",
    pestel: 55, irs: 50, change30d: 1.5, trend: [52,50,48,50,52,53,54,53,55],
    verdict: "watch",
    macroSummary: "Nigeria is Africa's largest economy by GDP and largest market by population, but persistent structural challenges — naira volatility, security patchwork, regulatory complexity — create a high risk-high reward profile. The Tinubu reform agenda (fuel subsidy removal, FX unification) has improved fundamentals. Score trending up from 2023 lows. Lagos fintech ecosystem is world-class.",
    opportunities: ["Lagos fintech unicorn ecosystem", "Oil & gas (upstream)", "Consumer market (220M)", "Media & entertainment (Nollywood)", "Agriculture (rice, cassava, palm oil)"],
    pestelBreak: { P:50, E:55, S:60, T:65, En:52, L:48, IR:50 },
    pestelSnippets: {
      P: "Federal structure creates sub-national complexity. Tinubu admin reform agenda underway. Security patchwork in North/Delta regions.",
      E: "Largest GDP in Africa. FX unification 2023 — naira stabilising. Fuel subsidy removal positive for fiscal position.",
      S: "220M population; 43M in Lagos metro alone. Middle class growing. Japa (emigration) brain drain a concern.",
      T: "Lagos is Africa's #2 tech hub. 5 unicorns and counting. Mobile money lagging Kenya but catching up.",
      En: "Oil spillage ESG risk in Niger Delta. Climate adaptation policy weak. Flooding in Lagos/Kano recurrent.",
      L: "Legal system overloaded; 5-10 year dispute timelines common. Lagos State courts faster. Arbitration improving.",
      IR: "Starting a business improved. Getting Credit strong. Enforcement and insolvency the IRS weak points.",
    },
    risks: [
      { category:"Economic", risk:"NGN exchange rate volatility", likelihood:"High", impact:"High", mitigation:"USD-denominated revenue structures; onshore NGN exposure for opex only." },
      { category:"Security", risk:"Regional insecurity (North, Delta)", likelihood:"High", impact:"High", mitigation:"Operate from Lagos/Abuja; engage specialist security intelligence; avoid North-East." },
      { category:"Regulatory", risk:"Multiple regulatory body friction", likelihood:"High", impact:"Medium", mitigation:"Hire experienced Lagos-based regulatory counsel before entry; allow 18-month licensing timeline." },
    ],
    sectors: [
      { name:"Fintech / Payments", score:82, verdict:"enter" },
      { name:"Consumer & FMCG", score:72, verdict:"enter" },
      { name:"Media & Entertainment", score:68, verdict:"watch" },
      { name:"Oil & Gas Services", score:62, verdict:"watch" },
      { name:"Agriculture", score:58, verdict:"watch" },
      { name:"Manufacturing", score:42, verdict:"avoid" },
    ],
    timeline: [
      { date:"Sep 2026", text:"NNPC gas pipeline to Ghana — regional energy integration", type:"positive" },
      { date:"Feb 2027", text:"CBN digital currency (eNaira) Phase 2 rollout", type:"neutral" },
      { date:"Feb 2027", text:"Governorship elections in key states", type:"warning" },
    ],
    signals: [
      { dim:"E", text:"NGN holds at 1,540/USD for 4th week — CBN intervention working.", impact:"pos", impactText:"▲ Currency stabilising", source:"CBN", time:"1d ago" },
      { dim:"T", text:"Flutterwave raises $250M Series E — signals Lagos ecosystem confidence.", impact:"pos", impactText:"▲ Fintech sector strength", source:"TechCabal", time:"3d ago" },
    ],
  },
  {
    code: "TZA", flag: "🇹🇿", name: "Tanzania", region: "East Africa",
    population: "65M", capital: "Dodoma", currency: "TZS",
    gdp: "$79B", fdi: "$910M",
    pestel: 68, irs: 65, change30d: -0.8, trend: [60,62,64,65,67,68,67,66,68],
    verdict: "watch",
    macroSummary: "Tanzania has significant resource endowments (gold, gas, tourism) and a large agricultural sector, but governance opacity and FX controls create friction for foreign investors. Hassan administration has been more investor-friendly than Magufuli era. Score slightly declining on governance signals. Natural gas project (LNG) represents a generational investment opportunity if negotiations resolve.",
    opportunities: ["LNG development (offshore gas)", "Gold & mineral extraction", "Tourism (Serengeti/Zanzibar)", "Agriculture & agro-processing", "Dar es Salaam port logistics"],
    pestelBreak: { P:62, E:68, S:70, T:64, En:72, L:60, IR:65 },
    pestelSnippets: {
      P: "Hassan admin more investor-friendly than predecessor. Single-party dominance (CCM) provides continuity but limits accountability.",
      E: "GDP growth 5.5%. Resource-driven but diversifying. FX controls on repatriation remain a concern.",
      S: "Young population. High agricultural employment (65%). Dar es Salaam urbanisation rapid.",
      T: "Mobile penetration high. M-Pesa Tanzania growing. Tech ecosystem embryonic outside Dar.",
      En: "High biodiversity — tourism asset but conservation obligation. Kilimanjaro glacial retreat a climate signal.",
      L: "Land acquisition legal framework complex for foreign investors. Mining code renegotiations create retrospective risk.",
      IR: "FX repatriation restrictions the key IRS drag. Land tenure and local content rules add compliance layer.",
    },
    risks: [
      { category:"Regulatory", risk:"FX repatriation restrictions", likelihood:"High", impact:"High", mitigation:"Negotiate repatriation terms in Investment Agreement via TIC before commitment." },
      { category:"Political", risk:"Mining code renegotiation precedent", likelihood:"Medium", impact:"High", mitigation:"Structure concession agreements with international arbitration clause (ICSID)." },
    ],
    sectors: [
      { name:"LNG / Natural Gas", score:74, verdict:"watch" },
      { name:"Mining (Gold)", score:70, verdict:"watch" },
      { name:"Tourism", score:78, verdict:"enter" },
      { name:"Agriculture & Agro-processing", score:68, verdict:"watch" },
      { name:"Port Logistics", score:65, verdict:"watch" },
    ],
    timeline: [
      { date:"Dec 2026", text:"LNG project Final Investment Decision expected", type:"neutral" },
      { date:"Oct 2025", text:"General Election (Hassan re-election expected)", type:"neutral" },
    ],
    signals: [
      { dim:"IR", text:"TIC (Tanzania Investment Centre) launches online one-stop permit portal — reduces bureaucracy.", impact:"pos", impactText:"▲ IRS improving", source:"TIC", time:"1w ago" },
    ],
  },
  {
    code: "COD", flag: "🇨🇩", name: "DR Congo", region: "Central Africa",
    population: "105M", capital: "Kinshasa", currency: "CDF",
    gdp: "$65B", fdi: "$1.1B",
    pestel: 32, irs: 28, change30d: -2.0, trend: [35,34,33,32,31,30,29,28,32],
    verdict: "avoid",
    macroSummary: "DRC holds an estimated $24 trillion in critical mineral wealth — the highest per-capita resource endowment of any nation on earth — but chronic conflict, governance failure, and infrastructure void make it one of the most challenging investment environments globally. Score declining. Active conflict in eastern DRC (M23/FARDC) is the primary risk. Specialist operators (mining majors, humanitarian orgs) are the current viable investor class.",
    opportunities: ["Critical minerals (cobalt, coltan, lithium)", "Hydropower (Inga potential)", "Kinshasa consumer market (18M)", "Telecoms (large underserved market)"],
    pestelBreak: { P:25, E:35, S:38, T:28, En:45, L:24, IR:28 },
    pestelSnippets: {
      P: "Active armed conflict in eastern provinces. Tshisekedi re-elected 2023 (disputed). Governance institutions deeply fragile.",
      E: "Mineral exports (cobalt 70% of global supply) provide revenue. But Dutch Disease effects limit non-extractive economy.",
      S: "105M population — largest Francophone nation. Kinshasa is a major city. Rural access near-impossible.",
      T: "Mobile penetration growing rapidly. M-Pesa DRC a success story. Otherwise tech infrastructure minimal.",
      En: "Congo Basin — world's second largest tropical forest. Carbon credit potential enormous but governance blocks realisation.",
      L: "Legal system non-functional outside Kinshasa. Contract enforcement near-zero in conflict zones. OHADA member — paper only.",
      IR: "Infrastructure void is the defining IRS factor. No functioning road network outside main corridors. Power grid absent in most of country.",
    },
    risks: [
      { category:"Security", risk:"Active armed conflict — eastern provinces", likelihood:"High", impact:"Critical", mitigation:"Operations only in Kinshasa and established mining corridors with private security. Not viable for most investor classes." },
      { category:"Governance", risk:"Contract enforcement void", likelihood:"High", impact:"Critical", mitigation:"ICSID arbitration clause mandatory. Expect 3–5 year dispute timelines even with clause." },
    ],
    sectors: [
      { name:"Critical Minerals (Majors only)", score:45, verdict:"watch" },
      { name:"Telecoms", score:40, verdict:"watch" },
      { name:"Hydropower (Long horizon)", score:38, verdict:"avoid" },
      { name:"Consumer / FMCG", score:28, verdict:"avoid" },
      { name:"Financial Services", score:22, verdict:"avoid" },
    ],
    timeline: [
      { date:"Ongoing", text:"M23 ceasefire negotiations (AU-mediated)", type:"critical" },
      { date:"Dec 2028", text:"Presidential Election", type:"neutral" },
    ],
    signals: [
      { dim:"P", text:"M23 ceasefire holds for 14 days — longest pause in 18 months.", impact:"neu", impactText:"→ Monitor; fragile", source:"AU Commission", time:"3d ago" },
    ],
  },
];

export const REGIONS = ["All Africa", "East Africa", "West Africa", "Southern Africa", "North Africa", "Central Africa"];
export const SECTORS = ["All Sectors", "Fintech", "Energy", "Agriculture", "Infrastructure", "Manufacturing"];
