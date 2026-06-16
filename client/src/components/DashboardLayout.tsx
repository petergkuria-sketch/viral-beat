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

// Navigation menu items organized by category
const menuItems = [
  // Core Features
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", category: "Core" },
  { icon: TrendingUp, label: "Trends", path: "/x-trends", category: "Core" },
  { icon: Heart, label: "Favorites", path: "/favorites", category: "Core" },
  
  // Content & AI
  { icon: MessageSquare, label: "ViralMind Assistant", path: "/viralmind", category: "AI" },
  { icon: Mail, label: "Newsletter", path: "/newsletter", category: "AI" },
  { icon: Bot, label: "AI Agents", path: "/ai-agents", category: "AI" },
  { icon: Code2, label: "Widget Builder", path: "/widget-builder", category: "AI" },
  { icon: Users, label: "Humans As Agents", path: "/haa", category: "AI" },
  { icon: Crown, label: "HAA Leaderboard", path: "/haa/leaderboard", category: "AI" },
  
  // Tokens & Economy
  { icon: Coins, label: "Tokens", path: "/tokens", category: "Economy" },
  { icon: ShoppingCart, label: "Marketplace", path: "/marketplace", category: "Economy" },
  { icon: ArrowRightLeft, label: "Migrate to Blockchain", path: "/migrate", category: "Economy" },
  
  // Analytics & Verification
  { icon: BarChart3, label: "Premium Analytics", path: "/premium-analytics", category: "Advanced" },
  { icon: BadgeCheck, label: "Creator Verification", path: "/creator-verification", category: "Advanced" },
  { icon: Sparkles, label: "Advanced Features", path: "/advanced-features", category: "Advanced" },
  
  // Developer Tools
  { icon: Code2, label: "Developer Hub", path: "/developer-hub", category: "Developer" },
  
  // Admin (only shown to admins)
  { icon: ShieldCheck, label: "Admin Dashboard", path: "/admin", category: "Admin", adminOnly: true },
  
  // Kenya Intelligence
  { icon: Globe, label: "Kenya Overview", path: "/kenya", category: "Kenya" },
  { icon: MapPin, label: "Sentiment Tracker", path: "/kenya/tracker", category: "Kenya" },
  { icon: MapPin, label: "Regional Map", path: "/kenya/regional-map", category: "Kenya" },
  { icon: AlertTriangle, label: "Balkanization Risk", path: "/kenya/balkanization", category: "Kenya" },
  { icon: Scale, label: "ICC Hate Speech", path: "/kenya/icc-agent", category: "Kenya" },
  { icon: Building2, label: "Executive Agent", path: "/kenya/executive", category: "Kenya" },
  { icon: Landmark, label: "Parliament Agent", path: "/kenya/parliament", category: "Kenya" },
  { icon: Vote, label: "Senate Agent", path: "/kenya/senate", category: "Kenya" },
  { icon: Users, label: "Governors Agent", path: "/kenya/governors", category: "Kenya" },
  { icon: Users, label: "Women Reps Agent", path: "/kenya/women-reps", category: "Kenya" },
  { icon: Newspaper, label: "News Feed", path: "/kenya/newsfeed", category: "Kenya" },
  { icon: Radio, label: "Breaking News", path: "/kenya/breaking-news", category: "Kenya" },
  { icon: FileText, label: "Election Phases", path: "/kenya/election-phases", category: "Kenya" },
  { icon: AlertTriangle, label: "Alerts", path: "/kenya/alerts", category: "Kenya" },
  { icon: FileText, label: "Reports", path: "/kenya/reports", category: "Kenya" },
  { icon: Users, label: "Civic Movements", path: "/kenya/movements", category: "Kenya" },
  // Settings
  { icon: SettingsIcon, label: "Settings", path: "/settings", category: "Settings" },
  { icon: Shield, label: "Privacy Settings", path: "/privacy-settings", category: "Settings" },
];

// Categories that are collapsible (have many items)
const COLLAPSIBLE_CATEGORIES = new Set(["Kenya"]);

// Group menu items by category
const menuCategories = [
  { name: "Core", items: menuItems.filter(item => item.category === "Core") },
  { name: "AI & Content", items: menuItems.filter(item => item.category === "AI") },
  { name: "Economy", items: menuItems.filter(item => item.category === "Economy") },
  { name: "Advanced", items: menuItems.filter(item => item.category === "Advanced") },
  { name: "Developer", items: menuItems.filter(item => item.category === "Developer") },
  { name: "Admin", items: menuItems.filter(item => item.category === "Admin") },
  { name: "Kenya Intelligence", items: menuItems.filter(item => item.category === "Kenya") },
  { name: "Settings", items: menuItems.filter(item => item.category === "Settings") },
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

  // Track which collapsible categories are expanded
  // Auto-expand Kenya if currently on a Kenya page
  const isOnKenyaPage = location.startsWith("/kenya");
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
    return isOnKenyaPage ? new Set(["Kenya Intelligence"]) : new Set();
  });

  // Auto-expand Kenya section when navigating to a Kenya page
  useEffect(() => {
    if (isOnKenyaPage && !expandedCategories.has("Kenya Intelligence")) {
      setExpandedCategories(prev => {
        const next = new Set(prev);
        next.add("Kenya Intelligence");
        return next;
      });
    }
  }, [isOnKenyaPage]);

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
                  className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity focus:outline-none"
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

              const isCollapsibleCategory = COLLAPSIBLE_CATEGORIES.has(category.name.replace(" Intelligence", ""));
              const isCategoryExpanded = !isCollapsibleCategory || expandedCategories.has(category.name);
              const hasCategoryActive = visibleItems.some(item => location.startsWith(item.path) || location === item.path);
              
              return (
                <div key={category.name} className="mb-1">
                  {!isCollapsed && (
                    isCollapsibleCategory ? (
                      // Collapsible category header (Kenya Intelligence)
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
                              <item.icon
                                className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                              />
                              <span className={`text-sm truncate ${isActive ? "text-foreground font-medium" : ""}`}>
                                {item.label}
                              </span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  )}
                  {/* Show collapsed Kenya indicator dot when collapsed and has active item */}
                  {isCollapsed && isCollapsibleCategory && hasCategoryActive && (
                    <SidebarMenu className="px-2">
                      {visibleItems.filter(item => location === item.path || location.startsWith(item.path + "/")).map(item => (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={true}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.label}
                            className="h-9"
                          >
                            <item.icon className="h-4 w-4 shrink-0 text-primary" />
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  )}
                </div>
              );
            })}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <ThemeSelector />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLocation("/settings")}
                  className="cursor-pointer"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile & Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation("/tokens")}
                  className="cursor-pointer"
                >
                  <Coins className="mr-2 h-4 w-4" />
                  <span>My Tokens</span>
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setLocation("/admin")}
                      className="cursor-pointer"
                    >
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
                      className="text-muted-foreground hover:text-foreground transition-colors truncate"
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
          {/* Right side: theme selector on desktop */}
          {!isMobile && (
            <div className="flex items-center gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-7 w-7 border shrink-0">
                      <AvatarFallback className="text-xs font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden lg:block max-w-[120px] truncate">{user?.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
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
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
