import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Brain, ArrowLeft, Plus, Trash2, Search, RefreshCw,
  X, Save, Tag, Clock, ChevronDown, ChevronUp, Database,
} from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  general:     "bg-white/[0.06] text-white/50",
  user:        "bg-blue-500/15 text-blue-400",
  project:     "bg-cyan-500/15 text-cyan-400",
  signal:      "bg-yellow-500/15 text-yellow-400",
  bulletin:    "bg-purple-500/15 text-purple-400",
  feedback:    "bg-emerald-500/15 text-emerald-400",
  session:     "bg-orange-500/15 text-orange-400",
};

function CategoryBadge({ cat }: { cat: string }) {
  const cls = CATEGORY_COLORS[cat] ?? "bg-white/[0.06] text-white/40";
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${cls}`}>
      {cat}
    </span>
  );
}

function timeAgo(date: Date | string) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Write / edit form ──────────────────────────────────────────────────────────
function MemoryForm({ initial, onSave, onCancel }: {
  initial?: { key?: string; value?: string; category?: string; tags?: string[]; source?: string; ttlDays?: number };
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [key, setKey]           = useState(initial?.key ?? "");
  const [value, setValue]       = useState(initial?.value ?? "");
  const [category, setCategory] = useState(initial?.category ?? "general");
  const [tagsRaw, setTagsRaw]   = useState((initial?.tags ?? []).join(", "));
  const [source, setSource]     = useState(initial?.source ?? "admin");
  const [ttlDays, setTtlDays]   = useState(initial?.ttlDays ? String(initial.ttlDays) : "");

  const valid = key.trim().length > 0 && value.trim().length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      key:      key.trim(),
      value:    value.trim(),
      category: category.trim() || "general",
      tags:     tagsRaw.split(",").map(t => t.trim()).filter(Boolean),
      source:   source.trim() || "admin",
      ttlDays:  ttlDays ? Number(ttlDays) : undefined,
    });
  }

  return (
    <form onSubmit={submit} className="bg-[#080d1a] border border-white/8 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-sm">Write memory</h3>
        <button type="button" onClick={onCancel} className="text-white/30 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 uppercase tracking-wide">Key</span>
          <input
            value={key} onChange={e => setKey(e.target.value)}
            placeholder="e.g. user.peter.context"
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 font-mono"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 uppercase tracking-wide">Category</span>
          <input
            value={category} onChange={e => setCategory(e.target.value)}
            list="category-options"
            placeholder="general"
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50"
          />
          <datalist id="category-options">
            {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c} />)}
          </datalist>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] text-white/40 uppercase tracking-wide">Value</span>
        <textarea
          value={value} onChange={e => setValue(e.target.value)}
          rows={5}
          placeholder="The memory content — facts, summaries, decisions, context..."
          className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 resize-none"
        />
      </label>

      <div className="grid sm:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 uppercase tracking-wide">Tags (comma-sep)</span>
          <input
            value={tagsRaw} onChange={e => setTagsRaw(e.target.value)}
            placeholder="kenya, project, viralbeat"
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 uppercase tracking-wide">Source</span>
          <input
            value={source} onChange={e => setSource(e.target.value)}
            placeholder="admin / agent / system"
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 uppercase tracking-wide">TTL (days, blank=forever)</span>
          <input
            type="number" min="1" value={ttlDays} onChange={e => setTtlDays(e.target.value)}
            placeholder="∞"
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50"
          />
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="text-xs text-white/30 hover:text-white px-3 py-1.5">
          Cancel
        </button>
        <button
          type="submit" disabled={!valid}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
        >
          <Save className="w-3.5 h-3.5" /> Save memory
        </button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MemoryAdmin() {
  const [, setLocation] = useLocation();
  const [showForm, setShowForm]   = useState(false);
  const [query, setQuery]         = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [expanded, setExpanded]   = useState<number | null>(null);

  const { data: categories } = trpc.memory.categories.useQuery();
  const { data: memories, refetch } = trpc.memory.adminList.useQuery({
    category: filterCat || undefined,
    limit: 100,
  });

  const set          = trpc.memory.set.useMutation({ onSuccess: () => { refetch(); setShowForm(false); } });
  const del          = trpc.memory.delete.useMutation({ onSuccess: () => refetch() });
  const purgeExpired = trpc.memory.purgeExpired.useMutation({ onSuccess: () => refetch() });

  const filtered = memories?.filter(m => {
    if (!query) return true;
    const q = query.toLowerCase();
    return m.key.toLowerCase().includes(q) || m.value.toLowerCase().includes(q);
  }) ?? [];

  const expiredCount = memories?.filter(m => m.expiresAt && new Date(m.expiresAt) < new Date()).length ?? 0;

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">

      {/* Header */}
      <div className="border-b border-white/5 bg-[#080d1a] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => setLocation("/admin")} className="text-white/30 hover:text-white flex items-center gap-1.5 text-sm">
            <ArrowLeft className="w-4 h-4" /> Admin
          </button>
          <span className="text-white/15">/</span>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm">Agent Memory</span>
          </div>
          <div className="flex-1" />
          {expiredCount > 0 && (
            <button
              onClick={() => purgeExpired.mutate()}
              className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 border border-orange-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Purge {expiredCount} expired
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Write memory
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total entries", value: memories?.length ?? 0, icon: Database },
            { label: "Categories",    value: categories?.length ?? 0, icon: Tag },
            { label: "Permanent",     value: memories?.filter(m => !m.expiresAt).length ?? 0, icon: Brain },
            { label: "Expiring",      value: memories?.filter(m => m.expiresAt).length ?? 0, icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center gap-3">
              <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-xl font-black">{value}</div>
                <div className="text-[10px] text-white/35 uppercase tracking-wide">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Write form */}
        {showForm && (
          <MemoryForm
            onSave={data => set.mutate(data)}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Search + filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-white/25 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search keys and values…"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <select
            value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">All categories</option>
            {categories?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Memory list */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/25 text-sm">
            {memories?.length === 0 ? "No memories yet — click \"Write memory\" to add the first entry." : "No results for your search."}
          </div>
        )}

        <div className="space-y-2">
          {filtered.map(m => {
            const isExpired = m.expiresAt && new Date(m.expiresAt) < new Date();
            const tags = (m.tags as string[] | null) ?? [];

            return (
              <div
                key={m.id}
                className={`bg-white/[0.03] border rounded-xl overflow-hidden transition-colors ${
                  isExpired ? "border-orange-500/20 opacity-60" : "border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-start gap-3 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    {/* Key + badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <code className="text-xs text-cyan-300 font-mono">{m.key}</code>
                      <CategoryBadge cat={m.category} />
                      {isExpired && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 uppercase tracking-wide">expired</span>
                      )}
                    </div>

                    {/* Value preview */}
                    <p className="text-sm text-white/60 leading-relaxed line-clamp-2 mb-2">
                      {m.value}
                    </p>

                    {/* Tags + meta */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {tags.map(t => (
                        <span key={t} className="text-[10px] text-white/30 flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" /> {t}
                        </span>
                      ))}
                      <span className="text-[10px] text-white/20">
                        {m.source} · updated {timeAgo(m.updatedAt)}
                        {m.expiresAt && ` · expires ${new Date(m.expiresAt).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                      className="p-2 rounded-lg text-white/25 hover:text-white hover:bg-white/[0.05] transition-colors"
                      title="Expand full value"
                    >
                      {expanded === m.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${m.key}"?`)) del.mutate({ id: m.id }); }}
                      className="p-2 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded full value */}
                {expanded === m.id && (
                  <div className="border-t border-white/5 bg-black/30 px-5 py-4">
                    <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap leading-relaxed">
                      {m.value}
                    </pre>
                    {!!m.metadata && Object.keys(m.metadata as Record<string, unknown>).length > 0 && (
                      <>
                        <div className="text-[9px] text-white/25 uppercase tracking-wide mt-3 mb-1">Metadata</div>
                        <pre className="text-[10px] text-white/40 font-mono whitespace-pre-wrap">
                          {JSON.stringify(m.metadata as Record<string, unknown>, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
