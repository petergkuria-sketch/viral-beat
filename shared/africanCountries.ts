export type AfricanRegion =
  | "North Africa"
  | "East Africa"
  | "West Africa"
  | "Central Africa"
  | "Southern Africa";

export interface AfricanCountry {
  code: string;       // ISO 3166-1 alpha-2
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
  { code: "DZ", name: "Algeria",       capital: "Algiers",      region: "North Africa",    flag: "🇩🇿", languages: ["Arabic","Tamazight","French"],
    rssFeeds: [{ name: "Algeria Watch", url: "https://www.algeria-watch.org/feed/" }] },
  { code: "EG", name: "Egypt",         capital: "Cairo",        region: "North Africa",    flag: "🇪🇬", languages: ["Arabic"],
    rssFeeds: [{ name: "Egypt Independent", url: "https://egyptindependent.com/feed/" }] },
  { code: "LY", name: "Libya",         capital: "Tripoli",      region: "North Africa",    flag: "🇱🇾", languages: ["Arabic"],
    rssFeeds: [{ name: "Libya Observer", url: "https://www.libyaobserver.ly/feed" }] },
  { code: "MA", name: "Morocco",       capital: "Rabat",        region: "North Africa",    flag: "🇲🇦", languages: ["Arabic","Tamazight","French"],
    rssFeeds: [{ name: "Morocco World News", url: "https://www.moroccoworldnews.com/feed/" }] },
  { code: "MR", name: "Mauritania",    capital: "Nouakchott",   region: "North Africa",    flag: "🇲🇷", languages: ["Arabic","French"] },
  { code: "SD", name: "Sudan",         capital: "Khartoum",     region: "North Africa",    flag: "🇸🇩", languages: ["Arabic","English"],
    rssFeeds: [
      { name: "Sudan Tribune",    url: "https://sudantribune.com/feed/" },
      { name: "Radio Dabanga",    url: "https://www.dabangasudan.org/en/feed" },
    ] },
  { code: "TN", name: "Tunisia",       capital: "Tunis",        region: "North Africa",    flag: "🇹🇳", languages: ["Arabic","French"] },

