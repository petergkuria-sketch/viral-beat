// Women Representatives Data for Kenya (2022-2027)
// Data sourced from IEBC 2022 election results

export interface WomanRep {
  id: number;
  name: string;
  county: string;
  party: string;
  coalition: 'Kenya Kwanza' | 'Azimio';
  region: string;
  sentiment: number;
  approvalRating: number;
  trend: 'up' | 'down' | 'stable';
  keyIssues: string[];
  termStart: number;
}

// Helper to determine coalition based on party
const getCoalition = (party: string): 'Kenya Kwanza' | 'Azimio' => {
  const kenyaKwanzaParties = ['UDA', 'KANU', 'TSP', 'KUP', 'Independent'];
  const azimioParties = ['ODM', 'Jubilee', 'Wiper', 'ANC', 'Ford-Kenya', 'UDM', 'WDP'];
  
  if (kenyaKwanzaParties.includes(party)) return 'Kenya Kwanza';
  return 'Azimio';
};

// Helper to determine region based on county
const getRegion = (county: string): string => {
  const regions: Record<string, string[]> = {
    'Coast': ['Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta'],
    'North Eastern': ['Garissa', 'Wajir', 'Mandera'],
    'Eastern': ['Marsabit', 'Isiolo', 'Meru', 'Tharaka Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni'],
    'Central': ['Nyandarua', 'Nyeri', 'Kirinyaga', "Murang'a", 'Kiambu'],
    'Rift Valley': ['Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Bomet'],
    'Western': ['Kakamega', 'Vihiga', 'Bungoma', 'Busia'],
    'Nyanza': ['Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira'],
    'Nairobi': ['Nairobi']
  };
  
  for (const [region, counties] of Object.entries(regions)) {
    if (counties.includes(county)) return region;
  }
  return 'Unknown';
};

// Generate random but consistent sentiment data
const generateSentiment = (index: number): number => {
  const base = 35 + (index * 7) % 40;
  return Math.min(85, Math.max(25, base + Math.floor(Math.sin(index) * 10)));
};

const generateApproval = (index: number): number => {
  const base = 40 + (index * 11) % 35;
  return Math.min(80, Math.max(30, base + Math.floor(Math.cos(index) * 8)));
};

const getTrend = (index: number): 'up' | 'down' | 'stable' => {
  const trends: ('up' | 'down' | 'stable')[] = ['up', 'down', 'stable'];
  return trends[index % 3];
};

// Key issues by region
const regionalIssues: Record<string, string[]> = {
  'Coast': ['Tourism recovery', 'Land rights', 'Port development', 'Education access'],
  'North Eastern': ['Security', 'Water access', 'Infrastructure', 'Healthcare'],
  'Eastern': ['Drought mitigation', 'Agriculture', 'Water projects', 'Youth employment'],
  'Central': ['Agriculture', 'SME support', 'Healthcare', 'Education'],
  'Rift Valley': ['Land issues', 'Pastoralism', 'Agriculture', 'Infrastructure'],
  'Western': ['Sugar industry', 'Education', 'Healthcare', 'Youth employment'],
  'Nyanza': ['Fishing industry', 'Healthcare', 'Education', 'Infrastructure'],
  'Nairobi': ['Urban planning', 'Youth employment', 'Healthcare', 'Housing']
};

const getKeyIssues = (region: string): string[] => {
  return regionalIssues[region] || ['Development', 'Healthcare', 'Education'];
};

