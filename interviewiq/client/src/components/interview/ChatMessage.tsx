"use client";

import { motion } from "framer-motion";
import { Brain, User } from "lucide-react";

export type MessageRole = "ai" | "user";

export interface Message {
    id: number;
    role: MessageRole;
    content: string;
    timestamp: string;
}

interface ChatMessageProps {
    message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isAi = message.role === "ai";

    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex items-start gap-3 ${isAi ? "justify-start" : "justify-end flex-row-reverse"}`}
        >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-md ${
                isAi 
                    ? "bg-[#B6FF00]/10 border border-[#B6FF00]/20 text-[#B6FF00]" 
                    : "bg-white/5 border border-white/10 text-white/70"
            }`}>
                {isAi ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            <div className={`max-w-[70%] flex flex-col ${isAi ? "items-start" : "items-end"}`}>
                <div
                    className={`px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed font-normal shadow-sm ${
                        isAi
                            ? "bg-[#0C0C0C]/80 border border-white/5 text-white/90 rounded-tl-none"
                            : "bg-[#B6FF00] text-black font-semibold rounded-tr-none shadow-[0_5px_15px_-5px_rgba(182,255,0,0.3)]"
                    }`}
                >
                    {message.content}
                </div>
                <span className="text-white/20 text-[10px] mt-1 px-1 font-medium">{message.timestamp}</span>
            </div>
        </motion.div>
    );
}
