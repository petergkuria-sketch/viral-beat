// Kenya Political Data - Executive, Parliament, Senate

export interface ExecutiveMember {
  id: number;
  name: string;
  title: string;
  position: 'president' | 'deputy_president' | 'prime_cabinet_secretary' | 'cabinet_secretary' | 'attorney_general' | 'secretary_cabinet';
  ministry?: string;
  party: string;
  county: string;
  imageUrl?: string;
  sentiment: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ParliamentMember {
  id: number;
  name: string;
  memberType: 'constituency' | 'women_rep' | 'nominated';
  constituency?: string;
  county: string;
  party: string;
  coalition: 'Kenya Kwanza' | 'Azimio' | 'Independent';
  sentiment: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SenateMember {
  id: number;
  name: string;
  memberType: 'elected' | 'women_nominated' | 'youth' | 'pwd';
  county: string;
  party: string;
  coalition: 'Kenya Kwanza' | 'Azimio' | 'Independent';
  sentiment: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ElectionPhase {
  id: string;
  name: string;
  type: 'pre_election' | 'campaign' | 'local_mobilization' | 'election_day' | 'post_election';
  description: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

// Executive Branch Data
export const executiveMembers: ExecutiveMember[] = [
  {
    id: 1,
    name: "William Samoei Ruto",
    title: "President of the Republic of Kenya",
    position: "president",
    party: "UDA",
    county: "Uasin Gishu",
    imageUrl: "/images/ruto.jpg",
    sentiment: 45,
    trend: "down"
  },
  {
    id: 2,
    name: "Prof. Kithure Kindiki",
    title: "Deputy President",
    position: "deputy_president",
    party: "UDA",
    county: "Tharaka Nithi",
    imageUrl: "/images/kindiki.jpg",
    sentiment: 52,
    trend: "up"
  },
  {
    id: 3,
    name: "Dr. Musalia Mudavadi",
    title: "Prime Cabinet Secretary",
    position: "prime_cabinet_secretary",
    ministry: "Foreign and Diaspora Affairs",
    party: "ANC",
    county: "Vihiga",
    sentiment: 48,
    trend: "stable"
  },
  {
    id: 4,
    name: "Onesimus Kipchumba Murkomen",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Interior and National Administration",
    party: "UDA",
    county: "Elgeyo Marakwet",
    sentiment: 38,
    trend: "down"
  },
  {
    id: 5,
    name: "Davis Chirchir",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Roads and Transport",
    party: "UDA",
    county: "Uasin Gishu",
    sentiment: 42,
    trend: "stable"
  },
  {
    id: 6,
    name: "Hassan Ali Joho",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Mining, Blue Economy and Maritime Affairs",
    party: "ODM",
    county: "Mombasa",
    sentiment: 55,
    trend: "up"
  },
  {
    id: 7,
    name: "Aden Duale",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Health",
    party: "UDA",
    county: "Garissa",
    sentiment: 35,
    trend: "down"
  },
  {
    id: 8,
    name: "Alice Wahome",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Lands, Public Works, Housing and Urban Development",
    party: "UDA",
    county: "Murang'a",
    sentiment: 41,
    trend: "stable"
  },
  {
    id: 9,
    name: "Dr. Alfred Mutua",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Labour and Social Protection",
    party: "Maendeleo Chap Chap",
    county: "Machakos",
    sentiment: 47,
    trend: "up"
  },
  {
    id: 10,
    name: "Julius Migos Ogamba",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Education",
    party: "UDA",
    county: "Kisii",
    sentiment: 39,
    trend: "down"
  },
  {
    id: 11,
    name: "Rebecca Miano",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Tourism and Wildlife",
    party: "Jubilee",
    county: "Meru",
    sentiment: 51,
    trend: "up"
  },
  {
    id: 12,
    name: "Salim Mvurya",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Youth Affairs, Creative Economy and Sports",
    party: "UDA",
    county: "Kwale",
    sentiment: 44,
    trend: "stable"
  },
  {
    id: 13,
    name: "Roselinda Soipan Tuya",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Defence",
    party: "UDA",
    county: "Narok",
    sentiment: 53,
    trend: "up"
  },
  {
    id: 14,
    name: "Wycliffe Ambetsa Oparanya",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Co-operatives and MSMEs Development",
    party: "ODM",
    county: "Kakamega",
    sentiment: 49,
    trend: "stable"
  },
  {
    id: 15,
    name: "John Mbadi Ng'ongo",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "National Treasury and Economic Planning",
    party: "ODM",
    county: "Homa Bay",
    sentiment: 36,
    trend: "down"
  },
  {
    id: 16,
    name: "Eric Muriithi Muuga",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Water, Sanitation and Irrigation",
    party: "UDA",
    county: "Meru",
    sentiment: 43,
    trend: "stable"
  },
  {
    id: 17,
    name: "Dr. Deborah Mulongo Barasa",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Environment, Climate Change & Forestry",
    party: "FORD-K",
    county: "Bungoma",
    sentiment: 46,
    trend: "up"
  },
  {
    id: 18,
    name: "Lee Maiyani Kinyanjui",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Investments, Trade and Industry",
    party: "Jubilee",
    county: "Nakuru",
    sentiment: 50,
    trend: "up"
  },
  {
    id: 19,
    name: "Mutahi Kagwe",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Agriculture and Livestock Development",
    party: "Jubilee",
    county: "Nyeri",
    sentiment: 54,
    trend: "up"
  },
  {
    id: 20,
    name: "James Opiyo Wandayi",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Energy and Petroleum",
    party: "ODM",
    county: "Siaya",
    sentiment: 47,
    trend: "stable"
  },
  {
    id: 21,
    name: "William Kabogo Gitau",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Information Communication and the Digital Economy",
    party: "Tujibebe",
    county: "Kiambu",
    sentiment: 40,
    trend: "down"
  },
  {
    id: 22,
    name: "Geoffrey Kiringa Ruku",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Public Service and Human Capital Development",
    party: "UDA",
    county: "Embu",
    sentiment: 45,
    trend: "stable"
  },
  {
    id: 23,
    name: "Ms. Beatrice Asukul Moe",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "East Africa Community and Regional Affairs",
    party: "UDA",
    county: "Turkana",
    sentiment: 48,
    trend: "up"
  },
  {
    id: 24,
    name: "Hanna Wendot Cheptumo",
    title: "Cabinet Secretary",
    position: "cabinet_secretary",
    ministry: "Gender",
    party: "UDA",
    county: "Baringo",
    sentiment: 44,
    trend: "stable"
  },
  {
    id: 25,
    name: "Ms. Dorcas Agik Oduor",
    title: "Attorney-General",
    position: "attorney_general",
    party: "Independent",
    county: "Siaya",
    sentiment: 52,
    trend: "stable"
  }
];

// Sample Senate Members (47 Counties)
export const senateMembers: SenateMember[] = [
  { id: 1, name: "Sen. Mohamed Faki", memberType: "elected", county: "Mombasa", party: "ODM", coalition: "Azimio", sentiment: 48, trend: "stable" },
  { id: 2, name: "Sen. Mwinyihaji Faki", memberType: "elected", county: "Kwale", party: "ODM", coalition: "Azimio", sentiment: 45, trend: "down" },
  { id: 3, name: "Sen. Stewart Madzayo", memberType: "elected", county: "Kilifi", party: "ODM", coalition: "Azimio", sentiment: 52, trend: "up" },
  { id: 4, name: "Sen. Danson Mungatana", memberType: "elected", county: "Tana River", party: "UDA", coalition: "Kenya Kwanza", sentiment: 47, trend: "stable" },
  { id: 5, name: "Sen. Anwar Loitiptip", memberType: "elected", county: "Lamu", party: "UDA", coalition: "Kenya Kwanza", sentiment: 41, trend: "down" },
  { id: 6, name: "Sen. Johnes Mwaruma", memberType: "elected", county: "Taita Taveta", party: "Wiper", coalition: "Azimio", sentiment: 49, trend: "up" },
  { id: 7, name: "Sen. Abdulkadir Haji", memberType: "elected", county: "Garissa", party: "UDA", coalition: "Kenya Kwanza", sentiment: 53, trend: "up" },
  { id: 8, name: "Sen. Ali Roba", memberType: "elected", county: "Mandera", party: "UDA", coalition: "Kenya Kwanza", sentiment: 46, trend: "stable" },
  { id: 9, name: "Sen. Mohamed Chute", memberType: "elected", county: "Marsabit", party: "UDA", coalition: "Kenya Kwanza", sentiment: 44, trend: "down" },
  { id: 10, name: "Sen. Fatuma Dullo", memberType: "elected", county: "Isiolo", party: "Jubilee", coalition: "Azimio", sentiment: 50, trend: "up" },
  { id: 11, name: "Sen. Kathuri Murungi", memberType: "elected", county: "Meru", party: "UDA", coalition: "Kenya Kwanza", sentiment: 55, trend: "up" },
  { id: 12, name: "Sen. Mwenda Gataya", memberType: "elected", county: "Tharaka Nithi", party: "UDA", coalition: "Kenya Kwanza", sentiment: 48, trend: "stable" },
  { id: 13, name: "Sen. Alexander Mundigi", memberType: "elected", county: "Embu", party: "UDA", coalition: "Kenya Kwanza", sentiment: 47, trend: "stable" },
  { id: 14, name: "Sen. Enoch Wambua", memberType: "elected", county: "Kitui", party: "Wiper", coalition: "Azimio", sentiment: 51, trend: "up" },
  { id: 15, name: "Sen. Agnes Kavindu", memberType: "elected", county: "Machakos", party: "Wiper", coalition: "Azimio", sentiment: 54, trend: "up" },
  { id: 16, name: "Sen. Dan Maanzo", memberType: "elected", county: "Makueni", party: "Wiper", coalition: "Azimio", sentiment: 49, trend: "stable" },
  { id: 17, name: "Sen. John Methu", memberType: "elected", county: "Nyandarua", party: "UDA", coalition: "Kenya Kwanza", sentiment: 43, trend: "down" },
  { id: 18, name: "Sen. Wahome Wamatinga", memberType: "elected", county: "Nyeri", party: "UDA", coalition: "Kenya Kwanza", sentiment: 46, trend: "stable" },
  { id: 19, name: "Sen. James Murango", memberType: "elected", county: "Kirinyaga", party: "UDA", coalition: "Kenya Kwanza", sentiment: 42, trend: "down" },
  { id: 20, name: "Sen. Joe Nyutu", memberType: "elected", county: "Murang'a", party: "UDA", coalition: "Kenya Kwanza", sentiment: 45, trend: "stable" },
  { id: 21, name: "Sen. Karungo wa Thangwa", memberType: "elected", county: "Kiambu", party: "UDA", coalition: "Kenya Kwanza", sentiment: 38, trend: "down" },
  { id: 22, name: "Sen. James Lomenen", memberType: "elected", county: "Turkana", party: "UDA", coalition: "Kenya Kwanza", sentiment: 47, trend: "stable" },
  { id: 23, name: "Sen. Julius Murgor", memberType: "elected", county: "West Pokot", party: "UDA", coalition: "Kenya Kwanza", sentiment: 50, trend: "up" },
  { id: 24, name: "Sen. Steve Lelegwe", memberType: "elected", county: "Samburu", party: "UDA", coalition: "Kenya Kwanza", sentiment: 44, trend: "stable" },
  { id: 25, name: "Sen. Allan Chesang", memberType: "elected", county: "Trans Nzoia", party: "UDA", coalition: "Kenya Kwanza", sentiment: 48, trend: "up" },
  { id: 26, name: "Sen. Jackson Mandago", memberType: "elected", county: "Uasin Gishu", party: "UDA", coalition: "Kenya Kwanza", sentiment: 52, trend: "up" },
  { id: 27, name: "Sen. Samson Cherargei", memberType: "elected", county: "Nandi", party: "UDA", coalition: "Kenya Kwanza", sentiment: 41, trend: "down" },
  { id: 28, name: "Sen. William Cheptumo", memberType: "elected", county: "Baringo", party: "UDA", coalition: "Kenya Kwanza", sentiment: 46, trend: "stable" },
  { id: 29, name: "Sen. John Kinyua", memberType: "elected", county: "Laikipia", party: "UDA", coalition: "Kenya Kwanza", sentiment: 49, trend: "up" },
  { id: 30, name: "Sen. Tabitha Karanja", memberType: "elected", county: "Nakuru", party: "UDA", coalition: "Kenya Kwanza", sentiment: 53, trend: "up" },
  { id: 31, name: "Sen. Ledama ole Kina", memberType: "elected", county: "Narok", party: "ODM", coalition: "Azimio", sentiment: 56, trend: "up" },
  { id: 32, name: "Sen. Seki Lenku", memberType: "elected", county: "Kajiado", party: "UDA", coalition: "Kenya Kwanza", sentiment: 45, trend: "stable" },
  { id: 33, name: "Sen. Aaron Cheruiyot", memberType: "elected", county: "Kericho", party: "UDA", coalition: "Kenya Kwanza", sentiment: 47, trend: "stable" },
  { id: 34, name: "Sen. Hillary Sigei", memberType: "elected", county: "Bomet", party: "UDA", coalition: "Kenya Kwanza", sentiment: 44, trend: "down" },
  { id: 35, name: "Sen. Boni Khalwale", memberType: "elected", county: "Kakamega", party: "UDA", coalition: "Kenya Kwanza", sentiment: 51, trend: "up" },
  { id: 36, name: "Sen. Godfrey Osotsi", memberType: "elected", county: "Vihiga", party: "DAP-K", coalition: "Azimio", sentiment: 48, trend: "stable" },
  { id: 37, name: "Sen. Wafula Wakoli", memberType: "elected", county: "Bungoma", party: "FORD-K", coalition: "Kenya Kwanza", sentiment: 46, trend: "stable" },
  { id: 38, name: "Sen. Okiya Omtatah", memberType: "elected", county: "Busia", party: "Independent", coalition: "Independent", sentiment: 62, trend: "up" },
  { id: 39, name: "Sen. Oburu Oginga", memberType: "elected", county: "Siaya", party: "ODM", coalition: "Azimio", sentiment: 54, trend: "up" },
  { id: 40, name: "Sen. Tom Ojienda", memberType: "elected", county: "Kisumu", party: "ODM", coalition: "Azimio", sentiment: 57, trend: "up" },
  { id: 41, name: "Sen. Moses Kajwang", memberType: "elected", county: "Homa Bay", party: "ODM", coalition: "Azimio", sentiment: 55, trend: "up" },
  { id: 42, name: "Sen. Eddy Oketch", memberType: "elected", county: "Migori", party: "ODM", coalition: "Azimio", sentiment: 52, trend: "stable" },
  { id: 43, name: "Sen. Richard Onyonka", memberType: "elected", county: "Kisii", party: "ODM", coalition: "Azimio", sentiment: 49, trend: "stable" },
  { id: 44, name: "Sen. Erick Okong'o", memberType: "elected", county: "Nyamira", party: "ODM", coalition: "Azimio", sentiment: 47, trend: "stable" },
  { id: 45, name: "Sen. Abdul Haji", memberType: "elected", county: "Wajir", party: "UDA", coalition: "Kenya Kwanza", sentiment: 50, trend: "up" },
  { id: 46, name: "Sen. Beatrice Ogola", memberType: "elected", county: "Elgeyo Marakwet", party: "UDA", coalition: "Kenya Kwanza", sentiment: 48, trend: "stable" },
  { id: 47, name: "Sen. Edwin Sifuna", memberType: "elected", county: "Nairobi", party: "ODM", coalition: "Azimio", sentiment: 58, trend: "up" }
];

// Election Phases
export const electionPhases: ElectionPhase[] = [
  {
    id: "pre_election",
    name: "Pre-Election Phase",
    type: "pre_election",
    description: "Voter registration, party primaries, coalition formation, and candidate vetting period.",
    isActive: false
  },
  {
    id: "campaign",
    name: "Campaign Phase",
    type: "campaign",
    description: "Official campaign period with rallies, media campaigns, debates, and public engagement.",
    isActive: true
  },
  {
    id: "local_mobilization",
    name: "Local Mobilization",
    type: "local_mobilization",
    description: "Grassroots organizing, door-to-door campaigns, community meetings, and get-out-the-vote efforts.",
    isActive: true
  },
  {
    id: "election_day",
    name: "Election Day",
    type: "election_day",
    description: "Voting day monitoring, turnout tracking, and incident reporting.",
    isActive: false
  },
  {
    id: "post_election",
    name: "Post-Election Phase",
    type: "post_election",
    description: "Results announcement, dispute resolution, and transition period monitoring.",
    isActive: false
  }
];

// Kenya Regions for balkanization mapping
export const kenyaRegions = [
  { name: "Coastal", counties: ["Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta"], dominantCoalition: "Azimio" },
  { name: "North Eastern", counties: ["Garissa", "Wajir", "Mandera"], dominantCoalition: "Kenya Kwanza" },
  { name: "Eastern", counties: ["Marsabit", "Isiolo", "Meru", "Tharaka Nithi", "Embu", "Kitui", "Machakos", "Makueni"], dominantCoalition: "Mixed" },
  { name: "Central", counties: ["Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu"], dominantCoalition: "Kenya Kwanza" },
  { name: "Rift Valley", counties: ["Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet"], dominantCoalition: "Kenya Kwanza" },
  { name: "Western", counties: ["Kakamega", "Vihiga", "Bungoma", "Busia"], dominantCoalition: "Mixed" },
  { name: "Nyanza", counties: ["Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira"], dominantCoalition: "Azimio" },
  { name: "Nairobi", counties: ["Nairobi"], dominantCoalition: "Azimio" }
];

// Political Parties
export const politicalParties = [
  { name: "United Democratic Alliance", abbreviation: "UDA", coalition: "Kenya Kwanza", color: "#FFD700", leader: "William Ruto" },
  { name: "Orange Democratic Movement", abbreviation: "ODM", coalition: "Azimio", color: "#FF6600", leader: "Raila Odinga" },
  { name: "Wiper Democratic Movement", abbreviation: "Wiper", coalition: "Azimio", color: "#008000", leader: "Kalonzo Musyoka" },
  { name: "Jubilee Party", abbreviation: "Jubilee", coalition: "Azimio", color: "#FF0000", leader: "Uhuru Kenyatta" },
  { name: "Amani National Congress", abbreviation: "ANC", coalition: "Kenya Kwanza", color: "#0000FF", leader: "Musalia Mudavadi" },
  { name: "FORD-Kenya", abbreviation: "FORD-K", coalition: "Kenya Kwanza", color: "#800080", leader: "Moses Wetangula" },
  { name: "Democratic Action Party", abbreviation: "DAP-K", coalition: "Azimio", color: "#00CED1", leader: "Eugene Wamalwa" },
  { name: "KANU", abbreviation: "KANU", coalition: "Azimio", color: "#006400", leader: "Gideon Moi" }
];

// Sample Parliament Members (first 50 for demo)
export const parliamentMembers: ParliamentMember[] = [
  { id: 1, name: "Hon. Kimani Ichung'wah", memberType: "constituency", constituency: "Kikuyu", county: "Kiambu", party: "UDA", coalition: "Kenya Kwanza", sentiment: 42, trend: "down" },
  { id: 2, name: "Hon. Opiyo Wandayi", memberType: "constituency", constituency: "Ugunja", county: "Siaya", party: "ODM", coalition: "Azimio", sentiment: 55, trend: "up" },
  { id: 3, name: "Hon. Junet Mohamed", memberType: "constituency", constituency: "Suna East", county: "Migori", party: "ODM", coalition: "Azimio", sentiment: 48, trend: "stable" },
  { id: 4, name: "Hon. Aden Duale", memberType: "constituency", constituency: "Garissa Township", county: "Garissa", party: "UDA", coalition: "Kenya Kwanza", sentiment: 35, trend: "down" },
  { id: 5, name: "Hon. Didmus Barasa", memberType: "constituency", constituency: "Kimilili", county: "Bungoma", party: "UDA", coalition: "Kenya Kwanza", sentiment: 38, trend: "down" },
  { id: 6, name: "Hon. John Mbadi", memberType: "constituency", constituency: "Suba South", county: "Homa Bay", party: "ODM", coalition: "Azimio", sentiment: 52, trend: "up" },
  { id: 7, name: "Hon. Millie Odhiambo", memberType: "women_rep", county: "Homa Bay", party: "ODM", coalition: "Azimio", sentiment: 58, trend: "up" },
  { id: 8, name: "Hon. Gathoni Wamuchomba", memberType: "women_rep", county: "Kiambu", party: "UDA", coalition: "Kenya Kwanza", sentiment: 45, trend: "stable" },
  { id: 9, name: "Hon. Sabina Chege", memberType: "women_rep", county: "Murang'a", party: "Jubilee", coalition: "Azimio", sentiment: 51, trend: "up" },
  { id: 10, name: "Hon. Gladys Wanga", memberType: "constituency", constituency: "Homa Bay Town", county: "Homa Bay", party: "ODM", coalition: "Azimio", sentiment: 54, trend: "up" },
  // Add more MPs...
];

// Helper functions
export const getExecutiveByPosition = (position: string) => 
  executiveMembers.filter(m => m.position === position);

export const getSenatorsByCoalition = (coalition: string) => 
  senateMembers.filter(m => m.coalition === coalition);

export const getMPsByCounty = (county: string) => 
  parliamentMembers.filter(m => m.county === county);

export const getRegionByCounty = (county: string) => 
  kenyaRegions.find(r => r.counties.includes(county));

export const calculateCoalitionSupport = () => {
  const kenyaKwanza = senateMembers.filter(m => m.coalition === "Kenya Kwanza").length;
  const azimio = senateMembers.filter(m => m.coalition === "Azimio").length;
  const independent = senateMembers.filter(m => m.coalition === "Independent").length;
  return { kenyaKwanza, azimio, independent };
};
