"use client";

import { Brain, Clock, ChevronRight, Square } from "lucide-react";
import { motion } from "framer-motion";

interface Round {
    id: string;
    label: string;
    done: boolean;
    active: boolean;
}

interface InterviewHeaderProps {
    elapsed: number;
    rounds: Round[];
    role?: string;
    company?: string;
    onEnd?: () => void; // called by END button
}

function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

export default function InterviewHeader({
    elapsed,
    rounds = [],
    role = "Frontend Engineer",
    company = "Google",
    onEnd,
}: InterviewHeaderProps) {
    return (
        <div className="bg-[#090909]/95 backdrop-blur-md border-b border-white/5 px-6 py-3 flex items-center justify-between z-50 relative">
            
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#B6FF00]/10 border border-[#B6FF00]/20 rounded-xl flex items-center justify-center shadow-[0_0_10px_-2px_rgba(182,255,0,0.2)]">
                    <Brain className="w-5 h-5 text-[#B6FF00]" />
                </div>
                <div>
                    <div className="font-bold text-white text-sm">Interview<span className="text-[#B6FF00]">IQ</span> — LIVE</div>
                    <div className="text-white/40 text-[11px] font-medium">{role} @ {company}</div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                
                {/* Mode Tabs (Rounds) */}
                <div className="hidden sm:flex items-center gap-1.5 bg-[#0C0C0C] border border-white/5 p-1 rounded-xl">
                    {rounds.map(r => (
                        <div
                            key={r.id}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-default ${
                                r.active
                                    ? "bg-[#B6FF00] text-black shadow-[0_4px_10px_-3px_rgba(182,255,0,0.4)]"
                                    : "bg-transparent text-white/40"
                            }`}
                        >
                            {r.label}
                        </div>
                    ))}
                </div>

                {/* Timer container offset */}
                <div className="flex items-center gap-2 bg-[#0C0C0C] border border-white/5 px-4 py-1.5 rounded-xl">
                    <motion.div
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    >
                        <Clock className="w-3.5 h-3.5 text-[#B6FF00]" />
                    </motion.div>
                    <span className="font-grotesk font-black text-white text-sm tracking-widest">{formatTime(elapsed)}</span>
                </div>

                {/* End Interview triggers */}
                <motion.button
                    onClick={onEnd}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs uppercase px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]"
                >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    End
                </motion.button>
            </div>
        </div>
    );
}