import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast, Toaster } from "sonner";
import {
  ArrowRight, Brain, Check, ChevronRight, Clock,
  Code2, Copy, Database, Download, FileCode, FolderOpen,
  Github, GitBranch, Globe, Layers, Linkedin,
  Loader2, Lock, Mail, Menu, Network,
  RefreshCw, Server, Shield, Sparkles, Star,
  Twitter, Users, Wand2, X, Zap, Flag, CheckSquare,
  Layout, History, Folder, BookOpen, List, AlignLeft
} from "lucide-react";
import { generateBlueprint, downloadDocx } from "../services/api";

// ─── Types ─────────────────────────────────────────────────────
type View = "landing" | "generating" | "results";

// New dynamic section types matching updated aiService.js output
interface SectionTable {
  headers: string[];
  rows: string[][];
  colPercents?: number[];
}
interface SectionCodeBlock {
  lines: string[];
  caption?: string;
}
interface SubSection {
  id: string;
  number?: string;
  title: string;
  content?: string;
  bullets?: string[];
  table?: SectionTable;
  codeBlock?: SectionCodeBlock;
}
interface Section {
  id: string;
  number?: string;
  title: string;
  content?: string;
  bullets?: string[];
  table?: SectionTable;
  codeBlock?: SectionCodeBlock;
  subsections?: SubSection[];
}
interface TechStack {
  frontend: string[];
  backend: string[];
  database: string[];
  devops: string[];
}
interface CoverMeta {
  subtitle?: string;
  institution?: string;
}
interface GeneratedFile {
  path: string;
  language?: string;
  type?: string;
  purpose?: string;
  content?: string;
}
interface ProjectData {
  title: string;
  tagline: string;
  category: string;
  techStack: TechStack;
  sections: Section[];
  coverMeta?: CoverMeta;
  generatedFiles?: GeneratedFile[];
}

// ─── Constants ─────────────────────────────────────────────────
const LOADING_STEPS = [
  { icon: Brain,       label: "Analyzing prompt & planning structure..."     },
  { icon: Layers,      label: "Building document skeleton & sections..."     },
  { icon: AlignLeft,   label: "Writing detailed content — pass 1 of 2..."   },
  { icon: GitBranch,   label: "Generating tables, APIs & diagrams..."        },
  { icon: Database,    label: "Enriching database design & architecture..."  },
  { icon: CheckSquare, label: "Finalizing all sections with full detail..."  },
  { icon: FolderOpen,  label: "Assembling complete document blueprint..."    },
];

