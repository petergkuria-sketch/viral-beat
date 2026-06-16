// Kenya Senators Data (2022-2027)
// All 47 elected senators representing each county

export interface Senator {
  id: string;
  name: string;
  county: string;
  party: string;
  coalition: 'Kenya Kwanza' | 'Azimio';
  region: string;
  gender: 'Male' | 'Female';
  sentimentScore: number;
  approvalRating: number;
  trend: 'up' | 'down' | 'stable';
  keyIssues: string[];
  committees: string[];
  leadershipPosition?: string;
  previousRole?: string;
  termStart: number;
  termEnd: number;
}

export interface CommitteeAssignment {
  name: string;
  role: 'Chair' | 'Vice Chair' | 'Member';
  description: string;
}

export interface VotingRecord {
  billName: string;
  date: string;
  vote: 'Yes' | 'No' | 'Abstain' | 'Absent';
  outcome: 'Passed' | 'Failed';
  description: string;
}

// All 47 Senators
export const senators: Senator[] = [
  // Nairobi Region
  {
    id: 'nairobi',
    name: 'Edwin Sifuna',
    county: 'Nairobi',
    party: 'ODM',
    coalition: 'Azimio',
    region: 'Nairobi',
    gender: 'Male',
    sentimentScore: 72,
    approvalRating: 68,
    trend: 'up',
    keyIssues: ['Urban Development', 'Youth Employment', 'Housing'],
    committees: ['County Public Accounts', 'Justice, Legal Affairs and Human Rights'],
    leadershipPosition: 'ODM Secretary General',
    termStart: 2022,
    termEnd: 2027
  },
  
  // Central Region
  {
    id: 'kiambu',
    name: 'Karungo Thang\'wa',
    county: 'Kiambu',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Central',
    gender: 'Male',
    sentimentScore: 65,
    approvalRating: 62,
    trend: 'stable',
    keyIssues: ['Agriculture', 'Infrastructure', 'Trade'],
    committees: ['Finance and Budget', 'Trade, Industrialization and Tourism'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'kirinyaga',
    name: 'James Murango',
    county: 'Kirinyaga',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Central',
    gender: 'Male',
    sentimentScore: 58,
    approvalRating: 55,
    trend: 'down',
    keyIssues: ['Rice Farming', 'Irrigation', 'Healthcare'],
    committees: ['Agriculture, Livestock and Fisheries', 'Health'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'muranga',
    name: 'Joe Nyutu',
    county: 'Murang\'a',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Central',
    gender: 'Male',
    sentimentScore: 61,
    approvalRating: 58,
    trend: 'stable',
    keyIssues: ['Coffee Farming', 'Water Resources', 'Education'],
    committees: ['Agriculture, Livestock and Fisheries', 'Education'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'nyeri',
    name: 'Wahome Wamatinga',
    county: 'Nyeri',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Central',
    gender: 'Male',
    sentimentScore: 64,
    approvalRating: 61,
    trend: 'up',
    keyIssues: ['Tea Farming', 'Tourism', 'Healthcare'],
    committees: ['Trade, Industrialization and Tourism', 'Health'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'nyandarua',
    name: 'John Methu',
    county: 'Nyandarua',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Central',
    gender: 'Male',
    sentimentScore: 59,
    approvalRating: 56,
    trend: 'stable',
    keyIssues: ['Dairy Farming', 'Roads', 'Water'],
    committees: ['Roads, Transportation and Housing', 'Agriculture, Livestock and Fisheries'],
    termStart: 2022,
    termEnd: 2027
  },
  
  // Rift Valley Region
  {
    id: 'kericho',
    name: 'Aaron Cheruiyot',
    county: 'Kericho',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Rift Valley',
    gender: 'Male',
    sentimentScore: 71,
    approvalRating: 69,
    trend: 'up',
    keyIssues: ['Tea Industry', 'Devolution', 'Legislation'],
    committees: ['Finance and Budget', 'Devolution and Intergovernmental Relations'],
    leadershipPosition: 'Senate Majority Leader',
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'nandi',
    name: 'Samson Cherargei',
    county: 'Nandi',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Rift Valley',
    gender: 'Male',
    sentimentScore: 63,
    approvalRating: 60,
    trend: 'stable',
    keyIssues: ['Athletics', 'Agriculture', 'Youth'],
    committees: ['Justice, Legal Affairs and Human Rights', 'Labour and Social Welfare'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'uasin-gishu',
    name: 'Jackson Mandago',
    county: 'Uasin Gishu',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Rift Valley',
    gender: 'Male',
    sentimentScore: 66,
    approvalRating: 64,
    trend: 'up',
    keyIssues: ['Urban Planning', 'Agriculture', 'Sports'],
    committees: ['County Public Accounts', 'Devolution and Intergovernmental Relations'],
    previousRole: 'Governor of Uasin Gishu (2013-2022)',
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'elgeyo-marakwet',
    name: 'Kipchumba Murkomen',
    county: 'Elgeyo Marakwet',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Rift Valley',
    gender: 'Male',
    sentimentScore: 68,
    approvalRating: 65,
    trend: 'stable',
    keyIssues: ['Roads', 'Athletics', 'Agriculture'],
    committees: ['Roads, Transportation and Housing', 'Energy'],
    previousRole: 'Senate Majority Leader (2017-2022)',
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'nakuru',
    name: 'Tabitha Keroche',
    county: 'Nakuru',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Rift Valley',
    gender: 'Female',
    sentimentScore: 62,
    approvalRating: 59,
    trend: 'down',
    keyIssues: ['Business', 'Women Empowerment', 'Tourism'],
    committees: ['Finance and Budget', 'Trade, Industrialization and Tourism'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'narok',
    name: 'Ledama Ole Kina',
    county: 'Narok',
    party: 'ODM',
    coalition: 'Azimio',
    region: 'Rift Valley',
    gender: 'Male',
    sentimentScore: 67,
    approvalRating: 64,
    trend: 'up',
    keyIssues: ['Wildlife Conservation', 'Tourism', 'Land Rights'],
    committees: ['Lands, Environment and Natural Resources', 'Tourism'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'kajiado',
    name: 'Seki Kanar',
    county: 'Kajiado',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Rift Valley',
    gender: 'Male',
    sentimentScore: 55,
    approvalRating: 52,
    trend: 'stable',
    keyIssues: ['Pastoralism', 'Land Issues', 'Water'],
    committees: ['Lands, Environment and Natural Resources', 'Agriculture, Livestock and Fisheries'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'laikipia',
    name: 'John Kinyua',
    county: 'Laikipia',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Rift Valley',
    gender: 'Male',
    sentimentScore: 60,
    approvalRating: 57,
    trend: 'stable',
    keyIssues: ['Wildlife', 'Ranching', 'Security'],
    committees: ['National Security, Defence and Foreign Relations', 'Lands, Environment and Natural Resources'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'samburu',
    name: 'Lelegwe Ltumbesi',
    county: 'Samburu',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Rift Valley',
    gender: 'Male',
    sentimentScore: 54,
    approvalRating: 51,
    trend: 'down',
    keyIssues: ['Pastoralism', 'Security', 'Education'],
    committees: ['National Security, Defence and Foreign Relations', 'Education'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'baringo',
    name: 'William Cheptumo',
    county: 'Baringo',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Rift Valley',
    gender: 'Male',
    sentimentScore: 61,
    approvalRating: 58,
    trend: 'stable',
    keyIssues: ['Security', 'Irrigation', 'Livestock'],
    committees: ['Justice, Legal Affairs and Human Rights', 'Agriculture, Livestock and Fisheries'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'bomet',
    name: 'Hillary Sigei',
    county: 'Bomet',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Rift Valley',
    gender: 'Male',
    sentimentScore: 58,
    approvalRating: 55,
    trend: 'stable',
    keyIssues: ['Tea Farming', 'Education', 'Healthcare'],
    committees: ['Education', 'Health'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'west-pokot',
    name: 'Julius Murgor',
    county: 'West Pokot',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Rift Valley',
    gender: 'Male',
    sentimentScore: 56,
    approvalRating: 53,
    trend: 'stable',
    keyIssues: ['Security', 'Pastoralism', 'Infrastructure'],
    committees: ['National Security, Defence and Foreign Relations', 'Roads, Transportation and Housing'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'trans-nzoia',
    name: 'Allan Chesang',
    county: 'Trans Nzoia',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Rift Valley',
    gender: 'Male',
    sentimentScore: 59,
    approvalRating: 56,
    trend: 'stable',
    keyIssues: ['Maize Farming', 'Education', 'Youth'],
    committees: ['Agriculture, Livestock and Fisheries', 'Labour and Social Welfare'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'turkana',
    name: 'James Lomenen',
    county: 'Turkana',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Rift Valley',
    gender: 'Male',
    sentimentScore: 53,
    approvalRating: 50,
    trend: 'down',
    keyIssues: ['Oil Resources', 'Pastoralism', 'Water'],
    committees: ['Energy', 'Lands, Environment and Natural Resources'],
    termStart: 2022,
    termEnd: 2027
  },
  
  // Western Region
  {
    id: 'kakamega',
    name: 'Boni Khalwale',
    county: 'Kakamega',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Western',
    gender: 'Male',
    sentimentScore: 69,
    approvalRating: 66,
    trend: 'up',
    keyIssues: ['Healthcare', 'Sugar Industry', 'Education'],
    committees: ['Health', 'County Public Accounts'],
    previousRole: 'Senator (2013-2017)',
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'bungoma',
    name: 'Moses Wetang\'ula',
    county: 'Bungoma',
    party: 'Ford Kenya',
    coalition: 'Kenya Kwanza',
    region: 'Western',
    gender: 'Male',
    sentimentScore: 73,
    approvalRating: 70,
    trend: 'up',
    keyIssues: ['Legislation', 'Sugar Industry', 'Education'],
    committees: ['Speaker\'s Panel'],
    leadershipPosition: 'Speaker of the National Assembly',
    previousRole: 'Senator (2013-2022)',
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'busia',
    name: 'Okiya Omtatah',
    county: 'Busia',
    party: 'Independent',
    coalition: 'Azimio',
    region: 'Western',
    gender: 'Male',
    sentimentScore: 74,
    approvalRating: 71,
    trend: 'up',
    keyIssues: ['Human Rights', 'Governance', 'Anti-Corruption'],
    committees: ['Justice, Legal Affairs and Human Rights', 'County Public Accounts'],
    previousRole: 'Human Rights Activist',
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'vihiga',
    name: 'Godfrey Osotsi',
    county: 'Vihiga',
    party: 'ODM',
    coalition: 'Azimio',
    region: 'Western',
    gender: 'Male',
    sentimentScore: 57,
    approvalRating: 54,
    trend: 'stable',
    keyIssues: ['Labour Rights', 'Education', 'Healthcare'],
    committees: ['Labour and Social Welfare', 'Education'],
    previousRole: 'Nominated MP',
    termStart: 2022,
    termEnd: 2027
  },
  
  // Nyanza Region
  {
    id: 'kisumu',
    name: 'Tom Ojienda',
    county: 'Kisumu',
    party: 'ODM',
    coalition: 'Azimio',
    region: 'Nyanza',
    gender: 'Male',
    sentimentScore: 66,
    approvalRating: 63,
    trend: 'stable',
    keyIssues: ['Legal Reform', 'Lakeside Development', 'Trade'],
    committees: ['Justice, Legal Affairs and Human Rights', 'Trade, Industrialization and Tourism'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'siaya',
    name: 'Oburu Odinga',
    county: 'Siaya',
    party: 'ODM',
    coalition: 'Azimio',
    region: 'Nyanza',
    gender: 'Male',
    sentimentScore: 64,
    approvalRating: 61,
    trend: 'stable',
    keyIssues: ['Agriculture', 'Healthcare', 'Education'],
    committees: ['Agriculture, Livestock and Fisheries', 'Health'],
    previousRole: 'MP, Cabinet Minister',
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'homa-bay',
    name: 'Moses Kajwang',
    county: 'Homa Bay',
    party: 'ODM',
    coalition: 'Azimio',
    region: 'Nyanza',
    gender: 'Male',
    sentimentScore: 63,
    approvalRating: 60,
    trend: 'stable',
    keyIssues: ['Fishing', 'Healthcare', 'Education'],
    committees: ['Agriculture, Livestock and Fisheries', 'ICT'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'migori',
    name: 'Eddy Oketch',
    county: 'Migori',
    party: 'ODM',
    coalition: 'Azimio',
    region: 'Nyanza',
    gender: 'Male',
    sentimentScore: 58,
    approvalRating: 55,
    trend: 'down',
    keyIssues: ['Mining', 'Agriculture', 'Border Trade'],
    committees: ['Trade, Industrialization and Tourism', 'Lands, Environment and Natural Resources'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'kisii',
    name: 'Richard Onyonka',
    county: 'Kisii',
    party: 'ODM',
    coalition: 'Azimio',
    region: 'Nyanza',
    gender: 'Male',
    sentimentScore: 62,
    approvalRating: 59,
    trend: 'stable',
    keyIssues: ['Education', 'Healthcare', 'Agriculture'],
    committees: ['Education', 'Health'],
    previousRole: 'MP Kitutu Chache',
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'nyamira',
    name: 'Okong\'o Omogeni',
    county: 'Nyamira',
    party: 'ODM',
    coalition: 'Azimio',
    region: 'Nyanza',
    gender: 'Male',
    sentimentScore: 60,
    approvalRating: 57,
    trend: 'stable',
    keyIssues: ['Tea Farming', 'Education', 'Legal Reform'],
    committees: ['Justice, Legal Affairs and Human Rights', 'Agriculture, Livestock and Fisheries'],
    termStart: 2022,
    termEnd: 2027
  },
  
  // Eastern Region
  {
    id: 'machakos',
    name: 'Agnes Kavindu',
    county: 'Machakos',
    party: 'Wiper',
    coalition: 'Azimio',
    region: 'Eastern',
    gender: 'Female',
    sentimentScore: 61,
    approvalRating: 58,
    trend: 'stable',
    keyIssues: ['Women Empowerment', 'Water', 'Education'],
    committees: ['Labour and Social Welfare', 'Devolution and Intergovernmental Relations'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'makueni',
    name: 'Dan Maanzo',
    county: 'Makueni',
    party: 'Wiper',
    coalition: 'Azimio',
    region: 'Eastern',
    gender: 'Male',
    sentimentScore: 59,
    approvalRating: 56,
    trend: 'stable',
    keyIssues: ['Water', 'Agriculture', 'Healthcare'],
    committees: ['Lands, Environment and Natural Resources', 'Health'],
    previousRole: 'MP Makueni',
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'kitui',
    name: 'Enoch Wambua',
    county: 'Kitui',
    party: 'Wiper',
    coalition: 'Azimio',
    region: 'Eastern',
    gender: 'Male',
    sentimentScore: 58,
    approvalRating: 55,
    trend: 'stable',
    keyIssues: ['Water', 'Mining', 'Agriculture'],
    committees: ['Energy', 'Lands, Environment and Natural Resources'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'embu',
    name: 'Alexander Mundigi',
    county: 'Embu',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Eastern',
    gender: 'Male',
    sentimentScore: 60,
    approvalRating: 57,
    trend: 'stable',
    keyIssues: ['Agriculture', 'Education', 'Healthcare'],
    committees: ['Agriculture, Livestock and Fisheries', 'Education'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'tharaka-nithi',
    name: 'Gataya Mwenda',
    county: 'Tharaka Nithi',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Eastern',
    gender: 'Male',
    sentimentScore: 57,
    approvalRating: 54,
    trend: 'down',
    keyIssues: ['Agriculture', 'Education', 'Water'],
    committees: ['Agriculture, Livestock and Fisheries', 'Lands, Environment and Natural Resources'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'meru',
    name: 'Kathuri Murungi',
    county: 'Meru',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Eastern',
    gender: 'Male',
    sentimentScore: 63,
    approvalRating: 60,
    trend: 'up',
    keyIssues: ['Miraa Trade', 'Agriculture', 'Tourism'],
    committees: ['Trade, Industrialization and Tourism', 'Agriculture, Livestock and Fisheries'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'isiolo',
    name: 'Fatuma Dullo',
    county: 'Isiolo',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Eastern',
    gender: 'Female',
    sentimentScore: 62,
    approvalRating: 59,
    trend: 'stable',
    keyIssues: ['Pastoralism', 'Women Rights', 'Infrastructure'],
    committees: ['National Security, Defence and Foreign Relations', 'Labour and Social Welfare'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'marsabit',
    name: 'Mohamed Said Chute',
    county: 'Marsabit',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Eastern',
    gender: 'Male',
    sentimentScore: 55,
    approvalRating: 52,
    trend: 'down',
    keyIssues: ['Pastoralism', 'Security', 'Water'],
    committees: ['National Security, Defence and Foreign Relations', 'Lands, Environment and Natural Resources'],
    termStart: 2022,
    termEnd: 2027
  },
  
  // Coast Region
  {
    id: 'mombasa',
    name: 'Mohamed Faki',
    county: 'Mombasa',
    party: 'ODM',
    coalition: 'Azimio',
    region: 'Coast',
    gender: 'Male',
    sentimentScore: 65,
    approvalRating: 62,
    trend: 'stable',
    keyIssues: ['Port Development', 'Tourism', 'Trade'],
    committees: ['Trade, Industrialization and Tourism', 'Roads, Transportation and Housing'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'kilifi',
    name: 'Stewart Madzayo',
    county: 'Kilifi',
    party: 'ODM',
    coalition: 'Azimio',
    region: 'Coast',
    gender: 'Male',
    sentimentScore: 68,
    approvalRating: 65,
    trend: 'up',
    keyIssues: ['Tourism', 'Land Rights', 'Education'],
    committees: ['Justice, Legal Affairs and Human Rights', 'Lands, Environment and Natural Resources'],
    leadershipPosition: 'Senate Minority Leader',
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'kwale',
    name: 'Issa Boy Juma',
    county: 'Kwale',
    party: 'ODM',
    coalition: 'Azimio',
    region: 'Coast',
    gender: 'Male',
    sentimentScore: 59,
    approvalRating: 56,
    trend: 'stable',
    keyIssues: ['Mining', 'Tourism', 'Agriculture'],
    committees: ['Energy', 'Trade, Industrialization and Tourism'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'taita-taveta',
    name: 'Johnes Mwaruma',
    county: 'Taita Taveta',
    party: 'Wiper',
    coalition: 'Azimio',
    region: 'Coast',
    gender: 'Male',
    sentimentScore: 58,
    approvalRating: 55,
    trend: 'stable',
    keyIssues: ['Mining', 'Tourism', 'Land Rights'],
    committees: ['Lands, Environment and Natural Resources', 'Energy'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'tana-river',
    name: 'Danson Mungatana',
    county: 'Tana River',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Coast',
    gender: 'Male',
    sentimentScore: 56,
    approvalRating: 53,
    trend: 'stable',
    keyIssues: ['Agriculture', 'Irrigation', 'Security'],
    committees: ['Agriculture, Livestock and Fisheries', 'National Security, Defence and Foreign Relations'],
    previousRole: 'MP Garsen',
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'lamu',
    name: 'Joseph Githuku',
    county: 'Lamu',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'Coast',
    gender: 'Male',
    sentimentScore: 54,
    approvalRating: 51,
    trend: 'down',
    keyIssues: ['LAPSSET', 'Tourism', 'Fishing'],
    committees: ['Roads, Transportation and Housing', 'Trade, Industrialization and Tourism'],
    termStart: 2022,
    termEnd: 2027
  },
  
  // North Eastern Region
  {
    id: 'garissa',
    name: 'Abdul Haji',
    county: 'Garissa',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'North Eastern',
    gender: 'Male',
    sentimentScore: 67,
    approvalRating: 64,
    trend: 'up',
    keyIssues: ['Security', 'Infrastructure', 'Education'],
    committees: ['National Security, Defence and Foreign Relations', 'Education'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'wajir',
    name: 'Abass Mohamed',
    county: 'Wajir',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'North Eastern',
    gender: 'Male',
    sentimentScore: 55,
    approvalRating: 52,
    trend: 'stable',
    keyIssues: ['Security', 'Pastoralism', 'Water'],
    committees: ['National Security, Defence and Foreign Relations', 'Lands, Environment and Natural Resources'],
    termStart: 2022,
    termEnd: 2027
  },
  {
    id: 'mandera',
    name: 'Ali Roba',
    county: 'Mandera',
    party: 'UDA',
    coalition: 'Kenya Kwanza',
    region: 'North Eastern',
    gender: 'Male',
    sentimentScore: 64,
    approvalRating: 61,
    trend: 'up',
    keyIssues: ['Security', 'Healthcare', 'Education'],
    committees: ['Health', 'Devolution and Intergovernmental Relations'],
    previousRole: 'Governor of Mandera (2013-2022)',
    termStart: 2022,
    termEnd: 2027
  }
];

// Senate Committees
export const senateCommittees = [
  { name: 'Finance and Budget', description: 'Oversight of national and county budgets' },
  { name: 'County Public Accounts', description: 'Audit and accountability of county funds' },
  { name: 'Justice, Legal Affairs and Human Rights', description: 'Legal reform and human rights' },
  { name: 'Agriculture, Livestock and Fisheries', description: 'Agricultural policy and food security' },
  { name: 'Health', description: 'Healthcare policy and county health services' },
  { name: 'Education', description: 'Education policy and standards' },
  { name: 'Energy', description: 'Energy policy and resources' },
  { name: 'Roads, Transportation and Housing', description: 'Infrastructure development' },
  { name: 'Trade, Industrialization and Tourism', description: 'Economic development' },
  { name: 'Lands, Environment and Natural Resources', description: 'Land policy and environment' },
  { name: 'National Security, Defence and Foreign Relations', description: 'Security and foreign policy' },
  { name: 'Devolution and Intergovernmental Relations', description: 'County-national relations' },
  { name: 'Labour and Social Welfare', description: 'Labour rights and social protection' },
  { name: 'ICT', description: 'Information and communication technology' }
];

// Helper functions
export function getSenatorByCounty(countySlug: string): Senator | undefined {
  return senators.find(s => s.id === countySlug.toLowerCase());
}

export function getSenatorsByRegion(region: string): Senator[] {
  return senators.filter(s => s.region === region);
}

export function getSenatorsByCoalition(coalition: 'Kenya Kwanza' | 'Azimio'): Senator[] {
  return senators.filter(s => s.coalition === coalition);
}

export function getSenatorsByParty(party: string): Senator[] {
  return senators.filter(s => s.party === party);
}

export function getSenatorsWithLeadershipPositions(): Senator[] {
  return senators.filter(s => s.leadershipPosition);
}

export function getAllRegions(): string[] {
  return Array.from(new Set(senators.map(s => s.region)));
}

export function getAllParties(): string[] {
  return Array.from(new Set(senators.map(s => s.party)));
}

// Generate mock voting records for a senator
export function generateVotingRecords(senatorId: string): VotingRecord[] {
  const bills = [
    { name: 'County Allocation of Revenue Bill 2024', desc: 'Division of revenue among counties' },
    { name: 'Public Finance Management Amendment Bill', desc: 'Financial management reforms' },
    { name: 'County Governments Amendment Bill', desc: 'Devolution framework changes' },
    { name: 'Health Bill 2024', desc: 'Universal health coverage implementation' },
    { name: 'Education Amendment Bill', desc: 'CBC curriculum reforms' },
    { name: 'Land Laws Amendment Bill', desc: 'Land registration and ownership' },
    { name: 'Climate Change Amendment Bill', desc: 'Environmental protection measures' },
    { name: 'Digital Economy Bill', desc: 'Technology and innovation framework' }
  ];
  
  const senator = getSenatorByCounty(senatorId);
  const isKenyaKwanza = senator?.coalition === 'Kenya Kwanza';
  
  return bills.map((bill, index) => {
    const votes: ('Yes' | 'No' | 'Abstain' | 'Absent')[] = ['Yes', 'No', 'Abstain', 'Absent'];
    // Senators tend to vote with their coalition
    const voteIndex = isKenyaKwanza 
      ? (Math.random() > 0.2 ? 0 : Math.floor(Math.random() * 4))
      : (Math.random() > 0.3 ? (Math.random() > 0.5 ? 0 : 1) : Math.floor(Math.random() * 4));
    
    return {
      billName: bill.name,
      date: `2024-${String(index + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      vote: votes[voteIndex],
      outcome: Math.random() > 0.3 ? 'Passed' : 'Failed',
      description: bill.desc
    };
  });
}

// Generate mock committee assignments for a senator
export function generateCommitteeAssignments(senatorId: string): CommitteeAssignment[] {
  const senator = getSenatorByCounty(senatorId);
  if (!senator) return [];
  
  return senator.committees.map((committeeName, index) => {
    const committee = senateCommittees.find(c => c.name === committeeName);
    const roles: ('Chair' | 'Vice Chair' | 'Member')[] = ['Chair', 'Vice Chair', 'Member'];
    // First committee more likely to be leadership role
    const roleIndex = index === 0 && Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 2;
    
    return {
      name: committeeName,
      role: roles[roleIndex],
      description: committee?.description || 'Senate standing committee'
    };
  });
}
