import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Globe, Users, Shield, Zap, Database, Rss, Brain, BarChart3, Clock, FileText, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "mission",     label: "Who We Are" },
  { id: "methodology", label: "How It Works" },
  { id: "team",        label: "The Team" },
  { id: "contact",     label: "Contact" },
];

const TEAM = [
  { initials: "Founder", role: "Founder & CEO",              focus: "Political intelligence strategy and Africa policy research" },
  { initials: "Editor",  role: "Head of Intelligence",        focus: "Editorial oversight, source verification, 55-nation coverage" },
  { initials: "Tech",    role: "Lead Engineer",               focus: "Platform architecture, data pipelines, and developer API" },
  { initials: "Signal",  role: "Director of Creator Network", focus: "On-the-ground contributor network and signal verification" },
  { initials: "Growth",  role: "Partnerships & Growth",       focus: "NGO, media, and institutional relationships across Africa" },
];

const VALUES = [
  { icon: Globe,  color: "#22d3ee", title: "Africa First",          desc: "Every product decision is made through the lens of what best serves African communities, journalists, and institutions — not outsider narratives." },
  { icon: Users,  color: "#a78bfa", title: "People-Powered",        desc: "Ground truth comes from people on the ground. We build technology that amplifies local voices rather than replacing them." },
  { icon: Shield, color: "#34d399", title: "Verified Intelligence", desc: "We never publish unverified claims. Every signal is cross-referenced before it reaches your dashboard." },
  { icon: Zap,    color: "#fb923c", title: "Speed with Depth",      desc: "Real-time news is only useful when it has context. We deliver both — fast signal and structured analysis, together." },
];

const PIPELINE_STEPS = [
  {
    icon: Rss,
    color: "#22d3ee",
    step: "01",
    title: "RSS Signal Ingestion",
    desc: "Every 4 hours, our pipeline fetches articles from Nation Africa, The Standard (Headlines, Kenya, Politics, Business), and Citizen Digital. Articles are deduplicated by URL and stored with full text, source, and publication timestamp.",
    detail: "~120–180 articles per run · 6 feeds · 4-hour refresh cycle",
  },
  {
    icon: Brain,
    color: "#a78bfa",
    step: "02",
    title: "Name Recognition & Matching",
    desc: "Each article is scanned for mentions of tracked political figures using name variants (e.g. 'Ruto', 'William Ruto', 'President Ruto'). Articles are attributed to every figure they mention — one article can inform multiple scores.",
    detail: "52 figures tracked · Swahili & Sheng term dictionary included",
  },
  {
    icon: BarChart3,
    color: "#34d399",
    step: "03",
    title: "Sentiment Scoring",
    desc: "Each matched article is scored using two methods in parallel: (1) rule-based keyword analysis using a Kenyan political vocabulary including NCIC Hatelex terms, and (2) LLM-enhanced analysis for top national figures using Claude, which returns structured JSON with score, confidence, key phrases, and hate speech risk.",
    detail: "Score = positive share − (0.5 × negative share) + 50 baseline · LLM blend for Tier-1 figures",
  },
  {
    icon: Database,
    color: "#fb923c",
    step: "04",
    title: "Persistence & Versioning",
    desc: "Every pipeline run writes a timestamped row to the sentiment_records table for each figure that had relevant coverage. Historical rows are never overwritten — each run appends, creating a genuine time series. The tracker chart renders this history directly.",
    detail: "MySQL · one row per figure per run · full audit trail retained",
  },
  {
    icon: Shield,
    color: "#f472b6",
    step: "05",
    title: "Confidence Classification",
    desc: "Each displayed score carries a confidence badge derived from the number of source articles: High (≥10 articles), Medium (4–9), Low (1–3), or No signal. When a score swings more than 20 points between consecutive runs, a 'Conflicted signal' warning is shown instead of a clean number.",
    detail: "Scores are never fabricated — figures with no coverage show '—' until data exists",
  },
];

const LIMITATIONS = [
  "Coverage is English and Swahili language only. County-level and vernacular-language coverage is limited.",
  "RSS feeds represent editorial decisions by Nation Africa and The Standard — framing bias of those outlets may influence scores.",
  "Governors and senators outside national headlines may have insufficient article volume for high-confidence scores.",
  "Pipeline runs every 4 hours; scores may lag breaking news by up to 4 hours.",
  "LLM-enhanced scoring applies only to named Tier-1 national figures (President, DP, Opposition leaders). All others use rule-based scoring only.",
  "Social media signals (X/Twitter) are not yet incorporated. Scores reflect editorial media only.",
];

