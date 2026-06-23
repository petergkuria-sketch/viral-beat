import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import ErrorBoundary, { ChunkErrorGuard } from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";

function RedirectTo({ path }: { path: string }) {
  const [, navigate] = useLocation();
  useEffect(() => { navigate(path, { replace: true }); }, []);
  return null;
}

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
const ApiKeysSettings = lazy(() => import("./pages/ApiKeysSettings"));
const AfricaIntelligence = lazy(() => import("./pages/AfricaIntelligence"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const DeveloperHub = lazy(() => import("./pages/DeveloperHub"));
const DeveloperAgent = lazy(() => import("./pages/DeveloperAgent"));
const ThreadDetail = lazy(() => import("./pages/ThreadDetail"));
const TokenDashboard = lazy(() => import("./pages/TokenDashboard"));
const PestelTrending = lazy(() => import("./pages/PestelTrending"));
const PoliticalAggregator = lazy(() => import("./pages/PoliticalAggregator"));
const PremiumAnalytics = lazy(() => import("./pages/PremiumAnalytics"));
const CreatorVerification = lazy(() => import("./pages/CreatorVerification"));
const HumansAsAgents = lazy(() => import("./pages/HumansAsAgents"));
// HaaLeaderboard replaced by PestelTrending (imported above)
const AdvancedFeatures = lazy(() => import("./pages/AdvancedFeatures").then(m => ({ default: m.AdvancedFeatures })));
const MigratePage = lazy(() => import("./pages/MigratePage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const ViralMindPage = lazy(() => import("./pages/ViralMindPage"));
const IntelligencePage = lazy(() => import("./pages/IntelligencePage"));
const KenyaActorsPage = lazy(() => import("./pages/KenyaActorsPage"));
const NewsletterSettings = lazy(() => import("./pages/NewsletterSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Pricing = lazy(() => import("./pages/Pricing"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PublicBrief = lazy(() => import("./pages/PublicBrief"));
const ContributorProfile = lazy(() => import("./pages/ContributorProfile"));
const DoingBusinessPage = lazy(() => import("./pages/DoingBusinessPage"));

// Country Intelligence — generic templates
const CountryDashboard = lazy(() => import("./pages/country/CountryDashboard"));
const CountryNewsfeed = lazy(() => import("./pages/country/CountryNewsfeed"));
const CountryTracker = lazy(() => import("./pages/country/CountryTracker"));
const CountryParliament = lazy(() => import("./pages/country/CountryParliament"));
const CountrySenate = lazy(() => import("./pages/country/CountrySenate"));
const CountryBreakingNews = lazy(() => import("./pages/country/CountryBreakingNews"));
const CountryMovements = lazy(() => import("./pages/country/CountryMovements"));
const CountryAlerts = lazy(() => import("./pages/country/CountryAlerts"));
const CountryReports = lazy(() => import("./pages/country/CountryReports"));
const CountryRegionalMap = lazy(() => import("./pages/country/CountryRegionalMap"));

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
const KenyaGovernorDetail = lazy(() => import("./pages/KenyaGovernorDetail"));
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
    { path: "/pricing", component: Pricing },
    { path: "/about", component: AboutPage },
    { path: "/methodology", component: () => { window.location.replace("/about#methodology"); return null; } },
    { path: "/brief/:id", component: PublicBrief },
    { path: "/contributor/:slug", component: ContributorProfile },
    { path: "/contributor", component: ContributorProfile },
    { path: "/embed/widget", component: EmbedWidget },
    { path: "/onboarding", component: OnboardingPage },
  ];

  // Authenticated routes (wrapped in DashboardLayout)
  const authenticatedRoutes = [
    { path: "/dashboard", component: Dashboard },
    { path: "/favorites", component: Favorites },
    { path: "/creator/:platform/:handle", component: CreatorProfile },
    { path: "/intelligence", component: IntelligencePage },
    { path: "/x-trends", component: () => <RedirectTo path="/intelligence" /> },
    { path: "/widget-builder", component: WidgetBuilder },
    { path: "/ai-agents", component: AIAgentsHub },
    { path: "/settings", component: Settings },
    { path: "/privacy-settings", component: PrivacySettings },
    { path: "/api-keys-settings", component: ApiKeysSettings },
    { path: "/africa", component: AfricaIntelligence },
    { path: "/africa/:code", component: AfricaIntelligence },
    { path: "/admin", component: AdminDashboard },
    { path: "/admin/users", component: AdminUsers },
    { path: "/developer-hub", component: DeveloperHub },
    { path: "/developer-hub/agent", component: () => <RedirectTo path="/developer-hub" /> },
    { path: "/developer-hub/thread/:threadId", component: ThreadDetail },
    { path: "/tokens", component: TokenDashboard },
    { path: "/credits", component: TokenDashboard },
    { path: "/marketplace", component: () => <RedirectTo path="/intelligence" /> },
    { path: "/premium-analytics", component: () => <RedirectTo path="/intelligence" /> },
    { path: "/creator-verification", component: () => <RedirectTo path="/contributor" /> },
    { path: "/haa", component: HumansAsAgents },
    { path: "/advanced-features", component: AdvancedFeatures },
    { path: "/migrate", component: MigratePage },
    { path: "/haa/leaderboard", component: () => <RedirectTo path="/trending" /> },
    { path: "/trending", component: PestelTrending },
    { path: "/aggregator", component: PoliticalAggregator },
    { path: "/viralmind", component: PoliticalAggregator },
    { path: "/newsletter", component: NewsletterSettings },
    // Generic country intelligence routes
    { path: "/country/:code", component: CountryDashboard },
    { path: "/country/:code/newsfeed", component: CountryNewsfeed },
    { path: "/country/:code/tracker", component: CountryTracker },
    { path: "/country/:code/parliament", component: CountryParliament },
    { path: "/country/:code/senate", component: CountrySenate },
    { path: "/country/:code/breaking-news", component: CountryBreakingNews },
    { path: "/country/:code/movements", component: CountryMovements },
    { path: "/country/:code/alerts", component: CountryAlerts },
    { path: "/country/:code/reports", component: CountryReports },
    { path: "/country/:code/regional-map", component: CountryRegionalMap },
    // Kenya Intelligence Module routes (legacy — kept for deep pages)
    { path: "/kenya", component: KenyaDashboard },
    { path: "/kenya/tracker", component: KenyaTracker },
    { path: "/kenya/regional-map", component: KenyaRegionalMap },
    { path: "/kenya/balkanization", component: KenyaBalkanization },
    { path: "/kenya/icc-agent", component: KenyaICCAgent },
    { path: "/kenya/actors", component: KenyaActorsPage },
    // Legacy branch routes → unified actors page
    { path: "/kenya/executive",   component: () => <RedirectTo path="/kenya/actors?branch=executive" /> },
    { path: "/kenya/parliament",  component: () => <RedirectTo path="/kenya/actors?branch=parliament" /> },
    { path: "/kenya/senate",      component: () => <RedirectTo path="/kenya/actors?branch=senate" /> },
    { path: "/kenya/governors",   component: () => <RedirectTo path="/kenya/actors?branch=governors" /> },
    { path: "/kenya/women-reps",  component: () => <RedirectTo path="/kenya/actors?branch=women-reps" /> },
    { path: "/kenya/newsfeed", component: KenyaNewsfeedAgent },
    { path: "/kenya/breaking-news", component: () => <RedirectTo path="/country/ke/breaking-news" /> },
    { path: "/kenya/social-media", component: KenyaSocialMediaAgent },
    { path: "/kenya/election-phases", component: KenyaElectionPhases },
    { path: "/kenya/alerts", component: KenyaAlerts },
    { path: "/kenya/reports", component: KenyaReports },
    { path: "/kenya/constituency/:id", component: KenyaConstituencyDetail },
    { path: "/kenya/senator/:id", component: KenyaSenatorDetail },
    { path: "/kenya/woman-rep/:id", component: KenyaWomanRepDetail },
    { path: "/kenya/governor/:county", component: KenyaGovernorDetail },
    { path: "/kenya/movements", component: KenyaMovements },
    { path: "/kenya/movements/:id", component: KenyaMovementDetail },
    { path: "/doing-business", component: DoingBusinessPage },
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
      <ChunkErrorGuard />
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
