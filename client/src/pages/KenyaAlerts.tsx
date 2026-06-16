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

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical": return "bg-red-600 text-white";
    case "high": return "bg-red-400 text-white";
    case "medium": return "bg-yellow-500 text-black";
    default: return "bg-green-500 text-white";
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

  // New rule form state
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

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b-2 border-border pb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bell className="w-8 h-8" />
                <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase">Alert Center</h2>
              </div>
              <p className="text-muted-foreground font-mono">
                Configure notifications for hate speech, sentiment changes, and regional risks.
              </p>
            </div>
            {unacknowledgedCount > 0 && (
              <div className="px-4 py-2 bg-red-600 text-white font-mono text-sm">
                {unacknowledgedCount} UNREAD
              </div>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("history")}
            className={`px-4 py-2 font-mono text-sm border-2 border-border transition-colors flex items-center gap-2 ${
              viewMode === "history" ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
            }`}
          >
            <Clock className="w-4 h-4" />
            Alert History
            {unacknowledgedCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{unacknowledgedCount}</span>
            )}
          </button>
          <button
            onClick={() => setViewMode("rules")}
            className={`px-4 py-2 font-mono text-sm border-2 border-border transition-colors flex items-center gap-2 ${
              viewMode === "rules" ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
            }`}
          >
            <Settings className="w-4 h-4" />
            Alert Rules ({rules.length})
          </button>
          <button
            onClick={() => setViewMode("settings")}
            className={`px-4 py-2 font-mono text-sm border-2 border-border transition-colors flex items-center gap-2 ${
              viewMode === "settings" ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
            }`}
          >
            <Mail className="w-4 h-4" />
            Notification Settings
          </button>
        </div>

        {/* Alert History View */}
        {viewMode === "history" && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex items-center gap-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border-2 border-border bg-background font-mono text-sm"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Alert List */}
            <div className="space-y-3">
              {filteredHistory.map(alert => (
                <div 
                  key={alert.id} 
                  className={`brutalist-card bg-background ${!alert.acknowledged ? "border-l-4 border-l-red-500" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 ${getSeverityColor(alert.severity)}`}>
                      {getTypeIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-bold">{alert.ruleName}</span>
                        <span className={`px-2 py-0.5 text-xs font-mono ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1 bg-green-600 text-white text-xs font-mono hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredHistory.length === 0 && (
                <div className="text-center py-12 text-muted-foreground font-mono">
                  No alerts found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alert Rules View */}
        {viewMode === "rules" && (
          <div className="space-y-4">
            {/* Add Rule Button */}
            <button
              onClick={() => setShowAddRule(!showAddRule)}
              className="px-4 py-2 bg-foreground text-background font-mono text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Create New Rule
            </button>

            {/* Add Rule Form */}
            {showAddRule && (
              <div className="brutalist-card bg-secondary">
                <h4 className="font-mono font-bold uppercase mb-4">New Alert Rule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Rule Name</label>
                    <input
                      type="text"
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      placeholder="e.g., High Risk Hate Speech"
                      className="w-full px-3 py-2 border-2 border-border bg-background font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Alert Type</label>
                    <select
                      value={newRule.type}
                      onChange={(e) => setNewRule({ ...newRule, type: e.target.value as AlertRule["type"] })}
                      className="w-full px-3 py-2 border-2 border-border bg-background font-mono text-sm"
                    >
                      <option value="hate_speech">Hate Speech Detection</option>
                      <option value="sentiment_drop">Sentiment Drop</option>
                      <option value="regional_risk">Regional Risk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Threshold (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newRule.threshold}
                      onChange={(e) => setNewRule({ ...newRule, threshold: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border-2 border-border bg-background font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Target (Optional)</label>
                    <input
                      type="text"
                      value={newRule.target}
                      onChange={(e) => setNewRule({ ...newRule, target: e.target.value })}
                      placeholder="e.g., Nairobi, Executive"
                      className="w-full px-3 py-2 border-2 border-border bg-background font-mono text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-2">Notification Channels</label>
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
                        <Mail className="w-4 h-4" />
                        <span className="font-mono text-sm">Email</span>
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
                        <Smartphone className="w-4 h-4" />
                        <span className="font-mono text-sm">SMS</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAddRule}
                    className="px-4 py-2 bg-green-600 text-white font-mono text-sm flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Create Rule
                  </button>
                  <button
                    onClick={() => setShowAddRule(false)}
                    className="px-4 py-2 bg-secondary border-2 border-border font-mono text-sm flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Rules List */}
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="brutalist-card bg-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 ${rule.isActive ? "bg-green-100" : "bg-gray-100"}`}>
                        {getTypeIcon(rule.type)}
                      </div>
                      <div>
                        <div className="font-mono font-bold">{rule.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          Type: {rule.type.replace("_", " ")} • Threshold: {rule.threshold}%
                          {rule.target && ` • Target: ${rule.target}`}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {rule.channels.includes("email") && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" /> Email
                            </span>
                          )}
                          {rule.channels.includes("sms") && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Smartphone className="w-3 h-3" /> SMS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`px-3 py-1 text-xs font-mono ${
                          rule.isActive 
                            ? "bg-green-600 text-white" 
                            : "bg-gray-300 text-gray-700"
                        }`}
                      >
                        {rule.isActive ? "ACTIVE" : "INACTIVE"}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 text-red-600 hover:bg-red-50 transition-colors"
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
          <div className="space-y-6">
            <div className="brutalist-card bg-background">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Primary Email</label>
                  <input
                    type="email"
                    placeholder="analyst@example.com"
                    className="w-full max-w-md px-3 py-2 border-2 border-border bg-background font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">CC Emails (comma separated)</label>
                  <input
                    type="text"
                    placeholder="team@example.com, manager@example.com"
                    className="w-full max-w-md px-3 py-2 border-2 border-border bg-background font-mono text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="digest" className="w-4 h-4" defaultChecked />
                  <label htmlFor="digest" className="font-mono text-sm">Send daily digest summary</label>
                </div>
              </div>
            </div>

            <div className="brutalist-card bg-background">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                SMS Notifications
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    className="w-full max-w-md px-3 py-2 border-2 border-border bg-background font-mono text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="critical-only" className="w-4 h-4" defaultChecked />
                  <label htmlFor="critical-only" className="font-mono text-sm">Only send SMS for critical alerts</label>
                </div>
              </div>
            </div>

            <div className="brutalist-card bg-secondary">
              <h3 className="font-mono font-bold uppercase mb-4">Quiet Hours</h3>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">From</label>
                  <input
                    type="time"
                    defaultValue="22:00"
                    className="px-3 py-2 border-2 border-border bg-background font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">To</label>
                  <input
                    type="time"
                    defaultValue="06:00"
                    className="px-3 py-2 border-2 border-border bg-background font-mono text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Non-critical alerts will be held during quiet hours and delivered in the morning digest.
              </p>
            </div>

            <button
              onClick={() => toast.success("Settings saved successfully")}
              className="px-6 py-3 bg-foreground text-background font-mono text-sm hover:opacity-90 transition-opacity"
            >
              Save Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
