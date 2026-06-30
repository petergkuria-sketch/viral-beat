import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';

/**
 * Standard orphan-page navigation: a "Back" control (browser history, falling
 * back to home) plus a "Home" control. Use at the top of any page that isn't
 * wrapped in the dashboard sidebar so users are never stranded.
 */
export function BackToDashboard({ home }: { home?: string }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const homeTarget = home ?? (user ? '/dashboard' : '/');

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) window.history.back();
    else setLocation(homeTarget);
  };

  return (
    <div className="flex items-center gap-1 mb-4">
      <Button variant="ghost" size="sm" onClick={goBack} className="text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setLocation(homeTarget)} className="text-slate-400 hover:text-white">
        <Home className="h-4 w-4 mr-1.5" /> Home
      </Button>
    </div>
  );
}