function SilhouetteSVG() {
  return (
    <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="60" cy="45" r="28" fill="currentColor" opacity="0.15" />
      <path d="M10 140 C10 100 30 80 60 80 C90 80 110 100 110 140 Z" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

export default function AboutPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState("mission");

  // Allow deep-linking via hash
  React.useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (TABS.find(t => t.id === hash)) setActiveTab(hash);
  }, []);

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Back */}
        <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-10 transition-colors">
          ← Back to home
        </button>

        {/* Header */}
        <div className="text-center pt-6 pb-12">
          <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">ViralBeat · Africa Intelligence</Badge>
          <h1 className="text-5xl sm:text-6xl font-black mb-5">
            Built for Africa.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">By Africans.</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Africa's political intelligence should be produced, verified, and distributed by the people who live it.
          </p>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-12 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); window.history.replaceState(null, "", `#${tab.id}`); }}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "bg-cyan-500 text-black shadow"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── WHO WE ARE ── */}
        {activeTab === "mission" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} key="mission">
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-10 mb-12 text-center">
              <h2 className="text-2xl font-black text-white mb-4">Our Mission</h2>
              <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
                To give journalists, NGOs, researchers, investors, and institutions across the world access to accurate, real-time political intelligence for all 55 African nations — powered by a verified network of local contributors and structured for decision-making.
              </p>
            </div>

            <h2 className="text-2xl font-black text-center mb-8">What We Stand For</h2>
            <div className="grid sm:grid-cols-2 gap-5 mb-12">
              {VALUES.map((v, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="bg-[#0f2240] border border-[#1e3a5f] rounded-xl p-6 flex gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${v.color}15` }}>
                    <v.icon className="w-5 h-5" style={{ color: v.color }} />
                  </div>
                  <div>
                    <div className="font-bold text-white mb-1">{v.title}</div>
                    <div className="text-sm text-gray-300 leading-relaxed">{v.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                onClick={() => setActiveTab("methodology")}>
                See how our scores are computed <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── METHODOLOGY ── */}
        {activeTab === "methodology" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} key="methodology">

            {/* Intro */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-600/10 border border-emerald-500/20 rounded-2xl p-8 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white mb-2">Published Methodology</h2>
                  <p className="text-gray-300 leading-relaxed">
                    Every sentiment score on ViralBeat is computed from verifiable source data using a documented, reproducible pipeline. This page describes exactly what data we collect, how scores are calculated, and where our current limitations lie. We publish our limitations alongside our scores because transparency is the foundation of credible intelligence.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs text-gray-500">Last updated: June 2026</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Data sources */}
            <h3 className="text-lg font-black text-white mb-4">Data Sources</h3>
            <div className="grid sm:grid-cols-3 gap-4 mb-12">
              {[
                { name: "Nation Africa", url: "nation.africa", type: "General / Politics", status: "Live" },
                { name: "The Standard – Headlines", url: "standardmedia.co.ke", type: "General", status: "Live" },
                { name: "The Standard – Kenya", url: "standardmedia.co.ke", type: "Kenya Politics", status: "Live" },
                { name: "The Standard – Politics", url: "standardmedia.co.ke", type: "Politics", status: "Live" },
                { name: "The Standard – Business", url: "standardmedia.co.ke", type: "Business", status: "Live" },
                { name: "Citizen Digital", url: "citizentv.co.ke", type: "General", status: "Live" },
              ].map((src, i) => (
                <div key={i} className="bg-[#0f2240] border border-[#1e3a5f] rounded-xl p-4 flex items-start gap-3">
                  <Rss className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{src.name}</p>
                    <p className="text-[11px] text-gray-500">{src.type}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                      {src.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pipeline steps */}
            <h3 className="text-lg font-black text-white mb-6">How Scores Are Computed</h3>
            <div className="space-y-4 mb-12">
              {PIPELINE_STEPS.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-[#0f2240] border border-[#1e3a5f] rounded-2xl p-6 flex gap-5">
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${step.color}15` }}>
                      <step.icon className="w-5 h-5" style={{ color: step.color }} />
                    </div>
                    <span className="text-[10px] font-black tracking-widest" style={{ color: step.color }}>{step.step}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-white mb-1.5">{step.title}</h4>
                    <p className="text-sm text-gray-300 leading-relaxed mb-3">{step.desc}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono bg-white/3 border border-white/5 rounded-lg px-3 py-1.5">
                      <Database className="w-3 h-3 shrink-0" />
                      {step.detail}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Confidence thresholds table */}
            <h3 className="text-lg font-black text-white mb-4">Confidence Thresholds</h3>
            <div className="bg-[#0f2240] border border-[#1e3a5f] rounded-2xl overflow-hidden mb-12">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Badge</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Articles found</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { badge: "High confidence",   color: "text-emerald-400", articles: "≥ 10 articles", note: "Score is reliable for publication and decision use" },
                    { badge: "Medium confidence", color: "text-amber-400",   articles: "4 – 9 articles",  note: "Directionally sound; treat point values with caution" },
                    { badge: "Low confidence",    color: "text-orange-400",  articles: "1 – 3 articles",  note: "Indicative only; verify with additional sources" },
                    { badge: "No signal",         color: "text-gray-500",    articles: "0 articles",      note: "Figure had no coverage in this pipeline run — score shows '—'" },
                    { badge: "Conflicted signal", color: "text-red-400",     articles: "Any",             note: "Score swung >20 points since last run — treat with caution" },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className={`px-5 py-3 font-semibold ${row.color}`}>{row.badge}</td>
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">{row.articles}</td>
                      <td className="px-5 py-3 text-gray-400">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Limitations */}
            <h3 className="text-lg font-black text-white mb-4">Known Limitations</h3>
            <div className="bg-[#0f2240] border border-amber-500/20 rounded-2xl p-6 mb-12">
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-4">We publish our limitations because they define the boundaries of responsible use</p>
              <ul className="space-y-3">
                {LIMITATIONS.map((lim, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-black text-amber-400 shrink-0 mt-0.5">{i + 1}</span>
                    {lim}
                  </li>
                ))}
              </ul>
            </div>

            {/* Audit / contact */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-8 text-center">
              <h4 className="font-black text-white mb-2">Request a Score Audit</h4>
              <p className="text-gray-300 text-sm mb-4 max-w-lg mx-auto">
                For any score displayed on this platform, we can provide the raw article titles, publication sources, computed breakdown, and pipeline run timestamp. Contact us with the figure name and date range.
              </p>
              <a href="mailto:hello@viralbeat.io?subject=Score Audit Request"
                className="inline-flex items-center gap-2 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                hello@viralbeat.io <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        )}

        {/* ── TEAM ── */}
        {activeTab === "team" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} key="team">
            <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
              Full introductions coming soon. For now, the work speaks.
            </p>
            <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-5 mb-16">
              {TEAM.map((member, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-[#0f2240] border border-[#1e3a5f] rounded-2xl p-5 text-center hover:border-cyan-500/30 transition-all">
                  <div className="w-20 h-24 mx-auto mb-4 text-cyan-500/40">
                    <SilhouetteSVG />
                  </div>
                  <div className="text-xs font-semibold text-cyan-400 mb-1 uppercase tracking-wide">{member.initials}</div>
                  <div className="text-sm font-bold text-white mb-2">{member.role}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{member.focus}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── CONTACT ── */}
        {activeTab === "contact" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} key="contact">
            <div className="bg-[#0f2240] border border-[#1e3a5f] rounded-2xl p-10 text-center mb-8">
              <h2 className="text-2xl font-black text-white mb-3">Get in Touch</h2>
              <p className="text-gray-300 mb-6">For partnerships, press, NGO pricing, score audits, or enterprise enquiries:</p>
              <a href="mailto:hello@viralbeat.io" className="text-cyan-400 text-lg font-semibold hover:text-cyan-300 transition-colors">
                hello@viralbeat.io
              </a>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                  onClick={() => user ? setLocation("/africa") : (window.location.href = getLoginUrl())}>
                  Explore the Platform <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white"
                  onClick={() => setLocation("/pricing")}>
                  View Pricing
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Partnerships & NGOs", email: "hello@viralbeat.io", desc: "Institutional subscriptions, data licensing" },
                { label: "Press & Media",        email: "hello@viralbeat.io", desc: "Attribution, embeds, platform briefings" },
                { label: "Score Audits",         email: "hello@viralbeat.io?subject=Score Audit Request", desc: "Raw data, pipeline logs, methodology questions" },
              ].map((item, i) => (
                <div key={i} className="bg-[#0f2240] border border-[#1e3a5f] rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">{item.label}</p>
                  <a href={`mailto:${item.email}`} className="text-sm text-white font-semibold hover:text-cyan-300 transition-colors">
                    hello@viralbeat.io
                  </a>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
