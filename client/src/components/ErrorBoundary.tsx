import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode, useEffect } from "react";

const CHUNK_RELOAD_KEY = "vb_chunk_reload_attempted";

function isChunkError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)) || "";
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Unable to preload CSS") ||
    msg.includes("error loading dynamically imported module") ||
    (error instanceof TypeError && msg.includes("import"))
  );
}

// Catches chunk-load failures that happen outside React's render tree
// (e.g. lazy() promises rejected before the component mounts)
function ChunkErrorGuard() {
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      if (isChunkError(e.reason)) {
        e.preventDefault();
        const alreadyTried = sessionStorage.getItem(CHUNK_RELOAD_KEY);
        if (!alreadyTried) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
          window.location.reload();
        } else {
          sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        }
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
  return null;
}

export { ChunkErrorGuard };

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  autoReloading: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, autoReloading: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    if (isChunkError(error)) {
      const alreadyTried = sessionStorage.getItem(CHUNK_RELOAD_KEY);
      if (!alreadyTried) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        return { hasError: true, error, autoReloading: true };
      }
      // Second chunk error in same session — clear flag so next manual reload works
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    }
    return { hasError: true, error, autoReloading: false };
  }

  componentDidUpdate() {
    if (this.state.autoReloading) {
      // Clear before reload so a second stale-chunk on the new page can also auto-reload
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.autoReloading) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <RotateCcw size={32} className="animate-spin" />
              <p className="text-sm">Refreshing to load the latest version…</p>
            </div>
          </div>
        );
      }

      const isChunk = isChunkError(this.state.error!);
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-md text-center">
            <AlertTriangle size={48} className="text-destructive mb-6 flex-shrink-0" />
            <h2 className="text-xl font-semibold mb-2">
              {isChunk ? "New version available" : "An unexpected error occurred."}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isChunk
                ? "A new deploy was released while you were browsing. Reload to get the latest version."
                : this.state.error?.message ?? "Something went wrong."}
            </p>
            <button
              onClick={() => {
                sessionStorage.removeItem(CHUNK_RELOAD_KEY);
                window.location.reload();
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              {isChunk ? "Load latest version" : "Reload Page"}
            </button>
          </div>
        </div>
      );
    }

    // Clear the reload flag on successful render (deploy cycle complete)
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    return this.props.children;
  }
}

export default ErrorBoundary;