const FEATURE_CARDS = [
  { icon: AlignLeft,  title: "Prompt-Driven Sections",   description: "Define exactly which sections you want — the AI follows your instructions precisely.", gradient: "from-blue-500/20 to-blue-600/5" },
  { icon: Database,   title: "Auto Tables & Diagrams",   description: "Relevant tables, schema, and ASCII diagrams are generated automatically per section.", gradient: "from-purple-500/20 to-purple-600/5" },
  { icon: List,       title: "Subsections & Bullets",    description: "Nested subsections, bullet lists, and structured content generated to match your spec.", gradient: "from-emerald-500/20 to-emerald-600/5" },
  { icon: Clock,      title: "Timeline Estimation",      description: "Phased development schedule with realistic milestones and deliverables.", gradient: "from-[#FF4D00]/20 to-[#FF8C00]/5" },
  { icon: Code2,      title: "Tech Stack",               description: "Curated technology recommendations tailored to your project needs.", gradient: "from-cyan-500/20 to-cyan-600/5" },
  { icon: Download,   title: "Word Report Download",     description: "Download a fully formatted .docx report with all your custom sections included.", gradient: "from-pink-500/20 to-pink-600/5" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Describe Your Project", description: "Provide a detailed prompt specifying your project, the sections you want, and any content requirements.", icon: Sparkles },
  { step: "02", title: "AI Generates It",        description: "The AI strictly follows your section list — names, order, tables, and diagrams are all as you specified.", icon: Brain    },
  { step: "03", title: "Download & Submit",      description: "Get a complete, downloadable Word report with every section exactly as you defined it.", icon: FileCode },
];

const EXAMPLE_PROMPTS = [
  "Food Delivery App with sections: Introduction, System Architecture, Database Design, API Specification, Testing Strategy, Conclusion",
  "AI Resume Builder with sections: Abstract, Problem Statement, Proposed Solution, Tech Stack, Features, Timeline",
  "E-commerce Platform — 5 sections: Overview, Database Schema, REST APIs, Frontend Design, Deployment Plan",
  "Student Attendance System — sections: Introduction, Objectives, System Design, Implementation, Results",
];

const STATS = [
  { value: "100+", label: "Blueprints Generated", icon: Zap   },
  { value: "20+",  label: "Tech Stacks Supported", icon: Code2 },
  { value: "4.9★", label: "Average Rating",        icon: Star  },
  { value: "100+", label: "Developers Served",     icon: Users },
];

const MANROPE = { fontFamily: '"Manrope", sans-serif' };
const MONO    = { fontFamily: '"JetBrains Mono", monospace' };

// ─── SkillDzire Logo ───────────────────────────────────────────
function SkillDzireLogo({ className = "" }: { className?: string }) {
  return (
    <img src="https://skilldzire.com/images/logo-skilldzire.png" alt="SkillDzire"
      className={className} style={{ objectFit: "contain" }} />
  );
}

// ─── Navbar ────────────────────────────────────────────────────
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

// ─── Hero Visual ───────────────────────────────────────────────
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
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-2">Document Sections</p>
          <div className="space-y-1.5">
            {["1. Introduction", "2. System Design", "3. Database Schema", "4. API Specification", "5. Testing & Conclusion"].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#E8320A] flex-shrink-0" />
                <span className="text-gray-500 text-xs">{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
            <span>Blueprint Progress</span><span>Complete</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #E8320A, #FF6B00)" }}
              initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }} />
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 }}
        className="absolute -top-3 -right-4 bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
        <BookOpen className="w-3.5 h-3.5 text-[#E8320A]" />
        <span className="text-gray-600 text-xs font-medium">Custom Sections</span>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}
        className="absolute -bottom-3 -left-4 bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
        <Download className="w-3.5 h-3.5 text-[#E8320A]" />
        <span className="text-gray-600 text-xs font-medium">Word Export</span>
      </motion.div>
    </div>
  );
}

// ─── Hero Section ──────────────────────────────────────────────
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
              Generate{" "}
              <span style={{ background: "linear-gradient(135deg, #E8320A 0%, #FF6B1A 50%, #FF8C00 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Custom-Section
              </span>{" "}Project Docs
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg">
              Describe your project and specify exactly which sections you want. The AI follows your instructions precisely — no unwanted boilerplate.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Wand2 className="w-4 h-4 text-gray-400" />
                </div>
                <textarea id="hero-input" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && input.trim() && (e.preventDefault(), onGenerate(input))}
                  placeholder="Describe your project and list the sections you want, e.g. 'Food Delivery App with sections: Introduction, System Design, Database, API Spec, Conclusion. PROMPT should be under 5000 characters.'"
                  rows={3}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-11 pr-4 py-3.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#E8320A] focus:ring-2 focus:ring-[#E8320A]/15 transition-all shadow-sm resize-none" />
              </div>
              <button onClick={() => input.trim() && onGenerate(input)}
                className="flex items-center justify-center gap-2 text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md self-end"
                style={{ background: "linear-gradient(135deg, #E8320A, #FF6B00)" }}
                onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.08)")}
                onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}>
                Generate <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
              className="flex flex-wrap items-start gap-2">
              <span className="text-gray-400 text-xs mt-1">Try:</span>
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

// ─── Features Section ──────────────────────────────────────────
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
          <p className="text-gray-500 max-w-md mx-auto text-sm">Describe your project, specify your sections — get a complete, structured document in seconds.</p>
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

