import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import { AFRICAN_COUNTRIES, AFRICAN_REGIONS, getCountriesByRegion } from "../../../shared/africanCountries";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  TrendingUp, 
  Heart, 
  User, 
  Code2, 
  Bot, 
  Settings as SettingsIcon, 
  Shield, 
  ShieldCheck, 
  Coins, 
  ShoppingCart, 
  BarChart3, 
  BadgeCheck, 
  Users, 
  Sparkles, 
  ArrowRightLeft,
  Crown,
  MessageSquare,
  Mail,
  MapPin,
  Newspaper,
  AlertTriangle,
  Globe,
  Scale,
  Building2,
  Landmark,
  Vote,
  Radio,
  FileText,
  ChevronDown,
  ChevronRight,
  Home,
  UserCircle,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

// Navigation menu items — ordered: Intelligence first, Creator tools second
const menuItems = [
  // ── Intelligence Home ─────────────────────────────────────────────────────
  { icon: LayoutDashboard, label: "Dashboard",    path: "/dashboard", category: "Core" },

  // ── Africa hub (single entry — rest rendered via AfricaNavSection) ────────
  { icon: Globe, label: "Africa Hub", path: "/africa", category: "Africa" },

  // ── Kenya Deep-Dive ───────────────────────────────────────────────────────
  { icon: Globe,         label: "Kenya Overview",      path: "/kenya",                  category: "Kenya" },
  { icon: MapPin,        label: "Sentiment Tracker",   path: "/kenya/tracker",          category: "Kenya" },
  { icon: MapPin,        label: "Regional Map",        path: "/kenya/regional-map",     category: "Kenya" },
  { icon: AlertTriangle, label: "Balkanization Risk",  path: "/kenya/balkanization",    category: "Kenya" },
  { icon: Scale,         label: "ICC Hate Speech",     path: "/kenya/icc-agent",        category: "Kenya" },
  { icon: Building2,     label: "Executive Agent",     path: "/kenya/executive",        category: "Kenya" },
  { icon: Landmark,      label: "Parliament Agent",    path: "/kenya/parliament",       category: "Kenya" },
  { icon: Vote,          label: "Senate Agent",        path: "/kenya/senate",           category: "Kenya" },
  { icon: Users,         label: "Governors Agent",     path: "/kenya/governors",        category: "Kenya" },
  { icon: Users,         label: "Women Reps Agent",    path: "/kenya/women-reps",       category: "Kenya" },
  { icon: Newspaper,     label: "News Feed",           path: "/kenya/newsfeed",         category: "Kenya" },
  { icon: Radio,         label: "Breaking News",       path: "/kenya/breaking-news",    category: "Kenya" },
  { icon: FileText,      label: "Election Phases",     path: "/kenya/election-phases",  category: "Kenya" },
  { icon: AlertTriangle, label: "Alerts",              path: "/kenya/alerts",           category: "Kenya" },
  { icon: FileText,      label: "Reports",             path: "/kenya/reports",          category: "Kenya" },
  { icon: Users,         label: "Civic Movements",     path: "/kenya/movements",        category: "Kenya" },

  // ── Creator Signal Network ────────────────────────────────────────────────
  { icon: TrendingUp,   label: "Trends",               path: "/x-trends",              category: "Creator" },
  { icon: Heart,        label: "Favorites",            path: "/favorites",             category: "Creator" },
  { icon: Users,        label: "Humans As Agents",     path: "/haa",                   category: "Creator" },
  { icon: Crown,        label: "HAA Leaderboard",      path: "/haa/leaderboard",       category: "Creator" },
  { icon: MessageSquare,label: "ViralMind Assistant",  path: "/viralmind",             category: "Creator" },
  { icon: Mail,         label: "Newsletter",           path: "/newsletter",            category: "Creator" },
  { icon: Bot,          label: "AI Agents",            path: "/ai-agents",             category: "Creator" },
  { icon: Code2,        label: "Widget Builder",       path: "/widget-builder",        category: "Creator" },

  // ── Token Economy ─────────────────────────────────────────────────────────
  { icon: Coins,         label: "Tokens",              path: "/tokens",                category: "Economy" },
  { icon: ShoppingCart,  label: "Marketplace",         path: "/marketplace",           category: "Economy" },
  { icon: ArrowRightLeft,label: "Migrate to Blockchain",path: "/migrate",             category: "Economy" },

  // ── Analytics & Verification ──────────────────────────────────────────────
  { icon: BarChart3,  label: "Premium Analytics",      path: "/premium-analytics",     category: "Advanced" },
  { icon: BadgeCheck, label: "Creator Verification",   path: "/creator-verification",  category: "Advanced" },
  { icon: Sparkles,   label: "Advanced Features",      path: "/advanced-features",     category: "Advanced" },

  // ── Developer ─────────────────────────────────────────────────────────────
  { icon: Code2,      label: "Developer Hub",          path: "/developer-hub",         category: "Developer" },

  // ── Admin ─────────────────────────────────────────────────────────────────
  { icon: ShieldCheck, label: "Admin Dashboard",       path: "/admin",                 category: "Admin", adminOnly: true },

  // ── Settings ─────────────────────────────────────────────────────────────
  { icon: SettingsIcon, label: "Settings",             path: "/settings",              category: "Settings" },
  { icon: Shield,       label: "Privacy Settings",     path: "/privacy-settings",      category: "Settings" },
];