  // ── East Africa ───────────────────────────────────────────────────────────
  { code: "BI", name: "Burundi",       capital: "Gitega",       region: "East Africa",     flag: "🇧🇮", languages: ["Kirundi","French","English"] },
  { code: "KM", name: "Comoros",       capital: "Moroni",       region: "East Africa",     flag: "🇰🇲", languages: ["Comorian","Arabic","French"] },
  { code: "DJ", name: "Djibouti",      capital: "Djibouti",     region: "East Africa",     flag: "🇩🇯", languages: ["French","Arabic"] },
  { code: "ER", name: "Eritrea",       capital: "Asmara",       region: "East Africa",     flag: "🇪🇷", languages: ["Tigrinya","Arabic","English"] },
  { code: "ET", name: "Ethiopia",      capital: "Addis Ababa",  region: "East Africa",     flag: "🇪🇹", languages: ["Amharic","Oromo","Somali"],
    rssFeeds: [{ name: "Addis Standard", url: "https://addisstandard.com/feed/" }] },
  { code: "KE", name: "Kenya",         capital: "Nairobi",      region: "East Africa",     flag: "🇰🇪", languages: ["Swahili","English"], hasRichData: true,
    rssFeeds: [
      { name: "Daily Nation",    url: "https://nation.africa/kenya/rss.xml" },
      { name: "The Standard",    url: "https://www.standardmedia.co.ke/rss/kenya.php" },
    ] },
  { code: "MG", name: "Madagascar",    capital: "Antananarivo", region: "East Africa",     flag: "🇲🇬", languages: ["Malagasy","French"] },
  { code: "MW", name: "Malawi",        capital: "Lilongwe",     region: "East Africa",     flag: "🇲🇼", languages: ["Chichewa","English"],
    rssFeeds: [{ name: "Nyasa Times", url: "https://www.nyasatimes.com/feed/" }] },
  { code: "MU", name: "Mauritius",     capital: "Port Louis",   region: "East Africa",     flag: "🇲🇺", languages: ["English","French","Creole"] },
  { code: "MZ", name: "Mozambique",    capital: "Maputo",       region: "East Africa",     flag: "🇲🇿", languages: ["Portuguese"] },
  { code: "RW", name: "Rwanda",        capital: "Kigali",       region: "East Africa",     flag: "🇷🇼", languages: ["Kinyarwanda","French","English"],
    rssFeeds: [{ name: "The New Times", url: "https://www.newtimes.co.rw/rss.xml" }] },
  { code: "SC", name: "Seychelles",    capital: "Victoria",     region: "East Africa",     flag: "🇸🇨", languages: ["Seychellois Creole","English","French"] },
  { code: "SO", name: "Somalia",       capital: "Mogadishu",    region: "East Africa",     flag: "🇸🇴", languages: ["Somali","Arabic"],
    rssFeeds: [{ name: "Garowe Online", url: "https://www.garoweonline.com/en/rss.xml" }] },
  { code: "SS", name: "South Sudan",   capital: "Juba",         region: "East Africa",     flag: "🇸🇸", languages: ["English","Dinka"],
    rssFeeds: [{ name: "Eye Radio South Sudan", url: "https://www.eyeradio.org/feed/" }] },
  { code: "TZ", name: "Tanzania",      capital: "Dodoma",       region: "East Africa",     flag: "🇹🇿", languages: ["Swahili","English"],
    rssFeeds: [{ name: "The Citizen TZ", url: "https://www.thecitizen.co.tz/rss.xml" }] },
  { code: "UG", name: "Uganda",        capital: "Kampala",      region: "East Africa",     flag: "🇺🇬", languages: ["English","Swahili"],
    rssFeeds: [{ name: "Monitor Uganda", url: "https://www.monitor.co.ug/rss.xml" }] },
  { code: "ZM", name: "Zambia",        capital: "Lusaka",       region: "East Africa",     flag: "🇿🇲", languages: ["English"],
    rssFeeds: [{ name: "Lusaka Times", url: "https://www.lusakatimes.com/feed/" }] },
  { code: "ZW", name: "Zimbabwe",      capital: "Harare",       region: "East Africa",     flag: "🇿🇼", languages: ["English","Shona","Ndebele"],
    rssFeeds: [{ name: "NewsDay Zimbabwe", url: "https://www.newsday.co.zw/feed/" }] },

