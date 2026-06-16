import { useLocation } from "wouter";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { 
  Heart, 
  TrendingUp, 
  Activity, 
  Search,
  Settings,
  LogOut,
  Users,
  Trash2,
  ExternalLink,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Favorites() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, logout } = useAuth();

  // Fetch user's favorites
  const { data: favorites, isLoading, error } = trpc.favorites.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Remove favorite mutation
  const utils = trpc.useUtils();
  const removeFavorite = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      utils.favorites.list.invalidate();
      toast.success("Removed from favorites");
    },
    onError: () => {
      toast.error("Failed to remove from favorites");
    }
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleRemoveFavorite = (topic: string) => {
    removeFavorite.mutate({ topic });
  };

  const handleViewTrend = (topic: string) => {
    setLocation(`/dashboard?topic=${encodeURIComponent(topic)}`);
  };

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <BackToDashboard />
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your saved favorites.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={() => window.location.href = getLoginUrl()}>
              Sign In
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg tracking-wider">VIRAL BEAT</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent/50" onClick={() => setLocation("/dashboard")}>
            <TrendingUp className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent/50" onClick={() => setLocation("/")}>
            <Search className="mr-2 h-4 w-4" /> Discover
          </Button>
          <Button variant="ghost" className="w-full justify-start bg-sidebar-accent text-sidebar-accent-foreground">
            <Heart className="mr-2 h-4 w-4" /> Favorites
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent/50">
            <Users className="mr-2 h-4 w-4" /> Creators
          </Button>
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent/50">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setLocation("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-bold md:hidden">VIRAL BEAT</span>
          </div>
          
          <h1 className="text-lg font-semibold hidden md:block">My Favorites</h1>

          <div className="flex items-center gap-4">
            {user && (
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-xs font-bold text-primary">
                {user.name?.charAt(0) || "U"}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                My Favorites
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your saved trends and stay updated on what matters to you.
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="bg-destructive/10 border-destructive/50">
                <CardContent className="p-6 text-center">
                  <p className="text-destructive">Failed to load favorites. Please try again.</p>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && !error && favorites?.length === 0 && (
              <Card className="bg-muted/20 border-dashed">
                <CardContent className="p-12 text-center">
                  <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start exploring trends and save the ones you want to track.
                  </p>
                  <Button onClick={() => setLocation("/")}>
                    <Search className="w-4 h-4 mr-2" /> Discover Trends
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Favorites List */}
            {!isLoading && !error && favorites && favorites.length > 0 && (
              <div className="grid gap-4">
                {favorites.map((favorite, index) => (
                  <motion.div
                    key={favorite.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-card border-border hover:border-primary/50 transition-colors group">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Thumbnail */}
                          <div className="w-20 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            {favorite.thumbnail ? (
                              <img 
                                src={favorite.thumbnail} 
                                alt={favorite.topic} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                              {favorite.topic}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs capitalize">
                                {favorite.platform}
                              </Badge>
                              {favorite.viralityScore && (
                                <Badge variant="outline" className="text-xs text-primary border-primary/50">
                                  Score: {favorite.viralityScore}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                Saved {new Date(favorite.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewTrend(favorite.topic)}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" /> View
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveFavorite(favorite.topic)}
                              disabled={removeFavorite.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
