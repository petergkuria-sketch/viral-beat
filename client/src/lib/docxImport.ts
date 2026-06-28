import { unzipSync, strFromU8 } from "fflate";
import { COUNTRIES } from "./scannerData";

// Parses the VB SME Listing template (.docx) — a 2-column Question/Answer table —
// into structured listing fields, entirely in the browser.

export interface ImportedListing {
  name?: string;
  sector?: string;
  countryCode?: string;
  location?: string;
  website?: string;
  foundedYear?: string;
  ownership?: string;
  employees?: string;
  summary?: string;
  products?: string;
  statusTags?: string[];
  governance?: number;
  financial?: number;
  innovation?: number;
  market?: number;
  certifications?: string[];
  exportMarkets?: string[];
  awards?: string[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  listedByType?: "self" | "incubator" | "accelerator";
  listedByOrg?: string;
}

const STATUS_OPTIONS = ["Seeking capital", "Open to collaboration", "Open to exit", "Seeking partners", "Export bound"];

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x?[0-9a-fA-F]+;/g, "");

const TXT = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;

function paraTexts(tc: string): string[] {
  return Array.from(tc.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g))
    .map(p => decode(Array.from(p[0].matchAll(TXT)).map(m => m[1]).join("")).trim())
    .filter(Boolean);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function toList(v: string): string[] {
  return v.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
}
function toScore(v: string): number | undefined {
  const m = v.match(/\d{1,3}/);          // first 1–3 digit run, e.g. "80 out of 100" → 80
  if (!m) return undefined;
  return Math.max(0, Math.min(100, parseInt(m[0], 10)));
}

export function parseListingDocx(buf: ArrayBuffer): { data: ImportedListing; filledCount: number } {
  const files = unzipSync(new Uint8Array(buf));
  const docXml = files["word/document.xml"];
  if (!docXml) throw new Error("This file isn't a valid .docx (no document.xml).");
  const xml = strFromU8(docXml);

  // Collect label -> answer from every 2-cell row.
  const map = new Map<string, string>();
  for (const row of Array.from(xml.matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)).map(m => m[0])) {
    const cells = Array.from(row.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)).map(m => m[0]);
    if (cells.length !== 2) continue;
    const label = (paraTexts(cells[0])[0] ?? "");
    const answer = paraTexts(cells[1]).join(" ").trim();
    if (!label || norm(label) === norm("Question")) continue;
    map.set(norm(label), answer);
  }

  const get = (label: string) => (map.get(norm(label)) ?? "").trim();

  const data: ImportedListing = {};
  let filled = 0;
  const setStr = (k: keyof ImportedListing, label: string) => {
    const v = get(label);
    if (v) { (data as any)[k] = v; filled++; }
  };

  setStr("name", "Enterprise name");
  setStr("sector", "Sector");
  setStr("location", "Location");
  setStr("website", "Website");
  setStr("ownership", "Ownership");
  setStr("summary", "Business summary");
  setStr("products", "Products / services");
  setStr("contactName", "Contact name");
  setStr("contactEmail", "Contact email");
  setStr("contactPhone", "Contact phone");
  setStr("listedByOrg", "Incubator / accelerator name");

  const founded = get("Year founded");
  if (founded) { const y = founded.replace(/[^0-9]/g, "").slice(0, 4); if (y) { data.foundedYear = y; filled++; } }

  const employees = get("Number of employees");
  if (employees) { data.employees = employees; filled++; }

  // Country → ISO3
  const country = get("Country");
  if (country) {
    const hit = COUNTRIES.find(c => norm(c.name) === norm(country) || c.code.toLowerCase() === country.trim().toLowerCase());
    if (hit) { data.countryCode = hit.code; filled++; }
  }

  // Pillars
  const g = toScore(get("Governance score")); if (g !== undefined) { data.governance = g; filled++; }
  const f = toScore(get("Financial health score")); if (f !== undefined) { data.financial = f; filled++; }
  const i = toScore(get("Innovation capacity score")); if (i !== undefined) { data.innovation = i; filled++; }
  const m = toScore(get("Market reach score")); if (m !== undefined) { data.market = m; filled++; }

  // Lists
  const certs = get("Certifications"); if (certs) { data.certifications = toList(certs); filled++; }
  const exp = get("Export markets"); if (exp) { data.exportMarkets = toList(exp); filled++; }
  const awards = get("Awards / recognition"); if (awards) { data.awards = toList(awards); filled++; }

  // Status (validate against options, case-insensitive)
  const status = get("Market status");
  if (status) {
    const picked = toList(status)
      .map(s => STATUS_OPTIONS.find(o => norm(o) === norm(s)))
      .filter((s): s is string => !!s);
    if (picked.length) { data.statusTags = picked; filled++; }
  }

  // Listing on behalf of
  const lb = norm(get("Listing on behalf of"));
  if (lb.includes("incubator")) { data.listedByType = "incubator"; filled++; }
  else if (lb.includes("accelerator")) { data.listedByType = "accelerator"; filled++; }
  else if (lb.includes("self")) { data.listedByType = "self"; filled++; }

  return { data, filledCount: filled };
}
