import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { exportBriefPDF } from "@/lib/exportBrief";
import { Button } from "@/components/ui/button";
import { Share2, Download, Check, Copy, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BriefPayload {
  countryCode: string;
  countryName: string;
  title: string;
  overview: string;
  sentimentScore: number;
  stabilityScore: number;
  riskLevel: string;
  keyThemes?: string[];
}

interface Props {
  brief: BriefPayload;
  contributorName?: string;
  affiliation?: string;
  className?: string;
}

export function ShareBriefButton({ brief, contributorName, affiliation, className }: Props) {
  const { user } = useAuth();
  const [shareId, setShareId]   = useState<string | null>(null);
  const [copied, setCopied]     = useState(false);
  const [pdfDone, setPdfDone]   = useState(false);
  const [open, setOpen]         = useState(false);

  const shareMutation = trpc.briefs.share.useMutation({
    onSuccess: (d) => setShareId(d.id),
  });

  const shareUrl = shareId ? `${window.location.origin}/brief/${shareId}` : null;

  function handleShare() {
    if (shareId) { setOpen(o => !o); return; }
    shareMutation.mutate({
      ...brief,
      briefJson: JSON.stringify(brief),
    });
    setOpen(true);
  }

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePDF() {
    exportBriefPDF({
      ...brief,
      contributor: contributorName,
      affiliation,
      shareUrl: shareId ? `/brief/${shareId}` : undefined,
      generatedAt: new Date().toISOString(),
    });
    setPdfDone(true);
    setTimeout(() => setPdfDone(false), 3000);
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm"
        className={cn("border-white/10 text-slate-400 gap-2 cursor-default", className)}
        title="Sign in to share briefs">
        <Lock className="w-3.5 h-3.5" /> Share Brief
      </Button>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2">
        {/* Share / get link */}
        <Button variant="outline" size="sm"
          onClick={handleShare}
          disabled={shareMutation.isPending}
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 gap-2">
          {shareMutation.isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Share2 className="w-3.5 h-3.5" />}
          {shareId ? "Shared" : "Share Brief"}
        </Button>

        {/* PDF download */}
        <Button variant="outline" size="sm"
          onClick={handlePDF}
          className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 gap-2">
          {pdfDone
            ? <Check className="w-3.5 h-3.5" />
            : <Download className="w-3.5 h-3.5" />}
          {pdfDone ? "Downloaded" : "Download PDF"}
        </Button>
      </div>

      {/* Share panel */}
      {open && shareId && (
        <div className="absolute top-full mt-2 right-0 z-50 w-80 bg-[#0d1525] border border-white/10 rounded-2xl p-4 shadow-2xl">
          <p className="text-xs font-bold text-slate-300 mb-2">Public brief link</p>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <span className="text-[11px] text-slate-400 truncate flex-1 font-mono">
              {shareUrl}
            </span>
            <button onClick={handleCopy}
              className="shrink-0 text-cyan-400 hover:text-cyan-300 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
            Anyone with this link can read the brief. Your name and methodology link are embedded.
            Sharing earns +5 Signal Credits.
          </p>
          <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
            <a href={shareUrl!} target="_blank" rel="noreferrer"
              className="text-[11px] text-cyan-400 hover:text-cyan-300">
              Preview →
            </a>
            <span className="text-slate-600">·</span>
            <button onClick={() => setOpen(false)} className="text-[11px] text-slate-500 hover:text-slate-300">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
