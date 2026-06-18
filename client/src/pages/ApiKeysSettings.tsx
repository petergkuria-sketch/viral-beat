import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Key, Plus, Copy, Check, Trash2, Activity, Clock, BarChart2, ExternalLink } from "lucide-react";

export default function ApiKeysSettings() {
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: keys = [], refetch, isLoading } = trpc.developerKeys.list.useQuery();
  const createMutation = trpc.developerKeys.create.useMutation({
    onSuccess(data) {
      setCreatedKey(data.key);
      setNewKeyName("");
      refetch();
    },
    onError(e) {
      toast.error(e.message);
    },
  });
  const revokeMutation = trpc.developerKeys.revoke.useMutation({
    onSuccess() {
      toast.success("Key revoked");
      setRevokeId(null);
      refetch();
    },
    onError(e) {
      toast.error(e.message);
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    createMutation.mutate({ name: newKeyName.trim() });
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <BackToDashboard />
        <Breadcrumb />

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6 text-cyan-400" />
            API Keys
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Use these keys to access the{" "}
            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline inline-flex items-center gap-1"
            >
              Viral Beat REST API <ExternalLink className="w-3 h-3" />
            </a>{" "}
            from your own apps.
          </p>
        </div>

        {/* Create new key */}
        <Card className="bg-[#0d1e36] border-[#1e3a5f]">
          <CardHeader>
            <CardTitle className="text-base">Create a new key</CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              Give the key a descriptive name so you remember what it's for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex gap-3">
              <Input
                placeholder="e.g. My dashboard app"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                className="bg-[#050b1a] border-[#1e3a5f] text-white placeholder:text-gray-600 flex-1"
                maxLength={80}
              />
              <Button
                type="submit"
                disabled={!newKeyName.trim() || createMutation.isPending}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2"
              >
                <Plus className="w-4 h-4" />
                {createMutation.isPending ? "Creating…" : "Create"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Key list */}
        <div className="space-y-3">
          {isLoading && (
            <p className="text-gray-500 text-sm text-center py-8">Loading keys…</p>
          )}
          {!isLoading && keys.length === 0 && (
            <Card className="bg-[#0d1e36] border-[#1e3a5f] border-dashed">
              <CardContent className="py-10 text-center text-gray-500 text-sm">
                No keys yet. Create one above to start using the API.
              </CardContent>
            </Card>
          )}
          {keys.map(k => (
            <Card
              key={k.id}
              className={`bg-[#0d1e36] border-[#1e3a5f] transition-opacity ${
                !k.isActive ? "opacity-50" : ""
              }`}
            >
              <CardContent className="py-4 px-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{k.name}</span>
                      {!k.isActive && (
                        <Badge variant="destructive" className="text-xs">Revoked</Badge>
                      )}
                    </div>
                    <code className="text-xs text-cyan-400/70 font-mono mt-1 block">
                      {k.keyPreview}
                    </code>
                  </div>
                  {k.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 shrink-0"
                      onClick={() => setRevokeId(k.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <Stat
                    icon={<Activity className="w-3.5 h-3.5 text-cyan-400" />}
                    label="Today"
                    value={`${k.requestsToday} / ${k.dailyLimit}`}
                  />
                  <Stat
                    icon={<BarChart2 className="w-3.5 h-3.5 text-purple-400" />}
                    label="Total"
                    value={k.requestsTotal.toLocaleString()}
                  />
                  <Stat
                    icon={<Clock className="w-3.5 h-3.5 text-gray-400" />}
                    label="Last used"
                    value={
                      k.lastUsedAt
                        ? new Date(k.lastUsedAt).toLocaleDateString()
                        : "Never"
                    }
                  />
                </div>

                <div className="flex gap-1.5 flex-wrap pt-0.5">
                  {(k.scopes as string[]).map(s => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="text-[10px] border-[#2e4a6f] text-gray-300 px-1.5 py-0"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Usage instructions */}
        <Card className="bg-[#0d1e36] border-[#1e3a5f]">
          <CardHeader>
            <CardTitle className="text-sm text-gray-300">Quick start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <CodeBlock label="cURL">
              {`curl https://viralbeat.io/api/v1/trends/search?query=AI \\
  -H "X-API-Key: vb_your_key_here"`}
            </CodeBlock>
            <CodeBlock label="JavaScript">
              {`const res = await fetch(
  "https://viralbeat.io/api/v1/trends/virality?topic=ChatGPT",
  { headers: { "X-API-Key": "vb_your_key_here" } }
);
const { data } = await res.json();`}
            </CodeBlock>
          </CardContent>
        </Card>
      </div>

      {/* New key reveal dialog */}
      <Dialog open={!!createdKey} onOpenChange={() => setCreatedKey(null)}>
        <DialogContent className="bg-[#0d1e36] border-[#1e3a5f] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-400">
              <Check className="w-5 h-5" /> Key created
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Copy this key now — it won't be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 bg-[#050b1a] rounded-lg px-4 py-3 border border-[#1e3a5f]">
              <code className="text-cyan-300 font-mono text-sm flex-1 break-all">
                {createdKey}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-gray-400 hover:text-white"
                onClick={() => handleCopy(createdKey!)}
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              onClick={() => {
                handleCopy(createdKey!);
                setTimeout(() => setCreatedKey(null), 600);
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy and close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm dialog */}
      <AlertDialog open={revokeId !== null} onOpenChange={() => setRevokeId(null)}>
        <AlertDialogContent className="bg-[#0d1e36] border-[#1e3a5f] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this key?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Any apps using this key will stop working immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#1e3a5f] text-white hover:bg-[#1e3a5f]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500 text-white"
              onClick={() => revokeId !== null && revokeMutation.mutate({ id: revokeId })}
            >
              Revoke key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#050b1a] rounded-lg px-3 py-2 space-y-0.5">
      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function CodeBlock({ label, children }: { label: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</span>
        <button
          className="text-[11px] text-gray-500 hover:text-cyan-400 flex items-center gap-1"
          onClick={() => {
            navigator.clipboard.writeText(children);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="bg-[#050b1a] rounded-lg p-3 text-xs text-gray-300 font-mono overflow-x-auto border border-[#1e3a5f] whitespace-pre-wrap break-all">
        {children}
      </pre>
    </div>
  );
}
