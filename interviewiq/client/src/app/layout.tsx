import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InterviewIQ -AI-Powered Mock Interview Platform",
  description: "Ace your next interview with autonomous AI-powered mock interviews tailored to your resume, target role, and experience level.",
  keywords: ["AI interview", "mock interview", "interview prep", "career"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-inter antialiased`}>
        {children}
      </body>
    </html>
  );
}
