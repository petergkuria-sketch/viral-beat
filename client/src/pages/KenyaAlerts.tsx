import React, { useState, useMemo } from "react";

import {
  Bell,
  AlertTriangle,
  Mail,
  Smartphone,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  TrendingDown,
  Shield,
  MapPin,
  User,
  Filter
} from "lucide-react";
import { toast } from "sonner";

interface AlertRule {
  id: string;
  name: string;
  type: "hate_speech" | "sentiment_drop" | "regional_risk";
  threshold: number;
  target?: string;
  channels: ("email" | "sms")[];
  isActive: boolean;
  createdAt: Date;
}

interface AlertHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  type: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  acknowledged: boolean;
}

// Mock alert rules
const initialRules: AlertRule[] = [
  {
    id: "1",
    name: "Critical Hate Speech Alert",
    type: "hate_speech",
    threshold: 80,
    channels: ["email", "sms"],
    isActive: true,
    createdAt: new Date("2024-12-01")
  },
  {
    id: "2",
    name: "Sentiment Drop - Key Figures",
    type: "sentiment_drop",
    threshold: 20,
    target: "Executive",
    channels: ["email"],
    isActive: true,
    createdAt: new Date("2024-12-05")
  },
  {
    id: "3",
    name: "Regional Risk Escalation",
    type: "regional_risk",
    threshold: 70,
    target: "Nairobi",
    channels: ["email", "sms"],
    isActive: true,
    createdAt: new Date("2024-12-10")
  }
];

// Mock alert history
const initialHistory: AlertHistory[] = [
  {
    id: "h1",
    ruleId: "1",
    ruleName: "Critical Hate Speech Alert",
    type: "hate_speech",
    message: "Hate speech detected in Rift Valley region with 85% risk score. Content contains ethnic slurs targeting Luo community.",
    severity: "critical",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    acknowledged: false
  },
  {
    id: "h2",
    ruleId: "2",
    ruleName: "Sentiment Drop - Key Figures",
    type: "sentiment_drop",
    message: "President Ruto's sentiment dropped by 25% in the last 24 hours following Finance Bill announcement.",
    severity: "high",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    acknowledged: true
  },
  {
    id: "h3",
    ruleId: "3",
    ruleName: "Regional Risk Escalation",
    type: "regional_risk",
    message: "Nairobi region risk level increased to 75%. High political activity detected in Kibra and Mathare constituencies.",
    severity: "high",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    acknowledged: false
  },
  {
    id: "h4",
    ruleId: "1",
    ruleName: "Critical Hate Speech Alert",
    type: "hate_speech",
    message: "Swahili hate speech terms detected in social media posts from Kisumu. Terms: 'madoadoa', 'wabara'.",
    severity: "medium",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    acknowledged: true
  }
];

const getSeverityStyle = (severity: string) => {
  switch (severity) {
    case "critical": return "bg-red-500/10 border border-red-500/20 text-red-300";
    case "high": return "bg-orange-500/10 border border-orange-500/20 text-orange-300";
    case "medium": return "bg-amber-500/10 border border-amber-500/20 text-amber-300";
    default: return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300";
  }
};

const getSeverityBorder = (severity: string) => {
  switch (severity) {
    case "critical": return "border-l-red-500";
    case "high": return "border-l-orange-500";
    case "medium": return "border-l-amber-500";
    default: return "border-l-emerald-500";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "hate_speech": return <Shield className="w-5 h-5" />;
    case "sentiment_drop": return <TrendingDown className="w-5 h-5" />;
    case "regional_risk": return <MapPin className="w-5 h-5" />;
    default: return <AlertTriangle className="w-5 h-5" />;
  }
};