// ─── How It Works ──────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3" style={MANROPE}>How It Works</h2>
          <p className="text-gray-500 text-sm">From a detailed prompt to a full custom-section document in seconds.</p>
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
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2" style={MANROPE}>Example Prompts</h2>
            <p className="text-gray-500 text-sm">Click any to instantly generate a blueprint.</p>
          </div>
          <div className="flex flex-col gap-3">
            {EXAMPLE_PROMPTS.map(p => (
              <button key={p} onClick={() => onGenerate(p)}
                className="group flex items-center gap-2 bg-gray-50 hover:bg-[#E8320A]/5 border border-gray-200 hover:border-[#E8320A]/30 text-gray-600 hover:text-[#E8320A] text-sm px-5 py-3 rounded-xl transition-all duration-200 text-left">
                <span className="flex-1">{p}</span>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
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
              Generate Your{" "}
              <span style={{ background: "linear-gradient(135deg, #E8320A, #FF8C00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Blueprint</span>{" "}Now
            </h2>
            <p className="text-gray-500 text-sm mb-8">Enter a detailed prompt specifying your project and the sections you want.</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && input.trim() && (e.preventDefault(), onGenerate(input))}
                placeholder="e.g. Food Delivery App with sections: Introduction, System Design, Database..."
                rows={2}
                className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#E8320A] focus:ring-2 focus:ring-[#E8320A]/15 transition-all resize-none" />
              <button onClick={() => input.trim() && onGenerate(input)}
                className="flex items-center justify-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all whitespace-nowrap shadow-sm hover:shadow-md self-end"
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

function FooterSection() {
  return (
    <footer className="border-t border-gray-200 py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="mb-4"><SkillDzireLogo className="h-8 w-auto" /></div>
            <p className="text-gray-400 text-xs leading-relaxed mb-5">Empowering students & developers with AI-powered project blueprints. Build faster. Build smarter.</p>
          </div>
          {[
            { heading: "Product",  links: ["Features", "How It Works"] },
            { heading: "Company",  links: ["About SkillDzire", "Contact"] },
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
      <FooterSection />
    </>
  );
}

// ─── Generating View ───────────────────────────────────────────
function GeneratingView({ prompt, onComplete }: { prompt: string; onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (currentStep >= LOADING_STEPS.length - 1) return;
    const t = setTimeout(() => {
      setCompleted(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    }, 5000);
    return () => clearTimeout(t);
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === LOADING_STEPS.length - 1 && !waiting) {
      setWaiting(true);
      onComplete();
    }
  }, [currentStep, waiting, onComplete]);

  const progress = waiting
    ? Math.min(Math.round((completed.length / LOADING_STEPS.length) * 100), 90)
    : Math.round((completed.length / LOADING_STEPS.length) * 100);

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
        <p className="text-gray-500 text-sm text-center mb-10 max-w-xs mx-auto line-clamp-2">"{prompt}"</p>
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
        <div className="text-center space-y-1">
          <span className="text-gray-400 text-xs" style={MONO}>{progress}%</span>
          <p className="text-gray-300 text-[10px]">Detailed reports take 30–90 seconds — hang tight!</p>
        </div>
      </div>
    </div>
  );
}

// ─── Results Dashboard (dynamic sections) ─────────────────────
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

// Renders a table block inside a section
function SectionTableView({ table }: { table: SectionTable }) {
  const cols = table.headers.length;
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 mb-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-900 border-b border-gray-700">
            {table.headers.map((h, i) => (
              <th key={i} className="text-left text-white font-semibold px-4 py-2.5 text-[11px] uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} className={`border-b border-gray-50 last:border-0 ${ri % 2 === 0 ? "bg-white" : "bg-orange-50/40"}`}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-gray-600 text-xs leading-relaxed">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Renders a code/diagram block inside a section
function SectionCodeView({ codeBlock }: { codeBlock: SectionCodeBlock }) {
  return (
    <div className="mb-4">
      <pre className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs text-gray-300 overflow-x-auto leading-loose whitespace-pre-wrap" style={MONO}>
        {codeBlock.lines.join("\n")}
      </pre>
      {codeBlock.caption && (
        <p className="text-center text-gray-400 text-[11px] mt-1.5 italic">Figure: {codeBlock.caption}</p>
      )}
    </div>
  );
}

// Renders all content for a subsection or section block
function ContentBlock({ block }: { block: Pick<Section, "content" | "bullets" | "table" | "codeBlock"> }) {
  return (
    <>
      {block.content && (
        <p className="text-gray-600 text-sm leading-relaxed mb-3">{block.content}</p>
      )}
      {block.bullets && block.bullets.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {block.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E8320A] flex-shrink-0 mt-1.5" />
              <span className="leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      )}
      {block.table && <SectionTableView table={block.table} />}
      {block.codeBlock && <SectionCodeView codeBlock={block.codeBlock} />}
    </>
  );
}

// Full section card with subsections
function SectionCard({ section }: { section: Section }) {
  const sectionLabel = section.number ? `${section.number}. ${section.title}` : section.title;
  // Flatten all text for copy
  const flatText = [
    sectionLabel,
    section.content || "",
    ...(section.bullets || []),
    ...(section.subsections || []).flatMap(s => [
      `${s.number ? s.number + " " : ""}${s.title}`,
      s.content || "",
      ...(s.bullets || []),
    ]),
  ].filter(Boolean).join("\n");

  return (
    <div id={`section-${section.id}`} className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4 scroll-mt-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E8320A]/8 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-[#E8320A]" />
          </div>
          <h3 className="text-gray-900 font-bold text-sm" style={MANROPE}>{sectionLabel}</h3>
        </div>
        <CopyBtn text={flatText} />
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Section-level content (shown when no subsections, or as intro) */}
        {section.content && (!section.subsections || section.subsections.length === 0) && (
          <ContentBlock block={section} />
        )}
        {section.content && section.subsections && section.subsections.length > 0 && (
          <p className="text-gray-600 text-sm leading-relaxed mb-5">{section.content}</p>
        )}
        {!section.content && (!section.subsections || section.subsections.length === 0) && (
          <ContentBlock block={section} />
        )}

        {/* Subsections */}
        {section.subsections && section.subsections.length > 0 && (
          <div className="space-y-5">
            {section.subsections.map(sub => (
              <div key={sub.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-gray-800 font-semibold text-sm mb-3" style={MANROPE}>
                  {sub.number ? <span className="text-[#E8320A] mr-1.5">{sub.number}</span> : null}
                  {sub.title}
                </h4>
                <ContentBlock block={sub} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsDashboard({ data, prompt, onBack, onRegenerate }: {
  data: ProjectData; prompt: string; onBack: () => void; onRegenerate: () => void;
}) {
  const [activeSection, setActiveSection] = useState(data.sections[0]?.id ?? "");
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = contentRef.current?.querySelector(`#section-${id}`);
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
    `PROJECT: ${data.title}`,
    `TAGLINE: ${data.tagline}`,
    `CATEGORY: ${data.category}`,
    `\nTECH STACK:\n${Object.entries(data.techStack).map(([k, v]) => `${k}: ${v.join(", ")}`).join("\n")}`,
    `\n`,
    ...(data.sections || []).map(s => [
      `${s.number ? s.number + ". " : ""}${s.title}`,
      s.content || "",
      ...(s.bullets || []).map(b => `• ${b}`),
      ...(s.subsections || []).flatMap(sub => [
        `  ${sub.number ? sub.number + " " : ""}${sub.title}`,
        sub.content ? `  ${sub.content}` : "",
        ...(sub.bullets || []).map(b => `  • ${b}`),
      ]),
    ].filter(Boolean).join("\n")),
  ].join("\n");

  const SidebarContent = () => (
    <div className="p-3">
      <div className="text-gray-400 text-[10px] uppercase tracking-widest px-2 mb-2 mt-1">Document Sections</div>
      {(data.sections || []).map(s => (
        <button key={s.id} onClick={() => scrollTo(s.id)}
          className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs mb-0.5 transition-all duration-150 ${
            activeSection === s.id ? "text-[#E8320A] bg-[#E8320A]/8 border border-[#E8320A]/15" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent"}`}>
          <BookOpen className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span className="leading-snug">
            {s.number ? <span className="font-semibold">{s.number}. </span> : null}
            {s.title}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Bar */}
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
          <div className="text-gray-400 text-[10px] hidden sm:block">
            {data.category} · {(data.sections || []).length} sections
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleDownloadDocx} disabled={downloading}
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-all shadow-sm disabled:opacity-60"
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

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileSidebar && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMobileSidebar(false)} />
              <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed top-14 left-0 bottom-0 z-40 w-60 bg-white border-r border-gray-200 overflow-y-auto lg:hidden">
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main ref={contentRef} className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-3xl mx-auto p-4 sm:p-6">

            {/* Project meta card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[#E8320A] bg-[#E8320A]/8 border border-[#E8320A]/15 text-xs px-3 py-1 rounded-full font-semibold">{data.category}</span>
                {data.techStack?.frontend?.[0] && (
                  <span className="text-gray-500 bg-gray-50 border border-gray-200 text-xs px-3 py-1 rounded-full">{data.techStack.frontend[0]}</span>
                )}
                {data.techStack?.backend?.[0] && (
                  <span className="text-gray-500 bg-gray-50 border border-gray-200 text-xs px-3 py-1 rounded-full">{data.techStack.backend[0]}</span>
                )}
              </div>
              <h2 className="text-gray-900 text-xl font-black mb-1" style={MANROPE}>{data.title}</h2>
              <p className="text-[#FF6B00] text-xs font-medium italic">{data.tagline}</p>
            </div>

            {/* Dynamic sections */}
            {(data.sections || []).map(section => (
              <SectionCard key={section.id} section={section} />
            ))}

            {/* Generated files (if any) */}
            {data.generatedFiles && data.generatedFiles.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4 shadow-sm">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-[#E8320A]/8 flex items-center justify-center">
                    <Code2 className="w-4 h-4 text-[#E8320A]" />
                  </div>
                  <h3 className="text-gray-900 font-bold text-sm" style={MANROPE}>Generated Source Files</h3>
                </div>
                <div className="p-5 space-y-4">
                  {data.generatedFiles.map((file, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                        <span className="text-gray-700 font-semibold text-xs" style={MONO}>{file.path}</span>
                        <span className="text-gray-400 text-[10px]">{file.language}</span>
                      </div>
                      {file.content && (
                        <pre className="p-4 text-[11px] text-gray-300 bg-gray-900 overflow-x-auto leading-relaxed" style={MONO}>
                          {file.content.split("\n").slice(0, 40).join("\n")}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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

// ─── App ───────────────────────────────────────────────────────
export default function App() {
  const [view, setView]               = useState<View>("landing");
  const [prompt, setPrompt]           = useState("");
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const apiPromiseRef                 = useRef<Promise<ProjectData> | null>(null);

  const handleGenerate = (p: string) => {
    if (!p.trim()) { toast.error("Please enter a project description"); return; }
    setPrompt(p);
    apiPromiseRef.current = generateBlueprint(p.trim()) as Promise<ProjectData>;
    setView("generating");
  };

  const handleComplete = useCallback(async () => {
    try {
      const data = await (apiPromiseRef.current ?? generateBlueprint(prompt)) as ProjectData;
      apiPromiseRef.current = null;
      // Safety: ensure sections is always an array
      if (!Array.isArray(data.sections)) data.sections = [];
      setProjectData(data);
      setView("results");
    } catch (err: any) {
      apiPromiseRef.current = null;
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
            className="h-screen overflow-hidden">
            <ResultsDashboard
              data={projectData} prompt={prompt}
              onBack={() => setView("landing")}
              onRegenerate={() => { setView("generating"); apiPromiseRef.current = generateBlueprint(prompt) as Promise<ProjectData>; }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}