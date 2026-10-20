"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { Component, type ReactNode } from "react";
import { HeroSceneFallback } from "./hero-fallback";

const HeroScene = dynamic(() => import("./hero-scene").then((module) => module.HeroScene), {
  ssr: false,
  loading: () => <HeroSceneFallback />,
});

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return <HeroSceneFallback />;
    }
    return this.props.children;
  }
}

export function HeroVisual() {
  const reduced = useReducedMotion();

  return (
    <div className="relative mx-auto aspect-[1.03] w-full max-w-[34rem] lg:max-w-none">
      <div className="absolute inset-x-4 top-10 bottom-10 rounded-[48%] bg-[radial-gradient(circle_at_50%_48%,rgba(109,91,246,0.22),rgba(244,201,93,0.13)_42%,transparent_70%)] blur-2xl" aria-hidden="true" />
      <div className="absolute inset-0 overflow-hidden rounded-[2.4rem] border border-white/60 bg-[linear-gradient(150deg,#f5efff_0%,#fffaf0_56%,#fff4f6_100%)] shadow-[0_40px_100px_-42px_rgba(45,34,92,0.45)]">
        <div className="absolute inset-0 opacity-[0.28] [background-image:radial-gradient(#8f7be8_0.8px,transparent_0.8px)] [background-size:22px_22px]" aria-hidden="true" />
        <div className="absolute -right-16 -top-20 size-64 rounded-full border border-violet/10" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-12 size-56 rounded-full border border-coral/10" aria-hidden="true" />
        <SceneBoundary><HeroScene /></SceneBoundary>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#fff8ee]/70 to-transparent" aria-hidden="true" />
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: -3 }}
        transition={{ delay: 0.65, duration: 0.65, ease: [0.2, 0.7, 0.2, 1] }}
        className="absolute -right-2 top-[15%] flex items-center gap-2 rounded-2xl border border-white/80 bg-white/88 px-3 py-2.5 shadow-[0_20px_50px_-22px_rgba(50,38,105,0.45)] backdrop-blur sm:-right-4"
      >
        <span className="flex size-8 items-center justify-center rounded-xl bg-mint-soft text-[#157a5b]">
          <CheckCircle2 className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[0.62rem] font-bold text-ink">گزارش امروز ثبت شد</p>
          <p className="mt-0.5 text-[0.54rem] text-muted">۲ ساعت و ۱۰ دقیقه مطالعه</p>
        </div>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: -14, rotate: 2 }}
        animate={{ opacity: 1, y: 0, rotate: 2 }}
        transition={{ delay: 0.85, duration: 0.65, ease: [0.2, 0.7, 0.2, 1] }}
        className="absolute -left-2 bottom-[17%] w-40 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-[0_20px_50px_-22px_rgba(50,38,105,0.45)] backdrop-blur sm:-left-5"
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[0.57rem] font-bold text-ink">
            <TrendingUp className="size-3 text-[#157a5b]" aria-hidden="true" />
            میانگین این ماه
          </span>
          <span className="rounded-full bg-mint-soft px-1.5 py-0.5 text-[0.5rem] font-bold text-[#157a5b]">+۴٪</span>
        </div>
        <p className="num mt-2 text-xl font-extrabold text-ink">۱۸٫۲۵<span className="mr-1 text-[0.55rem] font-medium text-muted">از ۲۰</span></p>
        <div className="mt-2 flex h-7 items-end gap-1" aria-hidden="true">
          {[38, 52, 45, 66, 58, 82, 74, 92].map((height, index) => (
            <span
              key={index}
              className={cn("flex-1 rounded-t-[3px]", index === 7 ? "bg-violet" : "bg-violet/25")}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </motion.div>

      <motion.span
        initial={reduced ? false : { opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.05, duration: 0.45 }}
        className="absolute left-[12%] top-[13%] inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold-soft/90 px-2.5 py-1 text-[0.55rem] font-bold text-[#7c5c12]"
      >
        <Sparkles className="size-3" aria-hidden="true" />
        یک صفحهٔ تازه
      </motion.span>
    </div>
  );
}
