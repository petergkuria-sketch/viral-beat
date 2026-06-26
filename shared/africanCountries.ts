export type AfricanRegion =
  | "North Africa"
  | "East Africa"
  | "West Africa"
  | "Central Africa"
  | "Southern Africa";

export interface AfricanCountry {
  code: string;       // ISO 3166-1 alpha-2
  iso3: string;       // ISO 3166-1 alpha-3
  name: string;
  capital: string;
  region: AfricanRegion;
  flag: string;       // emoji
  languages: string[];
  population?: number; // millions
  currency?: string;
  hasRichData?: boolean; // true = has seeded DB data (Kenya etc.)
  rssFeeds?: { name: string; url: string }[];
}

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  // ── North Africa ─────────────────────────────────────────────────────────
  { code: "DZ", iso3: "DZA", name: "Algeria",       capital: "Algiers",      region: "North Africa",    flag: "🇩🇿", languages: ["Arabic","Tamazight","French"],
    rssFeeds: [{ name: "Algeria Watch", url: "https://www.algeria-watch.org/feed/" }] },
  { code: "EG", iso3: "EGY", name: "Egypt",         capital: "Cairo",        region: "North Africa",    flag: "🇪🇬", languages: ["Arabic"],
    rssFeeds: [{ name: "Egypt Independent", url: "https://egyptindependent.com/feed/" }] },
  { code: "LY", iso3: "LBY", name: "Libya",         capital: "Tripoli",      region: "North Africa",    flag: "🇱🇾", languages: ["Arabic"],
    rssFeeds: [{ name: "Libya Observer", url: "https://www.libyaobserver.ly/feed" }] },
  { code: "MA", iso3: "MAR", name: "Morocco",       capital: "Rabat",        region: "North Africa",    flag: "🇲🇦", languages: ["Arabic","Tamazight","French"],
    rssFeeds: [{ name: "Morocco World News", url: "https://www.moroccoworldnews.com/feed/" }] },
  { code: "MR", iso3: "MRT", name: "Mauritania",    capital: "Nouakchott",   region: "North Africa",    flag: "🇲🇷", languages: ["Arabic","French"] },
  { code: "SD", iso3: "SDN", name: "Sudan",         capital: "Khartoum",     region: "North Africa",    flag: "🇸🇩", languages: ["Arabic","English"],
    rssFeeds: [
      { name: "Sudan Tribune",    url: "https://sudantribune.com/feed/" },
      { name: "Radio Dabanga",    url: "https://www.dabangasudan.org/en/feed" },
    ] },
  { code: "TN", iso3: "TUN", name: "Tunisia",       capital: "Tunis",        region: "North Africa",    flag: "🇹🇳", languages: ["Arabic","French"] },

  // ── East Africa ───────────────────────────────────────────────────────────
  { code: "BI", iso3: "BDI", name: "Burundi",       capital: "Gitega",       region: "East Africa",     flag: "🇧🇮", languages: ["Kirundi","French","English"] },
  { code: "KM", iso3: "COM", name: "Comoros",       capital: "Moroni",       region: "East Africa",     flag: "🇰🇲", languages: ["Comorian","Arabic","French"] },
  { code: "DJ", iso3: "DJI", name: "Djibouti",      capital: "Djibouti",     region: "East Africa",     flag: "🇩🇯", languages: ["French","Arabic"] },
  { code: "ER", iso3: "ERI", name: "Eritrea",       capital: "Asmara",       region: "East Africa",     flag: "🇪🇷", languages: ["Tigrinya","Arabic","English"] },
  { code: "ET", iso3: "ETH", name: "Ethiopia",      capital: "Addis Ababa",  region: "East Africa",     flag: "🇪🇹", languages: ["Amharic","Oromo","Somali"],
    rssFeeds: [{ name: "Addis Standard", url: "https://addisstandard.com/feed/" }] },
  { code: "KE", iso3: "KEN", name: "Kenya",         capital: "Nairobi",      region: "East Africa",     flag: "🇰🇪", languages: ["Swahili","English"], hasRichData: true,
    rssFeeds: [
      { name: "Daily Nation",    url: "https://nation.africa/kenya/rss.xml" },
      { name: "The Standard",    url: "https://www.standardmedia.co.ke/rss/kenya.php" },
    ] },
  { code: "MG", iso3: "MDG", name: "Madagascar",    capital: "Antananarivo", region: "East Africa",     flag: "🇲🇬", languages: ["Malagasy","French"] },
  { code: "MW", iso3: "MWI", name: "Malawi",        capital: "Lilongwe",     region: "East Africa",     flag: "🇲🇼", languages: ["Chichewa","English"],
    rssFeeds: [{ name: "Nyasa Times", url: "https://www.nyasatimes.com/feed/" }] },
  { code: "MU", iso3: "MUS", name: "Mauritius",     capital: "Port Louis",   region: "East Africa",     flag: "🇲🇺", languages: ["English","French","Creole"] },
  { code: "MZ", iso3: "MOZ", name: "Mozambique",    capital: "Maputo",       region: "East Africa",     flag: "🇲🇿", languages: ["Portuguese"] },
  { code: "RW", iso3: "RWA", name: "Rwanda",        capital: "Kigali",       region: "East Africa",     flag: "🇷🇼", languages: ["Kinyarwanda","French","English"],
    rssFeeds: [{ name: "The New Times", url: "https://www.newtimes.co.rw/rss.xml" }] },
  { code: "SC", iso3: "SYC", name: "Seychelles",    capital: "Victoria",     region: "East Africa",     flag: "🇸🇨", languages: ["Seychellois Creole","English","French"] },
  { code: "SO", iso3: "SOM", name: "Somalia",       capital: "Mogadishu",    region: "East Africa",     flag: "🇸🇴", languages: ["Somali","Arabic"],
    rssFeeds: [{ name: "Garowe Online", url: "https://www.garoweonline.com/en/rss.xml" }] },
  { code: "SS", iso3: "SSD", name: "South Sudan",   capital: "Juba",         region: "East Africa",     flag: "🇸🇸", languages: ["English","Dinka"],
    rssFeeds: [{ name: "Eye Radio South Sudan", url: "https://www.eyeradio.org/feed/" }] },
  { code: "TZ", iso3: "TZA", name: "Tanzania",      capital: "Dodoma",       region: "East Africa",     flag: "🇹🇿", languages: ["Swahili","English"],
    rssFeeds: [{ name: "The Citizen TZ", url: "https://www.thecitizen.co.tz/rss.xml" }] },
  { code: "UG", iso3: "UGA", name: "Uganda",        capital: "Kampala",      region: "East Africa",     flag: "🇺🇬", languages: ["English","Swahili"],
    rssFeeds: [{ name: "Monitor Uganda", url: "https://www.monitor.co.ug/rss.xml" }] },
  { code: "ZM", iso3: "ZMB", name: "Zambia",        capital: "Lusaka",       region: "East Africa",     flag: "🇿🇲", languages: ["English"],
    rssFeeds: [{ name: "Lusaka Times", url: "https://www.lusakatimes.com/feed/" }] },
  { code: "ZW", iso3: "ZWE", name: "Zimbabwe",      capital: "Harare",       region: "East Africa",     flag: "🇿🇼", languages: ["English","Shona","Ndebele"],
    rssFeeds: [{ name: "NewsDay Zimbabwe", url: "https://www.newsday.co.zw/feed/" }] },

  // ── West Africa ───────────────────────────────────────────────────────────
  { code: "BJ", iso3: "BEN", name: "Benin",               capital: "Porto-Novo",  region: "West Africa", flag: "🇧🇯", languages: ["French"] },
  { code: "BF", iso3: "BFA", name: "Burkina Faso",         capital: "Ouagadougou", region: "West Africa", flag: "🇧🇫", languages: ["French"] },
  { code: "CV", iso3: "CPV", name: "Cabo Verde",           capital: "Praia",       region: "West Africa", flag: "🇨🇻", languages: ["Portuguese","Cape Verdean Creole"] },
  { code: "CI", iso3: "CIV", name: "Côte d'Ivoire",        capital: "Yamoussoukro",region: "West Africa", flag: "🇨🇮", languages: ["French"] },
  { code: "GM", iso3: "GMB", name: "Gambia",               capital: "Banjul",      region: "West Africa", flag: "🇬🇲", languages: ["English"] },
  { code: "GH", iso3: "GHA", name: "Ghana",               capital: "Accra",       region: "West Africa", flag: "🇬🇭", languages: ["English"],
    rssFeeds: [{ name: "Ghana Web", url: "https://www.ghanaweb.com/rss/news.xml" }] },
  { code: "GN", iso3: "GIN", name: "Guinea",              capital: "Conakry",     region: "West Africa", flag: "🇬🇳", languages: ["French"] },
  { code: "GW", iso3: "GNB", name: "Guinea-Bissau",       capital: "Bissau",      region: "West Africa", flag: "🇬🇼", languages: ["Portuguese"] },
  { code: "LR", iso3: "LBR", name: "Liberia",             capital: "Monrovia",    region: "West Africa", flag: "🇱🇷", languages: ["English"] },
  { code: "ML", iso3: "MLI", name: "Mali",                capital: "Bamako",      region: "West Africa", flag: "🇲🇱", languages: ["French"] },
  { code: "NE", iso3: "NER", name: "Niger",               capital: "Niamey",      region: "West Africa", flag: "🇳🇪", languages: ["French"] },
  { code: "NG", iso3: "NGA", name: "Nigeria",             capital: "Abuja",       region: "West Africa", flag: "🇳🇬", languages: ["English","Hausa","Yoruba","Igbo"],
    rssFeeds: [
      { name: "Vanguard Nigeria", url: "https://www.vanguardngr.com/feed/" },
      { name: "Punch Nigeria",    url: "https://punchng.com/feed/" },
    ] },
  { code: "ST", iso3: "STP", name: "São Tomé and Príncipe",capital: "São Tomé",   region: "West Africa", flag: "🇸🇹", languages: ["Portuguese"] },
  { code: "SN", iso3: "SEN", name: "Senegal",             capital: "Dakar",       region: "West Africa", flag: "🇸🇳", languages: ["French","Wolof"],
    rssFeeds: [{ name: "Senenews", url: "https://www.senenews.com/feed/" }] },
  { code: "SL", iso3: "SLE", name: "Sierra Leone",        capital: "Freetown",    region: "West Africa", flag: "🇸🇱", languages: ["English"] },
  { code: "TG", iso3: "TGO", name: "Togo",                capital: "Lomé",        region: "West Africa", flag: "🇹🇬", languages: ["French"] },

  // ── Central Africa ────────────────────────────────────────────────────────
  { code: "AO", iso3: "AGO", name: "Angola",                 capital: "Luanda",     region: "Central Africa", flag: "🇦🇴", languages: ["Portuguese"] },
  { code: "CM", iso3: "CMR", name: "Cameroon",               capital: "Yaoundé",    region: "Central Africa", flag: "🇨🇲", languages: ["French","English"] },
  { code: "CF", iso3: "CAF", name: "Central African Republic",capital: "Bangui",    region: "Central Africa", flag: "🇨🇫", languages: ["French","Sango"] },
  { code: "TD", iso3: "TCD", name: "Chad",                   capital: "N'Djamena",  region: "Central Africa", flag: "🇹🇩", languages: ["French","Arabic"] },
  { code: "CG", iso3: "COG", name: "Congo",                  capital: "Brazzaville",region: "Central Africa", flag: "🇨🇬", languages: ["French","Lingala"] },
  { code: "CD", iso3: "COD", name: "DR Congo",               capital: "Kinshasa",   region: "Central Africa", flag: "🇨🇩", languages: ["French","Lingala","Swahili","Kikongo"],
    rssFeeds: [{ name: "Radio Okapi", url: "https://www.radiookapi.net/feed" }] },
  { code: "GQ", iso3: "GNQ", name: "Equatorial Guinea",      capital: "Malabo",     region: "Central Africa", flag: "🇬🇶", languages: ["Spanish","French","Portuguese"] },
  { code: "GA", iso3: "GAB", name: "Gabon",                  capital: "Libreville", region: "Central Africa", flag: "🇬🇦", languages: ["French"] },

  // ── Southern Africa ───────────────────────────────────────────────────────
  { code: "BW", iso3: "BWA", name: "Botswana",    capital: "Gaborone",    region: "Southern Africa", flag: "🇧🇼", languages: ["English","Setswana"] },
  { code: "SZ", iso3: "SWZ", name: "Eswatini",   capital: "Mbabane",     region: "Southern Africa", flag: "🇸🇿", languages: ["Swati","English"] },
  { code: "LS", iso3: "LSO", name: "Lesotho",    capital: "Maseru",      region: "Southern Africa", flag: "🇱🇸", languages: ["Sesotho","English"] },
  { code: "NA", iso3: "NAM", name: "Namibia",    capital: "Windhoek",    region: "Southern Africa", flag: "🇳🇦", languages: ["English","Afrikaans"] },
  { code: "ZA", iso3: "ZAF", name: "South Africa",capital: "Pretoria",  region: "Southern Africa", flag: "🇿🇦", languages: ["Zulu","Xhosa","Afrikaans","English"],
    rssFeeds: [
      { name: "Daily Maverick",  url: "https://www.dailymaverick.co.za/rss.xml" },
      { name: "News24 South Africa", url: "https://feeds.news24.com/articles/news24/SouthAfrica/rss" },
    ] },
];

export const AFRICAN_REGIONS: AfricanRegion[] = [
  "North Africa",
  "East Africa",
  "West Africa",
  "Central Africa",
  "Southern Africa",
];

export function getCountry(code: string): AfricanCountry | undefined {
  return AFRICAN_COUNTRIES.find(c => c.code === code);
}

export function getCountriesByRegion(region: AfricanRegion): AfricanCountry[] {
  return AFRICAN_COUNTRIES.filter(c => c.region === region);
}

export const COUNTRY_CODES = new Set(AFRICAN_COUNTRIES.map(c => c.code));

/** ISO3 lookup — used by report archive and signal ingestion pipelines */
export const COUNTRY_ISO3_CODES = new Set(AFRICAN_COUNTRIES.map(c => c.iso3));

/** Flat list for archive country filter dropdowns (ISO3 format to match reportArchive.countryCodes) */
export const ARCHIVE_COUNTRIES: { code: string; name: string }[] =
  AFRICAN_COUNTRIES.map(c => ({ code: c.iso3, name: c.name }));

export function getCountryByIso3(iso3: string): AfricanCountry | undefined {
  return AFRICAN_COUNTRIES.find(c => c.iso3 === iso3);
}
