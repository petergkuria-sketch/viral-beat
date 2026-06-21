import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

const CHUNK_RELOAD_KEY = "vb_chunk_reload_attempted";

function isChunkError(error: Error): boolean {
  const msg = error.message || "";
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Unable to preload CSS") ||
    (error.name === "TypeError" && msg.includes("import"))
  );
}

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
        // Reload happens in componentDidUpdate once state is set
        return { hasError: true, error, autoReloading: true };
      }
    }
    return { hasError: true, error, autoReloading: false };
  }

  componentDidUpdate() {
    if (this.state.autoReloading) {
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

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

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
              Reload Page
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
