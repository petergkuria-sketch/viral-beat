import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import { AFRICAN_COUNTRIES, AFRICAN_REGIONS, getCountriesByRegion } from "../../../shared/africanCountries";
import { COUNTRY_CONFIGS } from "../../../shared/countryConfig";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Button } from "./ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import {
  LayoutDashboard, LogOut, TrendingUp, Heart, User, Code2, Bot,
  Settings as SettingsIcon, Shield, ShieldCheck, Coins, ShoppingCart,
  BarChart3, BadgeCheck, Users, Sparkles, ArrowRightLeft, Crown,
  MessageSquare, Mail, MapPin, Newspaper, AlertTriangle, Globe,
  Scale, Building2, Landmark, Vote, Radio, FileText, ChevronDown,
  ChevronRight, Home, UserCircle, Menu, X, PanelLeft, Layers, BarChart2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

// ─── Route helper ──────────────────────────────────────────────────────────────
function countryPath(code: string, hasRichData?: boolean): string {
  if (hasRichData) return "/kenya";
  if (COUNTRY_CONFIGS[code.toLowerCase()]) return `/country/${code.toLowerCase()}`;
  return `/africa/${code}`;
}

// ─── Section / item definitions ───────────────────────────────────────────────
interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
  accent: string;          // hex colour for icon + active indicator
  items?: NavItem[];
  adminOnly?: boolean;
  custom?: boolean;        // Africa section uses custom renderer
}

