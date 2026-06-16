// Kenya County Governors Data - All 47 Counties (2022-2027)

export interface Governor {
  id: number;
  name: string;
  county: string;
  countyCode: string;
  party: string;
  coalition: 'Kenya Kwanza' | 'Azimio' | 'Independent';
  region: 'Coast' | 'North Eastern' | 'Eastern' | 'Central' | 'Rift Valley' | 'Western' | 'Nyanza' | 'Nairobi';
  gender: 'Male' | 'Female';
  sentiment: number;
  trend: 'up' | 'down' | 'stable';
  approvalRating: number;
  keyIssues: string[];
}

// Generate random but consistent sentiment data
const generateSentiment = (seed: number): { sentiment: number; trend: 'up' | 'down' | 'stable'; approvalRating: number } => {
  const base = 30 + (seed % 40);
  const sentiment = base + Math.floor((seed * 7) % 20);
  const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable'];
  const trend = trends[seed % 3];
  const approvalRating = Math.min(85, Math.max(25, sentiment + Math.floor((seed * 3) % 15) - 7));
  return { sentiment, trend, approvalRating };
};

export const governors: Governor[] = [
  // Coast Region (6 counties)
  {
    id: 1,
    name: "Abdulswamad Shariff Nassir",
    county: "Mombasa",
    countyCode: "001",
    party: "ODM",
    coalition: "Azimio",
    region: "Coast",
    gender: "Male",
    keyIssues: ["Port operations", "Tourism", "Urban development"],
    ...generateSentiment(1)
  },
  {
    id: 2,
    name: "Fatuma Mohamed Achani",
    county: "Kwale",
    countyCode: "002",
    party: "ODM",
    coalition: "Azimio",
    region: "Coast",
    gender: "Female",
    keyIssues: ["Mining", "Agriculture", "Education"],
    ...generateSentiment(2)
  },
  {
    id: 3,
    name: "Gideon Mung'aro",
    county: "Kilifi",
    countyCode: "003",
    party: "PAA",
    coalition: "Azimio",
    region: "Coast",
    gender: "Male",
    keyIssues: ["Tourism", "Healthcare", "Land rights"],
    ...generateSentiment(3)
  },
  {
    id: 4,
    name: "Dhadho Godhana",
    county: "Tana River",
    countyCode: "004",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Coast",
    gender: "Male",
    keyIssues: ["Pastoralism", "Water access", "Security"],
    ...generateSentiment(4)
  },
  {
    id: 5,
    name: "Issa Timamy",
    county: "Lamu",
    countyCode: "005",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Coast",
    gender: "Male",
    keyIssues: ["LAPSSET project", "Tourism", "Fishing"],
    ...generateSentiment(5)
  },
  {
    id: 6,
    name: "Andrew Mwadime",
    county: "Taita Taveta",
    countyCode: "006",
    party: "Wiper",
    coalition: "Azimio",
    region: "Coast",
    gender: "Male",
    keyIssues: ["Mining", "Wildlife conservation", "Agriculture"],
    ...generateSentiment(6)
  },

  // North Eastern Region (3 counties)
  {
    id: 7,
    name: "Nathif Jama",
    county: "Garissa",
    countyCode: "007",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "North Eastern",
    gender: "Male",
    keyIssues: ["Security", "Livestock", "Infrastructure"],
    ...generateSentiment(7)
  },
  {
    id: 8,
    name: "Ahmed Abdullahi",
    county: "Wajir",
    countyCode: "008",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "North Eastern",
    gender: "Male",
    keyIssues: ["Water scarcity", "Healthcare", "Education"],
    ...generateSentiment(8)
  },
  {
    id: 9,
    name: "Mohamed Khalif",
    county: "Mandera",
    countyCode: "009",
    party: "UDM",
    coalition: "Kenya Kwanza",
    region: "North Eastern",
    gender: "Male",
    keyIssues: ["Security", "Cross-border trade", "Infrastructure"],
    ...generateSentiment(9)
  },

  // Eastern Region (8 counties)
  {
    id: 10,
    name: "Mohamud Ali",
    county: "Marsabit",
    countyCode: "010",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Eastern",
    gender: "Male",
    keyIssues: ["Pastoralism", "Inter-clan conflicts", "Water"],
    ...generateSentiment(10)
  },
  {
    id: 11,
    name: "Abdi Hassan",
    county: "Isiolo",
    countyCode: "011",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Eastern",
    gender: "Male",
    keyIssues: ["LAPSSET", "Tourism", "Livestock"],
    ...generateSentiment(11)
  },
  {
    id: 12,
    name: "Isaac M'ethingia",
    county: "Meru",
    countyCode: "012",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Eastern",
    gender: "Male",
    keyIssues: ["Agriculture", "Miraa trade", "Infrastructure"],
    ...generateSentiment(12)
  },
  {
    id: 13,
    name: "Muthomi Njuki",
    county: "Tharaka Nithi",
    countyCode: "013",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Eastern",
    gender: "Male",
    keyIssues: ["Agriculture", "Education", "Healthcare"],
    ...generateSentiment(13)
  },
  {
    id: 14,
    name: "Cecily Mbarire",
    county: "Embu",
    countyCode: "014",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Eastern",
    gender: "Female",
    keyIssues: ["Agriculture", "Water projects", "Youth employment"],
    ...generateSentiment(14)
  },
  {
    id: 15,
    name: "Julius Malombe",
    county: "Kitui",
    countyCode: "015",
    party: "Wiper",
    coalition: "Azimio",
    region: "Eastern",
    gender: "Male",
    keyIssues: ["Water harvesting", "Agriculture", "Mining"],
    ...generateSentiment(15)
  },
  {
    id: 16,
    name: "Wavinya Ndeti",
    county: "Machakos",
    countyCode: "016",
    party: "Wiper",
    coalition: "Azimio",
    region: "Eastern",
    gender: "Female",
    keyIssues: ["Industrialization", "Water", "Urban planning"],
    ...generateSentiment(16)
  },
  {
    id: 17,
    name: "Mutula Kilonzo Jr",
    county: "Makueni",
    countyCode: "017",
    party: "Wiper",
    coalition: "Azimio",
    region: "Eastern",
    gender: "Male",
    keyIssues: ["Healthcare", "Agriculture", "Water"],
    ...generateSentiment(17)
  },

  // Central Region (5 counties)
  {
    id: 18,
    name: "Moses Badilisha",
    county: "Nyandarua",
    countyCode: "018",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Central",
    gender: "Male",
    keyIssues: ["Dairy farming", "Potato farming", "Roads"],
    ...generateSentiment(18)
  },
  {
    id: 19,
    name: "Mutahi Kahiga",
    county: "Nyeri",
    countyCode: "019",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Central",
    gender: "Male",
    keyIssues: ["Coffee farming", "Tourism", "Healthcare"],
    ...generateSentiment(19)
  },
  {
    id: 20,
    name: "Anne Waiguru",
    county: "Kirinyaga",
    countyCode: "020",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Central",
    gender: "Female",
    keyIssues: ["Rice farming", "Water projects", "Healthcare"],
    ...generateSentiment(20)
  },
  {
    id: 21,
    name: "Irungu Kangata",
    county: "Murang'a",
    countyCode: "021",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Central",
    gender: "Male",
    keyIssues: ["Tea farming", "Avocado export", "Water"],
    ...generateSentiment(21)
  },
  {
    id: 22,
    name: "Kimani Wamatangi",
    county: "Kiambu",
    countyCode: "022",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Central",
    gender: "Male",
    keyIssues: ["Urban development", "Agriculture", "Youth employment"],
    ...generateSentiment(22)
  },

  // Rift Valley Region (14 counties)
  {
    id: 23,
    name: "Jeremiah Lomorukai",
    county: "Turkana",
    countyCode: "023",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Rift Valley",
    gender: "Male",
    keyIssues: ["Oil exploration", "Drought", "Security"],
    ...generateSentiment(23)
  },
  {
    id: 24,
    name: "Simon Kachapin",
    county: "West Pokot",
    countyCode: "024",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Rift Valley",
    gender: "Male",
    keyIssues: ["Security", "Cattle rustling", "Infrastructure"],
    ...generateSentiment(24)
  },
  {
    id: 25,
    name: "Jonathan Lati",
    county: "Samburu",
    countyCode: "025",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Rift Valley",
    gender: "Male",
    keyIssues: ["Pastoralism", "Tourism", "Security"],
    ...generateSentiment(25)
  },
  {
    id: 26,
    name: "George Natembeya",
    county: "Trans Nzoia",
    countyCode: "026",
    party: "DAP-K",
    coalition: "Azimio",
    region: "Rift Valley",
    gender: "Male",
    keyIssues: ["Maize farming", "Land issues", "Education"],
    ...generateSentiment(26)
  },
  {
    id: 27,
    name: "Jonathan Bii",
    county: "Uasin Gishu",
    countyCode: "027",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Rift Valley",
    gender: "Male",
    keyIssues: ["Athletics", "Agriculture", "Urban development"],
    ...generateSentiment(27)
  },
  {
    id: 28,
    name: "Wisley Rotich",
    county: "Elgeyo Marakwet",
    countyCode: "028",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Rift Valley",
    gender: "Male",
    keyIssues: ["Athletics", "Agriculture", "Tourism"],
    ...generateSentiment(28)
  },
  {
    id: 29,
    name: "Stephen Sang",
    county: "Nandi",
    countyCode: "029",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Rift Valley",
    gender: "Male",
    keyIssues: ["Tea farming", "Athletics", "Education"],
    ...generateSentiment(29)
  },
  {
    id: 30,
    name: "Benjamin Cheboi",
    county: "Baringo",
    countyCode: "030",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Rift Valley",
    gender: "Male",
    keyIssues: ["Security", "Cattle rustling", "Tourism"],
    ...generateSentiment(30)
  },
  {
    id: 31,
    name: "Joshua Irungu",
    county: "Laikipia",
    countyCode: "031",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Rift Valley",
    gender: "Male",
    keyIssues: ["Ranching", "Tourism", "Security"],
    ...generateSentiment(31)
  },
  {
    id: 32,
    name: "Susan Kihika",
    county: "Nakuru",
    countyCode: "032",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Rift Valley",
    gender: "Female",
    keyIssues: ["Agriculture", "Tourism", "Industrialization"],
    ...generateSentiment(32)
  },
  {
    id: 33,
    name: "Patrick Ole Ntutu",
    county: "Narok",
    countyCode: "033",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Rift Valley",
    gender: "Male",
    keyIssues: ["Maasai Mara tourism", "Land issues", "Education"],
    ...generateSentiment(33)
  },
  {
    id: 34,
    name: "Joseph Ole Lenku",
    county: "Kajiado",
    countyCode: "034",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Rift Valley",
    gender: "Male",
    keyIssues: ["Land issues", "Urban sprawl", "Pastoralism"],
    ...generateSentiment(34)
  },
  {
    id: 35,
    name: "Erick Mutai",
    county: "Kericho",
    countyCode: "035",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Rift Valley",
    gender: "Male",
    keyIssues: ["Tea farming", "Athletics", "Infrastructure"],
    ...generateSentiment(35)
  },
  {
    id: 36,
    name: "Hillary Barchok",
    county: "Bomet",
    countyCode: "036",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Rift Valley",
    gender: "Male",
    keyIssues: ["Tea farming", "Education", "Healthcare"],
    ...generateSentiment(36)
  },

  // Western Region (4 counties)
  {
    id: 37,
    name: "Fernandes Barasa",
    county: "Kakamega",
    countyCode: "037",
    party: "ODM",
    coalition: "Azimio",
    region: "Western",
    gender: "Male",
    keyIssues: ["Sugar industry", "Education", "Healthcare"],
    ...generateSentiment(37)
  },
  {
    id: 38,
    name: "Wilber Ottichilo",
    county: "Vihiga",
    countyCode: "038",
    party: "ODM",
    coalition: "Azimio",
    region: "Western",
    gender: "Male",
    keyIssues: ["Education", "Agriculture", "Youth employment"],
    ...generateSentiment(38)
  },
  {
    id: 39,
    name: "Kenneth Lusaka",
    county: "Bungoma",
    countyCode: "039",
    party: "FORD-K",
    coalition: "Kenya Kwanza",
    region: "Western",
    gender: "Male",
    keyIssues: ["Sugar industry", "Education", "Infrastructure"],
    ...generateSentiment(39)
  },
  {
    id: 40,
    name: "Paul Otuoma",
    county: "Busia",
    countyCode: "040",
    party: "ODM",
    coalition: "Azimio",
    region: "Western",
    gender: "Male",
    keyIssues: ["Cross-border trade", "Fishing", "Agriculture"],
    ...generateSentiment(40)
  },

  // Nyanza Region (6 counties)
  {
    id: 41,
    name: "James Orengo",
    county: "Siaya",
    countyCode: "041",
    party: "ODM",
    coalition: "Azimio",
    region: "Nyanza",
    gender: "Male",
    keyIssues: ["Agriculture", "Fishing", "Healthcare"],
    ...generateSentiment(41)
  },
  {
    id: 42,
    name: "Anyang' Nyong'o",
    county: "Kisumu",
    countyCode: "042",
    party: "ODM",
    coalition: "Azimio",
    region: "Nyanza",
    gender: "Male",
    keyIssues: ["Urban development", "Healthcare", "Trade"],
    ...generateSentiment(42)
  },
  {
    id: 43,
    name: "Gladys Wanga",
    county: "Homa Bay",
    countyCode: "043",
    party: "ODM",
    coalition: "Azimio",
    region: "Nyanza",
    gender: "Female",
    keyIssues: ["Fishing", "Healthcare", "Agriculture"],
    ...generateSentiment(43)
  },
  {
    id: 44,
    name: "Ochilo Ayacko",
    county: "Migori",
    countyCode: "044",
    party: "ODM",
    coalition: "Azimio",
    region: "Nyanza",
    gender: "Male",
    keyIssues: ["Mining", "Agriculture", "Cross-border trade"],
    ...generateSentiment(44)
  },
  {
    id: 45,
    name: "Simba Arati",
    county: "Kisii",
    countyCode: "045",
    party: "ODM",
    coalition: "Azimio",
    region: "Nyanza",
    gender: "Male",
    keyIssues: ["Agriculture", "Education", "Healthcare"],
    ...generateSentiment(45)
  },
  {
    id: 46,
    name: "Amos Nyaribo",
    county: "Nyamira",
    countyCode: "046",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Nyanza",
    gender: "Male",
    keyIssues: ["Tea farming", "Education", "Infrastructure"],
    ...generateSentiment(46)
  },

  // Nairobi Region (1 county)
  {
    id: 47,
    name: "Johnson Sakaja",
    county: "Nairobi",
    countyCode: "047",
    party: "UDA",
    coalition: "Kenya Kwanza",
    region: "Nairobi",
    gender: "Male",
    keyIssues: ["Urban planning", "Traffic", "Waste management", "Housing"],
    ...generateSentiment(47)
  }
];

