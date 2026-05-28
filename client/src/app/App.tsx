import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast, Toaster } from "sonner";
import {
  ArrowRight, Brain, Check, ChevronRight, Clock,
  Code2, Copy, Database, Download, FileCode, FolderOpen,
  Github, GitBranch, Globe, Layers, Linkedin,
  Loader2, Lock, Mail, Menu, Network,
  RefreshCw, Server, Shield, Sparkles, Star,
  Twitter, Users, Wand2, X, Zap, Flag, CheckSquare,
  Layout, History, Folder
} from "lucide-react";
import { generateBlueprint, downloadDocx } from "../services/api";

// ─── Types ────────────────────────────────────────────────────
type View = "landing" | "generating" | "results";
type Priority = "high" | "medium" | "low";
type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface Feature { name: string; description: string; priority: Priority; }
interface DBColumn { name: string; type: string; note?: string; }
interface DBTable { name: string; columns: DBColumn[]; }
interface APIEndpoint { method: HTTPMethod; path: string; description: string; auth: boolean; }
interface DevStep { step: number; title: string; description: string; }
interface TimelinePhase { phase: string; duration: string; tasks: string[]; }
interface TechStack { frontend: string[]; backend: string[]; database: string[]; devops: string[]; }
interface ProjectData {
  title: string; tagline: string; description: string; category: string;
  techStack: TechStack; features: Feature[]; database: DBTable[];
  apis: APIEndpoint[]; devSteps: DevStep[]; timeline: TimelinePhase[];
  folderStructure: string;
}

// ─── Constants ────────────────────────────────────────────────
const LOADING_STEPS = [
  { icon: Brain, label: "Analyzing project requirements..." },
  { icon: Layers, label: "Generating system architecture..." },
  { icon: GitBranch, label: "Creating API endpoint structure..." },
  { icon: Database, label: "Designing database schema..." },
  { icon: CheckSquare, label: "Building development roadmap..." },
  { icon: FolderOpen, label: "Preparing folder structure..." },
];

