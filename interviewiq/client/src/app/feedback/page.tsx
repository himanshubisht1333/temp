"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ScoreRing from "@/components/ui/ScoreRing";
import ScoreBar from "@/components/ui/ScoreBar";
import TranscriptItem from "@/components/ui/TranscriptItem";
import Tabs from "@/components/ui/Tabs";
import {
    Download, RotateCcw, ArrowRight, CheckCircle, XCircle,
    Brain, Star, Target, Zap, TrendingUp, TrendingDown, Lightbulb
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ScoreCategory { label: string; score: number; desc: string; }
interface SkillGap       { skill: string; gap: string; how_to_improve: string; }
interface TranscriptEntry { q: string; a: string; score: number; feedback: string; }

interface Evaluation {
    overall_score:    number;
    verdict:          string;
    summary:          string;
    duration_minutes: number;
    score_categories: ScoreCategory[];
    strengths:        string[];
    improvements:     string[];
    skill_gaps:       SkillGap[];
    transcript:       TranscriptEntry[];
}

const feedbackTabs = [
    { id: "overview",   label: "📊 Overview"   },
    { id: "skills",     label: "🎯 Skill Gaps"  },
    { id: "transcript", label: "📝 Transcript"  },
];

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
    return (
        <motion.div
            className={`bg-dark-300 rounded ${className}`}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
        />
    );
}