// Statistics helpers
export const getGovernorsByRegion = (region: Governor['region']) => 
  governors.filter(g => g.region === region);

export const getGovernorsByCoalition = (coalition: Governor['coalition']) => 
  governors.filter(g => g.coalition === coalition);

export const getGovernorsByParty = (party: string) => 
  governors.filter(g => g.party === party);

export const getFemaleGovernors = () => 
  governors.filter(g => g.gender === 'Female');

export const getGovernorsByTrend = (trend: Governor['trend']) => 
  governors.filter(g => g.trend === trend);

// Region statistics
export const regionStats = {
  'Coast': { counties: 6, color: '#0EA5E9' },
  'North Eastern': { counties: 3, color: '#F97316' },
  'Eastern': { counties: 8, color: '#8B5CF6' },
  'Central': { counties: 5, color: '#10B981' },
  'Rift Valley': { counties: 14, color: '#EF4444' },
  'Western': { counties: 4, color: '#F59E0B' },
  'Nyanza': { counties: 6, color: '#06B6D4' },
  'Nairobi': { counties: 1, color: '#EC4899' }
};

// Coalition statistics
export const coalitionStats = () => {
  const kk = governors.filter(g => g.coalition === 'Kenya Kwanza').length;
  const az = governors.filter(g => g.coalition === 'Azimio').length;
  const ind = governors.filter(g => g.coalition === 'Independent').length;
  return { 'Kenya Kwanza': kk, 'Azimio': az, 'Independent': ind };
};

// Party breakdown
export const partyBreakdown = () => {
  const parties: Record<string, number> = {};
  governors.forEach(g => {
    parties[g.party] = (parties[g.party] || 0) + 1;
  });
  return Object.entries(parties)
    .sort((a, b) => b[1] - a[1])
    .map(([party, count]) => ({ party, count }));
};

// Get governor by county name or slug
export const getGovernorByCounty = (countySlug: string): Governor | undefined => {
  const normalizedSlug = countySlug.toLowerCase().replace(/[^a-z0-9]/g, '');
  return governors.find(g => {
    const govSlug = g.county.toLowerCase().replace(/[^a-z0-9]/g, '');
    return govSlug === normalizedSlug;
  });
};
