"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import InterviewHeader from "@/components/interview/InterviewHeader";
import ChatMessage, { type Message } from "@/components/interview/ChatMessage";
import TypingIndicator from "@/components/interview/TypingIndicator";
import {
    Mic, MicOff, Camera, CameraOff, Volume2, AlertCircle, CheckCircle2, Square, Loader2, Brain
} from "lucide-react";

const rounds = [
    { id: "behavioral", label: "Behavioral", done: false, active: true },
    { id: "technical",  label: "Technical",  done: false, active: false },
    { id: "system",     label: "System Design", done: false, active: false },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type InterviewStatus = "waiting" | "starting" | "active" | "complete" | "error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any;

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionType;
        webkitSpeechRecognition: SpeechRecognitionType;
    }
}

export default function InterviewPage() {
    // ── State ─────────────────────────────────────────────────────────────────
    const [messages, setMessages]         = useState<Message[]>([]);
    const [isAiTyping, setIsAiTyping]     = useState(false);
    const [elapsed, setElapsed]           = useState(0);
    const [status, setStatus]             = useState<InterviewStatus>("waiting");
    const [statusText, setStatusText]     = useState("Waiting for interview to be ready…");
    const [isMicOn, setIsMicOn]           = useState(false);
    const [isCameraOn, setIsCameraOn]     = useState(true);
    const [isListening, setIsListening]   = useState(false);
    const [liveTranscript, setLiveTranscript] = useState("");
    const [interviewDone, setInterviewDone]   = useState(false);
    const [evaluating, setEvaluating]         = useState(false);
    const router = useRouter();

    // ── Refs ──────────────────────────────────────────────────────────────────
    const bottomRef       = useRef<HTMLDivElement>(null);
    const videoRef        = useRef<HTMLVideoElement>(null);
    const streamRef       = useRef<MediaStream | null>(null);
    const recognitionRef  = useRef<SpeechRecognitionType | null>(null);
    const silenceTimer    = useRef<NodeJS.Timeout | null>(null);
    const finalTranscript = useRef("");
    const pollRef         = useRef<NodeJS.Timeout | null>(null);
    const hasStartedRef   = useRef(false);   // prevents poll from firing startInterview twice
    const isDoneRef       = useRef(false);   // ref mirror of interviewDone for use inside callbacks

    // ── Auto-scroll ───────────────────────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isAiTyping]);

    // ── Timer ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (status !== "active") return;
        const t = setInterval(() => setElapsed(p => p + 1), 1000);
        return () => clearInterval(t);
    }, [status]);

    // ── Camera ────────────────────────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch { /* camera denied — show placeholder */ }
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    }, []);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);

    const toggleCamera = () => {
        if (isCameraOn) { stopCamera(); setIsCameraOn(false); }
        else            { startCamera(); setIsCameraOn(true); }
    };

    // ── Speech synthesis ──────────────────────────────────────────────────────
    const speak = useCallback((text: string, onEnd?: () => void) => {
        speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate  = 0.95;
        utt.pitch = 1;
        utt.onend = () => onEnd?.();
        speechSynthesis.speak(utt);
    }, []);

    // ── Add message helper ────────────────────────────────────────────────────
    const addMessage = useCallback((role: "ai" | "user", content: string) => {
        setMessages(prev => [
            ...prev,
            {
                id: Date.now(),
                role,
                content,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
        ]);
    }, []);

    // ── Send answer to backend ────────────────────────────────────────────────
    const sendAnswer = useCallback(async (answer: string) => {
        if (!answer.trim()) return;
        addMessage("user", answer);
        setIsAiTyping(true);
        setStatusText("Gemini is thinking…");

        try {
            const res  = await fetch("http://127.0.0.1:5000/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answer }),
            });
            const data = await res.json();

            setIsAiTyping(false);
            addMessage("ai", data.reply);

            if (data.completed) {
                // ── Kill everything FIRST before any async ops ──
                isDoneRef.current = true;
                // Stop mic immediately so onend doesn't fire sendAnswer again
                if (recognitionRef.current) {
                    recognitionRef.current.onend = null;  // detach handler before stopping
                    recognitionRef.current.onresult = null;
                    recognitionRef.current.stop();
                    recognitionRef.current = null;
                }
                if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
                if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
                setInterviewDone(true);
                setIsListening(false);
                setIsMicOn(false);
                setStatus("complete");
                setStatusText("Interview complete!");

                // Speak closing words then evaluate
                speak(data.reply, async () => {
                    setEvaluating(true);
                    setStatusText("Analysing your performance… please wait.");
                    try {
                        const evalRes = await fetch("http://127.0.0.1:5000/evaluate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                        });
                        const evalData = await evalRes.json();
                        if (evalData.status === "ok") {
                            setEvaluating(false);
                            router.push("/feedback");
                        } else {
                            setEvaluating(false);
                            setStatusText("Evaluation failed: " + (evalData.error || "Unknown error"));
                        }
                    } catch {
                        setEvaluating(false);
                        setStatusText("Could not reach backend for evaluation.");
                    }
                });
                return;
            }

            speak(data.reply, () => {
                setStatusText("Your turn — speak your answer.");
                startListening();
            });
        } catch {
            setIsAiTyping(false);
            setStatusText("Connection error. Please check backend.");
        }
    }, [addMessage, speak]);

    // ── Speech recognition ────────────────────────────────────────────────────
    const startListening = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { setStatusText("Speech recognition not supported in this browser."); return; }

        const rec = new SR();
        rec.lang = "en-US";
        rec.continuous = true;
        rec.interimResults = true;
        finalTranscript.current = "";
        recognitionRef.current = rec;

        rec.onstart = () => {
            setIsListening(true);
            setIsMicOn(true);
            setStatusText("Listening…");
        };

        rec.onresult = (event: any) => {
            if (silenceTimer.current) clearTimeout(silenceTimer.current);
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript.current += event.results[i][0].transcript + " ";
                } else {
                    interim = event.results[i][0].transcript;
                }
            }
            setLiveTranscript((finalTranscript.current + interim).trim());
            silenceTimer.current = setTimeout(() => {
                if (finalTranscript.current.trim()) rec.stop();
            }, 2500);
        };

        rec.onend = () => {
            setIsListening(false);
            setIsMicOn(false);
            setLiveTranscript("");
            if (isDoneRef.current) return; // interview ended — do nothing
            const answer = finalTranscript.current.trim();
            if (answer) sendAnswer(answer);
            else setStatusText("Nothing detected — speak again.");
        };

        rec.onerror = (e: any) => {
            setIsListening(false);
            setIsMicOn(false);
            setStatusText(`Mic error: ${e.error}. Click mic to retry.`);
        };

        rec.start();
    }, [sendAnswer, interviewDone]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null; // prevent onend from firing sendAnswer
            recognitionRef.current.stop();
        }
    }, []);

    const toggleMic = () => {
        if (isListening) stopListening();
        else             startListening();
    };

    // ── Poll /questions-status then auto-start ─────────────────────────────
    const startInterview = useCallback(async () => {
        setStatus("starting");
        setStatusText("Starting interview…");

        try {
            const res  = await fetch("http://127.0.0.1:5000/start", { method: "POST" });
            const data = await res.json();

            if (data.error) {
                setStatus("error");
                setStatusText(data.error);
                return;
            }

            setStatus("active");
            addMessage("ai", data.reply);
            speak(data.reply, () => {
                setStatusText("Your turn — speak your answer.");
                startListening();
            });
        } catch {
            setStatus("error");
            setStatusText("Could not connect to backend on port 5000.");
        }
    }, [addMessage, speak, startListening]);

    useEffect(() => {
        const poll = async () => {
            if (hasStartedRef.current || isDoneRef.current) return; // hard guards
            try {
                const res  = await fetch("http://127.0.0.1:5000/questions-status");
                const data = await res.json();
                if (data.ready && !hasStartedRef.current && !isDoneRef.current) {
                    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
                    startInterview();
                }
            } catch { /* backend not up yet */ }
        };

        poll();
        pollRef.current = setInterval(poll, 3000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [startInterview]);

    // ── Manual end session (END & GET FEEDBACK button) ───────────────────────
    const handleEndSession = useCallback(async () => {
        if (isDoneRef.current) return; // already ending — ref check avoids stale state
        isDoneRef.current = true;
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

        speechSynthesis.cancel();
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.onresult = null;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }

        setInterviewDone(true);
        setStatus("complete");
        setEvaluating(true);
        setStatusText("Analysing your performance… please wait.");

        try {
            const evalRes = await fetch("http://127.0.0.1:5000/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const evalData = await evalRes.json();
            if (evalData.status === "ok") {
                setEvaluating(false);
                router.push("/feedback");
            } else {
                setEvaluating(false);
                setStatusText("Evaluation failed: " + (evalData.error || "Unknown error"));
            }
        } catch {
            setEvaluating(false);
            setStatusText("Could not reach backend for evaluation.");
        }
    }, [router]);

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="h-screen bg-[#090909] text-white flex flex-col overflow-hidden relative">
            {/* Faint Grid Background Overlay */}
            <div className="absolute inset-0 z-0 bg-transparent" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }} />

            <InterviewHeader elapsed={elapsed} rounds={rounds} onEnd={handleEndSession} />

            <div className="flex-1 flex overflow-hidden z-10 relative">

                {/* ── LEFT side: Conversational Chat Interface ─────────────────── */}
                <div className="flex-1 flex flex-col bg-[#0C0C0C]/50 border-r border-white/5 overflow-hidden">
                    
                    {/* Chat Messages scroll area */}
                    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 min-h-0">
                        <AnimatePresence initial={false}>
                            {messages.map(msg => (
                                <ChatMessage key={msg.id} message={msg} />
                            ))}
                        </AnimatePresence>

                        <AnimatePresence>
                            {isAiTyping && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 text-white/40 text-xs font-semibold px-2 animate-pulse"
                                >
                                    <div className="w-4 h-4 rounded-full border border-dashed border-[#B6FF00] animate-spin" />
                                    AI is analyzing your response...
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Waiting state overlay */}
                        {status === "waiting" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full gap-4"
                            >
                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#B6FF00] flex items-center justify-center animate-spin">
                                    <Brain className="w-6 h-6 text-[#B6FF00] animate-pulse" />
                                </div>
                                <p className="text-white/40 text-xs font-black uppercase tracking-widest">
                                    Configuring setup parameters...
                                </p>
                            </motion.div>
                        )}

                        {/* Complete state */}
                        {status === "complete" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 bg-[#B6FF00]/10 border border-[#B6FF00]/20 text-[#B6FF00] px-4 py-3 rounded-2xl text-xs font-bold font-inter mx-auto max-w-sm"
                            >
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                Interview complete. Great job!
                            </motion.div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* ── Bottom Response Controls ───────────────────────────── */}
                    <div className="border-t border-white/5 bg-[#0C0C0C]/80 px-6 py-4 flex items-center justify-between gap-4 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            {/* Status dot tracking pulses */}
                            <motion.div
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                    isListening  ? "bg-[#B6FF00] shadow-[0_0_8px_#B6FF00]" :
                                    isAiTyping   ? "bg-blue-400" :
                                    evaluating   ? "bg-yellow-400" :
                                    status === "complete" ? "bg-[#B6FF00]" :
                                    "bg-white/20"
                                }`}
                                animate={isListening || isAiTyping || evaluating ? { opacity: [1, 0.4, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1 }}
                            />
                            
                            {/* Status Text / Waveform overlay when speaking */}
                            {isListening ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5 h-3.5 items-center">
                                        {[...Array(4)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: ["3px", "14px", "3px"] }}
                                                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                                                className="w-0.5 bg-[#B6FF00] rounded-full"
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[#B6FF00] text-xs font-bold leading-none italic truncate max-w-[200px] md:max-w-md">
                                        {liveTranscript ? `"${liveTranscript}"` : "Listening..."}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-white/40 text-xs font-medium truncate max-w-[200px] md:max-w-md">
                                    {statusText}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Speak Button triggers overlays offsets cleanly */}
                            {!evaluating && !interviewDone && (
                                <motion.button
                                    onClick={toggleMic}
                                    disabled={status !== "active"}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase transition-all shadow-md ${
                                        isListening
                                            ? "bg-red-500 text-white shadow-[0_0_15px_-5px_rgba(239,68,68,0.4)]"
                                            : status === "active"
                                            ? "bg-[#B6FF00] text-black hover:scale-105 shadow-[0_4px_15px_-5px_rgba(182,255,0,0.4)]"
                                            : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                                    }`}
                                >
                                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                    <span>{isListening ? "Stop" : "Speak"}</span>
                                </motion.button>
                            )}

                            {/* Evaluating state spinner triggers */}
                            {evaluating && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-black uppercase rounded-xl">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Analysing…</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT side: AI Interviewer Panel + Camera Preview ────────── */}
                <div className="w-80 flex flex-col bg-[#090909] overflow-hidden shrink-0 border-l border-white/5">

                    {/* AI Avatar Pane */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8 border-b border-white/5 relative">
                        {/* Glowing ring overlays triggers offsets cleanly for speak states */}
                        <motion.div
                            className={`w-28 h-28 rounded-full border-2 flex items-center justify-center relative ${
                                isAiTyping ? "border-[#B6FF00]" : "border-white/10"
                            }`}
                            animate={isAiTyping ? { boxShadow: ["0 0 0px #B6FF00", "0 0 20px #B6FF00", "0 0 0px #B6FF00"] } : {}}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <div className={`w-22 h-22 rounded-full flex items-center justify-center bg-[#0C0C0C] ${isAiTyping ? "scale-95" : "scale-100"} transition-all duration-300`}>
                                <Brain className={`w-10 h-10 ${isAiTyping ? "text-[#B6FF00] animate-pulse" : "text-white/20"}`} />
                            </div>

                            {/* Continuous circular rings pulsating surrounding setup */}
                            {isAiTyping && (
                                <motion.div 
                                    className="absolute inset-0 rounded-full border border-[#B6FF00] opacity-50"
                                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                            )}
                        </motion.div>

                        <span className="text-white font-black text-xs mt-4 tracking-widest uppercase">AI Interviewer</span>
                        <span className="text-white/40 text-[10px] uppercase font-bold mt-1">Status: {isAiTyping ? <span className="text-[#B6FF00] animate-pulse">Speaking...</span> : "Listening"}</span>
                    </div>

                    {/* User Camera Preview bottom node offset */}
                    <div className="relative bg-black border-t border-white/5" style={{ height: "180px" }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraOn ? "opacity-100" : "opacity-0"}`}
                        />

                        {!isCameraOn && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[#0C0C0C]">
                                <CameraOff className="w-6 h-6 text-white/20" />
                                <span className="text-white/30 text-[10px] font-bold uppercase">Camera Off</span>
                            </div>
                        )}

                        {/* Top corner user tag labelling node */}
                        <div className="absolute top-3 left-3 bg-[#090909]/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white/50 font-black tracking-widest border border-white/5">
                            CANDIDATE
                        </div>

                        {/* Top corner recording dot tracks coordinate offsets cleanly */}
                        {isCameraOn && (
                            <motion.div
                                className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ repeat: Infinity, duration: 1.2 }}
                            />
                        )}

                        {/* Camera absolute control triggers layout overlays seamlessly */}
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 px-3">
                            <motion.button
                                onClick={toggleCamera}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`p-1.5 rounded-lg border transition-all ${
                                    isCameraOn
                                        ? "bg-black/60 border-white/10 text-white/70 hover:text-white"
                                        : "bg-red-500 text-white border-none shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                                }`}
                                title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                            >
                                {isCameraOn ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
                            </motion.button>

                            <button
                                className="p-1.5 rounded-full border bg-black/60 border-white/10 text-white/40 cursor-default"
                                title="Speaker always on"
                            >
                                <Volume2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}