export default function Alerts() {
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [history, setHistory] = useState<AlertHistory[]>(initialHistory);
  const [viewMode, setViewMode] = useState<"rules" | "history" | "settings">("history");
  const [showAddRule, setShowAddRule] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const [newRule, setNewRule] = useState({
    name: "",
    type: "hate_speech" as AlertRule["type"],
    threshold: 70,
    target: "",
    channels: ["email"] as ("email" | "sms")[]
  });

  const filteredHistory = useMemo(() => {
    if (filterSeverity === "all") return history;
    return history.filter(h => h.severity === filterSeverity);
  }, [history, filterSeverity]);

  const unacknowledgedCount = history.filter(h => !h.acknowledged).length;

  const handleAddRule = () => {
    if (!newRule.name) {
      toast.error("Please enter a rule name");
      return;
    }
    const rule: AlertRule = {
      id: Date.now().toString(),
      ...newRule,
      isActive: true,
      createdAt: new Date()
    };
    setRules([...rules, rule]);
    setNewRule({
      name: "",
      type: "hate_speech",
      threshold: 70,
      target: "",
      channels: ["email"]
    });
    setShowAddRule(false);
    toast.success("Alert rule created successfully");
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    toast.success("Alert rule deleted");
  };

  const handleToggleRule = (id: string) => {
    setRules(rules.map(r =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const handleAcknowledge = (id: string) => {
    setHistory(history.map(h =>
      h.id === id ? { ...h, acknowledged: true } : h
    ));
    toast.success("Alert acknowledged");
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const inputClass = "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-white/20";

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Bell className="w-6 h-6 text-slate-400" />
              <h1 className="text-xl font-black text-slate-100">Alert Center</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Configure notifications for hate speech, sentiment changes, and regional risks.
            </p>
          </div>
          {unacknowledgedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold">
              {unacknowledgedCount} Unread
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("history")}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors flex items-center gap-2 ${
              viewMode === "history" ? "bg-white/10 border-white/20 text-slate-100" : "bg-card border-border/50 text-slate-400 hover:bg-white/5"
            }`}
          >
            <Clock className="w-4 h-4" />
            Alert History
            {unacknowledgedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs">{unacknowledgedCount}</span>
            )}
          </button>
          <button
            onClick={() => setViewMode("rules")}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors flex items-center gap-2 ${
              viewMode === "rules" ? "bg-white/10 border-white/20 text-slate-100" : "bg-card border-border/50 text-slate-400 hover:bg-white/5"
            }`}
          >
            <Settings className="w-4 h-4" />
            Alert Rules ({rules.length})
          </button>
          <button
            onClick={() => setViewMode("settings")}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors flex items-center gap-2 ${
              viewMode === "settings" ? "bg-white/10 border-white/20 text-slate-100" : "bg-card border-border/50 text-slate-400 hover:bg-white/5"
            }`}
          >
            <Mail className="w-4 h-4" />
            Notification Settings
          </button>
        </div>

        {/* Alert History View */}
        {viewMode === "history" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredHistory.map(alert => (
                <div
                  key={alert.id}
                  className={`bg-card border border-border/50 rounded-2xl p-5 border-l-4 ${getSeverityBorder(alert.severity)} ${!alert.acknowledged ? 'border-opacity-100' : 'border-opacity-30'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl ${getSeverityStyle(alert.severity)}`}>
                      {getTypeIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-slate-200">{alert.ruleName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getSeverityStyle(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{alert.message}</p>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredHistory.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  No alerts found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alert Rules View */}
        {viewMode === "rules" && (
          <div className="space-y-4">
            <button
              onClick={() => setShowAddRule(!showAddRule)}
              className="px-4 py-2 bg-white/10 border border-white/20 text-slate-100 rounded-xl text-sm flex items-center gap-2 hover:bg-white/15 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Rule
            </button>

            {showAddRule && (
              <div className="bg-card border border-border/50 rounded-2xl p-5">
                <h4 className="font-bold text-slate-200 mb-4">New Alert Rule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Rule Name</label>
                    <input
                      type="text"
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      placeholder="e.g., High Risk Hate Speech"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Alert Type</label>
                    <select
                      value={newRule.type}
                      onChange={(e) => setNewRule({ ...newRule, type: e.target.value as AlertRule["type"] })}
                      className={inputClass}
                    >
                      <option value="hate_speech">Hate Speech Detection</option>
                      <option value="sentiment_drop">Sentiment Drop</option>
                      <option value="regional_risk">Regional Risk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Threshold (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newRule.threshold}
                      onChange={(e) => setNewRule({ ...newRule, threshold: parseInt(e.target.value) || 0 })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Target (Optional)</label>
                    <input
                      type="text"
                      value={newRule.target}
                      onChange={(e) => setNewRule({ ...newRule, target: e.target.value })}
                      placeholder="e.g., Nairobi, Executive"
                      className={inputClass}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-400 mb-2">Notification Channels</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRule.channels.includes("email")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRule({ ...newRule, channels: [...newRule.channels, "email"] });
                            } else {
                              setNewRule({ ...newRule, channels: newRule.channels.filter(c => c !== "email") });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-200">Email</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRule.channels.includes("sms")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRule({ ...newRule, channels: [...newRule.channels, "sms"] });
                            } else {
                              setNewRule({ ...newRule, channels: newRule.channels.filter(c => c !== "sms") });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <Smartphone className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-200">SMS</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAddRule}
                    className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm flex items-center gap-2 hover:bg-emerald-500/30 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Create Rule
                  </button>
                  <button
                    onClick={() => setShowAddRule(false)}
                    className="px-4 py-2 bg-card border border-border/50 text-slate-200 rounded-xl text-sm flex items-center gap-2 hover:bg-white/5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="bg-card border border-border/50 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${rule.isActive ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-white/5 border border-white/10 text-slate-400"}`}>
                        {getTypeIcon(rule.type)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{rule.name}</div>
                        <div className="text-xs text-slate-400">
                          Type: {rule.type.replace("_", " ")} • Threshold: {rule.threshold}%
                          {rule.target && ` • Target: ${rule.target}`}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {rule.channels.includes("email") && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Mail className="w-3 h-3" /> Email
                            </span>
                          )}
                          {rule.channels.includes("sms") && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Smartphone className="w-3 h-3" /> SMS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`px-3 py-1 rounded-xl text-xs border ${
                          rule.isActive
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                            : "bg-white/5 border-white/10 text-slate-400"
                        }`}
                      >
                        {rule.isActive ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notification Settings View */}
        {viewMode === "settings" && (
          <div className="space-y-5">
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Primary Email</label>
                  <input
                    type="email"
                    placeholder="analyst@example.com"
                    className="w-full max-w-md px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">CC Emails (comma separated)</label>
                  <input
                    type="text"
                    placeholder="team@example.com, manager@example.com"
                    className="w-full max-w-md px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 text-sm focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="digest" className="w-4 h-4" defaultChecked />
                  <label htmlFor="digest" className="text-sm text-slate-200">Send daily digest summary</label>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                SMS Notifications
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    className="w-full max-w-md px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 text-sm focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="critical-only" className="w-4 h-4" defaultChecked />
                  <label htmlFor="critical-only" className="text-sm text-slate-200">Only send SMS for critical alerts</label>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="font-bold text-slate-300 mb-4">Quiet Hours</h3>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">From</label>
                  <input
                    type="time"
                    defaultValue="22:00"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">To</label>
                  <input
                    type="time"
                    defaultValue="06:00"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Non-critical alerts will be held during quiet hours and delivered in the morning digest.
              </p>
            </div>

            <button
              onClick={() => toast.success("Settings saved successfully")}
              className="px-6 py-3 bg-white/10 border border-white/20 text-slate-100 rounded-xl text-sm hover:bg-white/15 transition-colors"
            >
              Save Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
