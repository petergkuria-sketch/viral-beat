import { useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useViewPreference } from "@/_core/hooks/useViewPreference";
import { ViewToggle } from "@/components/ViewToggle";
import ExecutiveAgent from "./KenyaExecutiveAgent";
import ParliamentAgent from "./KenyaParliamentAgent";
import SenateAgent from "./KenyaSenateAgent";
import GovernorsAgent from "./KenyaGovernorsAgent";
import WomenRepsAgent from "./KenyaWomenRepsAgent";

const BRANCHES = [
  { id: "executive",  label: "Executive",   icon: "👑", desc: "President, Deputy, Cabinet Secretaries", color: "#00d4ff" },
  { id: "parliament", label: "Parliament",   icon: "🏛️", desc: "National Assembly — 350 members",       color: "#a78bfa" },
  { id: "senate",     label: "Senate",       icon: "⚖️", desc: "Senate — 67 senators",                  color: "#34d399" },
  { id: "governors",  label: "Governors",    icon: "🗺️", desc: "47 County Governors",                   color: "#fbbf24" },
  { id: "women-reps", label: "Women Reps",   icon: "🌸", desc: "Women Representatives — 47 seats",      color: "#f472b6" },
];

export default function KenyaActorsPage() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const defaultBranch = BRANCHES.find(b => b.id === params.get("branch"))?.id ?? "executive";
  const [branch, setBranch] = useState(defaultBranch);
  const [view, setView] = useViewPreference("kenya_actors", "list");

  const handleSelectBranch = (id: string) => {
    setBranch(id);
    if (view === "icon") setView("list");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-border/50 px-4 sm:px-6 py-4 bg-card/40 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100">Kenya Political Actors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sentiment tracking across all branches of government.
          </p>
        </div>
        <ViewToggle
          options={[{ value: "icon", label: "Icons" }, { value: "list", label: "List" }]}
          current={view}
          onChange={setView}
        />
      </div>

      {/* Icon overview grid */}
      {view === "icon" && (
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {BRANCHES.map(b => (
              <button
                key={b.id}
                onClick={() => handleSelectBranch(b.id)}
                className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/50 transition-all"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border border-white/6 transition-transform group-hover:scale-105"
                  style={{ background: `${b.color}18` }}
                >
                  {b.icon}
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-200 group-hover:text-primary transition-colors">{b.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{b.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List / detail view */}
      {view === "list" && (
        <Tabs value={branch} onValueChange={setBranch} className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 px-4 pt-3 border-b border-border/40">
            <TabsList className="h-8">
              {BRANCHES.map(b => (
                <TabsTrigger key={b.id} value={b.id} className="text-xs px-3">
                  {b.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="executive"  className="flex-1 overflow-hidden m-0"><ExecutiveAgent /></TabsContent>
          <TabsContent value="parliament" className="flex-1 overflow-hidden m-0"><ParliamentAgent /></TabsContent>
          <TabsContent value="senate"     className="flex-1 overflow-hidden m-0"><SenateAgent /></TabsContent>
          <TabsContent value="governors"  className="flex-1 overflow-hidden m-0"><GovernorsAgent /></TabsContent>
          <TabsContent value="women-reps" className="flex-1 overflow-hidden m-0"><WomenRepsAgent /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}
