import { useState } from "react";

export function useViewPreference(key: string, defaultView: string = "grid") {
  const storageKey = `vb_view_${key}`;
  const [view, setViewState] = useState<string>(() => {
    try { return localStorage.getItem(storageKey) || defaultView; } catch { return defaultView; }
  });

  const setView = (v: string) => {
    setViewState(v);
    try { localStorage.setItem(storageKey, v); } catch {}
  };

  return [view, setView] as const;
}