// All 47 Women Representatives
export const womenReps: WomanRep[] = [
  // Coast Region
  { id: 1, name: 'Zamzam Mohammed', county: 'Mombasa', party: 'ODM', coalition: 'Azimio', region: 'Coast', sentiment: 52, approvalRating: 48, trend: 'stable', keyIssues: ['Women empowerment', 'Tourism', 'Youth employment'], termStart: 2022 },
  { id: 2, name: 'Masito Fatuma', county: 'Kwale', party: 'ODM', coalition: 'Azimio', region: 'Coast', sentiment: 45, approvalRating: 42, trend: 'up', keyIssues: ['Land rights', 'Education', 'Healthcare'], termStart: 2022 },
  { id: 3, name: 'Gertrude Mbeyu', county: 'Kilifi', party: 'ODM', coalition: 'Azimio', region: 'Coast', sentiment: 48, approvalRating: 45, trend: 'stable', keyIssues: ['Tourism', 'Education', 'Women rights'], termStart: 2022 },
  { id: 4, name: 'Amina Dika', county: 'Tana River', party: 'KANU', coalition: 'Kenya Kwanza', region: 'Coast', sentiment: 41, approvalRating: 38, trend: 'down', keyIssues: ['Water access', 'Pastoralism', 'Security'], termStart: 2022 },
  { id: 5, name: 'Monica Marubu', county: 'Lamu', party: 'Independent', coalition: 'Kenya Kwanza', region: 'Coast', sentiment: 55, approvalRating: 52, trend: 'up', keyIssues: ['Security', 'Tourism', 'Fishing'], termStart: 2022 },
  { id: 6, name: 'Lydia Haika', county: 'Taita Taveta', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Coast', sentiment: 50, approvalRating: 47, trend: 'stable', keyIssues: ['Mining', 'Tourism', 'Agriculture'], termStart: 2022 },
  
  // North Eastern Region
  { id: 7, name: 'Amina Siyad', county: 'Garissa', party: 'Jubilee', coalition: 'Azimio', region: 'North Eastern', sentiment: 44, approvalRating: 41, trend: 'stable', keyIssues: ['Security', 'Education', 'Healthcare'], termStart: 2022 },
  { id: 8, name: 'Fatuma Jehow', county: 'Wajir', party: 'ODM', coalition: 'Azimio', region: 'North Eastern', sentiment: 42, approvalRating: 39, trend: 'up', keyIssues: ['Water access', 'Healthcare', 'Education'], termStart: 2022 },
  { id: 9, name: 'Umul Kassim', county: 'Mandera', party: 'UDM', coalition: 'Azimio', region: 'North Eastern', sentiment: 40, approvalRating: 37, trend: 'down', keyIssues: ['Security', 'Infrastructure', 'Healthcare'], termStart: 2022 },
  
  // Eastern Region
  { id: 10, name: 'Naomi Jilo Wako', county: 'Marsabit', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Eastern', sentiment: 46, approvalRating: 43, trend: 'up', keyIssues: ['Water access', 'Pastoralism', 'Education'], termStart: 2022 },
  { id: 11, name: 'Mumina Bonaya', county: 'Isiolo', party: 'Jubilee', coalition: 'Azimio', region: 'Eastern', sentiment: 49, approvalRating: 46, trend: 'stable', keyIssues: ['Tourism', 'Infrastructure', 'Healthcare'], termStart: 2022 },
  { id: 12, name: 'Elizabeth Kananu', county: 'Meru', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Eastern', sentiment: 54, approvalRating: 51, trend: 'up', keyIssues: ['Agriculture', 'Education', 'Healthcare'], termStart: 2022 },
  { id: 13, name: 'Susan Ngigi', county: 'Tharaka Nithi', party: 'TSP', coalition: 'Kenya Kwanza', region: 'Eastern', sentiment: 47, approvalRating: 44, trend: 'stable', keyIssues: ['Agriculture', 'Water projects', 'Education'], termStart: 2022 },
  { id: 14, name: 'Pamela Njoki', county: 'Embu', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Eastern', sentiment: 52, approvalRating: 49, trend: 'up', keyIssues: ['Agriculture', 'Youth employment', 'Healthcare'], termStart: 2022 },
  { id: 15, name: 'Irene Muthoni', county: 'Kitui', party: 'Wiper', coalition: 'Azimio', region: 'Eastern', sentiment: 48, approvalRating: 45, trend: 'stable', keyIssues: ['Water access', 'Agriculture', 'Education'], termStart: 2022 },
  { id: 16, name: 'Joyce Kamene', county: 'Machakos', party: 'Wiper', coalition: 'Azimio', region: 'Eastern', sentiment: 51, approvalRating: 48, trend: 'up', keyIssues: ['SME support', 'Healthcare', 'Education'], termStart: 2022 },
  { id: 17, name: 'Rose Museo', county: 'Makueni', party: 'Wiper', coalition: 'Azimio', region: 'Eastern', sentiment: 53, approvalRating: 50, trend: 'stable', keyIssues: ['Water projects', 'Agriculture', 'Healthcare'], termStart: 2022 },
  
  // Central Region
  { id: 18, name: 'Faith Gitau', county: 'Nyandarua', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Central', sentiment: 56, approvalRating: 53, trend: 'up', keyIssues: ['Agriculture', 'Dairy farming', 'Infrastructure'], termStart: 2022 },
  { id: 19, name: 'Rahab Mukami', county: 'Nyeri', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Central', sentiment: 58, approvalRating: 55, trend: 'up', keyIssues: ['Agriculture', 'Tourism', 'Healthcare'], termStart: 2022 },
  { id: 20, name: 'Jane Maina', county: 'Kirinyaga', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Central', sentiment: 54, approvalRating: 51, trend: 'stable', keyIssues: ['Rice farming', 'Women empowerment', 'Healthcare'], termStart: 2022 },
  { id: 21, name: 'Betty Maina', county: "Murang'a", party: 'UDA', coalition: 'Kenya Kwanza', region: 'Central', sentiment: 55, approvalRating: 52, trend: 'up', keyIssues: ['Agriculture', 'SME support', 'Education'], termStart: 2022 },
  { id: 22, name: 'Ann Wamuratha', county: 'Kiambu', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Central', sentiment: 52, approvalRating: 49, trend: 'stable', keyIssues: ['Urban development', 'Youth employment', 'Healthcare'], termStart: 2022 },
  
  // Rift Valley Region
  { id: 23, name: 'Cecilia Asinyen', county: 'Turkana', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 43, approvalRating: 40, trend: 'up', keyIssues: ['Oil revenue', 'Water access', 'Education'], termStart: 2022 },
  { id: 24, name: 'Kasiwai Chepkemboi', county: 'West Pokot', party: 'KUP', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 45, approvalRating: 42, trend: 'stable', keyIssues: ['Security', 'Infrastructure', 'Education'], termStart: 2022 },
  { id: 25, name: 'Pauline Lenguris', county: 'Samburu', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 44, approvalRating: 41, trend: 'down', keyIssues: ['Pastoralism', 'Education', 'Healthcare'], termStart: 2022 },
  { id: 26, name: 'Lilian Chebet', county: 'Trans Nzoia', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 57, approvalRating: 54, trend: 'up', keyIssues: ['Agriculture', 'Education', 'Youth employment'], termStart: 2022 },
  { id: 27, name: 'Gladys Shollei', county: 'Uasin Gishu', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 62, approvalRating: 59, trend: 'up', keyIssues: ['Agriculture', 'Sports', 'Education'], termStart: 2022 },
  { id: 28, name: 'Caroline Ngelechei', county: 'Elgeyo Marakwet', party: 'Independent', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 50, approvalRating: 47, trend: 'stable', keyIssues: ['Athletics', 'Agriculture', 'Education'], termStart: 2022 },
  { id: 29, name: 'Cynthia Muge', county: 'Nandi', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 55, approvalRating: 52, trend: 'up', keyIssues: ['Tea farming', 'Athletics', 'Education'], termStart: 2022 },
  { id: 30, name: 'Florence Jematiah', county: 'Baringo', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 48, approvalRating: 45, trend: 'stable', keyIssues: ['Security', 'Pastoralism', 'Education'], termStart: 2022 },
  { id: 31, name: 'Jane Kagiri', county: 'Laikipia', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 51, approvalRating: 48, trend: 'up', keyIssues: ['Tourism', 'Security', 'Agriculture'], termStart: 2022 },
  { id: 32, name: 'Liza Chelule', county: 'Nakuru', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 54, approvalRating: 51, trend: 'stable', keyIssues: ['Agriculture', 'Tourism', 'Youth employment'], termStart: 2022 },
  { id: 33, name: 'Rebecca Tonkei', county: 'Narok', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 49, approvalRating: 46, trend: 'up', keyIssues: ['Tourism', 'Land rights', 'Education'], termStart: 2022 },
  { id: 34, name: 'Leah Sankaire', county: 'Kajiado', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 52, approvalRating: 49, trend: 'stable', keyIssues: ['Land rights', 'Education', 'Healthcare'], termStart: 2022 },
  { id: 35, name: 'Beatrice Kemei', county: 'Kericho', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 56, approvalRating: 53, trend: 'up', keyIssues: ['Tea farming', 'Agriculture', 'Education'], termStart: 2022 },
  { id: 36, name: 'Linet Chepkorir', county: 'Bomet', party: 'UDA', coalition: 'Kenya Kwanza', region: 'Rift Valley', sentiment: 60, approvalRating: 57, trend: 'up', keyIssues: ['Youth empowerment', 'Agriculture', 'Education'], termStart: 2022 },
  
  // Western Region
  { id: 37, name: 'Elsie Muhanda', county: 'Kakamega', party: 'ODM', coalition: 'Azimio', region: 'Western', sentiment: 47, approvalRating: 44, trend: 'stable', keyIssues: ['Sugar industry', 'Education', 'Healthcare'], termStart: 2022 },
  { id: 38, name: 'Beatrice Adagala', county: 'Vihiga', party: 'ANC', coalition: 'Azimio', region: 'Western', sentiment: 45, approvalRating: 42, trend: 'down', keyIssues: ['Education', 'Healthcare', 'Youth employment'], termStart: 2022 },
  { id: 39, name: 'Catherine Wambilianga', county: 'Bungoma', party: 'Ford-Kenya', coalition: 'Azimio', region: 'Western', sentiment: 48, approvalRating: 45, trend: 'stable', keyIssues: ['Sugar industry', 'Education', 'Infrastructure'], termStart: 2022 },
  { id: 40, name: 'Catherine Omanyo', county: 'Busia', party: 'ODM', coalition: 'Azimio', region: 'Western', sentiment: 46, approvalRating: 43, trend: 'up', keyIssues: ['Cross-border trade', 'Fishing', 'Education'], termStart: 2022 },
  
  // Nyanza Region
  { id: 41, name: 'Christine Ombaka', county: 'Siaya', party: 'ODM', coalition: 'Azimio', region: 'Nyanza', sentiment: 50, approvalRating: 47, trend: 'stable', keyIssues: ['Fishing', 'Education', 'Healthcare'], termStart: 2022 },
  { id: 42, name: 'Ruth Odinga', county: 'Kisumu', party: 'ODM', coalition: 'Azimio', region: 'Nyanza', sentiment: 55, approvalRating: 52, trend: 'up', keyIssues: ['Urban development', 'Healthcare', 'Education'], termStart: 2022 },
  { id: 43, name: 'Joyce Atieno', county: 'Homa Bay', party: 'ODM', coalition: 'Azimio', region: 'Nyanza', sentiment: 48, approvalRating: 45, trend: 'stable', keyIssues: ['Fishing', 'Healthcare', 'Education'], termStart: 2022 },
  { id: 44, name: 'Fatuma Mohammed', county: 'Migori', party: 'Independent', coalition: 'Kenya Kwanza', region: 'Nyanza', sentiment: 44, approvalRating: 41, trend: 'down', keyIssues: ['Mining', 'Agriculture', 'Education'], termStart: 2022 },
  { id: 45, name: 'Doris Ndonya', county: 'Kisii', party: 'WDP', coalition: 'Azimio', region: 'Nyanza', sentiment: 47, approvalRating: 44, trend: 'stable', keyIssues: ['Agriculture', 'Education', 'Healthcare'], termStart: 2022 },
  { id: 46, name: 'Jerusha Momanyi', county: 'Nyamira', party: 'Jubilee', coalition: 'Azimio', region: 'Nyanza', sentiment: 49, approvalRating: 46, trend: 'up', keyIssues: ['Tea farming', 'Education', 'Healthcare'], termStart: 2022 },
  
  // Nairobi Region
  { id: 47, name: 'Esther Passaris', county: 'Nairobi', party: 'ODM', coalition: 'Azimio', region: 'Nairobi', sentiment: 58, approvalRating: 55, trend: 'up', keyIssues: ['Women empowerment', 'Youth employment', 'Healthcare'], termStart: 2022 },
];

// Helper functions
export const getWomanRepByCounty = (county: string): WomanRep | undefined => {
  const normalizedCounty = county.toLowerCase().replace(/-/g, ' ').replace(/'/g, "'");
  return womenReps.find(rep => 
    rep.county.toLowerCase().replace(/'/g, "'") === normalizedCounty ||
    rep.county.toLowerCase().replace(/'/g, "") === normalizedCounty.replace(/'/g, "")
  );
};

export const getWomenRepsByRegion = (region: string): WomanRep[] => {
  return womenReps.filter(rep => rep.region === region);
};

export const getWomenRepsByCoalition = (coalition: 'Kenya Kwanza' | 'Azimio'): WomanRep[] => {
  return womenReps.filter(rep => rep.coalition === coalition);
};

export const getWomenRepsByParty = (party: string): WomanRep[] => {
  return womenReps.filter(rep => rep.party === party);
};

export const getCoalitionStats = () => {
  const kenyaKwanza = womenReps.filter(rep => rep.coalition === 'Kenya Kwanza').length;
  const azimio = womenReps.filter(rep => rep.coalition === 'Azimio').length;
  return { kenyaKwanza, azimio };
};

export const getRegionStats = () => {
  const regions = ['Coast', 'North Eastern', 'Eastern', 'Central', 'Rift Valley', 'Western', 'Nyanza', 'Nairobi'];
  return regions.map(region => ({
    region,
    count: womenReps.filter(rep => rep.region === region).length,
    avgSentiment: Math.round(
      womenReps.filter(rep => rep.region === region).reduce((sum, rep) => sum + rep.sentiment, 0) /
      womenReps.filter(rep => rep.region === region).length
    )
  }));
};

export const getPartyStats = () => {
  const parties = Array.from(new Set(womenReps.map(rep => rep.party)));
  return parties.map(party => ({
    party,
    count: womenReps.filter(rep => rep.party === party).length
  })).sort((a, b) => b.count - a.count);
};