export default function FeedbackPage() {
    const [evaluation, setEvaluation]   = useState<Evaluation | null>(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState("");
    const [openQ, setOpenQ]             = useState<number | null>(null);
    const [activeTab, setActiveTab]     = useState("overview");

    // ── Fetch evaluation from backend ─────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        const fetchEvaluation = async () => {
            // Retry up to 20 times (40 seconds) in case evaluation is still running
            for (let attempt = 0; attempt < 20; attempt++) {
                if (cancelled) return;
                try {
                    const res  = await fetch("http://127.0.0.1:5000/feedback-data");
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();

                    if (data.ready && data.evaluation) {
                        if (!cancelled) {
                            setEvaluation(data.evaluation);
                            setLoading(false);
                        }
                        return;
                    }
                } catch (err) {
                    if (attempt === 0) {
                        // First attempt failed — likely backend not running
                        if (!cancelled) {
                            setError("Could not connect to backend. Is it running on port 5000?");
                            setLoading(false);
                        }
                        return;
                    }
                }
                // Wait 2s between retries
                await new Promise(r => setTimeout(r, 2000));
            }

            // All retries exhausted
            if (!cancelled) {
                setError("Evaluation is taking too long. Please try again.");
                setLoading(false);
            }
        };

        fetchEvaluation();
        return () => { cancelled = true; };
    }, []);

    const overallScore = evaluation?.overall_score ?? 0;

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-dark flex flex-col items-center justify-center gap-6">
                <motion.div
                    className="w-10 h-10 rounded-full border-2 border-lime border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                />
                <p className="text-white/50 text-sm">Analysing your interview performance…</p>
                <div className="space-y-3 w-full max-w-md px-8">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                </div>
            </div>
        );
    }

    // ── Error state ───────────────────────────────────────────────────────────
    if (error || !evaluation) {
        return (
            <div className="min-h-screen bg-dark flex flex-col items-center justify-center gap-4">
                <XCircle className="w-10 h-10 text-red-400" />
                <p className="text-white/60 text-sm">{error || "No evaluation data found."}</p>
                <Link href="/setup" className="brutal-btn-primary px-6 py-3 text-sm">
                    Start New Interview
                </Link>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-dark">

            {/* Top Bar */}
            <div className="bg-dark border-b-3 border-lime px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-lime border-3 border-dark flex items-center justify-center">
                        <Brain className="w-4 h-4 text-dark" />
                    </div>
                    <span className="font-grotesk font-black text-white text-sm">
                        Interview<span className="text-lime">IQ</span> — FEEDBACK REPORT
                    </span>
                </div>
                <div className="flex gap-3">
                    <button className="brutal-btn-outline text-xs px-4 py-2 flex items-center gap-1">
                        <Download className="w-3 h-3" /> Export PDF
                    </button>
                    <Link href="/setup" className="brutal-btn-primary text-xs px-4 py-2 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> New Session
                    </Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-10">

                {/* Hero Score */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border-3 border-lime shadow-brutal p-8 mb-8 flex flex-col md:flex-row items-center gap-8"
                >
                    <ScoreRing score={overallScore} />

                    <div className="flex-1 text-center md:text-left">
                        <div className="brutal-tag inline-block mb-3">Session Complete</div>
                        <h1 className="text-3xl md:text-5xl font-grotesk font-black text-white mb-2">
                            {evaluation.verdict}
                        </h1>
                        <p className="text-white/50 text-sm mb-3">{evaluation.summary}</p>
                        <p className="text-white/30 text-xs mb-4">
                            {evaluation.duration_minutes} minutes · {evaluation.transcript.length} questions
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <span className="flex items-center gap-1 text-lime text-sm font-grotesk font-bold border-2 border-lime px-3 py-1">
                                <Star className="w-3 h-3 fill-lime" />
                                {overallScore >= 85 ? "Above Average" : overallScore >= 70 ? "Average" : "Below Average"}
                            </span>
                            <span className="flex items-center gap-1 text-white/60 text-sm font-grotesk border-2 border-dark-300 px-3 py-1">
                                <Target className="w-3 h-3" /> {evaluation.transcript.length} Questions Asked
                            </span>
                        </div>
                    </div>

                    {/* Score pills */}
                    <div className="grid grid-cols-2 gap-3 shrink-0">
                        {evaluation.score_categories.map(cat => (
                            <div key={cat.label} className="bg-dark border-3 border-dark-200 p-3 text-center min-w-[90px]">
                                <div className={`text-2xl font-grotesk font-black ${
                                    cat.score >= 80 ? "text-lime" :
                                    cat.score >= 70 ? "text-yellow-400" : "text-red-400"
                                }`}>
                                    {cat.score}
                                </div>
                                <div className="text-white/40 text-[10px] font-grotesk leading-tight mt-1">
                                    {cat.label.split(" ")[0]}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Tabs */}
                <Tabs tabs={feedbackTabs} activeTab={activeTab} onChange={setActiveTab} />

                {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
                {activeTab === "overview" && (
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="font-grotesk font-black text-white text-xl mb-5">SCORE BREAKDOWN</h2>
                            {evaluation.score_categories.map((cat, i) => (
                                <motion.div
                                    key={cat.label}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <ScoreBar label={cat.label} score={cat.score} description={cat.desc} />
                                </motion.div>
                            ))}
                        </div>

                        <div className="space-y-5">
                            {/* Strengths */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-card border-3 border-lime shadow-brutal p-6"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp className="w-5 h-5 text-lime" />
                                    <h3 className="font-grotesk font-black text-white text-lg">STRENGTHS</h3>
                                </div>
                                <ul className="space-y-3">
                                    {evaluation.strengths.map((s, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-white/70 leading-relaxed">
                                            <CheckCircle className="w-4 h-4 text-lime shrink-0 mt-0.5" />
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Improvements */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="bg-card border-3 border-white shadow-brutal-white p-6"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingDown className="w-5 h-5 text-red-400" />
                                    <h3 className="font-grotesk font-black text-white text-lg">IMPROVE</h3>
                                </div>
                                <ul className="space-y-3">
                                    {evaluation.improvements.map((s, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-white/70 leading-relaxed">
                                            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-lime border-3 border-dark shadow-brutal-dark p-6 text-center"
                            >
                                <Zap className="w-8 h-8 text-dark mx-auto mb-3" />
                                <h3 className="font-grotesk font-black text-dark text-lg mb-2">READY FOR ROUND 2?</h3>
                                <p className="text-dark/60 text-xs mb-4">Practice the areas you struggled with</p>
                                <Link
                                    href="/setup"
                                    className="bg-dark text-lime font-grotesk font-black border-3 border-dark px-5 py-3 flex items-center justify-center gap-2 text-sm hover:bg-dark/80 transition-colors"
                                >
                                    Practice Again <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* ── SKILL GAPS TAB ───────────────────────────────────────── */}
                {activeTab === "skills" && (
                    <div className="space-y-4">
                        <h2 className="font-grotesk font-black text-white text-xl mb-5">SKILL GAP ANALYSIS</h2>
                        <p className="text-white/40 text-sm mb-6">
                            Based on your interview answers, here's exactly what's missing and how to close each gap.
                        </p>
                        <div className="grid md:grid-cols-2 gap-5">
                            {evaluation.skill_gaps.map((gap, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-card border-3 border-dark-300 p-6 space-y-4"
                                >
                                    {/* Skill header */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                                        <h3 className="font-grotesk font-black text-white text-base">
                                            {gap.skill}
                                        </h3>
                                    </div>

                                    {/* What was missing */}
                                    <div>
                                        <p className="text-white/30 text-[10px] font-grotesk uppercase tracking-widest mb-1">
                                            What was missing
                                        </p>
                                        <p className="text-white/70 text-sm leading-relaxed">
                                            {gap.gap}
                                        </p>
                                    </div>

                                    {/* How to improve */}
                                    <div className="bg-lime/5 border border-lime/20 p-3 flex gap-3">
                                        <Lightbulb className="w-4 h-4 text-lime shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-white/30 text-[10px] font-grotesk uppercase tracking-widest mb-1">
                                                How to improve
                                            </p>
                                            <p className="text-lime/80 text-sm leading-relaxed">
                                                {gap.how_to_improve}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── TRANSCRIPT TAB ───────────────────────────────────────── */}
                {activeTab === "transcript" && (
                    <div className="space-y-4">
                        <h2 className="font-grotesk font-black text-white text-xl mb-5">INTERVIEW TRANSCRIPT</h2>
                        {evaluation.transcript.map((item, i) => (
                            <TranscriptItem
                                key={i}
                                question={item.q}
                                answer={item.a}
                                score={item.score}
                                index={i}
                                isOpen={openQ === i}
                                onToggle={() => setOpenQ(openQ === i ? null : i)}
                            />
                        ))}
                    </div>
                )}

                {/* Bottom Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                    <Link href="/dashboard" className="brutal-btn-outline px-8 py-4 flex items-center gap-2 justify-center">
                        ← Back to Dashboard
                    </Link>
                    <Link href="/setup" className="brutal-btn-primary px-8 py-4 flex items-center gap-2 justify-center">
                        <Zap className="w-5 h-5" /> New Interview
                    </Link>
                </div>
            </div>
        </div>
    );
}