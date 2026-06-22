import { useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExecutiveAgent from "./KenyaExecutiveAgent";
import ParliamentAgent from "./KenyaParliamentAgent";
import SenateAgent from "./KenyaSenateAgent";
import GovernorsAgent from "./KenyaGovernorsAgent";
import WomenRepsAgent from "./KenyaWomenRepsAgent";

const BRANCHES = [
  { id: "executive",  label: "Executive"  },
  { id: "parliament", label: "Parliament" },
  { id: "senate",     label: "Senate"     },
  { id: "governors",  label: "Governors"  },
  { id: "women-reps", label: "Women Reps" },
];

export default function KenyaActorsPage() {
  // Allow deep-link via ?branch=parliament
  const [loc] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const defaultBranch = BRANCHES.find(b => b.id === params.get("branch"))?.id ?? "executive";
  const [branch, setBranch] = useState(defaultBranch);

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="shrink-0 border-b border-border/50 px-4 sm:px-6 py-4 bg-card/40">
        <h1 className="text-xl font-black text-slate-100">Kenya Political Actors</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sentiment tracking across all branches of government — Executive, Parliament, Senate, Governors, and Women Reps.
        </p>
      </div>

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
    </div>
  );
}
