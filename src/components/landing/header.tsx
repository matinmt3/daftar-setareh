"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { cn } from "@/lib/cn";

const links = [
  { href: "#features", label: "امکانات" },
  { href: "#how", label: "چطور کار می‌کند" },
  { href: "#cards", label: "کارنامه‌ها" },
  { href: "#questions", label: "پرسش‌ها" },
];

export function LandingHeader({ loggedIn }: { loggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 18);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-line/70 bg-cream/88 py-2 backdrop-blur-xl" : "py-4",
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand href="/" />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="ناوبری اصلی">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-xs font-medium text-ink-soft transition-colors hover:bg-white/70 hover:text-violet-deep"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          {loggedIn ? (
            <Link href="/app" className="btn btn-primary text-xs">
              برگشت به دفتر
            </Link>
          ) : (
            <>
              <Link href="/auth" className="btn btn-ghost text-xs">
                ورود
              </Link>
              <Link href="/auth" className="btn btn-primary text-xs">
                شروع رایگان
              </Link>
            </>
          )}
        </div>
        <button
          ref={menuButton}
          type="button"
          className="flex size-10 items-center justify-center rounded-xl border border-line bg-white/70 text-ink lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          aria-label={open ? "بستن منو" : "باز کردن منو"}
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </div>
      {open ? (
        <div id="landing-mobile-menu" className="mx-4 mt-3 rounded-2xl border border-line bg-cream p-3 shadow-xl lg:hidden">
          <nav className="grid" aria-label="ناوبری موبایل">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <Link href={loggedIn ? "/app" : "/auth"} className="btn btn-primary mt-2 w-full text-xs">
            {loggedIn ? "برگشت به دفتر" : "شروع رایگان"}
          </Link>
        </div>
      ) : null}
    </header>
  );
}
