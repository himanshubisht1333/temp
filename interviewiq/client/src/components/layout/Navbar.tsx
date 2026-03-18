"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Menu, X } from "lucide-react";

/**
 * Modern SaaS Navbar for InterviewIQ
 * High-end aesthetic inspired by Linear, Stripe, and Vercel.
 */

const navLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "For Who", href: "#targets" },
    { label: "Dashboard", href: "/dashboard" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-[72px] flex items-center ${scrolled
                    ? "bg-[#0B0B0B]/80 backdrop-blur-md border-b border-white/10 shadow-lg"
                    : "bg-transparent border-b border-transparent"
                }`}
        >
            <div className="w-full max-w-[1200px] mx-auto px-6 flex items-center justify-between">

                {/* Left: Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-[#C6FF00] rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-[0_0_15px_rgba(198,255,0,0.3)]">
                        <Brain className="w-5 h-5 text-black" />
                    </div>
                    <span className="font-inter font-bold text-xl text-white tracking-tight">
                        Interview<span className="text-white/90 font-medium">IQ</span>
                    </span>
                </Link>

                {/* Center: Navigation Links */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-[14px] font-inter font-medium text-white/50 hover:text-white transition-all duration-200 tracking-wide relative group"
                        >
                            {link.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#C6FF00] transition-all duration-200 group-hover:w-full" />
                        </Link>
                    ))}
                </div>

                {/* Right: Actions */}
                <div className="hidden md:flex items-center gap-6">
                
                    <Link
                        href="/setup"
                        className="h-10 px-5 bg-[#C6FF00] hover:bg-[#D4FF33] text-black font-inter font-semibold text-[14px] rounded-linear flex items-center justify-center transition-all duration-200 hover:scale-[1.02] hover:-translate-y-[1px] active:scale-[0.98] shadow-[0_0_20px_rgba(198,255,0,0.2)]"
                        style={{ borderRadius: '10px' }}
                    >
                        Start Free
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden text-white/70 hover:text-white p-2 transition-colors"
                >
                    {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-[72px] left-0 right-0 bg-[#0B0B0B] border-b border-white/10 px-6 py-8 md:hidden shadow-2xl"
                    >
                        <div className="flex flex-col gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="text-lg font-inter font-medium text-white/60 hover:text-[#C6FF00] transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <hr className="border-white/5 my-2" />
                            <div className="flex flex-col gap-4">
                                <Link
                                    href="/login"
                                    className="text-lg font-inter font-medium text-white/60"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/setup"
                                    className="w-full h-12 bg-[#C6FF00] text-black font-inter font-bold rounded-xl flex items-center justify-center"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Start Free
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