  // ── West Africa ───────────────────────────────────────────────────────────
  { code: "BJ", name: "Benin",               capital: "Porto-Novo",  region: "West Africa", flag: "🇧🇯", languages: ["French"] },
  { code: "BF", name: "Burkina Faso",         capital: "Ouagadougou", region: "West Africa", flag: "🇧🇫", languages: ["French"] },
  { code: "CV", name: "Cabo Verde",           capital: "Praia",       region: "West Africa", flag: "🇨🇻", languages: ["Portuguese","Cape Verdean Creole"] },
  { code: "CI", name: "Côte d'Ivoire",        capital: "Yamoussoukro",region: "West Africa", flag: "🇨🇮", languages: ["French"] },
  { code: "GM", name: "Gambia",               capital: "Banjul",      region: "West Africa", flag: "🇬🇲", languages: ["English"] },
  { code: "GH", name: "Ghana",               capital: "Accra",       region: "West Africa", flag: "🇬🇭", languages: ["English"],
    rssFeeds: [{ name: "Ghana Web", url: "https://www.ghanaweb.com/rss/news.xml" }] },
  { code: "GN", name: "Guinea",              capital: "Conakry",     region: "West Africa", flag: "🇬🇳", languages: ["French"] },
  { code: "GW", name: "Guinea-Bissau",       capital: "Bissau",      region: "West Africa", flag: "🇬🇼", languages: ["Portuguese"] },
  { code: "LR", name: "Liberia",             capital: "Monrovia",    region: "West Africa", flag: "🇱🇷", languages: ["English"] },
  { code: "ML", name: "Mali",                capital: "Bamako",      region: "West Africa", flag: "🇲🇱", languages: ["French"] },
  { code: "NE", name: "Niger",               capital: "Niamey",      region: "West Africa", flag: "🇳🇪", languages: ["French"] },
  { code: "NG", name: "Nigeria",             capital: "Abuja",       region: "West Africa", flag: "🇳🇬", languages: ["English","Hausa","Yoruba","Igbo"],
    rssFeeds: [
      { name: "Vanguard Nigeria", url: "https://www.vanguardngr.com/feed/" },
      { name: "Punch Nigeria",    url: "https://punchng.com/feed/" },
    ] },
  { code: "ST", name: "São Tomé and Príncipe",capital: "São Tomé",   region: "West Africa", flag: "🇸🇹", languages: ["Portuguese"] },
  { code: "SN", name: "Senegal",             capital: "Dakar",       region: "West Africa", flag: "🇸🇳", languages: ["French","Wolof"],
    rssFeeds: [{ name: "Senenews", url: "https://www.senenews.com/feed/" }] },
  { code: "SL", name: "Sierra Leone",        capital: "Freetown",    region: "West Africa", flag: "🇸🇱", languages: ["English"] },
  { code: "TG", name: "Togo",                capital: "Lomé",        region: "West Africa", flag: "🇹🇬", languages: ["French"] },

  // ── Central Africa ────────────────────────────────────────────────────────
  { code: "AO", name: "Angola",                 capital: "Luanda",     region: "Central Africa", flag: "🇦🇴", languages: ["Portuguese"] },
  { code: "CM", name: "Cameroon",               capital: "Yaoundé",    region: "Central Africa", flag: "🇨🇲", languages: ["French","English"] },
  { code: "CF", name: "Central African Republic",capital: "Bangui",    region: "Central Africa", flag: "🇨🇫", languages: ["French","Sango"] },
  { code: "TD", name: "Chad",                   capital: "N'Djamena",  region: "Central Africa", flag: "🇹🇩", languages: ["French","Arabic"] },
  { code: "CG", name: "Congo",                  capital: "Brazzaville",region: "Central Africa", flag: "🇨🇬", languages: ["French","Lingala"] },
  { code: "CD", name: "DR Congo",               capital: "Kinshasa",   region: "Central Africa", flag: "🇨🇩", languages: ["French","Lingala","Swahili","Kikongo"],
    rssFeeds: [{ name: "Radio Okapi", url: "https://www.radiookapi.net/feed" }] },
  { code: "GQ", name: "Equatorial Guinea",      capital: "Malabo",     region: "Central Africa", flag: "🇬🇶", languages: ["Spanish","French","Portuguese"] },
  { code: "GA", name: "Gabon",                  capital: "Libreville", region: "Central Africa", flag: "🇬🇦", languages: ["French"] },

  // ── Southern Africa ───────────────────────────────────────────────────────
  { code: "BW", name: "Botswana",    capital: "Gaborone",    region: "Southern Africa", flag: "🇧🇼", languages: ["English","Setswana"] },
  { code: "SZ", name: "Eswatini",   capital: "Mbabane",     region: "Southern Africa", flag: "🇸🇿", languages: ["Swati","English"] },
  { code: "LS", name: "Lesotho",    capital: "Maseru",      region: "Southern Africa", flag: "🇱🇸", languages: ["Sesotho","English"] },
  { code: "NA", name: "Namibia",    capital: "Windhoek",    region: "Southern Africa", flag: "🇳🇦", languages: ["English","Afrikaans"] },
  { code: "ZA", name: "South Africa",capital: "Pretoria",  region: "Southern Africa", flag: "🇿🇦", languages: ["Zulu","Xhosa","Afrikaans","English"],
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
