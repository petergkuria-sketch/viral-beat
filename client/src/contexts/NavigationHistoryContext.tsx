import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

interface NavigationHistoryContextType {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  history: string[];
  currentIndex: number;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | undefined>(undefined);

export function NavigationHistoryProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [history, setHistory] = useState<string[]>([location]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Update history when location changes (but not when using back/forward)
  useEffect(() => {
    const handleLocationChange = () => {
      // Only add to history if it's a new navigation (not back/forward)
      if (location !== history[currentIndex]) {
        // Remove any forward history
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(location);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
      }
    };

    handleLocationChange();
  }, [location]);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  const goBack = () => {
    if (canGoBack) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setLocation(history[newIndex]);
    }
  };

  const goForward = () => {
    if (canGoForward) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setLocation(history[newIndex]);
    }
  };

  return (
    <NavigationHistoryContext.Provider
      value={{
        canGoBack,
        canGoForward,
        goBack,
        goForward,
        history,
        currentIndex,
      }}
    >
      {children}
    </NavigationHistoryContext.Provider>
  );
}

export function useNavigationHistory() {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error("useNavigationHistory must be used within NavigationHistoryProvider");
  }
  return context;
}
