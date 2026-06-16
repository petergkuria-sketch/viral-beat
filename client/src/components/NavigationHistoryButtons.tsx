import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigationHistory } from "@/contexts/NavigationHistoryContext";

export function NavigationHistoryButtons() {
  const { canGoBack, canGoForward, goBack, goForward } = useNavigationHistory();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={goBack}
        disabled={!canGoBack}
        className="h-8 w-8"
        title="Go back"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={goForward}
        disabled={!canGoForward}
        className="h-8 w-8"
        title="Go forward"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