const SECTIONS: Section[] = [
  {
    id: "africa",
    label: "Africa Intelligence",
    icon: Globe,
    accent: "#818cf8",
    custom: true,
  },
  {
    id: "kenya",
    label: "Kenya Deep-Dive",
    icon: MapPin,
    accent: "#34d399",
    items: [
      { icon: Globe,         label: "Overview",          path: "/kenya" },
      { icon: MapPin,        label: "Sentiment Tracker",  path: "/kenya/tracker" },
      { icon: MapPin,        label: "Regional Map",       path: "/kenya/regional-map" },
      { icon: AlertTriangle, label: "Balkanization Risk", path: "/kenya/balkanization" },
      { icon: Scale,         label: "ICC Hate Speech",    path: "/kenya/icc-agent" },
      { icon: Users,         label: "Political Actors",   path: "/kenya/actors" },
      { icon: Newspaper,     label: "Newsfeed",           path: "/kenya/newsfeed" },
      { icon: Radio,         label: "Breaking News",      path: "/kenya/breaking-news" },
      { icon: FileText,      label: "Election Phases",    path: "/kenya/election-phases" },
      { icon: AlertTriangle, label: "Alerts",             path: "/kenya/alerts" },
      { icon: FileText,      label: "Reports",            path: "/kenya/reports" },
      { icon: Users,         label: "Movements",          path: "/kenya/movements" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence Tools",
    icon: TrendingUp,
    accent: "#38bdf8",
    items: [
      { icon: Sparkles,   label: "Signal Monitor",        path: "/intelligence" },
      { icon: Layers,     label: "Political Aggregator",  path: "/aggregator" },
      { icon: BarChart2,  label: "PESTEL Trending",       path: "/trending" },
      { icon: Users,      label: "Field Signals",         path: "/haa" },
      { icon: Heart,      label: "Favorites",             path: "/favorites" },
      { icon: Mail,       label: "Newsletter",            path: "/newsletter" },
      { icon: Bot,        label: "AI Agents",             path: "/ai-agents" },
      { icon: Code2,      label: "Widget Builder",        path: "/widget-builder" },
    ],
  },
  {
    id: "credits",
    label: "Contributions",
    icon: Coins,
    accent: "#34d399",
    items: [
      { icon: Coins, label: "My Credits", path: "/credits" },
    ],
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: Sparkles,
    accent: "#a78bfa",
    items: [
      { icon: BadgeCheck, label: "Creator Verification", path: "/creator-verification" },
      { icon: Sparkles,   label: "Advanced Features",    path: "/advanced-features" },
    ],
  },
  {
    id: "developer",
    label: "Developer",
    icon: Code2,
    accent: "#22d3ee",
    items: [
      { icon: Code2, label: "Developer Hub", path: "/developer-hub" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: ShieldCheck,
    accent: "#fb923c",
    adminOnly: true,
    items: [
      { icon: ShieldCheck, label: "Admin Dashboard", path: "/admin" },
      { icon: Users,       label: "User Management", path: "/admin/users" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: SettingsIcon,
    accent: "#94a3b8",
    items: [
      { icon: Crown,        label: "Pricing & Plans",      path: "/pricing" },
      { icon: UserCircle,   label: "Contributor Profile",  path: "/contributor" },
      { icon: FileText,     label: "About & Methodology",  path: "/about" },
      { icon: SettingsIcon, label: "Settings",         path: "/settings" },
      { icon: Shield,       label: "Privacy",          path: "/privacy-settings" },
    ],
  },
];

// ─── Africa region sub-section ────────────────────────────────────────────────
function AfricaSection({
  location, setLocation, expanded, myCountryCode,
}: {
  location: string; setLocation: (p: string) => void;
  expanded: boolean; myCountryCode: string | null;
}) {
  const [openRegions, setOpenRegions] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("sb-regions") ?? "[]") as string[]); } catch { return new Set(); }
  });
  const toggleRegion = (r: string) => {
    setOpenRegions(prev => {
      const n = new Set(prev);
      n.has(r) ? n.delete(r) : n.add(r);
      localStorage.setItem("sb-regions", JSON.stringify(Array.from(n)));
      return n;
    });
  };

  if (!expanded) return null;

  return (
    <div className="pb-1">
      {/* Hub */}
      <NavLink path="/africa" label="Africa Hub" icon={Globe} location={location} setLocation={setLocation} accent="#818cf8" pl={3} />

      {/* My Country */}
      {myCountryCode && (() => {
        const c = AFRICAN_COUNTRIES.find(x => x.code === myCountryCode);
        if (!c) return null;
        const p = countryPath(c.code, c.hasRichData);
        return (
          <NavLink path={p} label={`${c.flag} ${c.name}`} icon={() => null} location={location}
            setLocation={setLocation} accent="#818cf8" pl={3}
            badge={<span className="text-[9px] text-cyan-400 font-bold ml-auto shrink-0">MY COUNTRY</span>} />
        );
      })()}

      {/* Regions */}
      {AFRICAN_REGIONS.map(region => {
        const countries = getCountriesByRegion(region);
        const isOpen = openRegions.has(region);
        const hasActive = countries.some(c => {
          const p = countryPath(c.code, c.hasRichData);
          return location === p || location.startsWith(p + "/");
        });
        return (
          <div key={region}>
            <button onClick={() => toggleRegion(region)}
              className={`w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors
                ${hasActive ? "text-indigo-400" : "text-slate-600 hover:text-slate-400"}`}>
              <span>{region.replace(" Africa", "")}</span>
              {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {isOpen && (
              <div className="pl-1">
                {countries.map(c => {
                  const p = countryPath(c.code, c.hasRichData);
                  const active = location === p || location.startsWith(p + "/");
                  return (
                    <button key={c.code} onClick={() => setLocation(p)}
                      className={`w-full flex items-center gap-2 px-3 py-1 text-xs transition-colors rounded mx-1
                        ${active ? "text-indigo-300 bg-indigo-500/10" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}>
                      <span className="text-sm shrink-0">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                      {(c.hasRichData || !!COUNTRY_CONFIGS[c.code.toLowerCase()]) &&
                        <span className="ml-auto text-[9px] text-cyan-400 shrink-0">★</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Single nav link ──────────────────────────────────────────────────────────
function NavLink({ path, label, icon: Icon, location, setLocation, accent, pl = 2, badge }: {
  path: string; label: string; icon: React.ElementType;
  location: string; setLocation: (p: string) => void;
  accent: string; pl?: number; badge?: React.ReactNode;
}) {
  const active = location === path || (path !== "/dashboard" && location.startsWith(path + "/"));
  return (
    <button onClick={() => setLocation(path)}
      className={`w-full flex items-center gap-2.5 py-1.5 pr-3 text-sm transition-all rounded-r-lg my-0.5 relative
        ${active
          ? "text-white font-medium"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
      style={{ paddingLeft: `${pl * 4}px` }}>
      {active && (
        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full" style={{ background: accent }} />
      )}
      {Icon && <Icon className="w-4 h-4 shrink-0" style={{ color: active ? accent : undefined }} />}
      <span className="truncate">{label}</span>
      {badge}
    </button>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ section, isOpen, hasActive, onToggle, sidebarOpen }: {
  section: Section; isOpen: boolean; hasActive: boolean;
  onToggle: () => void; sidebarOpen: boolean;
}) {
  const Icon = section.icon;
  return (
    <button onClick={onToggle}
      className={`w-full flex items-center gap-2.5 px-3 py-2 transition-all
        ${hasActive ? "text-white" : "text-slate-500 hover:text-slate-300"}`}>
      <Icon className="w-4 h-4 shrink-0" style={{ color: hasActive ? section.accent : undefined }} />
      {sidebarOpen && (
        <>
          <span className="flex-1 text-left text-[11px] font-bold uppercase tracking-widest truncate"
            style={{ color: hasActive ? section.accent : undefined }}>
            {section.label}
          </span>
          {isOpen
            ? <ChevronDown className="w-3 h-3 shrink-0 text-slate-600" />
            : <ChevronRight className="w-3 h-3 shrink-0 text-slate-600" />}
        </>
      )}
    </button>
  );
}

// ─── User dropdown ────────────────────────────────────────────────────────────
function UserMenu({ user, logout, setLocation, compact }: {
  user: { name?: string | null; email?: string | null; role?: string | null } | null;
  logout: () => void; setLocation: (p: string) => void; compact: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors rounded-lg focus:outline-none">
          <Avatar className="h-7 w-7 shrink-0 border border-slate-700">
            <AvatarFallback className="text-xs bg-slate-800 text-slate-300">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          {!compact && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name ?? "—"}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email ?? "—"}</p>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-52 bg-[#0d1525] border-slate-700 text-slate-200">
        <div className="px-2 py-1.5">
          <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          {user?.role === "admin" && (
            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded font-bold uppercase tracking-wide">Admin</span>
          )}
        </div>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer text-slate-300 focus:text-white focus:bg-white/10">
          <UserCircle className="mr-2 h-4 w-4" /> Profile & Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation("/credits")} className="cursor-pointer text-slate-300 focus:text-white focus:bg-white/10">
          <Coins className="mr-2 h-4 w-4" /> My Credits
        </DropdownMenuItem>
        {user?.role === "admin" && (
          <>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer text-orange-400 focus:text-orange-300 focus:bg-orange-500/10">
              <ShieldCheck className="mr-2 h-4 w-4" /> Admin Dashboard
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();

  // Sidebar open state: hover-expand on desktop, toggle on mobile
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const sidebarOpen = isMobile ? mobileOpen : hovered;

  const handleMouseEnter = () => {
    clearTimeout(leaveTimer.current);
    setHovered(true);
  };
  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(false), 120);
  };

  // My Country detection
  const autoDetect = trpc.africa.autoDetectCountry.useMutation();
  const setMyCountry = trpc.africa.setMyCountry.useMutation();
  const { data: myCountry } = trpc.africa.getMyCountry.useQuery(undefined, { retry: false, enabled: !!user });
  useEffect(() => {
    if (!user || myCountry !== null) return;
    autoDetect.mutate(undefined, {
      onSuccess(result) {
        if (!result) {
          for (const locale of navigator.languages || [navigator.language]) {
            const m = locale.match(/[a-z]{2}-([A-Z]{2})/);
            if (m) { setMyCountry.mutate({ countryCode: m[1], method: "browser" }); break; }
          }
        }
      },
    });
  }, [user, myCountry]);
  const myCountryCode = myCountry?.code ?? null;

  // Section open/close — auto-open section of current page
  const activeSection = SECTIONS.find(s =>
    s.custom
      ? location.startsWith("/africa") || location.startsWith("/kenya")
      : s.items?.some(i => location === i.path || (i.path !== "/dashboard" && location.startsWith(i.path + "/")))
  );
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("sb-sections") ?? "[]") as string[]); }
    catch { return activeSection ? new Set([activeSection.id]) : new Set(); }
  });
  useEffect(() => {
    if (activeSection && !openSections.has(activeSection.id)) {
      setOpenSections(p => { const n = new Set(p); n.add(activeSection.id); return n; });
    }
  }, [activeSection?.id]);
  useEffect(() => {
    localStorage.setItem("sb-sections", JSON.stringify(Array.from(openSections)));
  }, [openSections]);
  const toggleSection = (id: string) => setOpenSections(p => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <h1 className="text-2xl font-semibold tracking-tight text-center">Sign in to continue</h1>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} size="lg" className="w-full">
            Continue with Google
          </Button>
        </div>
      </div>
    );
  }

  // Build breadcrumbs
  const allItems = SECTIONS.flatMap(s => s.items ?? []);
  const activeItem = allItems.find(i => location === i.path || (i.path !== "/dashboard" && location.startsWith(i.path + "/")));
  const breadcrumbs: { label: string; path?: string }[] = [{ label: "Home", path: "/dashboard" }];
  if (activeItem && activeItem.path !== "/dashboard") {
    const sec = SECTIONS.find(s => s.items?.some(i => i.path === activeItem.path));
    if (sec) breadcrumbs.push({ label: sec.label });
    breadcrumbs.push({ label: activeItem.label });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#050b1a]">

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        onMouseEnter={!isMobile ? handleMouseEnter : undefined}
        onMouseLeave={!isMobile ? handleMouseLeave : undefined}
        className={`
          flex flex-col shrink-0 h-screen bg-[#080d1a] border-r border-[#0f172a] z-50
          transition-all duration-200 ease-out overflow-hidden
          ${isMobile
            ? `fixed top-0 left-0 ${mobileOpen ? "w-64" : "w-0"}`
            : `relative ${sidebarOpen ? "w-64" : "w-14"}`}
        `}>

        {/* Header */}
        <div className="flex items-center gap-3 px-3 h-14 shrink-0 border-b border-[#0f172a]">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
            <TrendingUp className="w-4 h-4 text-black" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-sm text-white tracking-tight truncate">The Viral Beat</span>
          )}
          {isMobile && mobileOpen && (
            <button onClick={() => setMobileOpen(false)} className="ml-auto text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800">

          {/* Dashboard — always visible */}
          <div className="px-1 mb-1">
            <NavLink path="/dashboard" label="Dashboard" icon={LayoutDashboard}
              location={location} setLocation={setLocation} accent="#22d3ee" pl={12} />
          </div>

          <div className="h-px bg-[#0f172a] mx-3 mb-2" />

          {/* Sections */}
          {SECTIONS.map(section => {
            if (section.adminOnly && user?.role !== "admin") return null;
            const isOpen = openSections.has(section.id);
            const hasActive = section.custom
              ? location.startsWith("/africa") || location.startsWith("/kenya")
              : section.items?.some(i =>
                  location === i.path || (i.path !== "/dashboard" && location.startsWith(i.path + "/"))
                ) ?? false;

            return (
              <div key={section.id} className="px-1">
                {/* Section header — tooltip when collapsed */}
                <div title={!sidebarOpen ? section.label : undefined}>
                  <SectionHeader
                    section={section}
                    isOpen={isOpen}
                    hasActive={hasActive}
                    onToggle={() => toggleSection(section.id)}
                    sidebarOpen={sidebarOpen}
                  />
                </div>

                {/* Section items */}
                {isOpen && sidebarOpen && (
                  <div className="ml-2 border-l border-[#1e293b] pl-1 mb-1">
                    {section.custom ? (
                      <AfricaSection
                        location={location}
                        setLocation={setLocation}
                        expanded={sidebarOpen}
                        myCountryCode={myCountryCode}
                      />
                    ) : (
                      section.items?.map(item => (
                        <NavLink
                          key={item.path}
                          path={item.path}
                          label={item.label}
                          icon={item.icon}
                          location={location}
                          setLocation={setLocation}
                          accent={section.accent}
                          pl={8}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#0f172a] p-2 space-y-1">
          {sidebarOpen && (
            <div className="flex items-center gap-2 px-3 py-1">
              <ThemeSelector />
            </div>
          )}
          <UserMenu user={user} logout={logout} setLocation={setLocation} compact={!sidebarOpen} />
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-12 shrink-0 flex items-center justify-between px-4 bg-[#050b1a]/95 border-b border-[#0f172a] backdrop-blur sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            {isMobile && (
              <button onClick={() => setMobileOpen(true)}
                className="text-slate-400 hover:text-white transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            )}
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 text-sm min-w-0" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  {crumb.path && i < breadcrumbs.length - 1 ? (
                    <button onClick={() => setLocation(crumb.path!)}
                      className="text-slate-500 hover:text-slate-300 transition-colors">
                      {i === 0 ? <Home className="w-3.5 h-3.5" /> : crumb.label}
                    </button>
                  ) : (
                    <span className={i === breadcrumbs.length - 1 ? "text-white font-medium truncate" : "text-slate-500"}>
                      {i === 0 && breadcrumbs.length === 1 ? <Home className="w-3.5 h-3.5 inline" /> : crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          </div>
          {!isMobile && (
            <UserMenu user={user} logout={logout} setLocation={setLocation} compact />
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
