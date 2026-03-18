"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FileText, Brain, BarChart3, ChevronRight } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { phases } from "@/lib/constants";

// Custom Animated Icons referencing neon color #B6FF00
const AnimatedScanner = () => (
  <div className="relative w-14 h-14 flex items-center justify-center">
    <FileText className="w-8 h-8 text-[#B6FF00] z-10" />
    <motion.div
      animate={{ y: [-15, 15] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
      className="absolute w-10 h-[2px] bg-[#B6FF00] shadow-[0_0_10px_#B6FF00] z-20"
    />
    <div className="absolute inset-2 border border-[#B6FF00]/30 rounded-md animate-pulse" />
  </div>
);

const AnimatedBrainNode = () => (
  <div className="relative w-14 h-14 flex items-center justify-center">
    <Brain className="w-9 h-9 text-[#B6FF00] z-10" />
    {/* Concentric neural network pulse grids */}
    {[...Array(2)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.9, ease: "easeOut" }}
        className="absolute w-full h-full rounded-full bg-[#B6FF00]/10 border border-[#B6FF00]/40"
      />
    ))}
  </div>
);

const AnimatedAnalytics = () => (
  <div className="relative w-14 h-14 flex items-center justify-center">
    <BarChart3 className="w-8 h-8 text-[#B6FF00] z-10" />
    <div className="absolute inset-2 flex items-end justify-between gap-1 px-1">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ height: ["20%", "70%", "30%", "85%", "20%"] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          className="w-1.5 bg-[#B6FF00]/40 rounded-t-sm"
        />
      ))}
    </div>
  </div>
);

export default function Pipeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stagesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!containerRef.current) return;

    // 1. Header fade/slide
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    }

    // 2. Cascade activate stage nodes sequential illumination
    stagesRef.current.forEach((el, index) => {
      if (el) {
        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: index * 0.2,
            ease: "back.out(1.2)",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 60%",
            },
          }
        );

        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 35%",
          toggleClass: { targets: el, className: "active" },
        });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const pipelineIcons = [
    <AnimatedScanner />,
    <AnimatedBrainNode />,
    <AnimatedAnalytics />,
  ];

  return (
    <section id="features" className="py-24 px-4 bg-[#090909] relative overflow-hidden" ref={containerRef}>
      {/* Particle Overlay flowing implicit nodes */}

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 bg-transparent" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '36px 36px'
      }} />

      {/* Particle Overlay flowing implicit nodes */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            x: ["0%", "100%", "0%"],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "linear"
          }}
          className="absolute h-[1px] bg-[#B6FF00] w-20 blur-[1px] pointer-events-none"
          style={{ top: `${25 + i * 12}%`, left: "10%" }}
        />
      ))}

      <div className="relative z-10 max-w-6xl mx-auto">
        <div ref={headerRef}>
          <SectionHeader
            title={<>THE <span className="text-[#B6FF00]">PIPELINE</span></>}
            subtitle="Everything you need to go from resume upload to final offer."
          />
        </div>

        <div className="relative mt-20">
          {/* Horizontal connecting Pipeline lines overlay - Desktop only */}
          <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-white/5 -translate-y-1/2 hidden md:block z-0">
            {/* Animated drawing line on top */}
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute top-0 left-0 h-full bg-[#B6FF00] shadow-[0_0_10px_#B6FF00]" 
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
            {phases.map((phase, i) => (
              <div
                key={phase.tag}
                ref={(el) => { stagesRef.current[i] = el; }}
                className="group relative flex flex-col items-center"
              >
                {/* Connector Dot Node covering absolute track edge bounds */}
                <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center z-10 group-[.active]:scale-110 transition-transform">
                  {i > 0 && (
                    <div className="w-5 h-5 rounded-full bg-[#0D0D0D] border border-white/10 group-[.active]:border-[#B6FF00] flex items-center justify-center transition-colors duration-300">
                      <div className="w-2 h-2 rounded-full bg-white/30 group-[.active]:bg-[#B6FF00] animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Card stage Node with glassmorphism */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="w-full flex flex-col items-center bg-[#0C0C0C]/80 border border-white/5 p-8 rounded-3xl transition-all duration-500 hover:border-white/10 group-[.active]:border-[#B6FF00]/40 relative cursor-default text-center overflow-hidden"
                >
                  {/* Neon Top active edge */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-[#B6FF00] scale-x-0 group-[.active]:scale-x-100 transition-transform duration-500 origin-left shadow-[0_0_10px_#B6FF00]" />
                  <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#B6FF00]/5 group-hover:border-[#B6FF00]/20 group-[.active]:border-[#B6FF00]/40 transition-all duration-300 mb-6 relative">
                    {/* Continuous inner socket light */}
                    <div className="absolute inset-0 rounded-3xl border border-transparent group-[.active]:border-[#B6FF00]/10" />
                    {pipelineIcons[i]}
                  </div>

                  <span className="text-[11px] text-[#B6FF00] font-black uppercase tracking-widest mb-2 px-3 py-1 bg-[#B6FF00]/5 rounded-full border border-[#B6FF00]/10">
                    {phase.tag}
                  </span>
                  
                  <h3 className="text-xl font-bold font-inter text-white group-[.active]:text-[#B6FF00] transition-colors mb-4 flex flex-wrap justify-center">
                    {phase.title.split(" ").map((word, wIndex) => (
                      <div key={wIndex} className="flex overflow-hidden">
                        {word.split("").map((char, cIndex) => (
                          <motion.span
                            key={cIndex}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{
                              duration: 0.4,
                              delay: i * 0.15 + (wIndex * 0.1 + cIndex * 0.03),
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="inline-block"
                          >
                            {char}
                          </motion.span>
                        ))}
                        <span className="inline-block">&nbsp;</span>
                      </div>
                    ))}
                  </h3>

                  <ul className="space-y-3 text-left w-full mt-2">
                    {phase.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2.5 text-white/50 text-sm group-hover:text-white/70 transition-colors">
                        <ChevronRight className="w-4 h-4 text-[#B6FF00]/60 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
                
                {/* Arrow indicator right for flow on desktop list items layout */}
                {i < phases.length - 1 && (
                  <div className="absolute top-1/2 -right-6 -translate-y-1/2 hidden md:block z-20 pointer-events-none">
                    <motion.div 
                      animate={{ x: [0, 5, 0] }} 
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ChevronRight className="w-5 h-5 text-[#B6FF00]/40" />
                    </motion.div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
