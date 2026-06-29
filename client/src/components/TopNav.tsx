import { useLocation } from "wouter";
import { LayoutDashboard, ScanLine, Building2, FileText, TrendingUp, MessageSquare } from "lucide-react";

type NavEntry = { icon: typeof Building2; label: string; path: string; exact?: boolean };

// Exchange-persona tasks first; the bridge into the broader app is grouped separately.
const EXCHANGE_NAV: NavEntry[] = [
  { icon: Building2,     label: "Browse",       path: "/exchange", exact: true },
  { icon: FileText,      label: "List",         path: "/exchange/list" },
  { icon: TrendingUp,    label: "My Listings",  path: "/exchange/mine" },
  { icon: MessageSquare, label: "Messages",     path: "/exchange/messages" },
];

const APP_NAV: NavEntry[] = [
  { icon: ScanLine,        label: "Scanner",   path: "/scanner" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
];

/** Persistent icon nav bar for standalone Exchange pages that lack the sidebar layout. */
export function TopNav() {
  const [loc, setLocation] = useLocation();
  const isActive = (e: NavEntry) =>
    e.exact ? loc === e.path : loc === e.path || loc.startsWith(e.path + "/");

  const renderBtn = (e: NavEntry) => {
    const active = isActive(e);
    const Icon = e.icon;
    return (
      <button key={e.path} onClick={() => setLocation(e.path)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
          active ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"}`}>
        <Icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{e.label}</span>
      </button>
    );
  };

  return (
    <div className="sticky top-0 z-40 bg-[#080d1a]/90 backdrop-blur border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-1 overflow-x-auto">
        <button onClick={() => setLocation("/")} aria-label="ViralBeat home"
          className="font-black text-cyan-400 text-sm mr-2 shrink-0 hover:text-cyan-300">VB</button>
        {EXCHANGE_NAV.map(renderBtn)}
        <div className="w-px h-5 bg-white/10 mx-1 shrink-0" aria-hidden="true" />
        {APP_NAV.map(renderBtn)}
      </div>
    </div>
  );
}
