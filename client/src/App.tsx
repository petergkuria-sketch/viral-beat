import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";

// Lazy load all page components for better performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Favorites = lazy(() => import("./pages/Favorites"));
const CreatorProfile = lazy(() => import("./pages/CreatorProfile"));
const XTrends = lazy(() => import("./pages/XTrends"));
const WidgetBuilder = lazy(() => import("./pages/WidgetBuilder"));
const EmbedWidget = lazy(() => import("./pages/EmbedWidget"));
const AIAgentsHub = lazy(() => import("./pages/AIAgentsHub"));
const PrivacySettings = lazy(() => import("./pages/PrivacySettings"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DeveloperHub = lazy(() => import("./pages/DeveloperHub"));
const DeveloperAgent = lazy(() => import("./pages/DeveloperAgent"));
const ThreadDetail = lazy(() => import("./pages/ThreadDetail"));
const TokenDashboard = lazy(() => import("./pages/TokenDashboard"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const PremiumAnalytics = lazy(() => import("./pages/PremiumAnalytics"));
const CreatorVerification = lazy(() => import("./pages/CreatorVerification"));
const HumansAsAgents = lazy(() => import("./pages/HumansAsAgents"));
const HaaLeaderboard = lazy(() => import("./pages/HaaLeaderboard"));
const AdvancedFeatures = lazy(() => import("./pages/AdvancedFeatures").then(m => ({ default: m.AdvancedFeatures })));
const MigratePage = lazy(() => import("./pages/MigratePage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const ViralMindPage = lazy(() => import("./pages/ViralMindPage"));
const NewsletterSettings = lazy(() => import("./pages/NewsletterSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Kenya Intelligence Module
const KenyaDashboard = lazy(() => import("./pages/KenyaDashboard"));
const KenyaTracker = lazy(() => import("./pages/KenyaTracker"));
const KenyaRegionalMap = lazy(() => import("./pages/KenyaRegionalMap"));
const KenyaBalkanization = lazy(() => import("./pages/KenyaBalkanization"));
const KenyaICCAgent = lazy(() => import("./pages/KenyaICCAgent"));
const KenyaExecutiveAgent = lazy(() => import("./pages/KenyaExecutiveAgent"));
const KenyaParliamentAgent = lazy(() => import("./pages/KenyaParliamentAgent"));
const KenyaSenateAgent = lazy(() => import("./pages/KenyaSenateAgent"));
const KenyaGovernorsAgent = lazy(() => import("./pages/KenyaGovernorsAgent"));
const KenyaWomenRepsAgent = lazy(() => import("./pages/KenyaWomenRepsAgent"));
const KenyaNewsfeedAgent = lazy(() => import("./pages/KenyaNewsfeedAgent"));
const KenyaBreakingNewsAgent = lazy(() => import("./pages/KenyaBreakingNewsAgent"));
const KenyaSocialMediaAgent = lazy(() => import("./pages/KenyaSocialMediaAgent"));
const KenyaElectionPhases = lazy(() => import("./pages/KenyaElectionPhases"));
const KenyaAlerts = lazy(() => import("./pages/KenyaAlerts"));
const KenyaReports = lazy(() => import("./pages/KenyaReports"));
const KenyaConstituencyDetail = lazy(() => import("./pages/KenyaConstituencyDetail"));
const KenyaSenatorDetail = lazy(() => import("./pages/KenyaSenatorDetail"));
const KenyaWomanRepDetail = lazy(() => import("./pages/KenyaWomanRepDetail"));
const KenyaMovements = lazy(() => import("./pages/KenyaMovements"));
const KenyaMovementDetail = lazy(() => import("./pages/KenyaMovementDetail"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  // Public routes (no authentication required)
  const publicRoutes = [
    { path: "/", component: LandingPage },
    { path: "/embed/widget", component: EmbedWidget },
    { path: "/onboarding", component: OnboardingPage },
  ];

  // Authenticated routes (wrapped in DashboardLayout)
  const authenticatedRoutes = [
    { path: "/dashboard", component: Dashboard },
    { path: "/favorites", component: Favorites },
    { path: "/creator/:platform/:handle", component: CreatorProfile },
    { path: "/x-trends", component: XTrends },
    { path: "/widget-builder", component: WidgetBuilder },
    { path: "/ai-agents", component: AIAgentsHub },
    { path: "/settings", component: Settings },
    { path: "/privacy-settings", component: PrivacySettings },
    { path: "/admin", component: AdminDashboard },
    { path: "/developer-hub", component: DeveloperHub },
    { path: "/developer-hub/agent", component: DeveloperAgent },
    { path: "/developer-hub/thread/:threadId", component: ThreadDetail },
    { path: "/tokens", component: TokenDashboard },
    { path: "/marketplace", component: Marketplace },
    { path: "/premium-analytics", component: PremiumAnalytics },
    { path: "/creator-verification", component: CreatorVerification },
    { path: "/haa", component: HumansAsAgents },
    { path: "/advanced-features", component: AdvancedFeatures },
    { path: "/migrate", component: MigratePage },
    { path: "/haa/leaderboard", component: HaaLeaderboard },
    { path: "/viralmind", component: ViralMindPage },
    { path: "/newsletter", component: NewsletterSettings },
    // Kenya Intelligence Module routes
    { path: "/kenya", component: KenyaDashboard },
    { path: "/kenya/tracker", component: KenyaTracker },
    { path: "/kenya/regional-map", component: KenyaRegionalMap },
    { path: "/kenya/balkanization", component: KenyaBalkanization },
    { path: "/kenya/icc-agent", component: KenyaICCAgent },
    { path: "/kenya/executive", component: KenyaExecutiveAgent },
    { path: "/kenya/parliament", component: KenyaParliamentAgent },
    { path: "/kenya/senate", component: KenyaSenateAgent },
    { path: "/kenya/governors", component: KenyaGovernorsAgent },
    { path: "/kenya/women-reps", component: KenyaWomenRepsAgent },
    { path: "/kenya/newsfeed", component: KenyaNewsfeedAgent },
    { path: "/kenya/breaking-news", component: KenyaBreakingNewsAgent },
    { path: "/kenya/social-media", component: KenyaSocialMediaAgent },
    { path: "/kenya/election-phases", component: KenyaElectionPhases },
    { path: "/kenya/alerts", component: KenyaAlerts },
    { path: "/kenya/reports", component: KenyaReports },
    { path: "/kenya/constituency/:id", component: KenyaConstituencyDetail },
    { path: "/kenya/senator/:id", component: KenyaSenatorDetail },
    { path: "/kenya/woman-rep/:id", component: KenyaWomanRepDetail },
    { path: "/kenya/movements", component: KenyaMovements },
    { path: "/kenya/movements/:id", component: KenyaMovementDetail },
  ];

  return (
    <Switch>
      {/* Public routes */}
      {publicRoutes.map(({ path, component: Component }) => (
        <Route key={path} path={path}>
          <Suspense fallback={<PageLoader />}>
            <Component />
          </Suspense>
        </Route>
      ))}

      {/* Authenticated routes with persistent sidebar */}
      {authenticatedRoutes.map(({ path, component: Component }) => (
        <Route key={path} path={path}>
          <DashboardLayout>
            <Suspense fallback={<PageLoader />}>
              <Component />
            </Suspense>
          </DashboardLayout>
        </Route>
      ))}

      {/* 404 and fallback */}
      <Route path="404">
        <Suspense fallback={<PageLoader />}>
          <NotFound />
        </Suspense>
      </Route>
      <Route>
        <Suspense fallback={<PageLoader />}>
          <NotFound />
        </Suspense>
      </Route>
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
