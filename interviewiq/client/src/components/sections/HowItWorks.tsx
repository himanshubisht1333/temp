"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Upload, Mic, TrendingUp } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

// Custom SVG Icons with continuous animations
const AnimatedUpload = () => (
  <div className="relative w-12 h-12 flex items-center justify-center">
    {/* Drawer line */}
    <div className="absolute bottom-2 w-10 h-2 border-2 border-b-2 border-x-2 border-t-0 border-[#C6FF00] rounded-b-sm" />
    
    {/* Arrow */}
    <motion.div
      animate={{ y: [4, -4, 4] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute flex flex-col items-center"
    >
      <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#C6FF00]" />
      <div className="w-1.5 h-6 bg-[#C6FF00]" />
    </motion.div>
    
    {/* Small dots moving up */}
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 0], y: -15 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.5,
          ease: "easeOut",
        }}
        className="absolute w-1 h-1 rounded-full bg-[#C6FF00]"
      />
    ))}
  </div>
);

const AnimatedMic = () => (
  <div className="relative w-12 h-12 flex items-center justify-center">
    <Mic className="w-8 h-8 text-[#C6FF00] z-10" />
    {/* Pulse Rings */}
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.6,
          ease: "easeOut",
        }}
        className="absolute w-6 h-6 rounded-full border border-[#C6FF00]"
      />
    ))}
  </div>
);

const AnimatedChart = () => (
  <div className="relative w-12 h-12 flex items-center justify-center">
    <TrendingUp className="w-8 h-8 text-[#C6FF00] z-10" />
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48">
      <motion.path
        d="M 8 36 L 16 26 L 24 30 L 32 18 L 40 22"
        fill="none"
        stroke="#C6FF00"
        strokeWidth="2"
        strokeDasharray="100"
        strokeDashoffset="100"
        animate={{ strokeDashoffset: [100, 0, 100] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  </div>
);

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!containerRef.current || !trackRef.current) return;

    // 1. Header fade/slide
    gsap.fromTo(
      ".how-header",
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".how-header",
          start: "top 85%",
          once: true,
        },
      }
    );

    // 2. Path Line Filler Animation
    gsap.to(trackRef.current, {
      height: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 70%",
        end: "bottom 80%",
        scrub: 2,
      },
    });

    // 2. Timeline Step Highlights
    triggerRefs.current.forEach((el) => {
      if (el) {
        ScrollTrigger.create({
          trigger: el,
          start: "top 60%",
          end: "bottom 40%",
          toggleClass: { targets: el, className: "active" },
        });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const stepsData = [
    {
      num: "01",
      title: "Upload Resume + JD",
      desc: "Paste your resume and job description. Our AI parses everything to understand exactly what the role needs.",
      icon: <AnimatedUpload />,
    },
    {
      num: "02",
      title: "AI Conducts Interview",
      desc: "A live conversational AI interviewer adapts in real-time — asking follow-ups, probing depth, raising difficulty.",
      icon: <AnimatedMic />,
    },
    {
      num: "03",
      title: "Get Actionable Feedback",
      desc: "Receive a structured performance report with scores, strengths, gaps, and a personalized improvement roadmap.",
      icon: <AnimatedChart />,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 relative overflow-hidden" ref={containerRef}>
      {/* Absolute Grid overlay */}
      <div className="absolute inset-0 z-0 bg-transparent" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Soft continuous particles floating implicitly */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -40, 0],
            x: [0, 20, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 5 + i * 2,
            repeat: Infinity,
            delay: i * 1.5,
          }}
          className="absolute w-2 h-2 rounded-full bg-[#C6FF00] blur-sm pointer-events-none"
          style={{
            top: `${20 + i * 15}%`,
            left: `${15 + (i % 2) * 70}%`,
          }}
        />
      ))}

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="how-header">
          <SectionHeader
            title={<>HOW IT <span className="text-[#C6FF00]">WORKS</span></>}
          />
        </div>

        <div className="relative max-w-3xl mx-auto mt-20">
          {/* Vertical Track Pipeline (Left side desktop layout stacked nicely) */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-[2px] bg-white/5 z-0">
            <div 
              ref={trackRef} 
              className="absolute top-0 left-0 w-full bg-[#C6FF00] h-0 shadow-[0_0_10px_rgba(198,255,0,0.4)]" 
            />
          </div>

          <div className="space-y-16 relative">
            {stepsData.map((step, i) => (
              <div
                key={step.num}
                ref={(el) => { triggerRefs.current[i] = el; }}
                className="group relative flex gap-8 pl-[3rem] md:pl-[4.5rem] items-start transition-all duration-500"
              >
                {/* Node Dot covering over pipeline */}
                <div className="absolute left-6 md:left-8 top-7 -translate-x-1/2 w-4 h-4 rounded-full bg-[#0F0F0F] border border-white/10 flex items-center justify-center z-10 group-[.active]:border-[#C6FF00] transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-[.active]:bg-[#C6FF00] animate-pulse" />
                </div>

                {/* Step Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="w-full flex flex-col md:flex-row gap-5 bg-[#0D0D0D] border border-white/5 p-6 md:p-8 rounded-3xl transition-all duration-300 hover:scale-[1.01] hover:border-[#white/10] group-[.active]:border-[#C6FF00]/40 group-[.active]:shadow-[0_0_40px_-10px_rgba(198,255,0,0.1)] relative cursor-default"
                >
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C6FF00]/5 group-hover:border-[#C6FF00]/30 group-[.active]:border-[#C6FF00]/50 transition-all duration-300">
                    {step.icon}
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="text-4xl font-inter font-black text-white/5 absolute right-6 top-4 group-[.active]:text-[#C6FF00]/5 transition-colors">
                      {step.num}
                    </div>
                    <h3 className="text-xl font-bold font-inter text-white group-[.active]:text-[#C6FF00] transition-colors mb-2 flex flex-wrap">
                      {step.title.split(" ").map((word, wIndex) => (
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
                    <p className="text-white/50 text-sm md:text-md leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
