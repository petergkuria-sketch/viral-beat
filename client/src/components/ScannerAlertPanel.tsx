/**
 * ScannerAlertPanel
 *
 * Step-by-step panel for enabling PWA push alerts from the Africa Scanner.
 * Uses the existing usePushNotifications hook (subscribe/unsubscribe/sendTest)
 * and lets the user configure per-country thresholds stored in localStorage.
 *
 * Designed to be rendered in a Sheet (slide-over) or inline card.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell, BellOff, BellRing, Check, ChevronDown, ChevronUp,
  Loader2, Smartphone, Trash2, X,
} from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { COUNTRIES, VERDICT_LABELS, type Verdict } from "@/lib/scannerData";

// ── localStorage watchlist ─────────────────────────────────────────────────

const STORAGE_KEY = "vb_scanner_alerts";

interface AlertRule {
  code: string;
  threshold: number;      // notify if score changes by ≥ this amount
  onVerdictChange: boolean;
  onBreakingSignal: boolean;
}

function loadRules(): AlertRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveRules(rules: AlertRule[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)); } catch {}
}

// ── component ──────────────────────────────────────────────────────────────

interface Props {
  /** Pre-select a country when opened from a country profile */
  defaultCode?: string;
  onClose?: () => void;
}

export function ScannerAlertPanel({ defaultCode, onClose }: Props) {
  const {
    isSupported, permission, isSubscribed, isLoading,
    subscribe, unsubscribe, sendTest,
  } = usePushNotifications();

  const [rules, setRules] = useState<AlertRule[]>(loadRules);
  const [addingCode, setAddingCode] = useState(defaultCode ?? "");
  const [threshold, setThreshold] = useState(5);
  const [onVerdictChange, setOnVerdictChange] = useState(true);
  const [onBreakingSignal, setOnBreakingSignal] = useState(true);
  const [testSent, setTestSent] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Persist rules on change
  useEffect(() => { saveRules(rules); }, [rules]);

  const selectedCountry = COUNTRIES.find(c => c.code === addingCode);

  function addRule() {
    if (!addingCode) return;
    const existing = rules.find(r => r.code === addingCode);
    if (existing) return;
    setRules(prev => [...prev, { code: addingCode, threshold, onVerdictChange, onBreakingSignal }]);
    setAddingCode("");
    setShowCountryPicker(false);
  }

  function removeRule(code: string) {
    setRules(prev => prev.filter(r => r.code !== code));
  }

  async function handleTest() {
    await sendTest();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  }

  const watchedCountries = rules.map(r => COUNTRIES.find(c => c.code === r.code)).filter(Boolean);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#050b1a] text-slate-200 w-full max-w-sm">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2d4a]">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-sm">Scanner Alerts</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="px-5 py-4 space-y-5">

        {/* Step 1: Enable push */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isSubscribed ? "bg-green-500 text-white" : "bg-[#1a2d4a] text-slate-400"}`}>
              {isSubscribed ? <Check className="w-3 h-3" /> : "1"}
            </div>
            <span className="text-sm font-semibold">Enable push notifications</span>
          </div>

          {!isSupported ? (
            <div className="ml-7 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
              Push notifications require Chrome or Edge. Open VB in Chrome on your Android phone.
            </div>
          ) : isSubscribed ? (
            <div className="ml-7 flex items-center gap-2">
              <span className="text-xs text-green-400">✓ Notifications enabled on this device</span>
              <button onClick={() => unsubscribe()} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors ml-auto">
                Disable
              </button>
            </div>
          ) : (
            <div className="ml-7 space-y-2">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tap below and approve the notification prompt. For Android: open VB in Chrome, tap the address bar menu → "Add to Home Screen" first for best reliability.
              </p>
              <Button
                size="sm" onClick={() => subscribe()}
                disabled={isLoading}
                className="h-8 text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 gap-2 w-full"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                Allow notifications on this device
              </Button>
            </div>
          )}
        </div>

        {/* Step 2: Add countries to watch */}
        <div className={isSubscribed ? "" : "opacity-40 pointer-events-none"}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${rules.length > 0 ? "bg-green-500 text-white" : "bg-[#1a2d4a] text-slate-400"}`}>
              {rules.length > 0 ? <Check className="w-3 h-3" /> : "2"}
            </div>
            <span className="text-sm font-semibold">Add countries to watch</span>
          </div>

          <div className="ml-7 space-y-3">
            {/* Country picker */}
            <div>
              <button
                onClick={() => setShowCountryPicker(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#0a1628] border border-[#1a2d4a] text-sm text-slate-300 hover:border-cyan-500/40 transition-colors"
              >
                <span>{selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : "Select a country…"}</span>
                {showCountryPicker ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showCountryPicker && (
                <div className="mt-1 bg-[#0a1628] border border-[#1a2d4a] rounded-lg overflow-hidden max-h-44 overflow-y-auto">
                  {COUNTRIES.filter(c => !rules.find(r => r.code === c.code)).map(c => (
                    <button key={c.code} onClick={() => { setAddingCode(c.code); setShowCountryPicker(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-[#1a2d4a] text-left transition-colors">
                      <span className="text-lg">{c.flag}</span>
                      <span>{c.name}</span>
                      <span className="ml-auto text-[10px] text-slate-500">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Alert options */}
            {addingCode && (
              <div className="space-y-2 p-3 bg-[#0a1628] rounded-lg border border-[#1a2d4a]">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Alert when…</p>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={onVerdictChange} onChange={e => setOnVerdictChange(e.target.checked)}
                    className="accent-cyan-400" />
                  <span className="text-xs text-slate-300">Verdict changes (e.g. Watch → Buy)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={onBreakingSignal} onChange={e => setOnBreakingSignal(e.target.checked)}
                    className="accent-cyan-400" />
                  <span className="text-xs text-slate-300">Breaking signal lands in feed</span>
                </label>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">Score change ≥</span>
                  <input
                    type="number" min={1} max={20} value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    className="w-12 text-center text-xs bg-[#050b1a] border border-[#1a2d4a] rounded px-1 py-0.5 text-slate-200"
                  />
                  <span className="text-xs text-slate-500">points in 30 days</span>
                </div>

                <Button size="sm" onClick={addRule}
                  className="mt-2 h-7 text-xs bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 w-full gap-1.5">
                  <Bell className="w-3 h-3" />Add to watchlist
                </Button>
              </div>
            )}

            {/* Active watchlist */}
            {rules.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Watching ({rules.length})</p>
                {rules.map(rule => {
                  const c = COUNTRIES.find(x => x.code === rule.code);
                  if (!c) return null;
                  return (
                    <div key={rule.code} className="flex items-center gap-2 px-3 py-2 bg-[#0a1628] rounded-lg border border-[#1a2d4a]">
                      <span className="text-base">{c.flag}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-200">{c.name}</span>
                        <div className="text-[9px] text-slate-500 flex gap-2 mt-0.5">
                          {rule.onVerdictChange && <span>Verdict Δ</span>}
                          {rule.onBreakingSignal && <span>Breaking</span>}
                          <span>±{rule.threshold}pt</span>
                        </div>
                      </div>
                      <button onClick={() => removeRule(rule.code)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Test */}
        <div className={isSubscribed ? "" : "opacity-40 pointer-events-none"}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${testSent ? "bg-green-500 text-white" : "bg-[#1a2d4a] text-slate-400"}`}>
              {testSent ? <Check className="w-3 h-3" /> : "3"}
            </div>
            <span className="text-sm font-semibold">Test it now</span>
          </div>
          <div className="ml-7">
            <Button
              size="sm" onClick={handleTest} disabled={!isSubscribed}
              variant="outline"
              className="h-8 text-xs border-[#1a2d4a] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400 gap-2 w-full"
            >
              {testSent ? <Check className="w-3.5 h-3.5 text-green-400" /> : <BellRing className="w-3.5 h-3.5" />}
              {testSent ? "Test sent — check your phone!" : "Send test notification to this device"}
            </Button>
            {testSent && (
              <p className="text-[10px] text-green-400 mt-1.5 text-center">
                ✓ Check your Android notification shade now
              </p>
            )}
          </div>
        </div>

        {/* Setup note */}
        <div className="p-3 bg-[#0a1628] rounded-lg border border-[#1a2d4a] text-[10px] text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-400">For Android Chrome:</span> Open viralbeat.io in Chrome → tap ⋮ menu → "Add to Home screen" → open VB from your home screen → enable notifications. This registers VB as a PWA so alerts arrive even when the browser is closed.
        </div>

      </div>
    </div>
  );
}