// Collapsible categories (start collapsed to keep sidebar clean)
const COLLAPSIBLE_CATEGORIES = new Set(["Creator Signal Network", "Token Economy", "Advanced", "Developer", "Admin", "Kenya Intelligence", "Africa Intelligence", "Settings"]);

// Category order — Intelligence first, Creator second
const menuCategories = [
  { name: "Core",                  items: menuItems.filter(item => item.category === "Core") },
  { name: "Africa Intelligence",   items: menuItems.filter(item => item.category === "Africa") },
  { name: "Kenya Intelligence",    items: menuItems.filter(item => item.category === "Kenya") },
  { name: "Creator Signal Network",items: menuItems.filter(item => item.category === "Creator") },
  { name: "Token Economy",         items: menuItems.filter(item => item.category === "Economy") },
  { name: "Advanced",              items: menuItems.filter(item => item.category === "Advanced") },
  { name: "Developer",             items: menuItems.filter(item => item.category === "Developer") },
  { name: "Admin",                 items: menuItems.filter(item => item.category === "Admin") },
  { name: "Settings",              items: menuItems.filter(item => item.category === "Settings") },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function UserDropdown({
  user,
  logout,
  setLocation,
  size = "md",
}: {
  user: { name?: string | null; email?: string | null; role?: string | null } | null;
  logout: () => void;
  setLocation: (path: string) => void;
  size?: "sm" | "md";
}) {
  const avatarSize = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full text-left"
          aria-label="User menu"
        >
          <Avatar className={`${avatarSize} border shrink-0`}>
            <AvatarFallback className="text-xs font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {size === "md" && (
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium truncate leading-none">{user?.name || "-"}</p>
              <p className="text-xs text-muted-foreground truncate mt-1.5">{user?.email || "-"}</p>
            </div>
          )}
          {size === "sm" && (
            <span className="text-sm font-medium hidden lg:block max-w-[120px] truncate">{user?.name}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={size === "md" ? "top" : "bottom"} className="w-52">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer">
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Profile & Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation("/tokens")} className="cursor-pointer">
          <Coins className="mr-2 h-4 w-4" />
          <span>My Tokens</span>
        </DropdownMenuItem>
        {user?.role === "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer">
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Admin Dashboard</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Africa nav: nested region groups inside the sidebar ─────────────────────

function AfricaNavSection({
  isCollapsed,
  location,
  setLocation,
  expandedRegions,
  toggleRegion,
  myCountryCode,
}: {
  isCollapsed: boolean;
  location: string;
  setLocation: (p: string) => void;
  expandedRegions: Set<string>;
  toggleRegion: (r: string) => void;
  myCountryCode: string | null;
}) {
  const isAfricaActive = location.startsWith("/africa");

  if (isCollapsed) {
    return isAfricaActive ? (
      <SidebarMenu className="px-2">
        <SidebarMenuItem>
          <SidebarMenuButton isActive onClick={() => setLocation("/africa")} tooltip="Africa Intelligence" className="h-9">
            <Globe className="h-4 w-4 shrink-0 text-primary" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    ) : null;
  }

  return (
    <div className="px-2 space-y-0.5">
      {/* Hub link */}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={location === "/africa"}
            onClick={() => setLocation("/africa")}
            tooltip="Africa Hub"
            className={`h-9 ${location === "/africa" ? "bg-accent" : ""}`}
          >
            <Globe className={`h-4 w-4 shrink-0 ${location === "/africa" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm truncate">Africa Hub</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* My Country shortcut */}
      {myCountryCode && (() => {
        const c = AFRICAN_COUNTRIES.find(x => x.code === myCountryCode);
        if (!c) return null;
        const path = c.hasRichData ? "/kenya" : `/africa/${c.code}`;
        const isActive = location === path || location.startsWith(path + "/");
        return (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isActive}
                onClick={() => setLocation(path)}
                className={`h-9 ${isActive ? "bg-accent" : ""}`}
              >
                <span className="text-base leading-none shrink-0">{c.flag}</span>
                <span className={`text-sm truncate ${isActive ? "font-medium" : ""}`}>
                  {c.name} <span className="text-[10px] text-cyan-400 ml-1">My Country</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        );
      })()}

      {/* Regions */}
      {AFRICAN_REGIONS.map(region => {
        const countries = getCountriesByRegion(region);
        const isExpanded = expandedRegions.has(region);
        const hasActive = countries.some(c => {
          const p = c.hasRichData ? "/kenya" : `/africa/${c.code}`;
          return location === p || location.startsWith(p + "/");
        });

        return (
          <div key={region}>
            <button
              onClick={() => toggleRegion(region)}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors rounded hover:text-foreground ${hasActive ? "text-primary" : "text-muted-foreground"}`}
            >
              <span>{region.replace(" Africa", "")}</span>
              {isExpanded
                ? <ChevronDown className="h-3 w-3" />
                : <ChevronRight className="h-3 w-3" />
              }
            </button>
            {isExpanded && (
              <SidebarMenu className="pl-2">
                {countries.map(c => {
                  const path = c.hasRichData ? "/kenya" : `/africa/${c.code}`;
                  const isActive = location === path || (path !== "/dashboard" && location.startsWith(path + "/"));
                  return (
                    <SidebarMenuItem key={c.code}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(path)}
                        tooltip={c.name}
                        className={`h-8 ${isActive ? "bg-accent" : ""}`}
                      >
                        <span className="text-sm leading-none shrink-0">{c.flag}</span>
                        <span className={`text-xs truncate ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {c.name}
                        </span>
                        {c.hasRichData && (
                          <span className="ml-auto text-[9px] text-cyan-400 shrink-0">★</span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main layout content ───────────────────────────────────────────────────────

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  // Geo-detect country on first login and persist it
  const autoDetect = trpc.africa.autoDetectCountry.useMutation();
  const setMyCountry = trpc.africa.setMyCountry.useMutation();
  const { data: myCountry } = trpc.africa.getMyCountry.useQuery(undefined, {
    retry: false,
    enabled: !!user,
  });
  useEffect(() => {
    if (!user || myCountry !== null) return; // already set or still loading (undefined)
    if (myCountry === null) {
      autoDetect.mutate(undefined, {
        onSuccess(result) {
          if (!result) {
            const locales = navigator.languages || [navigator.language];
            for (const locale of locales) {
              const match = locale.match(/[a-z]{2}-([A-Z]{2})/);
              if (match) { setMyCountry.mutate({ countryCode: match[1], method: "browser" }); break; }
            }
          }
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, myCountry]);
  const myCountryCode = myCountry?.code ?? null;

  // Africa region collapse state
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("sidebar-expanded-regions");
    if (saved) { try { return new Set(JSON.parse(saved) as string[]); } catch {} }
    // Auto-expand the region of the current page or user's country
    const activeCountryCode = location.match(/^\/africa\/([A-Z]{2})/)?.[1];
    if (activeCountryCode) {
      const c = AFRICAN_COUNTRIES.find(x => x.code === activeCountryCode);
      if (c) return new Set([c.region]);
    }
    return new Set<string>();
  });
  const toggleRegion = (region: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      next.has(region) ? next.delete(region) : next.add(region);
      localStorage.setItem("sidebar-expanded-regions", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Track which collapsible categories are expanded
  // Auto-expand Kenya if currently on a Kenya page
  // Find which category the current page belongs to
  const activeCategoryName = menuCategories.find(c =>
    c.items.some(i => location === i.path || (i.path !== "/dashboard" && location.startsWith(i.path + "/")))
  )?.name;

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("sidebar-expanded-categories");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        return new Set(parsed);
      } catch {
        // ignore
      }
    }
    // Default: expand only the category of the current page
    return activeCategoryName ? new Set([activeCategoryName]) : new Set();
  });

  // Auto-expand the category of the active page when navigating
  useEffect(() => {
    if (activeCategoryName && !expandedCategories.has(activeCategoryName)) {
      setExpandedCategories(prev => {
        const next = new Set(prev);
        next.add(activeCategoryName);
        return next;
      });
    }
  }, [activeCategoryName]);

  // Persist expanded categories
  useEffect(() => {
    localStorage.setItem("sidebar-expanded-categories", JSON.stringify(Array.from(expandedCategories)));
  }, [expandedCategories]);

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // Build breadcrumb trail
  const buildBreadcrumbs = () => {
    if (!activeMenuItem) return [];
    const crumbs: { label: string; path?: string }[] = [{ label: "Home", path: "/dashboard" }];
    const category = menuCategories.find(c => c.items.some(i => i.path === activeMenuItem.path));
    if (category && category.name !== "Core") {
      crumbs.push({ label: category.name });
    }
    if (activeMenuItem.path !== "/dashboard") {
      crumbs.push({ label: activeMenuItem.label });
    }
    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <button
                  onClick={() => setLocation("/dashboard")}
                  className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-label="Go to dashboard"
                >
                  <div className="w-6 h-6 bg-primary rounded flex items-center justify-center shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="font-semibold tracking-tight truncate text-sm">
                    The Viral Beat
                  </span>
                </button>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto">
            {menuCategories.map((category) => {
              // Filter out admin-only items if user is not admin
              const visibleItems = category.items.filter(item => 
                !item.adminOnly || user?.role === 'admin'
              );
              
              // Don't render empty categories
              if (visibleItems.length === 0) return null;

              const isCollapsibleCategory = COLLAPSIBLE_CATEGORIES.has(category.name);
              const isCategoryExpanded = !isCollapsibleCategory || expandedCategories.has(category.name);
              const hasCategoryActive = visibleItems.some(item => location.startsWith(item.path) || location === item.path);
              
              return (
                <div key={category.name} className="mb-1">
                  {/* Africa Intelligence uses its own nested renderer */}
                  {category.name === "Africa Intelligence" ? (
                    <>
                      {!isCollapsed && (
                        <button
                          onClick={() => toggleCategory(category.name)}
                          className={`w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground ${location.startsWith("/africa") || location.startsWith("/kenya") ? "text-primary" : "text-muted-foreground"}`}
                        >
                          <span>Africa Intelligence</span>
                          {isCategoryExpanded
                            ? <ChevronDown className="h-3 w-3" />
                            : <ChevronRight className="h-3 w-3" />
                          }
                        </button>
                      )}
                      {isCategoryExpanded && (
                        <AfricaNavSection
                          isCollapsed={isCollapsed}
                          location={location}
                          setLocation={setLocation}
                          expandedRegions={expandedRegions}
                          toggleRegion={toggleRegion}
                          myCountryCode={myCountryCode}
                        />
                      )}
                      {isCollapsed && (location.startsWith("/africa") || location.startsWith("/kenya")) && (
                        <SidebarMenu className="px-2">
                          <SidebarMenuItem>
                            <SidebarMenuButton isActive onClick={() => setLocation("/africa")} tooltip="Africa Intelligence" className="h-9">
                              <Globe className="h-4 w-4 shrink-0 text-primary" />
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </SidebarMenu>
                      )}
                    </>
                  ) : (
                    <>
                      {!isCollapsed && (
                        isCollapsibleCategory ? (
                          <button
                            onClick={() => toggleCategory(category.name)}
                            className={`w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground ${hasCategoryActive ? "text-primary" : "text-muted-foreground"}`}
                          >
                            <span>{category.name}</span>
                            {isCategoryExpanded
                              ? <ChevronDown className="h-3 w-3" />
                              : <ChevronRight className="h-3 w-3" />
                            }
                          </button>
                        ) : (
                          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {category.name}
                          </div>
                        )
                      )}
                      {isCategoryExpanded && (
                        <SidebarMenu className="px-2">
                          {visibleItems.map(item => {
                            const isActive = location === item.path ||
                              (item.path !== "/dashboard" && location.startsWith(item.path + "/"));
                            return (
                              <SidebarMenuItem key={item.path}>
                                <SidebarMenuButton
                                  isActive={isActive}
                                  onClick={() => setLocation(item.path)}
                                  tooltip={item.label}
                                  className={`h-9 transition-all font-normal ${isActive ? "bg-accent" : ""}`}
                                >
                                  <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                  <span className={`text-sm truncate ${isActive ? "text-foreground font-medium" : ""}`}>
                                    {item.label}
                                  </span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      )}
                      {isCollapsed && isCollapsibleCategory && hasCategoryActive && (
                        <SidebarMenu className="px-2">
                          {visibleItems.filter(item => location === item.path || location.startsWith(item.path + "/")).map(item => (
                            <SidebarMenuItem key={item.path}>
                              <SidebarMenuButton isActive onClick={() => setLocation(item.path)} tooltip={item.label} className="h-9">
                                <item.icon className="h-4 w-4 shrink-0 text-primary" />
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <ThemeSelector />
            </div>
            <UserDropdown user={user} logout={logout} setLocation={setLocation} size="md" />
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Top header bar — always visible on mobile, visible on desktop too for breadcrumbs */}
        <div className="flex border-b h-12 items-center justify-between bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2 min-w-0">
            {isMobile && (
              <SidebarTrigger className="h-8 w-8 rounded-lg shrink-0" />
            )}
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 text-sm min-w-0" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  {crumb.path && i < breadcrumbs.length - 1 ? (
                    <button
                      onClick={() => setLocation(crumb.path!)}
                      className="text-muted-foreground hover:text-foreground transition-colors truncate focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      {i === 0 ? <Home className="h-3.5 w-3.5" /> : crumb.label}
                    </button>
                  ) : (
                    <span className={`truncate ${i === breadcrumbs.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {i === 0 && breadcrumbs.length === 1 ? <Home className="h-3.5 w-3.5 inline" /> : crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          </div>
          {/* Right side: user menu on desktop */}
          {!isMobile && (
            <div className="flex items-center gap-2 shrink-0">
              <UserDropdown user={user} logout={logout} setLocation={setLocation} size="sm" />
            </div>
          )}
        </div>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
