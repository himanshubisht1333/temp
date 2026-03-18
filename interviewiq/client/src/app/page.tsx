"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Marquee from "@/components/ui/Marquee";
import SectionHeader from "@/components/ui/SectionHeader";
import HowItWorks from "@/components/sections/HowItWorks";
import Pipeline from "@/components/sections/Pipeline";
import Personas from "@/components/sections/Personas";
import GridBackground from "@/components/ui/GridBackground";
import PhaseCard from "@/components/ui/PhaseCard";
import StepCard from "@/components/ui/StepCard";
import TargetCard from "@/components/ui/TargetCard";
import TestimonialCard from "@/components/ui/TestimonialCard";
import {
  Zap, Target, CheckCircle, Clock, Shield,
  FileText, Mic, BarChart3, ArrowRight, Play,
  Sparkles, MessageSquare, Video, Brain
} from "lucide-react";
import {
  marqueeItems, marqueeItemsReverse,
  phases, steps, stats, targets, testimonials,
} from "@/lib/constants";

// ─── Sub-components for Hero ───

// ─── Sub-components for Hero ───

function FloatingCard({ icon, label, sub, className = "", delay = 0, mouseX, mouseY, factorX = 15, factorY = 15 }: { 
  icon: React.ReactNode, 
  label: string, 
  sub: string, 
  className?: string, 
  delay?: number,
  mouseX: any,
  mouseY: any,
  factorX?: number,
  factorY?: number
}) {
  const x = useTransform(mouseX, [-1, 1], [-factorX, factorX]);
  const y = useTransform(mouseY, [-1, 1], [-factorY, factorY]);

  return (
    <motion.div
      style={{ x, y }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 + delay }}
      className={`flex items-center gap-3 px-5 py-4 bg-[#141414]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.8)] ${className} group hover:border-[#C6FF00]/30 transition-colors duration-300`}
    >
      <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#C6FF00]/20 group-hover:bg-[#C6FF00]/5 transition-all">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-white font-inter font-bold text-sm tracking-tight group-hover:text-[#C6FF00] transition-colors">{label}</span>
        <span className="text-white/40 font-inter text-[11px] uppercase tracking-wider mt-0.5">{sub}</span>
      </div>
    </motion.div>
  );
}