const FEATURE_CARDS = [
  { icon: Layers, title: "AI Architecture", description: "Complete system design with component relationships and data flow", gradient: "from-blue-500/20 to-blue-600/5" },
  { icon: GitBranch, title: "API Blueprint", description: "Full REST API spec with methods, paths, params & auth requirements", gradient: "from-emerald-500/20 to-emerald-600/5" },
  { icon: Database, title: "Database Schema", description: "Normalized table designs with relationships, indexes & column types", gradient: "from-purple-500/20 to-purple-600/5" },
  { icon: Clock, title: "Timeline Estimation", description: "Phased development schedule with realistic milestones & deliverables", gradient: "from-[#FF4D00]/20 to-[#FF8C00]/5" },
  { icon: Code2, title: "Tech Stack", description: "Curated technology recommendations tailored to your project needs", gradient: "from-cyan-500/20 to-cyan-600/5" },
  { icon: FolderOpen, title: "Folder Structure", description: "Production-ready architecture with best-practice file organization", gradient: "from-pink-500/20 to-pink-600/5" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Enter Your Idea", description: "Type any project concept — from 'E-commerce App' to 'AI Chatbot'. No technical knowledge required.", icon: Sparkles },
  { step: "02", title: "AI Processes", description: "Our AI analyzes your idea across 50+ dimensions to generate a production-grade blueprint in seconds.", icon: Brain },
  { step: "03", title: "Get Blueprint", description: "Download a complete Word document report ready for university submission.", icon: FileCode },
];

const EXAMPLE_PROMPTS = [
  "Food Delivery App", "AI Resume Builder", "E-commerce Platform",
  "Student Attendance System", "Task Management Tool", "Healthcare Portal",
  "Real Estate Platform", "Social Media Dashboard",
];

const STATS = [
  { value: "100+", label: "Blueprints Generated", icon: Zap },
  { value: "25+", label: "Tech Stacks Supported", icon: Code2 },
  { value: "4.8★", label: "User Experience", icon: Star },
  { value: "50+", label: "Students Helped", icon: Users },
];
// ─── Utilities ────────────────────────────────────────────────
function methodColor(m: HTTPMethod) {
  const map: Record<HTTPMethod, string> = {
    GET: "text-emerald-700 bg-emerald-50 border-emerald-200",
    POST: "text-orange-700 bg-orange-50 border-orange-200",
    PUT: "text-blue-700 bg-blue-50 border-blue-200",
    PATCH: "text-purple-700 bg-purple-50 border-purple-200",
    DELETE: "text-red-700 bg-red-50 border-red-200",
  };
  return map[m];
}

function priorityColor(p: Priority) {
  const map = {
    high: "text-[#E8320A] bg-[#E8320A]/8 border-[#E8320A]/20",
    medium: "text-amber-600 bg-amber-50 border-amber-200",
    low: "text-gray-400 bg-gray-50 border-gray-200",
  };
  return map[p];
}

const MANROPE = { fontFamily: '"Manrope", sans-serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };

// ─── SkillDzire Logo ──────────────────────────────────────────
function SkillDzireLogo({ className = "" }: { className?: string }) {
  return (
    <img src="https://skilldzire.com/images/logo-skilldzire.png" alt="SkillDzire"
      className={className} style={{ objectFit: "contain" }} />
  );
}

// ─── Navbar ───────────────────────────────────────────────────
const NAV_LINKS = ["Home", "Features", "How It Works"];

function Navbar({ onGetStarted }: { onGetStarted?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm" : "bg-white border-b border-gray-100"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 flex-shrink-0">
            <SkillDzireLogo className="h-9 w-auto" />
            <div className="hidden sm:block h-5 w-px bg-gray-200" />
            <div className="hidden sm:block leading-tight">
              <div className="text-gray-800 font-bold text-xs" style={MANROPE}>Mini Project Generator</div>
              <div className="text-[#E8320A] text-[10px] font-medium">AI-Powered Blueprint Tool</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(l => (
              <a key={l} href="#" className="text-gray-500 hover:text-gray-900 text-sm transition-colors duration-200 font-medium">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={onGetStarted}
              className="bg-[#E8320A] hover:bg-[#C0300A] text-white text-sm px-5 py-2 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
              style={MANROPE}>Get Started</button>
          </div>
          <button className="md:hidden text-gray-500 hover:text-gray-800 p-2 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-200 overflow-hidden">
            <div className="px-5 py-4 space-y-0.5">
              {NAV_LINKS.map(l => (
                <a key={l} href="#" className="block text-gray-600 hover:text-gray-900 py-2.5 text-sm transition-colors font-medium">{l}</a>
              ))}
              <div className="pt-4 border-t border-gray-100 mt-3">
                <button onClick={onGetStarted}
                  className="w-full bg-[#E8320A] hover:bg-[#C0300A] text-white text-sm py-2.5 rounded-xl font-semibold transition-colors">
                  Get Started Free
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── Hero Visual ──────────────────────────────────────────────
function HeroVisual() {
  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0">
      <div className="absolute -inset-8 rounded-full blur-3xl" style={{ background: "radial-gradient(ellipse at center, rgba(232,50,10,0.08) 0%, transparent 70%)" }} />
      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
        className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-1.5 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-gray-400 text-[11px] ml-2" style={MONO}>project.blueprint</span>
        </div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-gray-900 font-bold text-sm" style={MANROPE}>FoodFleet Platform</h3>
            <p className="text-gray-400 text-[11px] mt-0.5">Food & Delivery · Full Stack</p>
          </div>
          <span className="bg-[#E8320A]/10 text-[#E8320A] text-[10px] px-2 py-0.5 rounded-full border border-[#E8320A]/20 font-semibold whitespace-nowrap">AI Generated</span>
        </div>
        <div className="mb-4">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-2">Tech Stack</p>
          <div className="flex flex-wrap gap-1.5">
            {["React.js", "Node.js", "PostgreSQL", "Redis", "Docker"].map(t => (
              <span key={t} className="bg-gray-50 border border-gray-200 text-gray-600 text-[11px] px-2 py-0.5 rounded-md">{t}</span>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-2">Core Features</p>
          <div className="space-y-1.5">
            {["User Auth & RBAC", "Real-time Order Tracking", "Payment Processing", "Restaurant Dashboard"].map(f => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#E8320A] flex-shrink-0" />
                <span className="text-gray-500 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
            <span>Est. Timeline</span><span>12 weeks</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #E8320A, #FF6B00)" }}
              initial={{ width: 0 }} animate={{ width: "75%" }} transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }} />
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 }}
        className="absolute -top-3 -right-4 bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
        <Database className="w-3.5 h-3.5 text-[#E8320A]" />
        <span className="text-gray-600 text-xs font-medium">4 DB Tables</span>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}
        className="absolute -bottom-3 -left-4 bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
        <GitBranch className="w-3.5 h-3.5 text-[#E8320A]" />
        <span className="text-gray-600 text-xs font-medium">10 API Routes</span>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.7 }}
        className="absolute top-1/3 -right-12 hidden xl:flex bg-white border border-gray-200 rounded-xl px-3 py-2 flex-col items-center gap-1 shadow-lg">
        <Zap className="w-3.5 h-3.5 text-[#E8320A]" />
        <span className="text-gray-600 text-[10px] font-medium">Instant</span>
      </motion.div>
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────
function HeroSection({ onGenerate }: { onGenerate: (p: string) => void }) {
  const [input, setInput] = useState("");
  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-20 overflow-hidden bg-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] blur-3xl opacity-40" style={{ background: "radial-gradient(ellipse at top right, rgba(232,50,10,0.06) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] blur-3xl opacity-30" style={{ background: "radial-gradient(ellipse at bottom left, rgba(232,50,10,0.05) 0%, transparent 65%)" }} />
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: "radial-gradient(circle, #E8320A 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-[#E8320A]/8 border border-[#E8320A]/15 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#E8320A]" />
              <span className="text-[#E8320A] text-xs font-semibold">AI-Powered Blueprint Generator</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[3.2rem] font-black leading-[1.1] tracking-tight mb-5 text-gray-900" style={MANROPE}>
              Generate Complete{" "}
              <span style={{ background: "linear-gradient(135deg, #E8320A 0%, #FF6B1A 50%, #FF8C00 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Project Blueprints
              </span>{" "}with AI
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg">
              Turn any software idea into a production-ready blueprint — tech stack, APIs, database schema, dev roadmap & downloadable Word report. Instantly.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Wand2 className="w-4 h-4 text-gray-400" />
                </div>
                <input id="hero-input" type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && input.trim() && onGenerate(input)}
                  placeholder="e.g. Food Delivery App, AI Resume Builder..."
                  className="w-full bg-white border border-gray-300 rounded-xl pl-11 pr-4 py-3.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#E8320A] focus:ring-2 focus:ring-[#E8320A]/15 transition-all shadow-sm" />
              </div>
              <button onClick={() => input.trim() && onGenerate(input)}
                className="flex items-center justify-center gap-2 text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md"
                style={{ background: "linear-gradient(135deg, #E8320A, #FF6B00)" }}
                onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.08)")}
                onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}>
                Generate Blueprint <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
              className="flex flex-wrap items-center gap-2">
              <span className="text-gray-400 text-xs">Try:</span>
              {["Food Delivery App", "AI Resume Builder", "E-commerce Platform", "Task Manager"].map(p => (
                <button key={p} onClick={() => onGenerate(p)}
                  className="text-xs text-gray-500 hover:text-[#E8320A] bg-gray-50 hover:bg-[#E8320A]/5 border border-gray-200 hover:border-[#E8320A]/30 rounded-full px-3 py-1 transition-all duration-150">{p}</button>
              ))}
            </motion.div>
          </div>
          <div className="flex justify-center lg:justify-end"><HeroVisual /></div>
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────
function FeaturesSection() {
  return (
    <section className="py-20 relative bg-gray-50">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 mb-5 shadow-sm">
            <Zap className="w-3 h-3 text-[#E8320A]" />
            <span className="text-gray-500 text-xs font-medium">What AI Generates For You</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3" style={MANROPE}>
            Everything You Need to{" "}
            <span style={{ background: "linear-gradient(135deg, #E8320A, #FF8C00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Start Building</span>
          </h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm">No more guessing. Get a complete technical blueprint for any project idea in seconds.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURE_CARDS.map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="group bg-white hover:bg-white border border-gray-200 hover:border-[#E8320A]/20 rounded-2xl p-6 transition-all duration-300 cursor-default hover:shadow-md">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-100`}>
                <card.icon className="w-5 h-5 text-gray-700" />
              </div>
              <h3 className="text-gray-900 font-bold mb-2 text-sm" style={MANROPE}>{card.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3" style={MANROPE}>How It Works</h2>
          <p className="text-gray-500 text-sm">From idea to full blueprint in under 15 seconds.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-px border-t border-dashed border-gray-300" />
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div key={step.step} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="text-center relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{ background: "linear-gradient(135deg, #E8320A, #FF8C00)" }}>
                <step.icon className="w-7 h-7 text-white" />
              </div>
              <div className="text-[#E8320A] text-xs font-black mb-2 tracking-[0.2em]" style={MONO}>{step.step}</div>
              <h3 className="text-gray-900 font-bold mb-2" style={MANROPE}>{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExamplePromptsSection({ onGenerate }: { onGenerate: (p: string) => void }) {
  return (
    <section className="py-14 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-[#E8320A]/40 to-transparent" />
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2" style={MANROPE}>Try These Project Ideas</h2>
            <p className="text-gray-500 text-sm">Click any idea to instantly generate its full blueprint.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {EXAMPLE_PROMPTS.map(p => (
              <button key={p} onClick={() => onGenerate(p)}
                className="group flex items-center gap-2 bg-gray-50 hover:bg-[#E8320A]/5 border border-gray-200 hover:border-[#E8320A]/30 text-gray-600 hover:text-[#E8320A] text-sm px-5 py-2.5 rounded-xl transition-all duration-200">
                {p}<ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:border-[#E8320A]/20 hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-[#E8320A]/8 flex items-center justify-center mx-auto mb-3">
                <s.icon className="w-4 h-4 text-[#E8320A]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-1" style={MANROPE}>{s.value}</div>
              <div className="text-gray-500 text-xs">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ onGenerate }: { onGenerate: (p: string) => void }) {
  const [input, setInput] = useState("");
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 overflow-hidden text-center shadow-sm">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px" style={{ background: "linear-gradient(90deg, transparent, #E8320A, transparent)" }} />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{ background: "linear-gradient(135deg, #E8320A, #FF8C00)" }}>
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3" style={MANROPE}>
              Start Building Your{" "}
              <span style={{ background: "linear-gradient(135deg, #E8320A, #FF8C00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Blueprint</span>{" "}Now
            </h2>
            <p className="text-gray-500 text-sm mb-8">Enter any project idea and get a complete technical blueprint + downloadable report in seconds.</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="text" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && input.trim() && onGenerate(input)}
                placeholder="Enter your project idea..."
                className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#E8320A] focus:ring-2 focus:ring-[#E8320A]/15 transition-all" />
              <button onClick={() => input.trim() && onGenerate(input)}
                className="flex items-center justify-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all whitespace-nowrap shadow-sm hover:shadow-md"
                style={{ background: "linear-gradient(135deg, #E8320A, #FF6B00)" }}
                onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.08)")}
                onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}>
                Generate <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="mb-4"><SkillDzireLogo className="h-8 w-auto" /></div>
            <p className="text-gray-400 text-xs leading-relaxed mb-5">Empowering students & developers with AI-powered software project blueprints. Build faster. Build smarter.</p>
            <div className="flex items-center gap-4">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="text-gray-400 hover:text-[#E8320A] transition-colors"><Icon className="w-4 h-4" /></a>
              ))}
              <a href="#" className="text-gray-400 hover:text-[#E8320A] transition-colors"><Mail className="w-4 h-4" /></a>
            </div>
          </div>
          {[
            { heading: "Product", links: ["Features", "How It Works", "Documentation"] },
            { heading: "Company", links: ["About SkillDzire", "Contact"] },
            { heading: "Resources", links: ["Get Started", "Support Center", "Privacy Policy"] },
          ].map(col => (
            <div key={col.heading}>
              <h4 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (<li key={l}><a href="#" className="text-gray-500 hover:text-[#E8320A] text-xs transition-colors">{l}</a></li>))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-400 text-xs">© 2026 SkillDzire. All rights reserved.</p>
          <p className="text-gray-400 text-xs">Built by SkillDzire</p>
        </div>
      </div>
    </footer>
  );
}

function LandingPage({ onGenerate }: { onGenerate: (p: string) => void }) {
  return (
    <>
      <HeroSection onGenerate={onGenerate} />
      <FeaturesSection />
      <HowItWorksSection />
      <ExamplePromptsSection onGenerate={onGenerate} />
      <StatsSection />
      <CTASection onGenerate={onGenerate} />
      <Footer />
    </>
  );
}

// ─── Generating View ──────────────────────────────────────────
function GeneratingView({ prompt, onComplete }: { prompt: string; onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    if (currentStep >= LOADING_STEPS.length) return;
    const t = setTimeout(() => {
      setCompleted(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    }, 1200);
    return () => clearTimeout(t);
  }, [currentStep]);

  useEffect(() => {
    if (currentStep >= LOADING_STEPS.length) onComplete();
  }, [currentStep, onComplete]);

  const progress = Math.round((completed.length / LOADING_STEPS.length) * 100);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: "linear-gradient(135deg, #E8320A, #FF8C00)" }}>
              <Brain className="w-10 h-10 text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl animate-ping opacity-15" style={{ background: "linear-gradient(135deg, #E8320A, #FF8C00)" }} />
          </div>
        </div>
        <h2 className="text-gray-900 text-2xl font-black text-center mb-2" style={MANROPE}>Generating Blueprint</h2>
        <p className="text-gray-500 text-sm text-center mb-10 max-w-xs mx-auto truncate">"{prompt}"</p>
        <div className="space-y-2.5 mb-8">
          {LOADING_STEPS.map((step, i) => {
            const done = completed.includes(i);
            const active = currentStep === i;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${done ? "bg-[#E8320A]/5 border-[#E8320A]/15" : active ? "bg-gray-50 border-gray-200" : "border-transparent"}`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                  style={done ? { background: "linear-gradient(135deg, #E8320A, #FF8C00)" } : { background: active ? "#F3F4F6" : "#F9FAFB" }}>
                  {done ? <Check className="w-3.5 h-3.5 text-white" /> : active ? <Loader2 className="w-3.5 h-3.5 text-[#E8320A] animate-spin" /> : <step.icon className="w-3.5 h-3.5 text-gray-400" />}
                </div>
                <span className={`text-sm transition-colors ${done ? "text-gray-600" : active ? "text-gray-900" : "text-gray-400"}`}>{step.label}</span>
              </motion.div>
            );
          })}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
          <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #E8320A, #FF8C00)" }}
            animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
        </div>
        <div className="text-center">
          <span className="text-gray-400 text-xs" style={MONO}>{progress}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Results Dashboard ────────────────────────────────────────
const RESULT_SECTIONS = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "techstack", label: "Tech Stack", icon: Code2 },
  { id: "features", label: "Core Features", icon: CheckSquare },
  { id: "database", label: "Database", icon: Database },
  { id: "apis", label: "API Endpoints", icon: GitBranch },
  { id: "devsteps", label: "Dev Steps", icon: Flag },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "structure", label: "Folder Structure", icon: Folder },
];

function CopyBtn({ text, small = false }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); }}
      className={`flex items-center gap-1.5 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all ${small ? "text-[11px] px-2.5 py-1" : "text-xs px-3 py-1.5"}`}>
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function Card({ id, icon: Icon, title, children, copyText }: {
  id: string; icon: React.ElementType; title: string; children: React.ReactNode; copyText?: string;
}) {
  return (
    <div id={id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4 scroll-mt-4 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E8320A]/8 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#E8320A]" />
          </div>
          <h3 className="text-gray-900 font-bold text-sm" style={MANROPE}>{title}</h3>
        </div>
        {copyText && <CopyBtn text={copyText} />}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ResultsDashboard({ data, prompt, onBack, onRegenerate }: {
  data: ProjectData; prompt: string; onBack: () => void; onRegenerate: () => void;
}) {
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // ← This ref points to the scrollable content area only
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    // Scroll within the content pane, not the whole page
    const el = contentRef.current?.querySelector(`#${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileSidebar(false);
  };

  const handleDownloadDocx = async () => {
    setDownloading(true);
    try {
      await downloadDocx(data);
      toast.success("Report downloaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to download report.");
    } finally {
      setDownloading(false);
    }
  };

  const allText = [
    `PROJECT: ${data.title}`, `TAGLINE: ${data.tagline}`, `\n${data.description}`,
    `\nTECH STACK:\n${Object.entries(data.techStack).map(([k, v]) => `${k}: ${v.join(", ")}`).join("\n")}`,
    `\nFEATURES:\n${data.features.map(f => `- ${f.name}: ${f.description}`).join("\n")}`,
    `\nAPI ENDPOINTS:\n${data.apis.map(a => `${a.method} ${a.path} — ${a.description}`).join("\n")}`,
    `\nFOLDER STRUCTURE:\n${data.folderStructure}`,
  ].join("\n");

  const SidebarContent = () => (
    <div className="p-3">
      <div className="text-gray-400 text-[10px] uppercase tracking-widest px-2 mb-2 mt-1">Sections</div>
      {RESULT_SECTIONS.map(s => (
        <button key={s.id} onClick={() => scrollTo(s.id)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs mb-0.5 transition-all duration-150 ${
            activeSection === s.id ? "text-[#E8320A] bg-[#E8320A]/8 border border-[#E8320A]/15" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent"}`}>
          <s.icon className="w-3.5 h-3.5 flex-shrink-0" />{s.label}
        </button>
      ))}
    </div>
  );

  return (
    // ── KEY FIX: outer container is fixed height, no overflow ──
    // The page body does NOT scroll. Only the content pane scrolls.
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 h-14 flex items-center px-4 sm:px-6 gap-3 shadow-sm z-40">
        <SkillDzireLogo className="h-7 w-auto flex-shrink-0" />
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm transition-colors flex-shrink-0">
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="text-gray-900 font-bold text-sm truncate" style={MANROPE}>{data.title}</h1>
          <div className="text-gray-400 text-[10px] hidden sm:block">{data.category} · {data.techStack.frontend.slice(0, 2).join(", ")}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Download Doc button */}
          <button onClick={handleDownloadDocx} disabled={downloading}
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
            onMouseEnter={e => !downloading && (e.currentTarget.style.filter = "brightness(1.1)")}
            onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}>
            {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            <span className="hidden sm:inline">{downloading ? "Generating..." : "Download Doc"}</span>
          </button>
          <button onClick={() => { navigator.clipboard.writeText(allText); toast.success("All sections copied!"); }}
            className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition-all">
            <Copy className="w-3 h-3" /> Copy All
          </button>
          <button onClick={onRegenerate}
            className="flex items-center gap-1.5 text-xs text-white font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm"
            style={{ background: "linear-gradient(135deg, #E8320A, #FF6B00)" }}
            onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.08)")}
            onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}>
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
          <button className="lg:hidden text-gray-500 hover:text-gray-900 p-1.5 transition-colors" onClick={() => setMobileSidebar(!mobileSidebar)}>
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Body: sidebar + scrollable content ──────────────── */}
      <div className="flex flex-1 min-h-0"> {/* min-h-0 is critical — lets children shrink */}

        {/* Desktop sidebar — does NOT scroll with content */}
        <aside className="hidden lg:flex flex-col w-56 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileSidebar && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMobileSidebar(false)} />
              <motion.aside initial={{ x: -224 }} animate={{ x: 0 }} exit={{ x: -224 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed top-14 left-0 bottom-0 z-40 w-56 bg-white border-r border-gray-200 overflow-y-auto lg:hidden">
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main content — THIS is the only thing that scrolls ── */}
        <main ref={contentRef} className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-3xl mx-auto p-4 sm:p-6">

            <Card id="overview" icon={Layers} title="Project Overview" copyText={`${data.title}\n${data.tagline}\n\n${data.description}`}>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-[#E8320A] bg-[#E8320A]/8 border border-[#E8320A]/15 text-xs px-3 py-1 rounded-full font-semibold">{data.category}</span>
                <span className="text-gray-500 bg-gray-50 border border-gray-200 text-xs px-3 py-1 rounded-full">Full Stack</span>
              </div>
              <h2 className="text-gray-900 text-xl font-black mb-1.5" style={MANROPE}>{data.title}</h2>
              <p className="text-[#FF6B00] text-xs mb-3 font-medium italic">{data.tagline}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{data.description}</p>
            </Card>

            <Card id="techstack" icon={Code2} title="Recommended Tech Stack" copyText={Object.entries(data.techStack).map(([k, v]) => `${k}: ${v.join(", ")}`).join("\n")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.entries(data.techStack) as [keyof TechStack, string[]][]).map(([key, items]) => {
                  const icons: Record<string, React.ElementType> = { frontend: Globe, backend: Server, database: Database, devops: Network };
                  const Icon = icons[key] || Code2;
                  return (
                    <div key={key} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-400 text-[10px] uppercase tracking-wider mb-3"><Icon className="w-3 h-3" />{key}</div>
                      <div className="flex flex-wrap gap-2">
                        {items.map(item => (<span key={item} className="bg-white border border-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded-lg">{item}</span>))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card id="features" icon={CheckSquare} title="Core Features & Modules" copyText={data.features.map(f => `[${f.priority.toUpperCase()}] ${f.name}: ${f.description}`).join("\n")}>
              <div className="space-y-2">
                {data.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 hover:bg-white border border-gray-100 hover:border-[#E8320A]/15 rounded-xl p-4 transition-all">
                    <div className="w-5 h-5 rounded-full bg-[#E8320A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E8320A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-gray-900 text-sm font-semibold">{f.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${priorityColor(f.priority)}`}>{f.priority}</span>
                      </div>
                      <p className="text-gray-500 text-xs leading-relaxed">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card id="database" icon={Database} title="Database Schema">
              <div className="space-y-4">
                {data.database.map((table, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-[#E8320A]" />
                        <span className="text-gray-900 font-semibold text-sm" style={MONO}>{table.name}</span>
                      </div>
                      <span className="text-gray-400 text-xs">{table.columns.length} columns</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left text-gray-400 text-[10px] uppercase tracking-wider px-4 py-2">Column</th>
                            <th className="text-left text-gray-400 text-[10px] uppercase tracking-wider px-4 py-2">Type</th>
                            <th className="text-left text-gray-400 text-[10px] uppercase tracking-wider px-4 py-2">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((col, j) => (
                            <tr key={j} className="border-b border-gray-50 last:border-0 hover:bg-white transition-colors">
                              <td className="px-4 py-2 text-gray-700 text-xs" style={MONO}>{col.name}</td>
                              <td className="px-4 py-2 text-[#E8320A] text-xs font-medium" style={MONO}>{col.type}</td>
                              <td className="px-4 py-2 text-gray-400 text-xs">{col.note || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card id="apis" icon={GitBranch} title="API Endpoints" copyText={data.apis.map(a => `${a.method} ${a.path} — ${a.description}${a.auth ? " [AUTH]" : ""}`).join("\n")}>
              <div className="space-y-2">
                {data.apis.map((api, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2.5 bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 rounded-xl p-3.5 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border flex-shrink-0 ${methodColor(api.method)}`} style={MONO}>{api.method}</span>
                      <code className="text-gray-600 text-xs truncate" style={MONO}>{api.path}</code>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-auto flex-shrink-0">
                      <p className="text-gray-400 text-xs hidden sm:block">{api.description}</p>
                      {api.auth && (
                        <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-md px-1.5 py-0.5 flex-shrink-0">
                          <Lock className="w-2.5 h-2.5 text-gray-400" />
                          <span className="text-gray-400 text-[10px]">Auth</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs sm:hidden">{api.description}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card id="devsteps" icon={Flag} title="Development Steps" copyText={data.devSteps.map(s => `${s.step}. ${s.title}: ${s.description}`).join("\n\n")}>
              <div className="space-y-3">
                {data.devSteps.map((step, i) => (
                  <div key={i} className="flex gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border border-[#E8320A]/20 bg-[#E8320A]/5">
                      <span className="text-[#E8320A] text-xs font-black">{step.step}</span>
                    </div>
                    <div>
                      <h4 className="text-gray-900 font-semibold text-sm mb-1" style={MANROPE}>{step.title}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card id="timeline" icon={Clock} title="Development Timeline" copyText={data.timeline.map(p => `${p.phase} (${p.duration}): ${p.tasks.join(", ")}`).join("\n")}>
              <div className="space-y-3">
                {data.timeline.map((phase, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-gray-900 font-semibold text-sm" style={MANROPE}>{phase.phase}</h4>
                      <span className="text-[#E8320A] text-xs bg-[#E8320A]/8 border border-[#E8320A]/15 px-2.5 py-0.5 rounded-full font-semibold">{phase.duration}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {phase.tasks.map(task => (
                        <span key={task} className="flex items-center gap-1.5 text-gray-500 text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1">
                          <div className="w-1 h-1 rounded-full bg-gray-300" />{task}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card id="structure" icon={Folder} title="Folder Structure">
              <div className="relative">
                <div className="absolute top-3 right-3 z-10"><CopyBtn text={data.folderStructure} /></div>
                <pre className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-xs text-gray-300 overflow-x-auto leading-loose" style={MONO}>
                  {data.folderStructure}
                </pre>
              </div>
            </Card>

            {/* Bottom actions */}
            <div className="flex flex-wrap gap-3 pt-2 pb-8">
              <button onClick={handleDownloadDocx} disabled={downloading}
                className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
                onMouseEnter={e => !downloading && (e.currentTarget.style.filter = "brightness(1.1)")}
                onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}>
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? "Generating Doc..." : "Download Word Report"}
              </button>
              <button onClick={() => { navigator.clipboard.writeText(allText); toast.success("All sections copied!"); }}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 text-sm px-5 py-2.5 rounded-xl transition-all">
                <Copy className="w-4 h-4" /> Copy All
              </button>
              <button onClick={onRegenerate}
                className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
                style={{ background: "linear-gradient(135deg, #E8320A, #FF6B00)" }}
                onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.08)")}
                onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}>
                <RefreshCw className="w-4 h-4" /> Generate Again
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<View>("landing");
  const [prompt, setPrompt] = useState("");
  const [projectData, setProjectData] = useState<ProjectData | null>(null);

  const handleGenerate = (p: string) => {
    if (!p.trim()) { toast.error("Please enter a project idea"); return; }
    setPrompt(p);
    setView("generating");
  };

  const handleComplete = useCallback(async () => {
    try {
      const data = await generateBlueprint(prompt);
      setProjectData(data);
      setView("results");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate blueprint. Please try again.");
      setView("landing");
    }
  }, [prompt]);

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased overflow-x-hidden">
      <Toaster theme="light" position="top-right" richColors />
      {view === "landing" && (
        <Navbar onGetStarted={() => document.getElementById("hero-input")?.focus()} />
      )}
      <AnimatePresence mode="wait">
        {view === "landing" && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <LandingPage onGenerate={handleGenerate} />
          </motion.div>
        )}
        {view === "generating" && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <GeneratingView prompt={prompt} onComplete={handleComplete} />
          </motion.div>
        )}
        {view === "results" && projectData && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="h-screen overflow-hidden"> {/* ← Locks outer container */}
            <ResultsDashboard
              data={projectData} prompt={prompt}
              onBack={() => setView("landing")}
              onRegenerate={() => setView("generating")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}