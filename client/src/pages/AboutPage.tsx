import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Globe, Users, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

const TEAM = [
  { initials: "Founder", role: "Founder & CEO",               focus: "Political intelligence strategy and Africa policy research" },
  { initials: "Editor",  role: "Head of Intelligence",         focus: "Editorial oversight, source verification, 55-nation coverage" },
  { initials: "Tech",    role: "Lead Engineer",                focus: "Platform architecture, data pipelines, and developer API" },
  { initials: "Signal",  role: "Director of Creator Network",  focus: "On-the-ground contributor network and signal verification" },
  { initials: "Growth",  role: "Partnerships & Growth",        focus: "NGO, media, and institutional relationships across Africa" },
];

const VALUES = [
  { icon: Globe,  color: "#22d3ee", title: "Africa First",       desc: "Every product decision is made through the lens of what best serves African communities, journalists, and institutions — not outsider narratives." },
  { icon: Users,  color: "#a78bfa", title: "People-Powered",     desc: "Ground truth comes from people on the ground. We build technology that amplifies local voices rather than replacing them." },
  { icon: Shield, color: "#34d399", title: "Verified Intelligence",desc: "We never publish unverified claims. Every signal is cross-referenced before it reaches your dashboard." },
  { icon: Zap,    color: "#fb923c", title: "Speed with Depth",   desc: "Real-time news is only useful when it has context. We deliver both — fast signal and structured analysis, together." },
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

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Back */}
        <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-12 transition-colors">
          ← Back to home
        </button>

        {/* Header */}
        <div className="text-center pt-8 pb-16">
          <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Who We Are</Badge>
          <h1 className="text-5xl sm:text-6xl font-black mb-6">
            Built for Africa.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">By Africans.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Viral Beat was founded on a simple belief: Africa's political intelligence should be produced, verified, and distributed by the people who live it — not imported from outside.
          </p>
        </div>

        {/* Mission */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-10 mb-20 text-center">
          <h2 className="text-2xl font-black text-white mb-4">Our Mission</h2>
          <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
            To give journalists, NGOs, researchers, investors, and institutions across the world access to accurate, real-time political intelligence for all 55 African nations — powered by a verified network of local contributors and structured for decision-making.
          </p>
        </motion.div>

        {/* Team */}
        <div className="mb-20">
          <h2 className="text-3xl font-black text-center mb-3">The Team</h2>
          <p className="text-gray-400 text-center mb-12">Introductions coming soon. For now, the work speaks.</p>

          <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {TEAM.map((member, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="bg-[#0f2240] border border-[#1e3a5f] rounded-2xl p-5 text-center hover:border-cyan-500/30 transition-all">
                {/* Silhouette */}
                <div className="w-20 h-24 mx-auto mb-4 text-cyan-500/40">
                  <SilhouetteSVG />
                </div>
                <div className="text-xs font-semibold text-cyan-400 mb-1 uppercase tracking-wide">{member.initials}</div>
                <div className="text-sm font-bold text-white mb-2">{member.role}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{member.focus}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-black text-center mb-12">What We Stand For</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALUES.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
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
        </div>

        {/* Contact / CTA */}
        <div className="text-center pb-20">
          <div className="bg-[#0f2240] border border-[#1e3a5f] rounded-2xl p-10">
            <h2 className="text-2xl font-black text-white mb-3">Get in Touch</h2>
            <p className="text-gray-300 mb-6">For partnerships, press, NGO pricing, or enterprise enquiries:</p>
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
        </div>
      </div>
    </div>
  );
}
