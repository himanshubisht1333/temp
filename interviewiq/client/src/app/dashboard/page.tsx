"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/components/layout/Navbar";
import {
    Brain, TrendingUp, Clock, Zap, Flame, BarChart3, ChevronRight, Star,
} from "lucide-react";
import { recentSessions, skills, upcomingTips } from "@/lib/constants";

// GSAP Number Counter Component
const CountUp = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        gsap.to(ref.current, {
            innerText: value,
            duration: 1.5,
            snap: { innerText: 1 },
            scrollTrigger: {
                trigger: ref.current,
                start: "top 90%",
            },
            ease: "power2.out"
        });
    }, [value]);

    return <span ref={ref}>0</span>;
};

const keyStats = [
    { label: "Total Sessions", val: 24, icon: Brain, delta: "+3 this week", suffix: "" },
    { label: "Avg Score", val: 79, icon: BarChart3, delta: "+4% vs last week", suffix: "%" },
    { label: "Current Streak", val: 5, icon: Flame, delta: "Personal best!", suffix: " Days" },
    { label: "Time Practiced", val: 18, icon: Clock, delta: "+2h this week", suffix: "h" },
];

export default function Dashboard() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
    }, []);

    return (
        <div className="min-h-screen bg-[#090909] text-white relative overflow-hidden" ref={containerRef}>
            <Navbar />

            {/* Faint Grid overlay */}
            <div className="absolute inset-0 z-0 bg-transparent" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }} />

            <div className="pt-28 pb-16 px-4 max-w-7xl mx-auto z-10 relative">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
                >
                    <div>
                        <div className="text-[#B6FF00] text-[11px] font-black uppercase tracking-widest mb-2 px-3 py-1 bg-[#B6FF00]/5 rounded-full border border-[#B6FF00]/10 inline-block">
                            Dashboard
                        </div>
                        <h1 className="text-4xl md:text-5xl font-inter font-black text-white">
                            WELCOME BACK, <span className="text-[#B6FF00]">SHIVAM</span> 👋
                        </h1>
                        <p className="text-white/50 mt-2 font-medium">You&apos;re on a 5-day streak. Keep pushing your limits!</p>
                    </div>

                    <div className="flex items-center gap-2 bg-[#0C0C0C] border border-white/5 px-5 py-3 rounded-2xl">
                        <motion.div
                            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
                        </motion.div>
                        <div>
                            <span className="text-white font-black text-xl">5</span>
                            <span className="text-white/40 text-xs font-bold uppercase ml-1">Day Streak</span>
                        </div>
                    </div>
                </motion.div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
                    {keyStats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            whileHover={{ y: -4 }}
                            className="bg-[#0C0C0C]/50 border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-[#B6FF00]/20 transition-all duration-300 cursor-default"
                        >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#B6FF00] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                            
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-white/40 text-[11px] font-black uppercase tracking-wider">{stat.label}</span>
                                <stat.icon className="w-5 h-5 text-[#B6FF00]/60 group-hover:text-[#B6FF00] transition-colors duration-300" />
                            </div>

                            <div className="text-3xl font-black text-white mb-2">
                                <CountUp value={stat.val} />
                                <span className="text-[#B6FF00]">{stat.suffix}</span>
                            </div>

                            <div className="text-[10px] text-[#B6FF00]/80 font-bold bg-[#B6FF00]/5 px-2 py-0.5 rounded-md inline-block">
                                {stat.delta}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6 md:gap-8">

                    {/* Left Col: Recent Sessions */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-2 bg-[#0A0A0A]/40 border border-white/5 p-8 rounded-[32px]"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="font-inter font-black text-xl text-white">RECENT SESSIONS</h2>
                            <Link href="/setup" className="text-xs text-[#B6FF00] font-bold flex items-center gap-1 hover:underline">
                                Start New <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        
                        <div className="space-y-4">
                            {recentSessions.map((s, i) => {
                                const scoreNum = parseInt(s.score);
                                const radius = 20;
                                const circumference = 2 * Math.PI * radius;
                                const strokeOffset = circumference - (scoreNum / 100) * circumference;

                                return (
                                    <motion.div 
                                        key={i}
                                        whileHover={{ x: 4 }}
                                        className="bg-[#0C0C0C]/80 border border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all duration-300 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Circular Score representation */}
                                            <div className="relative w-12 h-12 flex items-center justify-center">
                                                <svg className="absolute w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                                                    <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                                                    <motion.circle 
                                                        cx="24" cy="24" r={radius} 
                                                        fill="none" stroke="#B6FF00" strokeWidth="3" 
                                                        strokeDasharray={circumference}
                                                        initial={{ strokeDashoffset: circumference }}
                                                        whileInView={{ strokeDashoffset: strokeOffset }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
                                                    />
                                                </svg>
                                                <span className="font-black text-xs text-white">{s.score}</span>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-sm text-white group-hover:text-[#B6FF00] transition-colors">{s.role}</h4>
                                                <div className="text-white/40 text-xs mt-1 flex items-center gap-2">
                                                    <span>{s.date}</span>
                                                    <span>•</span>
                                                    <span className="text-[#B6FF00]/80">AI Rated</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex gap-1">
                                                {[...Array(3)].map((_, starI) => (
                                                    <Star key={starI} className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                ))}
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#B6FF00] group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Right Col */}
                    <div className="space-y-6 md:space-y-8">

                        {/* Quick Start Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-[#0C0C0C]/80 border border-white/5 p-7 rounded-[32px] relative group overflow-hidden"
                        >
                            <motion.div 
                                className="absolute bottom-[-10px] right-[-10px] opacity-10 group-hover:opacity-20 transition-opacity"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                                <Brain className="w-40 h-40 text-[#B6FF00]" />
                            </motion.div>

                            <h3 className="font-inter font-black text-lg text-white mb-2">QUICK START</h3>
                            <p className="text-white/50 text-xs mb-6">Upload resume and configure realistic follow-ups.</p>
                            
                            <Link
                                href="/setup"
                                className="bg-[#B6FF00] text-black font-bold border-none px-6 py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.98] transition-all text-sm uppercase shadow-[0_0_20px_-5px_rgba(182,255,0,0.3)] w-full"
                            >
                                <Zap className="w-4 h-4 fill-black" /> Start Now
                            </Link>
                        </motion.div>

                        {/* Skill Breakdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-[#0C0C0C]/80 border border-white/5 p-7 rounded-[32px]"
                        >
                            <h3 className="font-inter font-black text-md text-white mb-6 uppercase tracking-wider">SKILL BREAKDOWN</h3>
                            <div className="space-y-5">
                                {skills.map((skill, i) => {
                                    const percentage = parseInt(skill.score);
                                    let label = "Needs Work";
                                    let labelColor = "text-red-400 bg-red-400/10";
                                    if (percentage >= 80) { label = "Strong"; labelColor = "text-[#B6FF00] bg-[#B6FF00]/10"; }
                                    else if (percentage >= 60) { label = "Average"; labelColor = "text-yellow-400 bg-yellow-400/10"; }

                                    return (
                                        <div key={skill.name}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-xs font-bold text-white/80">{skill.name}</span>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${labelColor}`}>
                                                    {label}
                                                </span >
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${skill.score}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                                                    className="h-full bg-[#B6FF00] rounded-full"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* AI Tips section */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-[#0C0C0C]/80 border border-[#B6FF00]/10 p-7 rounded-[32px] relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#B6FF00]" />
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-4 h-4 text-[#B6FF00]" />
                                <h3 className="font-inter font-black text-md text-white uppercase tracking-wider">AI TIPS</h3>
                            </div>
                            
                            <ul className="space-y-3">
                                {upcomingTips.map((tip, i) => (
                                    <motion.li 
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex gap-2 text-xs text-white/60 leading-relaxed items-start"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#B6FF00] mt-1.5 animate-pulse flex-shrink-0" />
                                        <span>{tip}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                    </div>
                </div>
            </div>
        </div>
    );
}
