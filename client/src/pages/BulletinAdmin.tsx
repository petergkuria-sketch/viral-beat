import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  BookOpen, Plus, Eye, EyeOff, Trash2, Edit3, ArrowLeft,
  Calendar, CheckCircle, FileText, Save, X, ChevronDown, ChevronUp,
} from "lucide-react";

function issueLabel(slug: string) {
  const [y, m] = slug.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

const STATUS_BADGE: Record<string, string> = {
  published: "bg-green-500/15 text-green-400 border border-green-500/25",
  draft:     "bg-white/[0.06] text-white/40 border border-white/10",
};

// ─── Simple form for create / edit ───────────────────────────────────────────
function BulletinForm({ initial, onSave, onCancel }: {
  initial?: Partial<{
    id: number; slug: string; issueNumber: number; title: string;
    summary: string; htmlContent: string; status: "draft" | "published";
  }>;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [slug, setSlug]               = useState(initial?.slug ?? "");
  const [issueNumber, setIssueNumber] = useState(String(initial?.issueNumber ?? ""));
  const [title, setTitle]             = useState(initial?.title ?? "");
  const [summary, setSummary]         = useState(initial?.summary ?? "");
  const [htmlContent, setHtmlContent] = useState(initial?.htmlContent ?? "<p>Issue content here.</p>");
  const [status, setStatus]           = useState<"draft" | "published">(initial?.status ?? "draft");
  const [showHtml, setShowHtml]       = useState(false);

  const valid = /^\d{4}-\d{2}$/.test(slug) && Number(issueNumber) > 0 && title.length >= 5 && summary.length >= 10 && htmlContent.length >= 10;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: initial?.id,
      slug,
      issueNumber: Number(issueNumber),
      title,
      summary,
      htmlContent,
      sections: {},
      coverCountries: [],
      stats: { breakingShifts: 0, greenProjects: 0, fieldSignals: 0, verdictsChanged: 0 },
      status,
    });
  }

  return (
    <form onSubmit={submit} className="bg-[#080d1a] border border-white/8 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm">{initial?.id ? "Edit issue" : "New issue"}</h3>
        <button type="button" onClick={onCancel} className="text-white/30 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 uppercase tracking-wide">Slug (YYYY-MM)</span>
          <input
            value={slug} onChange={e => setSlug(e.target.value)}
            placeholder="2026-07"
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-white/40 uppercase tracking-wide">Issue number</span>
          <input
            type="number" min="1" max="99" value={issueNumber}
            onChange={e => setIssueNumber(e.target.value)}
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] text-white/40 uppercase tracking-wide">Title</span>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Africa Intelligence Bulletin — July 2026"
          className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] text-white/40 uppercase tracking-wide">Summary (shown on archive card)</span>
        <textarea
          value={summary} onChange={e => setSummary(e.target.value)}
          rows={3}
          className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 resize-none"
        />
      </label>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setShowHtml(v => !v)}
          className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-wide hover:text-white/70 w-fit"
        >
          {showHtml ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          HTML content {showHtml ? "(collapse)" : "(expand)"}
        </button>
        {showHtml && (
          <textarea
            value={htmlContent} onChange={e => setHtmlContent(e.target.value)}
            rows={12}
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-cyan-500/50 resize-y"
          />
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-white/50">Status:</span>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as "draft" | "published")}
            className="bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>

        <div className="flex-1" />

        <button
          type="button" onClick={onCancel}
          className="text-xs text-white/30 hover:text-white px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          type="submit" disabled={!valid}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {initial?.id ? "Save changes" : "Create issue"}
        </button>
      </div>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BulletinAdmin() {
  const [, setLocation] = useLocation();
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<any | null>(null);
  const [expanded, setExpanded]   = useState<number | null>(null);

  const { data: issues, refetch } = trpc.bulletins.adminList.useQuery();
  const upsert  = trpc.bulletins.upsert.useMutation({ onSuccess: () => { refetch(); setShowForm(false); setEditing(null); } });
  const publish = trpc.bulletins.publish.useMutation({ onSuccess: () => refetch() });
  const del     = trpc.bulletins.delete.useMutation({ onSuccess: () => refetch() });

  function handleSave(data: any) {
    upsert.mutate(data);
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">

      {/* Header */}
      <div className="border-b border-white/5 bg-[#080d1a] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => setLocation("/admin")}
            className="text-white/30 hover:text-white flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Admin
          </button>
          <span className="text-white/15">/</span>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm">Bulletin Archive — Admin</span>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New issue
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total issues", value: issues?.length ?? 0 },
            { label: "Published",    value: issues?.filter(i => i.status === "published").length ?? 0 },
            { label: "Drafts",       value: issues?.filter(i => i.status === "draft").length ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-[10px] text-white/35 uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* New / edit form */}
        {(showForm || editing) && (
          <BulletinForm
            initial={editing ?? undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        )}

        {/* Issue list */}
        <div className="space-y-3">
          {(!issues || issues.length === 0) && !showForm && (
            <div className="text-center py-16 text-white/30 text-sm">
              No issues yet — click "New issue" to create the first one.
            </div>
          )}

          {issues?.map(issue => (
            <div key={issue.id} className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_BADGE[issue.status]}`}>
                      {issue.status}
                    </span>
                    <span className="text-xs text-white/30 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {issueLabel(issue.slug)}
                    </span>
                    <span className="text-xs text-white/20">#{issue.issueNumber}/12</span>
                  </div>
                  <h3 className="font-bold text-sm text-white truncate">{issue.title}</h3>
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{issue.summary}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Preview */}
                  {issue.status === "published" && (
                    <button
                      onClick={() => setLocation(`/bulletins/${issue.slug}`)}
                      title="View live"
                      className="p-2 rounded-lg text-white/30 hover:text-cyan-400 hover:bg-white/[0.05] transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {/* Edit */}
                  <button
                    onClick={() => { setEditing(issue); setShowForm(false); }}
                    title="Edit"
                    className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {/* Toggle published */}
                  <button
                    onClick={() => publish.mutate({ id: issue.id, status: issue.status === "published" ? "draft" : "published" })}
                    title={issue.status === "published" ? "Unpublish" : "Publish"}
                    className={`p-2 rounded-lg transition-colors ${
                      issue.status === "published"
                        ? "text-green-400 hover:text-white/50 hover:bg-white/[0.05]"
                        : "text-white/30 hover:text-green-400 hover:bg-white/[0.05]"
                    }`}
                  >
                    {issue.status === "published" ? <CheckCircle className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  {/* Expand JSON preview */}
                  <button
                    onClick={() => setExpanded(expanded === issue.id ? null : issue.id)}
                    title="Show raw JSON"
                    className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => { if (confirm(`Delete "${issue.title}"? This cannot be undone.`)) del.mutate({ id: issue.id }); }}
                    title="Delete"
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* JSON preview drawer */}
              {expanded === issue.id && (
                <div className="border-t border-white/5 bg-black/30 px-5 py-4 max-h-64 overflow-auto">
                  <pre className="text-[10px] text-white/50 font-mono whitespace-pre-wrap">
                    {JSON.stringify(issue.sections, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
