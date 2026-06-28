import { useLocation } from "wouter";
import { LayoutDashboard, Globe, ScanLine, Briefcase, Brain, Leaf } from "lucide-react";

const NAV: { icon: typeof Globe; label: string; path: string }[] = [
  { icon: LayoutDashboard, label: "Dashboard",    path: "/dashboard" },
  { icon: Globe,           label: "Africa Hub",   path: "/africa" },
  { icon: ScanLine,        label: "Scanner",      path: "/scanner" },
  { icon: Briefcase,       label: "SME Exchange", path: "/exchange" },
  { icon: Brain,           label: "Intelligence", path: "/intelligence" },
  { icon: Leaf,            label: "Green",        path: "/green" },
];

/** Persistent icon nav bar for standalone pages that lack the sidebar layout. */
export function TopNav() {
  const [loc, setLocation] = useLocation();
  const isActive = (p: string) => loc === p || loc.startsWith(p + "/");
  return (
    <div className="sticky top-0 z-40 bg-[#080d1a]/90 backdrop-blur border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-1 overflow-x-auto">
        <button onClick={() => setLocation("/")} aria-label="ViralBeat home"
          className="font-black text-cyan-400 text-sm mr-2 shrink-0 hover:text-cyan-300">VB</button>
        {NAV.map(({ icon: Icon, label, path }) => {
          const active = isActive(path);
          return (
            <button key={path} onClick={() => setLocation(path)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                active ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"}`}>
              <Icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
