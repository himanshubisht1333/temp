"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Users, GraduationCap, Building2, Shield, ArrowUpRight } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { targets } from "@/lib/constants";

// Custom Animated Icons referencing neon color #B6FF00
const AnimatedUsers = () => (
  <div className="relative w-14 h-14 flex items-center justify-center">
    <Users className="w-8 h-8 text-[#B6FF00] z-10" />
    <motion.div
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      className="absolute w-8 h-8 rounded-full bg-[#B6FF00]/20"
    />
  </div>
);

const AnimatedGraduation = () => (
  <div className="relative w-14 h-14 flex items-center justify-center">
    <motion.div
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <GraduationCap className="w-9 h-9 text-[#B6FF00] z-10" />
    </motion.div>
    <motion.div
      animate={{ scaleY: [0.8, 1.1, 0.8] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-2 w-6 h-[2px] bg-[#B6FF00]/40 blur-sm"
    />
  </div>
);

const AnimatedBuilding = () => (
  <div className="relative w-14 h-14 flex items-center justify-center">
    <Building2 className="w-8 h-8 text-[#B6FF00] z-10" />
    <motion.div
      animate={{ x: [-15, 15] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
      className="absolute w-[2px] h-8 bg-[#B6FF00] shadow-[0_0_10px_#B6FF00] z-20"
    />
    <div className="absolute inset-2 border border-[#B6FF00]/20 rounded-md animate-pulse" />
  </div>
);

const AnimatedShield = () => (
  <div className="relative w-14 h-14 flex items-center justify-center">
    <Shield className="w-8 h-8 text-[#B6FF00] z-10" />
    {[...Array(2)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
        className="absolute w-7 h-7 rounded-full border border-[#B6FF00]/40"
      />
    ))}
  </div>
);

export default function Personas() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

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

    // 2. Cascade activate cards sequential reveal
    cardsRef.current.forEach((el, index) => {
      if (el) {
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.95, y: 30 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.6,
            delay: index * 0.15,
            ease: "back.out(1.1)",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 60%",
            },
          }
        );
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const personaIcons = [
    <AnimatedUsers />,
    <AnimatedGraduation />,
    <AnimatedBuilding />,
    <AnimatedShield />,
  ];

  return (
    <section id="targets" className="py-24 px-4 bg-[#090909] relative overflow-hidden" ref={containerRef}>
      {/* Absolute Grid overlay */}
      <div className="absolute inset-0 z-0 bg-transparent" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      {/* Background Radial Neon GLow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#B6FF00]/3 rounded-full blur-[140px] pointer-events-none" />

      {/* Ambient floating Particles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: i * 1,
          }}
          className="absolute w-3 h-3 rounded-full bg-[#B6FF00]/40 blur-sm pointer-events-none"
          style={{
            top: `${30 + i * 15}%`,
            left: `${20 + (i % 2) * 60}%`,
          }}
        />
      ))}

      <div className="relative z-10 max-w-6xl mx-auto">
        <div ref={headerRef}>
          <SectionHeader
            title={<>BUILT FOR <span className="text-[#B6FF00]">YOU</span></>}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mt-16">
          {targets.map((t, i) => (
            <div
              key={t.title}
              ref={(el) => { cardsRef.current[i] = el; }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`relative flex flex-col md:flex-row items-center md:items-start gap-6 bg-[#0D0D0D]/60 backdrop-blur-xl border border-white/5 p-8 rounded-[32px] transition-all duration-500 cursor-pointer overflow-hidden ${
                hoveredIndex !== null && hoveredIndex !== i ? "opacity-40 scale-[0.98]" : "opacity-100 scale-100 border-[#B6FF00]/10"
              } hover:border-[#B6FF00]/40 hover:shadow-[0_0_50px_-15px_rgba(182,255,0,0.15)] group`}
            >
              {/* Neon Top Edge active strip */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-[#B6FF00] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left shadow-[0_0_10px_#B6FF00]" />

              <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#B6FF00]/5 group-hover:border-[#B6FF00]/20 transition-all duration-300 relative">
                {personaIcons[i]}
              </div>

              <div className="flex-1 flex flex-col justify-center text-center md:text-left">
                <div className="flex items-center justify-center md:justify-between mb-2">
                  <h3 className="text-2xl font-black font-inter text-white group-hover:text-[#B6FF00] transition-colors">
                    {t.title}
                  </h3>
                  <ArrowUpRight className="w-5 h-5 text-[#B6FF00]/40 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                
                <p className="text-white/50 text-sm md:text-md font-medium leading-relaxed group-hover:text-white/70 transition-colors">
                  {t.desc}
                </p>
                
                <div className="mt-4 flex gap-2 justify-center md:justify-start">
                  <span className="text-[10px] text-[#B6FF00] font-bold uppercase tracking-widest px-3 py-1 bg-[#B6FF00]/5 rounded-full border border-[#B6FF00]/10">
                    Learn More
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
