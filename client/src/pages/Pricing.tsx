import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BackToDashboard } from "@/components/BackToDashboard";
import {
  CheckCircle2, Globe, Zap, Code2, Shield, Users, BarChart3,
  ArrowRight, Crown, Building2, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "",
    tagline: "Explore the platform",
    icon: Globe,
    color: "border-white/10",
    headerBg: "bg-white/[0.03]",
    badge: null,
    cta: "Get Started Free",
    features: [
      "10 country intelligence previews",
      "Cached briefs (updated daily)",
      "Live RSS news feeds",
      "Trend Engine access",
      "Community VBT tokens",
      "100 API calls/month",
    ],
    locked: [
      "Live brief refresh on demand",
      "Sentiment analysis",
      "All 55 nations",
      "Data export (CSV/PDF)",
    ],
  },
  {
    id: "analyst",
    name: "Analyst",
    price: 19,
    period: "/month",
    tagline: "For journalists, NGOs & researchers",
    icon: BarChart3,
    color: "border-cyan-500/60",
    headerBg: "bg-cyan-500/[0.06]",
    badge: "Most Popular",
    cta: "Start Analyst Plan",
    features: [
      "All 55 African nations",
      "Live brief refresh on demand",
      "Sentiment analysis API",
      "50 AI calls/day",
      "5,000 API calls/month",
      "CSV & PDF export",
      "Priority support",
    ],
    locked: [
      "Webhook alerts",
      "Custom watchlists",
      "Unlimited API calls",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 149,
    period: "/month",
    tagline: "For risk firms, media & embassies",
    icon: Building2,
    color: "border-purple-500/30",
    headerBg: "bg-purple-500/[0.05]",
    badge: "Full Access",
    cta: "Contact Us",
    features: [
      "Everything in Analyst",
      "Unlimited AI calls",
      "Unlimited API calls",
      "Webhook alerts (risk-level changes)",
      "Custom country watchlists",
      "SLA guarantee",
      "Dedicated account manager",
      "White-label data option",
    ],
    locked: [],
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

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [checkingOut, setCheckingOut] = useState(false);
  const { data: myPlan, refetch: refetchPlan } = trpc.subscription.getMyPlan.useQuery(undefined, { enabled: !!user });
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation();

  // Handle Stripe redirect-back query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      toast.success("Payment successful — your Analyst plan is now active!");
      refetchPlan();
      window.history.replaceState({}, "", "/pricing");
    } else if (params.get("cancelled") === "1") {
      toast.info("Checkout cancelled — no charge was made.");
      window.history.replaceState({}, "", "/pricing");
    }
  }, []);

  const handleCta = async (planId: string) => {
    if (!user) { window.location.href = getLoginUrl(); return; }
    if (planId === "free") { setLocation("/africa"); return; }
    if (planId === "enterprise") {
      window.open("mailto:hello@viralbeat.io?subject=Enterprise Plan", "_blank");
      return;
    }
    // Analyst — create Stripe Checkout session
    try {
      setCheckingOut(true);
      const { url } = await checkoutMutation.mutateAsync({ planId: "analyst" });
      if (url) window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message || "Could not start checkout. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {user && <BackToDashboard />}

        {/* Header */}
        <div className="text-center pt-16 pb-14">
          <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Simple, transparent pricing</Badge>
          <h1 className="text-5xl sm:text-6xl font-black mb-5">
            Intelligence for every<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">use case</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Start free and upgrade when you need live refresh and full API access. No contracts, cancel anytime.
          </p>
        </div>

        {/* Current plan banner */}
        {user && myPlan && (
          <div className="mb-8 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-5 py-3 flex items-center justify-between">
            <div className="text-sm text-cyan-300">
              You are on the <strong>{myPlan.tier}</strong> plan.
              {myPlan.expiresAt && <span className="text-gray-400 ml-2">Renews {new Date(myPlan.expiresAt).toLocaleDateString()}</span>}
            </div>
            {myPlan.tier === "free" && (
              <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold" onClick={() => handleCta("analyst")}>
                Upgrade to Analyst <ArrowRight className="ml-1.5 w-3 h-3" />
              </Button>
            )}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan, i) => {
            const isCurrent = myPlan?.tier === plan.id;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-[#0f2240] border rounded-2xl overflow-hidden flex flex-col ${plan.color} ${isCurrent ? "ring-1 ring-cyan-500/40" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">{plan.badge}</Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">Current plan</Badge>
                  </div>
                )}

                <div className={`px-7 pt-8 pb-6 ${plan.headerBg}`}>
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                    <plan.icon className="w-5 h-5 text-gray-300" />
                  </div>
                  <div className="text-lg font-bold text-white">{plan.name}</div>
                  <div className="text-sm text-gray-300 mt-0.5 mb-4">{plan.tagline}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">${plan.price}</span>
                    {plan.period && <span className="text-gray-400 text-sm">{plan.period}</span>}
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
                    {plan.locked.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600 line-through">
                        <CheckCircle2 className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full font-semibold ${
                      plan.id === "analyst"
                        ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                        : plan.id === "enterprise"
                          ? "bg-purple-600 hover:bg-purple-500 text-white"
                          : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                    }`}
                    disabled={isCurrent || (checkingOut && plan.id === "analyst")}
                    onClick={() => handleCta(plan.id)}
                  >
                    {checkingOut && plan.id === "analyst" ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Redirecting to Stripe…</>
                    ) : isCurrent ? "Current plan" : (
                      <>{plan.cta}<ArrowRight className="ml-2 w-3.5 h-3.5" /></>
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Use cases */}
        <div className="mb-20">
          <h2 className="text-3xl font-black text-center mb-10">Who uses Viral Beat</h2>
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
              ["Do I need a credit card to start?", "No. The Free plan requires no payment details. Upgrade anytime from your settings."],
              ["How fresh is the data on the Free plan?", "Free users see cached briefs updated once per day per country. Analyst+ users can force a live refresh at any time."],
              ["How does the API work?", "Every account gets API keys from the Developer Hub. Free accounts get 100 calls/month. Analyst gets 5,000. Enterprise is unlimited."],
              ["Can I cancel anytime?", "Yes — no lock-in, no cancellation fees. Downgrade to Free and your data stays intact."],
              ["What counts as an AI call?", "Generating a country intelligence brief, running sentiment analysis, or requesting a live brief refresh each count as one AI call."],
              ["Do you offer NGO or academic discounts?", "Yes. Email hello@viralbeat.io with your organisation details and we'll set you up on a discounted Analyst plan."],
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
            Start free today — no credit card needed
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="px-8 py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
              onClick={() => user ? setLocation("/africa") : (window.location.href = getLoginUrl())}
            >
              Open Intelligence Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-5 border-white/10 text-gray-300 hover:text-white"
              onClick={() => handleCta("analyst")}
            >
              Upgrade to Analyst — $19/mo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