function HeroMockup() {
  return (
    <div className="w-full aspect-[16/10] bg-[#090909] flex flex-col relative">
      {/* Browser Decoration */}
      <div className="h-11 border-b border-white/5 flex items-center px-5 gap-2 bg-[#0F0F0F]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/20" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-600/20" />
          <div className="w-3 h-3 rounded-full bg-green-500/80 border border-green-600/20" />
        </div>
        <div className="ml-4 h-6 px-4 rounded-full bg-white/5 flex items-center transition-all border border-white/5 cursor-default hover:bg-white/10">
           <span className="text-[10px] text-white/40 font-inter uppercase tracking-[0.2em] font-medium">interview-iq.ai/session-live</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden p-8 md:p-12 relative">
        {/* Subtle radial glow inside mockup */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(198,255,0,0.03),transparent_70%)] pointer-events-none" />

        {/* Mock AI Interview Interface */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-14 h-14 rounded-2xl bg-[#C6FF00]/10 border border-[#C6FF00]/20 flex items-center justify-center shadow-[0_0_20px_rgba(198,255,0,0.15)]"
            >
              <Sparkles className="w-7 h-7 text-[#C6FF00]" />
            </motion.div>
            <div>
              <motion.div 
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[11px] text-[#C6FF00] font-black uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#C6FF00]" />
                AI Interviewer Active
              </motion.div>
              <div className="h-3 w-40 bg-white/10 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Recording</span>
          </div>
        </div>

        <div className="flex-1 flex gap-8">
          {/* Chat Bubble Simulation */}
          <div className="flex-1 space-y-6">
             <motion.div 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.8 }}
               className="max-w-[85%] bg-white/5 border border-white/5 p-5 rounded-2xl rounded-tl-none shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] flex gap-3 items-start"
             >
                <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-full bg-white/10 rounded-full" />
                  <div className="h-2.5 w-[85%] bg-white/10 rounded-full" />
                  <div className="h-2.5 w-[40%] bg-white/10 rounded-full" />
                </div>
             </motion.div>

             <motion.div 
               initial={{ opacity: 0, x: 10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 1.4 }}
               className="max-w-[75%] bg-[#C6FF00]/5 border border-[#C6FF00]/10 p-5 rounded-2xl rounded-tr-none ml-auto shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] flex gap-3 items-start justify-end"
             >
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-full bg-[#C6FF00]/20 rounded-full ml-auto" />
                  <div className="h-2.5 w-[60%] bg-[#C6FF00]/20 rounded-full ml-auto" />
                </div>
                <div className="w-6 h-6 rounded-full bg-[#C6FF00]/20 flex-shrink-0" />
             </motion.div>

             {/* Typing indicator */}
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 2 }}
               className="flex items-center gap-1.5 max-w-[85%] bg-white/5 border border-white/5 px-4 py-3 rounded-full w-max"
             >
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-white/40" />
             </motion.div>
          </div>
          
          {/* Visual Feedback Mockup */}
          <div className="w-56 flex flex-col gap-5">
             <div className="aspect-square rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center justify-center p-6 relative group hover:border-[#C6FF00]/20 transition-all duration-300 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                {/* Glowing ring */}
                <div className="absolute inset-4 rounded-full border-2 border-white/5 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-[#C6FF00]/30 border-t-transparent animate-spin [animation-duration:3s]" />
                  <div className="text-4xl font-black text-white font-inter">84</div>
                </div>
                <div className="absolute bottom-4 text-[10px] text-white/40 uppercase font-bold tracking-widest mt-1">Confidence</div>
             </div>
             
             <div className="flex-1 rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden flex items-end justify-center gap-1.5 p-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                
                {/* Audio Visualizer Wave */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: ["15%", "65%", "25%", "85%", "15%"],
                    }}
                    transition={{
                      duration: 1.5 + i * 0.1,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut",
                    }}
                    className="w-2.5 bg-[#C6FF00] rounded-full opacity-60 hover:opacity-100 transition-opacity"
                  />
                ))}
                
                <div className="absolute bottom-3 text-center w-full">
                  <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Live Feedback</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InteractiveHeroVisual() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for tilt
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  const rotateX = useTransform(springY, [-1, 1], [12, -12]);
  const rotateY = useTransform(springX, [-1, 1], [-12, 12]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Normalize to -1 to 1
    mouseX.set(x / (rect.width / 2));
    mouseY.set(y / (rect.height / 2));
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div 
      className="relative mt-20 max-w-[1000px] mx-auto"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "2000px" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative z-10 w-full rounded-[32px] border border-white/5 bg-[#0D0D0D] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] cursor-pointer group"
      >
        {/* Continuous soft glow following mouse on top of wrapper */}
        <motion.div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: useTransform(
              [springX, springY],
              ([x, y]) => `radial-gradient(circle at ${(x as number + 1) * 50}% ${(y as number + 1) * 50}%, rgba(198,255,0,0.08), transparent 50%)`
            )
          }}
        />
        <HeroMockup />
      </motion.div>

      {/* Floating Cards (Orbits) with Parallax */}
      <FloatingCard 
        icon={<FileText className="w-5 h-5 text-[#C6FF00]" />}
        label="Resume Analysis" 
        sub="Tailored questions"
        className="absolute -top-12 -left-12 z-20 pointer-events-none xl:-left-16"
        delay={0}
        mouseX={springX}
        mouseY={springY}
        factorX={20}
        factorY={20}
      />
      
      <FloatingCard 
        icon={<Mic className="w-5 h-5 text-lime-400" />}
        label="Live AI Interaction" 
        sub="Adaptive follow-ups"
        className="absolute -bottom-10 -right-6 z-20 pointer-events-none xl:-right-12"
        delay={0.8}
        mouseX={springX}
        mouseY={springY}
        factorX={-25}
        factorY={-25}
      />
      
      <FloatingCard 
        icon={<BarChart3 className="w-5 h-5 text-white/80" />}
        label="Instant Evaluation" 
        sub="Technical depth metrics"
        className="absolute top-1/2 -right-20 -translate-y-1/2 z-20 hidden lg:flex pointer-events-none xl:-right-32"
        delay={1.5}
        mouseX={springX}
        mouseY={springY}
        factorX={15}
        factorY={0}
      />
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <Navbar />

      {/* ───── HERO SECTION ───── */}
      <section className="relative min-h-screen pt-20 flex flex-col items-center justify-center overflow-hidden">
        {/* Clean Background Grid */}
        <div className="absolute inset-0 z-0">
          <GridBackground cellSize={40} lineOpacity={0.03} className="h-full w-full" />
        </div>

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 text-center pt-24 pb-32">
          

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(2.5rem,8vw,6rem)] font-inter font-extrabold text-white leading-[0.95] tracking-tight mb-8"
          >
            CRACK ANY TECHNICAL <br />
            <span className="text-[#C6FF00]">INTERVIEW.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[600px] mx-auto text-lg md:text-xl text-white/50 font-inter font-medium leading-relaxed mb-12"
          >
            Experience simulated, high-stakes sessions that adapt to your specific resume and target role. No generic questions, just real practice.
          </motion.p>

          {/* CTA Group */}
          <div className="flex flex-col items-center gap-6 mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <Link
                href="/setup"
                className="h-14 px-8 bg-[#C6FF00] hover:bg-[#D4FF33] text-black font-inter font-bold text-[16px] rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-[0_0_40px_rgba(198,255,0,0.2)] group"
              >
                Start Free Interview
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#how-it-works"
                className="h-14 px-8 bg-white/5 hover:bg-white/10 text-white font-inter font-semibold text-[16px] border border-white/5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 backdrop-blur-md"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                See How It Works
              </Link>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-6 text-white/20 text-xs font-bold uppercase tracking-widest"
            >
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#C6FF00]" /> No Signup</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#C6FF00]" /> 2 Min Setup</span>
            </motion.div>
          </div>

          {/* Hero Visual: Product Preview with Perspective */}
          <InteractiveHeroVisual />

        
        </div>
      </section>

      {/* ───── MARQUEE ───── */}
      <div className="border-y border-white/5 bg-transparent overflow-hidden py-4">
        <Marquee
          items={marqueeItems}
          itemClassName="text-white/20 font-inter font-bold text-xs uppercase tracking-[0.3em]"
        />
      </div>



      {/* ───── HOW IT WORKS ───── */}
      <HowItWorks />

      {/* ───── FEATURES (PIPELINE) ───── */}
      <Pipeline />

      {/* ───── REVERSE MARQUEE ───── */}
      <div className="border-y border-white/5 bg-transparent overflow-hidden py-4">
        <Marquee
          items={marqueeItemsReverse}
          reverse
          itemClassName="text-white/10 font-inter font-medium text-xs uppercase tracking-[0.3em]"
        />
      </div>

      {/* ───── TARGET AUDIENCES ───── */}
      <Personas />



      <Footer />
    </div>
  );
}