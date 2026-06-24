import { useEffect, useState } from "react";
import { HelpCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOURS, isTourDone, resetTour, type TourId } from "@/lib/onboarding";

interface Props {
  tourId: TourId;
  /** If true, auto-starts the tour once on first visit */
  autoStart?: boolean;
  /** Label shown on the button */
  label?: string;
  className?: string;
}

export function OnboardingTour({ tourId, autoStart = true, label = "Tour", className }: Props) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const alreadyDone = isTourDone(tourId);
    setDone(alreadyDone);
    if (autoStart && !alreadyDone) {
      // Small delay so page elements have mounted
      const t = setTimeout(() => TOURS[tourId](), 600);
      return () => clearTimeout(t);
    }
  }, [tourId, autoStart]);

  function handleClick() {
    if (done) resetTour(tourId);
    setDone(false);
    TOURS[tourId]();
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleClick}
      title={done ? "Replay tour" : "Start tour"}
      className={`gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 ${className ?? ""}`}
    >
      {done
        ? <><RotateCcw className="w-3 h-3" /> Replay Tour</>
        : <><HelpCircle className="w-3 h-3" /> {label}</>
      }
    </Button>
  );
}
