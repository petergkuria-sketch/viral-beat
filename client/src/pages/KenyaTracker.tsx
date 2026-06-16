import React from "react";

import { politicians } from "@/lib/kenya/mock-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

export default function Tracker() {
  const [selectedPolId, setSelectedPolId] = React.useState(politicians[0].id);
  const selectedPol = politicians.find(p => p.id === selectedPolId) || politicians[0];

  return (
    <div className="space-y-6">
      <div className="space-y-8">
        <div className="border-b-2 border-border pb-6">
          <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase">Sentiment Tracker</h2>
          <p className="text-muted-foreground font-mono mt-2">Historical analysis of political figures.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Selection */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-mono font-bold uppercase text-sm text-muted-foreground">Select Figure</h3>
            <div className="space-y-2">
              {politicians.map((pol) => (
                <button
                  key={pol.id}
                  onClick={() => setSelectedPolId(pol.id)}
                  className={cn(
                    "w-full text-left p-3 border-2 font-mono text-sm uppercase transition-all flex items-center justify-between group",
                    selectedPolId === pol.id 
                      ? "bg-primary text-primary-foreground border-primary shadow-[4px_4px_0px_0px_var(--color-accent)]" 
                      : "bg-background border-border hover:bg-secondary"
                  )}
                >
                  <span>{pol.name}</span>
                  {selectedPolId === pol.id && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                </button>
              ))}
            </div>
          </div>

          {/* Main Chart Area */}
          <div className="lg:col-span-3 space-y-6">
            <div className="brutalist-card bg-white min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="flex items-center gap-4">
                  <div className="w-16 h-16 border-2 border-border overflow-hidden">
                    <img src={selectedPol.image} alt={selectedPol.name} className="w-full h-full object-cover grayscale" />
                  </div>
                  <h3 className="text-2xl font-bold uppercase">{selectedPol.name}</h3>
                </div>
                  <span className="text-xs font-mono bg-secondary px-2 py-1 border border-border">{selectedPol.party}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-muted-foreground uppercase">Current Sentiment</div>
                  <div className={cn(
                    "text-3xl font-mono font-bold",
                    selectedPol.currentSentiment > 50 ? "text-green-600" : "text-red-600"
                  )}>
                    {selectedPol.currentSentiment}%
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedPol.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{fontFamily: 'Space Mono', fontSize: 10}} 
                      tickLine={false}
                      axisLine={{stroke: '#000', strokeWidth: 2}}
                    />
                    <YAxis 
                      tick={{fontFamily: 'Space Mono', fontSize: 10}} 
                      tickLine={false}
                      axisLine={{stroke: '#000', strokeWidth: 2}}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '2px solid #000',
                        borderRadius: '0px',
                        fontFamily: 'Space Mono',
                        boxShadow: '4px 4px 0px 0px #000'
                      }}
                    />
                    <Legend wrapperStyle={{fontFamily: 'Space Mono', fontSize: '12px', paddingTop: '20px'}}/>
                    <Line 
                      type="step" 
                      dataKey="positive" 
                      name="Positive" 
                      stroke="#16a34a" 
                      strokeWidth={3} 
                      dot={false} 
                      activeDot={{r: 6, strokeWidth: 0}}
                    />
                    <Line 
                      type="step" 
                      dataKey="negative" 
                      name="Negative" 
                      stroke="#dc2626" 
                      strokeWidth={3} 
                      dot={false} 
                      activeDot={{r: 6, strokeWidth: 0}}
                    />
                    <Line 
                      type="step" 
                      dataKey="neutral" 
                      name="Neutral" 
                      stroke="#2563eb" 
                      strokeWidth={3} 
                      dot={false} 
                      activeDot={{r: 6, strokeWidth: 0}}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="brutalist-card bg-green-50">
                <h4 className="font-mono font-bold text-xs uppercase text-green-800 mb-2">Positive Drivers</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Infrastructure launch</li>
                  <li>Youth employment initiative</li>
                </ul>
              </div>
              <div className="brutalist-card bg-red-50">
                <h4 className="font-mono font-bold text-xs uppercase text-red-800 mb-2">Negative Drivers</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Tax policy criticism</li>
                  <li>Cost of living complaints</li>
                </ul>
              </div>
              <div className="brutalist-card bg-blue-50">
                <h4 className="font-mono font-bold text-xs uppercase text-blue-800 mb-2">Top Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 bg-white border border-blue-200 text-xs font-mono">#Economy</span>
                  <span className="px-2 py-0.5 bg-white border border-blue-200 text-xs font-mono">#RutoCare</span>
                  <span className="px-2 py-0.5 bg-white border border-blue-200 text-xs font-mono">#Maandamano</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
