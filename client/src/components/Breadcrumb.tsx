import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

interface BreadcrumbItem {
  label: string;
  path: string;
}

export function Breadcrumb() {
  const [location] = useLocation();

  // Map routes to breadcrumb labels
  const routeMap: Record<string, string> = {
    "/": "Dashboard",
    "/dashboard": "Trend Analysis",
    "/creators": "Creators",
    "/sentiment": "Sentiment",
    "/platforms": "Platforms",
    "/ai-agents": "AI Agents Hub",
    "/widget-builder": "Widget Builder",
    "/developer-hub": "Developer Hub",
    "/developer-agent": "Developer Agent",
    "/settings": "Settings",
    "/privacy-settings": "Privacy Settings",
    "/api-keys-settings": "API Keys",
    "/favorites": "Favorites",
    "/admin-dashboard": "Admin Dashboard",
    "/x-trends": "Intelligence Workspace",
    "/intelligence": "Intelligence Workspace",
    "/aggregator": "Political Aggregator",
    "/trending": "PESTEL+IR Trending",
    "/doing-business": "Investment Readiness",
    "/haa": "Field Contributors",
    "/viralmind": "Political Aggregator",
    "/kenya/actors": "Political Actors",
    "/premium-analytics": "Premium Analytics",
    "/contributor": "Contributor Profile",
    "/newsletter": "Newsletter",
  };

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ label: "Dashboard", path: "/" }];
    
    // If we're on the home page, just return Dashboard
    if (location === "/") {
      return items;
    }

    // Handle dashboard route separately
    if (location.startsWith("/dashboard")) {
      const parts = location.split("/").filter(Boolean);
      if (parts.length > 1) {
        items.push({ label: "Trend Analysis", path: "/dashboard" });
        // Add topic if present
        if (parts.length > 2) {
          const topic = decodeURIComponent(parts[2]);
          items.push({ label: topic, path: location });
        }
      } else {
        items.push({ label: "Trend Analysis", path: "/dashboard" });
      }
      return items;
    }

    // Handle creator profile routes
    if (location.startsWith("/creator/")) {
      items.push({ label: "Creators", path: "/creators" });
      const parts = location.split("/").filter(Boolean);
      if (parts.length >= 3) {
        const platform = parts[1];
        const handle = parts[2];
        items.push({ 
          label: `${platform.charAt(0).toUpperCase() + platform.slice(1)} - @${handle}`, 
          path: location 
        });
      }
      return items;
    }

    // Handle thread detail routes
    if (location.startsWith("/thread/")) {
      items.push({ label: "Developer Hub", path: "/developer-hub" });
      items.push({ label: "Thread", path: location });
      return items;
    }

    // Handle embed widget (don't show breadcrumbs)
    if (location.startsWith("/embed/")) {
      return [];
    }

    // For other routes, use the route map
    const label = routeMap[location];
    if (label) {
      items.push({ label, path: location });
    }

    return items;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't render breadcrumbs for embed pages or if only one item
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((item, index) => (
        <div key={item.path} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <Link href={item.path}>
              <a className="hover:text-foreground transition-colors flex items-center gap-1">
                {index === 0 && <Home className="w-4 h-4" />}
                {item.label}
              </a>
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
