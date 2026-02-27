"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import InterviewHeader from "@/components/interview/InterviewHeader";
import ChatMessage, { type Message } from "@/components/interview/ChatMessage";
import TypingIndicator from "@/components/interview/TypingIndicator";
import {
    Mic, MicOff, Camera, CameraOff, Volume2, AlertCircle, CheckCircle2, Square, Loader2
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
        <div className="h-screen bg-dark flex flex-col overflow-hidden">
            <InterviewHeader elapsed={elapsed} rounds={rounds} onEnd={handleEndSession} />

            <div className="flex overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>

                {/* ── LEFT: Chat ─────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 min-h-0">
                        <AnimatePresence initial={false}>
                            {messages.map(msg => (
                                <ChatMessage key={msg.id} message={msg} />
                            ))}
                        </AnimatePresence>

                        <AnimatePresence>
                            {isAiTyping && <TypingIndicator />}
                        </AnimatePresence>

                        {/* Waiting state */}
                        {status === "waiting" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-48 gap-3"
                            >
                                <motion.div
                                    className="w-8 h-8 rounded-full border-2 border-lime border-t-transparent"
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                                />
                                <p className="text-white/40 text-sm">
                                    Waiting for questions to be ready…
                                </p>
                            </motion.div>
                        )}

                        {/* Complete state */}
                        {status === "complete" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 bg-lime/10 border border-lime/30 text-lime px-4 py-3 rounded text-sm mx-2"
                            >
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                Interview complete. Great job!
                            </motion.div>
                        )}

                        {/* Error state */}
                        {status === "error" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded text-sm mx-2"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {statusText}
                            </motion.div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* ── Bottom bar ───────────────────────────────────── */}
                    <div className="border-t border-dark-300 bg-dark-200 px-4 py-3 flex items-center gap-3">

                        {/* Status dot */}
                        <motion.div
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                isListening  ? "bg-lime" :
                                isAiTyping   ? "bg-blue-400" :
                                evaluating   ? "bg-yellow-400" :
                                status === "complete" ? "bg-lime" :
                                status === "error"    ? "bg-red-400" :
                                "bg-white/20"
                            }`}
                            animate={isListening || isAiTyping || evaluating ? { opacity: [1, 0.3, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 1 }}
                        />

                        {/* Status text / live transcript */}
                        <span className="flex-1 text-sm text-white/50 truncate">
                            {isListening && liveTranscript
                                ? <span className="text-white/80 italic">"{liveTranscript}"</span>
                                : statusText
                            }
                        </span>

                        {/* Mic button — hidden when evaluating or done */}
                        {!evaluating && !interviewDone && (
                            <button
                                onClick={toggleMic}
                                disabled={status !== "active"}
                                className={`flex items-center gap-2 px-4 py-2 border-2 font-bold text-sm uppercase transition-all ${
                                    isListening
                                        ? "bg-red-500 border-red-500 text-white"
                                        : status === "active"
                                        ? "bg-lime border-lime text-dark hover:opacity-80"
                                        : "bg-dark-300 border-dark-300 text-white/20 cursor-not-allowed"
                                }`}
                            >
                                {isListening
                                    ? <><MicOff className="w-4 h-4" /> Stop</>
                                    : <><Mic    className="w-4 h-4" /> Speak</>
                                }
                            </button>
                        )}

                        {/* END INTERVIEW button — always visible when active */}
                        {status === "active" && !evaluating && (
                            <button
                                onClick={handleEndSession}
                                className="flex items-center gap-2 px-4 py-2 border-2 border-red-500 bg-red-500/10 text-red-400 font-bold text-sm uppercase hover:bg-red-500 hover:text-white transition-all"
                            >
                                <Square className="w-4 h-4 fill-current" />
                                End Interview
                            </button>
                        )}

                        {/* Evaluating spinner */}
                        {evaluating && (
                            <div className="flex items-center gap-2 px-4 py-2 border-2 border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm font-bold uppercase">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analysing…
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Sidebar + Camera ────────────────────────────── */}
                <div className="w-72 border-l border-dark-300 flex flex-col bg-dark-100 overflow-hidden shrink-0">

                    {/* Camera preview */}
                    <div className="relative bg-black border-b border-dark-300" style={{ height: "180px", flexShrink: 0 }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className={`w-full h-full object-cover ${isCameraOn ? "opacity-100" : "opacity-0"}`}
                        />

                        {/* Placeholder when camera off */}
                        {!isCameraOn && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-dark-200">
                                <CameraOff className="w-8 h-8 text-white/20" />
                                <span className="text-white/30 text-xs">Camera off</span>
                            </div>
                        )}

                        {/* Corner label */}
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white/70 font-mono">
                            YOU
                        </div>

                        {/* Recording dot */}
                        {isCameraOn && (
                            <motion.div
                                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"
                                animate={{ opacity: [1, 0.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            />
                        )}

                        {/* Camera + Audio controls */}
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                            <button
                                onClick={toggleCamera}
                                className={`p-1.5 rounded-full border transition-all text-xs ${
                                    isCameraOn
                                        ? "bg-dark/70 border-white/20 text-white hover:border-white/50"
                                        : "bg-red-500/80 border-red-500 text-white"
                                }`}
                                title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                            >
                                {isCameraOn ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
                            </button>

                            <button
                                className="p-1.5 rounded-full border bg-dark/70 border-white/20 text-white hover:border-white/50 transition-all"
                                title="Speaker (always on)"
                            >
                                <Volume2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* AI interviewer avatar placeholder */}
                    <div className="relative bg-gradient-to-br from-dark-300 to-dark-200 border-b border-dark-300 flex flex-col items-center justify-center py-5 gap-2">
                        <div className="w-14 h-14 rounded-full bg-lime/10 border-2 border-lime/30 flex items-center justify-center">
                            <span className="text-2xl">🤖</span>
                        </div>
                        <span className="text-white/60 text-xs font-mono">AI INTERVIEWER</span>
                        {isAiTyping && (
                            <motion.span
                                className="text-lime text-xs"
                                animate={{ opacity: [1, 0.4, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                            >
                                speaking…
                            </motion.span>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}