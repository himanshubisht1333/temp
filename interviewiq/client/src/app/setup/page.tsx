"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Brain, Zap, ChevronDown, CheckCircle2, AlertCircle, FileText, Upload, Settings, Users, ArrowRight, ArrowLeft } from "lucide-react";
import { roles } from "@/lib/roles";

// AI processing stages framing node string structure
const processingStages = [
  "Parsing resume structure...",
  "Detecting core skills & gaps...",
  "Mapping candidate profile to job data...",
  "Generating personalized interview plan..."
];

export default function SetupPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [roleId, setRoleId] = useState("");
    const [difficulty, setDifficulty] = useState("medium"); // Step 3 config item
    
    // AI Processing states Simulation trigger framing
    const [aiProcessing, setAiProcessing] = useState(false);
    const [processStageIndex, setProcessStageIndex] = useState(0);

    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const canProceedStep1 = resumeFile !== null;
    const canProceedStep2 = roleId !== "";

    // Simulate AI parsing after CV uploaded
    useEffect(() => {
        if (aiProcessing) {
            const interval = setInterval(() => {
                setProcessStageIndex((prev) => {
                    if (prev < processingStages.length - 1) return prev + 1;
                    clearInterval(interval);
                    setAiProcessing(false);
                    setCurrentStep(2); // Auto proceed to step 2 after parsing simulation
                    return 0;
                });
            }, 1200);
            return () => clearInterval(interval);
        }
    }, [aiProcessing]);

    const handleResumeUpload = (file: File | null) => {
        setResumeFile(file);
        if (file) {
            // Trigger local AI simulation
            setAiProcessing(true);
            setProcessStageIndex(0);
        }
    };

    const handleSubmit = async () => {
        if (!resumeFile || !roleId) return;

        setError("");

        const selectedRole = roles.find(r => r.id === roleId);
        if (!selectedRole) {
            setError("Invalid role selected.");
            return;
        }

        try {
            setLoading(true);

            // Stage 1: Upload CV + generate questions
            setLoadingStage("Uploading resume & analysing with AI…");
            const formData = new FormData();
            formData.append("file", resumeFile);
            formData.append("role_id", selectedRole.id);
            formData.append("prompt", selectedRole.promptTemplate);
            formData.append("difficulty", difficulty); // extra config

            const response = await fetch("http://127.0.0.1:5000/cv", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Something went wrong. Please try again.");
                return;
            }

            // Stage 2: Poll until backend confirms questions are ready
            setLoadingStage(`Generated ${data.question_count} questions. Preparing interview…`);

            let ready = false;
            for (let i = 0; i < 15; i++) {
                await new Promise(r => setTimeout(r, 800));
                const statusRes = await fetch("http://127.0.0.1:5000/questions-status");
                const statusData = await statusRes.json();
                if (statusData.ready) { ready = true; break; }
            }

            if (!ready) {
                setError("Interview setup timed out. Please try again.");
                return;
            }

            router.push("/interview");

        } catch (err) {
            console.error("Submission error:", err);
            setError("Network error. Is the backend running on port 5000?");
        } finally {
            setLoading(false);
            setLoadingStage("");
        }
    };

    const steps = [
        { num: 1, title: "Upload Resume", icon: FileText },
        { num: 2, title: "Target Role", icon: Users },
        { num: 3, title: "AI Config", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-[#090909] text-white relative overflow-hidden flex flex-col">
            <Navbar />

            {/* Faint Grid Background Overlay */}
            <div className="absolute inset-0 z-0 bg-transparent" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)',
                backgroundSize: '36px 36px'
            }} />

            {/* Main setup container frame */}
            <div className="pt-28 pb-16 px-4 max-w-2xl mx-auto flex-1 flex flex-col items-center justify-center w-full z-10">
                
                {/* Visual Progress Indicator */}
                <div className="w-full mb-12 relative flex items-center justify-between">
                    {/* Background track line linear layout */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2 z-0" />
                    
                    {/* Active filling overlay with framer node trigger coordination */}
                    <motion.div 
                        animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="absolute top-1/2 left-0 h-0.5 bg-[#B6FF00] shadow-[0_0_10px_#B6FF00] -translate-y-1/2 z-0"
                    />

                    {steps.map((s, i) => {
                        const isActive = currentStep === s.num;
                        const isCompleted = currentStep > s.num;
                        const Icon = s.icon;

                        return (
                            <div key={s.num} className="flex flex-col items-center z-10">
                                <motion.div
                                    animate={{
                                        borderColor: isActive || isCompleted ? "#B6FF00" : "rgba(255,255,255,0.05)",
                                        backgroundColor: isCompleted ? "#B6FF00" : "#0C0C0C",
                                        scale: isActive ? 1.1 : 1,
                                    }}
                                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-[#000000]" />
                                    ) : (
                                        <Icon className={`w-4 h-4 ${isActive ? "text-[#B6FF00]" : "text-white/30"}`} />
                                    )}
                                </motion.div>
                                <span className={`text-[10px] mt-2 font-black uppercase tracking-widest ${isActive ? "text-[#B6FF00]" : "text-white/30"} hidden sm:block`}>
                                    {s.title}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Setup Body Card Wrapper */}
                <AnimatePresence mode="wait">
                    {aiProcessing ? (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-[#0C0C0C]/80 border border-[#B6FF00]/20 p-12 rounded-[32px] w-full text-center flex flex-col items-center justify-center relative overflow-hidden"
                        >
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#B6FF00] flex items-center justify-center animate-spin mb-6">
                                <Brain className="w-8 h-8 text-[#B6FF00] animate-pulse" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">AI Analyzing Resume...</h2>
                            <p className="text-[#B6FF00] text-sm font-medium animate-pulse">
                                {processingStages[processStageIndex]}
                            </p>
                        </motion.div>
                    ) : currentStep === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-[#0C0C0C]/50 border border-white/5 p-8 rounded-[32px] w-full relative group transition-all duration-500 hover:border-[#B6FF00]/10"
                        >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#B6FF00] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left shadow-[0_0_10px_#B6FF00]" />
                            
                            <h2 className="text-2xl font-black mb-1">UPLOAD RESUME</h2>
                            <p className="text-white/40 text-sm mb-6">Let AI parse your structure dynamically.</p>

                            {resumeFile ? (
                                <div className="border border-[#B6FF00]/30 bg-[#B6FF00]/5 p-5 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#B6FF00]/10 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-[#B6FF00]" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">{resumeFile.name}</div>
                                            <div className="text-white/40 text-xs">{(resumeFile.size / 1024).toFixed(1)} KB</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setResumeFile(null)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                                        <Zap className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];
                                        if (file?.type === "application/pdf") handleResumeUpload(file);
                                    }}
                                    className="border border-dashed border-white/10 hover:border-[#B6FF00]/40 rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center hover:bg-[#B6FF00]/5 group"
                                >
                                    <Upload className="w-10 h-10 text-white/30 group-hover:text-[#B6FF00] mb-3 transition-colors duration-300" />
                                    <p className="font-bold text-white mb-1">Drag & drop your resume</p>
                                    <p className="text-white/40 text-xs mb-4">PDF format only</p>
                                    <label className="text-xs bg-[#090909] border border-white/10 hover:border-[#B6FF00]/30 text-white px-5 py-2 rounded-xl transition-all cursor-pointer">
                                        Browse Files
                                        <input type="file" accept=".pdf" className="hidden" onChange={e => handleResumeUpload(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                            )}
                        </motion.div>
                    ) : currentStep === 2 ? (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-[#0C0C0C]/50 border border-white/5 p-8 rounded-[32px] w-full"
                        >
                            <h2 className="text-2xl font-black mb-1">TARGET ROLE</h2>
                            <p className="text-white/40 text-sm mb-6">Select the ideal engineering criteria profile layout.</p>

                            <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto mb-6 pr-2">
                                {roles.map((r) => (
                                    <div
                                        key={r.id}
                                        onClick={() => setRoleId(r.id)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                            roleId === r.id ? "bg-[#B6FF00]/10 border-[#B6FF00]/30 text-[#B6FF00]" : "bg-[#090909] border-white/5 hover:border-white/10 text-white/60"
                                        }`}
                                    >
                                        <span className="font-bold text-sm">{r.name}</span>
                                        {roleId === r.id && <CheckCircle2 className="w-4 h-4 text-[#B6FF00]" />}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between mt-6">
                                <button onClick={() => setCurrentStep(1)} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <button 
                                    onClick={() => setCurrentStep(3)} 
                                    disabled={!canProceedStep2}
                                    className={`flex items-center gap-2 text-sm px-6 py-2.5 rounded-xl font-bold transition-all ${
                                        canProceedStep2 ? "bg-[#B6FF00] text-black hover:scale-105" : "bg-white/5 text-white/20 cursor-not-allowed"
                                    }`}
                                >
                                    Proceed <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-[#0C0C0C]/50 border border-white/5 p-8 rounded-[32px] w-full"
                        >
                            <h2 className="text-2xl font-black mb-1">AI CONFIGURATION</h2>
                            <p className="text-white/40 text-sm mb-6">Update follow-up prompts difficulty levels.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-white/50 block mb-2 uppercase tracking-widest font-bold">Interview Difficulty</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["easy", "medium", "hard"].map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => setDifficulty(d)}
                                                className={`py-3 rounded-xl border font-bold text-xs uppercase transition-all ${
                                                    difficulty === d ? "bg-[#B6FF00]/10 border-[#B6FF00]/30 text-[#B6FF00]" : "bg-[#090909] border-white/5 text-white/40"
                                                }`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}

                            {loading && loadingStage && (
                                <div className="mt-4 flex items-center gap-2 bg-[#B6FF00]/10 border border-[#B6FF00]/20 text-[#B6FF00] p-3 rounded-xl text-xs">
                                    <div className="w-3 h-3 rounded-full border border-[#B6FF00] border-t-transparent animate-spin" />
                                    {loadingStage}
                                </div>
                            )}

                            <div className="flex justify-between mt-8">
                                <button onClick={() => setCurrentStep(2)} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </button>
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-[#B6FF00] text-black px-8 py-3 rounded-xl font-black text-sm hover:scale-105 transition-all shadow-[0_0_20px_-5px_rgba(182,255,0,0.3)]"
                                >
                                    {loading ? "Readying..." : "Launch Interview"} <Zap className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
            </div>
        </div>
    );
}