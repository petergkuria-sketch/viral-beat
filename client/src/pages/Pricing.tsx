import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BackToDashboard } from "@/components/BackToDashboard";
import {
  CheckCircle2, Globe, Zap, Code2, Shield, Users, BarChart3,
  ArrowRight, Crown, Building2, Loader2, Check,
} from "lucide-react";
import { motion } from "framer-motion";

type Tier = "bronze" | "premium";

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    tagline: "Full access, no cost",
    icon: Globe,
    color: "border-cyan-500/50",
    headerBg: "bg-cyan-500/[0.06]",
    badge: "Available now",
    features: [
      "Africa Intelligence Scanner — all nations",
      "Country briefs & live signal feeds",
      "SME Exchange — list & discover",
      "Go/No-Go briefs & PDF export",
      "Community VBT tokens",
      "API access",
    ],
    locked: [] as string[],
  },
  {
    id: "bronze" as const,
    name: "Bronze",
    tagline: "For analysts, journalists & NGOs",
    icon: BarChart3,
    color: "border-amber-500/40",
    headerBg: "bg-amber-500/[0.06]",
    badge: "Request access",
    features: [
      "Everything in Free",
      "Priority live brief refresh",
      "Deeper sentiment analytics",
      "Higher AI & API limits",
      "Priority support",
    ],
    locked: [] as string[],
  },
  {
    id: "premium" as const,
    name: "Premium",
    tagline: "For risk firms, funds & institutions",
    icon: Building2,
    color: "border-purple-500/40",
    headerBg: "bg-purple-500/[0.06]",
    badge: "Request access",
    features: [
      "Everything in Bronze",
      "Unlimited AI & API",
      "Webhook & watchlist alerts",
      "Dedicated account manager",
      "White-label data option",
      "SLA guarantee",
    ],
    locked: [] as string[],
  },
];

const USE_CASES = [
  { icon: BarChart3, role: "Political Risk Analysts",  desc: "Replace expensive consultancy subscriptions with live AI-generated country briefs." },
  { icon: Globe,     role: "Journalists & Newsrooms",  desc: "Get breaking civic movement alerts before wire services. Verified local signal network." },
  { icon: Users,     role: "NGO Programme Teams",      desc: "Geo-personalised briefings for your country of operation, ready the moment you open the app." },
  { icon: Code2,     role: "Developers & SaaS Builders",desc: "Embed Africa political intelligence in your product via our REST API." },
  { icon: Crown,     role: "Embassies & Institutions", desc: "Stability scores, key figures, and risk classification for all 55 nations in one dashboard." },
  { icon: Shield,    role: "Investment & PE Funds",    desc: "Track civic movements and economic outlook across the continent before deploying capital." },
];

function RequestAccess({ tier, user }: { tier: Tier; user: any }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const req = trpc.access.request.useMutation({ onSuccess: () => setDone(true) });

  const btn = tier === "bronze"
    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
    : "bg-purple-500/20 text-purple-200 border border-purple-500/40 hover:bg-purple-500/30";
  const doneCls = tier === "bronze"
    ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
    : "text-purple-200 bg-purple-500/10 border-purple-500/30";

  if (done) {
    return (
      <div className={`w-full text-center text-sm rounded-lg py-2.5 flex items-center justify-center gap-1.5 border ${doneCls}`}>
        <Check className="w-4 h-4" /> Request received — we'll be in touch
      </div>
    );
  }

  if (!open) {
    return (
      <Button className={`w-full font-semibold ${btn}`} onClick={() => setOpen(true)}>
        Request access <ArrowRight className="ml-2 w-3.5 h-3.5" />
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@company.com"
        className="bg-[#0a1628] border-[#1a2d4a] text-sm h-9" />
      <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="What do you need? (optional)"
        className="bg-[#0a1628] border-[#1a2d4a] text-sm h-9" />
      {req.error && <p className="text-[11px] text-red-400">{req.error.message}</p>}
      <Button className={`w-full font-semibold ${btn}`}
        disabled={!/.+@.+\..+/.test(email) || req.isPending}
        onClick={() => req.mutate({ tier, email: email || undefined, message: message || undefined })}>
        {req.isPending ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Sending…</> : "Send request"}
      </Button>
    </div>
  );
}

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {user && <BackToDashboard />}

        {/* Header */}
        <div className="text-center pt-16 pb-14">
          <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Free while in beta</Badge>
          <h1 className="text-5xl sm:text-6xl font-black mb-5">
            Full access,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">free right now</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            The whole platform is free to use today. Bronze and Premium unlock advanced capabilities —
            request access and we'll set you up.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-[#0f2240] border rounded-2xl overflow-hidden flex flex-col ${plan.color}`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <Badge className={`text-xs ${plan.id === "free" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : plan.id === "bronze" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-purple-500/10 text-purple-300 border-purple-500/30"}`}>
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className={`px-7 pt-8 pb-6 ${plan.headerBg}`}>
                <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                  <plan.icon className="w-5 h-5 text-gray-300" />
                </div>
                <div className="text-lg font-bold text-white">{plan.name}</div>
                <div className="text-sm text-gray-300 mt-0.5 mb-4">{plan.tagline}</div>
                <div className="flex items-baseline gap-2">
                  {plan.id === "free" ? (
                    <span className="text-3xl font-black text-cyan-400">Free</span>
                  ) : (
                    <span className="text-2xl font-black text-white">By request</span>
                  )}
                </div>
              </div>

              <div className="px-7 py-6 flex-1 flex flex-col">
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.id === "free" ? (
                  <Button
                    className="w-full font-semibold bg-cyan-500 hover:bg-cyan-400 text-black"
                    onClick={() => user ? setLocation("/africa") : (window.location.href = getLoginUrl())}
                  >
                    Get started free <ArrowRight className="ml-2 w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <RequestAccess tier={plan.id} user={user} />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Use cases */}
        <div className="mb-20">
          <h2 className="text-3xl font-black text-center mb-10">Who uses ViralBeat</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map((uc, i) => (
              <motion.div
                key={uc.role}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                viewport={{ once: true }}
                className="bg-[#0f2240] border border-[#1e3a5f] rounded-xl p-5"
              >
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center mb-3">
                  <uc.icon className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="font-semibold text-sm text-white mb-1">{uc.role}</div>
                <div className="text-xs text-gray-400 leading-relaxed">{uc.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-20 max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10">Common questions</h2>
          <div className="space-y-4">
            {[
              ["Is it really free?", "Yes — the full platform is free to use during our beta. No credit card, no time limit."],
              ["What are Bronze and Premium?", "Higher tiers with advanced analytics, higher limits, alerts and institutional features. They're available by request while we finalise them."],
              ["What happens when I request access?", "We record your interest and reach out to set you up and discuss what you need — there's no charge to request."],
              ["Will I be charged automatically?", "No. Nothing is billed today. Requesting access simply starts a conversation."],
              ["Do you offer NGO or academic terms?", "Yes — mention it in your access request and we'll tailor something."],
            ].map(([q, a]) => (
              <div key={q} className="bg-[#0f2240] border border-[#1e3a5f] rounded-xl p-5">
                <div className="font-semibold text-sm text-white mb-2">{q}</div>
                <div className="text-sm text-gray-400 leading-relaxed">{a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pb-16">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Zap className="w-4 h-4 text-cyan-400" />
            Everything is free today — no credit card needed
          </div>
          <div className="flex justify-center">
            <Button
              size="lg"
              className="px-8 py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
              onClick={() => user ? setLocation("/africa") : (window.location.href = getLoginUrl())}
            >
              Open Intelligence Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
