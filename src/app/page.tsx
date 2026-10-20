import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  GraduationCap,
  Heart,
  NotebookPen,
  Printer,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { APP_NAME } from "@/lib/constants";
import { HOME_TITLE, HOME_DESCRIPTION, publicMetadata } from "@/lib/seo";
import { getSiteOrigin } from "@/lib/seo-server";
import { FAQS, PRODUCT_FEATURES, PRODUCT_SUMMARY, homeStructuredData } from "@/lib/public-content";
import { PublicLinks, StructuredData } from "@/components/public-discovery";
import { Brand, BrandMark } from "@/components/brand";
import { LandingHeader } from "@/components/landing/header";
import { HeroVisual } from "@/components/landing/hero-visual";
import { Reveal } from "@/components/landing/reveal";
import { SubjectIcon } from "@/components/subject-icon";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return publicMetadata({ path: "/", title: HOME_TITLE, description: HOME_DESCRIPTION }, await getSiteOrigin());
}

const features = [
  {
    icon: NotebookPen,
    title: "گزارش روزانه در دو دقیقه",
    text: "مطالعه، کارها، حال روحی و نکته‌های امروز را ساده ثبت کن؛ دفتر خودش جمع‌بندی می‌کند.",
    tone: "coral",
  },
  {
    icon: GraduationCap,
    title: "آزمون‌ها و نمره‌ها",
    text: "هر آزمون را با درس، وزن و نمره ثبت کن تا میانگین‌ها و روند پیشرفت دقیق ساخته شوند.",
    tone: "violet",
  },
  {
    icon: CalendarDays,
    title: "برنامهٔ مطالعهٔ تکرارشونده",
    text: "جلسه‌های هفتگی را یک‌بار بساز؛ دفتر آن‌ها را برای روزهای پیش رو می‌چیند.",
    tone: "sky",
  },
  {
    icon: Target,
    title: "هدف‌های قابل اندازه‌گیری",
    text: "هدف مطالعه، تکمیل کارها یا نمرهٔ درس؛ پیشرفت را زنده و شفاف ببین.",
    tone: "gold",
  },
  {
    icon: BarChart3,
    title: "تحلیل واقعی، نه حدس",
    text: "نمودار ساعت مطالعه، میانگین درس‌ها و تغییرات هفتگی و ماهانه در یک نگاه.",
    tone: "mint",
  },
];

const steps = [
  {
    number: "۰۱",
    title: "با شماره‌ات وارد شو",
    text: "یک کد کوتاه، بدون رمز و بدون فرم طولانی. اولین صفحهٔ دفترت همان‌جاست.",
    icon: Sparkles,
  },
  {
    number: "۰۲",
    title: "دفترت را بچین",
    text: "پایهٔ تحصیلی، رشته و درس‌هایت را انتخاب کن؛ می‌توانی بعداً هر چیزی را عوض کنی.",
    icon: BookOpen,
  },
  {
    number: "۰۳",
    title: "هر روز یک صفحه",
    text: "گزارش کوتاه بنویس، جلسه‌ها را تیک بزن و بگذار کارنامه‌ها خودشان ساخته شوند.",
    icon: Star,
  },
];

const questions = FAQS;

export default async function LandingPage() {
  const [user, origin] = await Promise.all([getCurrentUser(), getSiteOrigin()]);
  const loggedIn = Boolean(user);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-paper text-ink">
      <StructuredData value={homeStructuredData(origin)} />
      <LandingHeader loggedIn={loggedIn} />

      <section className="relative pb-10 pt-28 sm:pt-32 lg:pb-20 lg:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute -right-24 top-16 size-[30rem] rounded-full bg-[radial-gradient(circle,rgba(109,91,246,0.14),transparent_68%)] blur-2xl" />
          <div className="absolute -left-28 top-72 size-[26rem] rounded-full bg-[radial-gradient(circle,rgba(242,116,139,0.12),transparent_68%)] blur-2xl" />
          <div className="paper-grid absolute inset-x-0 top-0 h-[46rem] opacity-45 [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
          <svg className="absolute right-[46%] top-24 hidden size-24 text-gold/25 lg:block" viewBox="0 0 100 100" fill="none">
            <path d="M50 4 59 34 91 36 66 56 75 87 50 68 25 87 34 56 9 36 41 34 50 4Z" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.04fr_1fr] lg:gap-8">
          <div className="relative z-10 max-w-2xl">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft/80 py-1.5 pl-3 pr-2 text-[0.7rem] font-semibold text-violet-deep">
                <span className="flex size-6 items-center justify-center rounded-full bg-white">
                  <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
                </span>
                دفتر برنامه‌ریزی هوشمند دانش‌آموز
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-6 font-display text-[2.8rem] leading-[1.24] tracking-tight text-ink sm:text-[3.7rem] lg:text-[4.15rem]">
                هر روز یک صفحه،
                <br />
                هر هفته یک <span className="relative inline-block text-violet-deep">کارنامه
                  <svg className="pointer-events-none absolute -bottom-2 left-0 h-3 w-full text-coral/70" viewBox="0 0 220 14" fill="none" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M3 10C54 3 150 3 217 8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-lg text-[0.95rem] leading-8 text-ink-soft sm:text-base">
                دفتر ستاره جای دفتر کاغذی و فایل‌های پراکنده است؛ گزارش‌های روزانه، آزمون‌ها،
                برنامهٔ مطالعه و پیشرفتت را کنار هم نگه می‌دارد و از دل آن‌ها کارنامهٔ
                خودکار می‌سازد.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={loggedIn ? "/app" : "/auth"} className="btn btn-primary group px-5 text-sm">
                  {loggedIn ? "برگشت به دفتر من" : "دفترم را باز کن"}
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                </Link>
                <a href="#cards" className="btn btn-secondary text-sm">
                  <Sparkles className="size-4 text-gold" aria-hidden="true" />
                  یک کارنامه ببین
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.68rem] text-muted">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-mint" aria-hidden="true" />
                  ورود سریع با موبایل
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-mint" aria-hidden="true" />
                  بدون تبلیغ
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-mint" aria-hidden="true" />
                  حساب دموی آماده
                </span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12} y={26}>
            <HeroVisual />
            <p className="mt-3 text-center text-[0.65rem] text-ink-soft">تصویر نمونهٔ محیط برنامه؛ عددها نمایشی‌اند.</p>
          </Reveal>
        </div>

        <Reveal delay={0.42}>
          <div className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6 lg:mt-20">
            <div className="grid divide-y divide-line rounded-2xl border border-line bg-cream/60 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
              {[
                ["۲ دقیقه", "برای ثبت گزارش روزانه"],
                ["۷ روز", "برای ساختن اولین کارنامه"],
                ["همهٔ درس‌ها", "در یک نمای روشن"],
                ["همیشه", "در دسترس و قابل چاپ"],
              ].map(([value, label], index) => (
                <div key={value} className={`px-5 py-4 sm:text-center ${index > 0 ? "sm:border-r sm:border-line" : ""}`}>
                  <p className="font-display text-xl text-ink">{value}</p>
                  <p className="mt-1 text-[0.65rem] text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section id="features" className="relative scroll-mt-24 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-eyebrow">همه‌چیز در یک دفتر</p>
              <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
                ساده مثل نوشتن، دقیق مثل یک تحلیل
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                هر بخش برای یک کار ساخته شده و همه با هم یک تصویر کامل از روزهای درسی‌ات می‌سازند.
              </p>
              <p className="mt-2 text-xs leading-7 text-ink-soft">کارت‌های زیر نمونهٔ نمایش ابزارها هستند و اطلاعات یک حساب واقعی را نشان نمی‌دهند.</p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-12">
            <Reveal className="md:col-span-7" delay={0.04}>
              <article className="card noise-overlay flex h-full flex-col overflow-hidden p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-coral-soft text-[#c73554]">
                      <NotebookPen className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-lg font-bold">صفحهٔ امروز</h3>
                    <p className="mt-2 max-w-sm text-xs leading-6 text-muted">
                      مطالعه، کارها، حالت و یک نکتهٔ کوچک. گزارش کوتاه است، اما هفتهٔ تو را می‌سازد.
                    </p>
                  </div>
                  <span className="rounded-full bg-mint-soft px-2.5 py-1 text-[0.6rem] font-bold text-[#157a5b]">
                    ثبت شد
                  </span>
                </div>
                <div className="mt-5 grid gap-3 rounded-2xl border border-line bg-[#fffdf8] p-3.5 sm:grid-cols-[1.1fr_1fr]">
                  <div className="rounded-xl bg-violet-soft/70 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[0.62rem] text-violet-deep">مطالعهٔ امروز</p>
                      <Clock3 className="size-3.5 text-violet-deep" aria-hidden="true" />
                    </div>
                    <p className="num mt-2 text-2xl font-extrabold text-ink">۲:۱۰</p>
                    <div className="mt-3 flex h-1.5 items-end gap-1">
                      {[50, 76, 62, 94, 70, 84, 100].map((height, index) => (
                        <span key={index} className={`flex-1 rounded-full ${index === 6 ? "bg-violet" : "bg-violet/20"}`} style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      ["حل تمرین ریاضی", true],
                      ["مرور فصل زیست", true],
                      ["خواندن متن انگلیسی", false],
                    ].map(([task, done]) => (
                      <div key={String(task)} className="flex items-center gap-2 rounded-xl border border-line/70 bg-white px-2.5 py-2">
                        <span className={`flex size-4 items-center justify-center rounded-full ${done ? "bg-mint text-white" : "border border-[#d5cbbc] text-transparent"}`}>
                          <Check className="size-2.5" aria-hidden="true" />
                        </span>
                        <span className={`text-[0.62rem] ${done ? "text-muted line-through" : "text-ink-soft"}`}>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  {["آرام", "متمرکز", "هدف فردا: ۹۰ دقیقه"].map((chip) => (
                    <span key={chip} className="chip bg-paper-deep/60 text-[0.6rem] text-ink-soft">{chip}</span>
                  ))}
                </div>
              </article>
            </Reveal>

            <Reveal className="md:col-span-5" delay={0.1}>
              <article className="relative flex h-full min-h-[21rem] flex-col overflow-hidden rounded-3xl bg-night p-6 text-white shadow-[0_32px_80px_-38px_rgba(33,27,63,0.8)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(109,91,246,0.7),transparent_45%),radial-gradient(circle_at_10%_95%,rgba(242,116,139,0.25),transparent_38%)]" aria-hidden="true" />
                <div className="relative">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-white/10 text-gold">
                    <Sparkles className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">کارنامه‌ای که خودش ساخته می‌شود</h3>
                  <p className="mt-2 text-xs leading-6 text-white/65">
                    هر هفته و هر ماه، دفتر از دل گزارش‌ها و آزمون‌ها یک جمع‌بندی روشن و قابل چاپ آماده می‌کند.
                  </p>
                </div>
                <div className="relative mt-auto pt-6">
                  <div className="rotate-[-2deg] rounded-2xl border border-white/15 bg-[#fffdf8] p-4 text-ink shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <BrandMark size={24} />
                        <span className="text-[0.62rem] font-bold">کارنامهٔ هفته</span>
                      </div>
                      <span className="text-[0.55rem] text-muted">هفتهٔ دوم مهر</span>
                    </div>
                    <div className="mt-3 flex items-end justify-between border-b border-line pb-3">
                      <div>
                        <p className="text-[0.52rem] text-muted">میانگین کل</p>
                        <p className="num text-xl font-extrabold">۱۸٫۴۵</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[0.52rem] text-muted">مطالعه</p>
                        <p className="num text-sm font-bold">۱۱ ساعت</p>
                      </div>
                      <span className="rounded-full bg-mint-soft px-2 py-0.5 text-[0.52rem] font-bold text-[#157a5b]">روند صعودی</span>
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                      {[["ریاضی", "۱۹٫۵", 92], ["زیست", "۱۸", 80], ["ادبیات", "۱۷٫۲۵", 72]].map(([name, score, width]) => (
                        <div key={String(name)} className="flex items-center gap-2">
                          <span className="w-12 text-[0.52rem] text-muted">{name}</span>
                          <span className="h-1 flex-1 overflow-hidden rounded-full bg-paper-deep">
                            <span className="block h-full rounded-full bg-violet" style={{ width: `${width}%` }} />
                          </span>
                          <span className="num w-7 text-left text-[0.52rem] font-bold">{score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className="absolute -left-2 -top-3 rotate-[-8deg] rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[0.55rem] text-white/80 backdrop-blur">
                    قابل چاپ
                    <Printer className="mr-1 inline size-2.5" aria-hidden="true" />
                  </span>
                </div>
              </article>
            </Reveal>

            <Reveal className="md:col-span-5" delay={0.06}>
              <article className="card flex h-full flex-col p-5 sm:p-6">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-sky-soft text-[#1e6dad]">
                  <GraduationCap className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold">هر آزمون یک نقطهٔ روشن</h3>
                <p className="mt-2 text-xs leading-6 text-muted">
                  نمره‌ها را با وزن ثبت کن؛ دفتر میانگین واقعی درس‌ها را حساب می‌کند.
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    ["ریاضی", "۱۸٫۵", "gold"],
                    ["زیست", "۱۹", "mint"],
                    ["فیزیک", "۱۶٫۷۵", "sky"],
                  ].map(([name, score, color]) => (
                    <div key={String(name)} className="flex items-center gap-2.5 rounded-xl border border-line bg-[#fffdf8] p-2.5">
                      <SubjectIcon icon={String(name) === "ریاضی" ? "calculator" : String(name) === "زیست" ? "leaf" : "atom"} color={String(color)} size="sm" />
                      <span className="flex-1 text-[0.68rem] font-semibold">{name}</span>
                      <span className="num text-sm font-extrabold">{score}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-auto flex items-center gap-1.5 pt-4 text-[0.62rem] text-[#157a5b]">
                  <TrendingUp className="size-3.5" aria-hidden="true" />
                  ۰٫۷۵ نمره بهتر از ماه گذشته
                </p>
              </article>
            </Reveal>

            <Reveal className="md:col-span-4" delay={0.1}>
              <article className="card flex h-full flex-col p-5">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-gold-soft text-[#8a6410]">
                  <CalendarDays className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold">برنامه‌ای که فراموش نمی‌شود</h3>
                <p className="mt-2 text-xs leading-6 text-muted">
                  جلسه‌های تکرارشونده را یک‌بار بچین.
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    ["۱۶:۰۰", "ریاضی • تمرین", "violet"],
                    ["۱۸:۳۰", "زیست • مرور", "mint"],
                    ["۲۰:۰۰", "ادبیات • خواندن", "coral"],
                  ].map(([time, label, color]) => (
                    <div key={String(time)} className="flex items-center gap-2 border-r-2 pr-2.5" style={{ borderColor: color === "violet" ? "#6d5bf6" : color === "mint" ? "#2dbb8c" : "#f2748b" }}>
                      <span className="num text-[0.58rem] text-muted">{time}</span>
                      <span className="text-[0.62rem] font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </article>
            </Reveal>

            <Reveal className="md:col-span-3" delay={0.14}>
              <article className="card flex h-full flex-col p-5">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-mint-soft text-[#157a5b]">
                  <Target className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold">هدف‌های کوچک</h3>
                <p className="mt-2 text-xs leading-6 text-muted">
                  هر تیک، یک قدم به هدف نزدیک‌تر.
                </p>
                <div className="mt-4 space-y-3">
                  {[["مطالعهٔ هفتگی", 72], ["تکمیل کارها", 90]].map(([label, value]) => (
                    <div key={String(label)}>
                      <div className="flex items-center justify-between text-[0.58rem]">
                        <span className="text-muted">{label}</span>
                        <span className="num font-bold">{value}٪</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-deep">
                        <span className="block h-full rounded-full bg-mint" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </Reveal>

            {features.slice(1, 3).map((feature, index) => {
              const Icon = feature.icon;
              const toneClass = feature.tone === "violet" ? "bg-violet-soft text-violet-deep" : feature.tone === "sky" ? "bg-sky-soft text-[#1e6dad]" : "bg-coral-soft text-[#c73554]";
              return (
                <Reveal key={feature.title} className="hidden md:col-span-6 lg:col-span-3" delay={0.06 + index * 0.04}>
                  <article className="card flex h-full flex-col p-5">
                    <span className={`flex size-10 items-center justify-center rounded-2xl ${toneClass}`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-base font-bold">{feature.title}</h3>
                    <p className="mt-2 text-xs leading-6 text-muted">{feature.text}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how" className="relative scroll-mt-24 border-y border-line bg-cream/65 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <div>
                <p className="section-eyebrow">شروع آسان</p>
                <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
                  سه قدم تا اولین کارنامه
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-7 text-muted">
                  لازم نیست همه‌چیز را از روز اول کامل کنی. دفتر ستاره همراه روزهای تو رشد می‌کند.
                </p>
                <div className="mt-7 flex items-center gap-2 text-[0.68rem] text-muted">
                  <Bell className="size-4 text-violet" aria-hidden="true" />
                  یادآورهای داخل برنامه، همیشه کنارت هستند
                </div>
              </div>
            </Reveal>
            <div className="relative">
              <div className="absolute right-6 top-8 bottom-8 w-px bg-line sm:right-8" aria-hidden="true" />
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <Reveal key={step.number} delay={index * 0.08}>
                      <div className="relative flex gap-4 rounded-2xl border border-line bg-cream p-4 sm:gap-5 sm:p-5">
                        <span className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-soft text-violet-deep">
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <div className="flex items-baseline gap-2">
                          <span className="num text-[0.6rem] font-bold text-plum">{step.number}</span>
                            <h3 className="text-sm font-bold">{step.title}</h3>
                          </div>
                          <p className="mt-1.5 text-xs leading-6 text-muted">{step.text}</p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="cards" className="relative scroll-mt-24 overflow-hidden bg-night py-16 text-white sm:py-24">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-32 top-0 size-[34rem] rounded-full bg-violet/25 blur-[90px]" />
          <div className="absolute -left-24 bottom-0 size-[26rem] rounded-full bg-coral/15 blur-[80px]" />
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.18)_0.8px,transparent_0.8px)] [background-size:26px_26px]" />
        </div>
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div>
              <p className="text-[0.68rem] font-bold tracking-wide text-gold">جمع‌بندی خودکار</p>
              <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
                هفته‌ات را در یک نگاه ببین
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-8 text-white/65">
                کارنامه فقط یک عدد نیست؛ روایت کوتاهی از تلاش توست. میانگین درس‌ها، ساعت مطالعه،
                کارهای انجام‌شده و روند پیشرفت، همه در یک صفحه.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "جمع‌بندی هفتگی و ماهانه به‌صورت خودکار",
                  "مقایسه با دورهٔ قبل و جملهٔ تحلیلی فارسی",
                  "نسخهٔ آمادهٔ چاپ برای دفتر یا دیوار اتاق",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-white/75">
                    <span className="flex size-5 items-center justify-center rounded-full bg-mint/15 text-mint">
                      <Check className="size-3" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={loggedIn ? "/app/cards" : "/auth"} className="btn mt-7 bg-white text-ink hover:bg-gold-soft">
                {loggedIn ? "دیدن کارنامه‌ها" : "ساختن دفتر من"}
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.12} y={24}>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-4 rotate-2 rounded-[2rem] border border-white/10 bg-white/5" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[1.7rem] bg-[#fffdf8] p-5 text-ink shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)] sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <BrandMark size={38} />
                    <div>
                      <p className="font-display text-lg leading-none">دفتر ستاره</p>
                      <p className="mt-1 text-[0.55rem] text-muted">کارنامهٔ هفتگی • هفتهٔ دوم مهر ۱۴۰۵</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[0.55rem] font-bold text-[#7c5c12]">هفتگی</span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    ["میانگین", "۱۸٫۴۵", "از ۲۰"],
                    ["مطالعه", "۱۱:۳۰", "ساعت"],
                    ["زنجیره", "۱۲", "روز"],
                  ].map(([label, value, unit]) => (
                    <div key={String(label)} className="rounded-xl border border-line bg-[#fdfaf4] p-2.5 text-center">
                      <p className="text-[0.52rem] text-muted">{label}</p>
                      <p className="num mt-1 text-lg font-extrabold">{value}</p>
                      <p className="text-[0.5rem] text-muted">{unit}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.65rem] font-bold">میانگین درس‌ها</p>
                    <span className="text-[0.52rem] text-muted">این هفته</span>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {[
                      ["ریاضی", "۱۹٫۵", 96, "#6d5bf6"],
                      ["زیست", "۱۸٫۲۵", 88, "#2dbb8c"],
                      ["ادبیات", "۱۷٫۷۵", 82, "#f2748b"],
                      ["فیزیک", "۱۶٫۵", 74, "#e5b23c"],
                    ].map(([name, score, width, color]) => (
                      <div key={String(name)} className="flex items-center gap-2.5">
                        <span className="w-12 text-[0.58rem] text-ink-soft">{name}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-deep">
                          <span className="block h-full rounded-full" style={{ width: `${width}%`, background: String(color) }} />
                        </span>
                        <span className="num w-8 text-left text-[0.58rem] font-bold">{score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-gold/35 bg-gold-soft/55 p-3">
                  <p className="flex items-center gap-1 text-[0.55rem] font-bold text-[#7c5c12]">
                    <Sparkles className="size-3" aria-hidden="true" />
                    یک نکته از دفتر
                  </p>
                  <p className="mt-1 text-[0.6rem] leading-5 text-ink-soft">
                    مطالعهٔ ریاضی‌ات منظم‌تر شده و میانگین این درس ۰٫۷۵ نمره بالا رفته؛ همین ریتم را نگه دار.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[0.52rem] text-muted">
                  <span>ساخته‌شده از ۷ گزارش و ۳ آزمون</span>
                  <span className="flex items-center gap-1"><Star className="size-2.5 fill-gold text-gold" /> ستارهٔ این هفته</span>
                </div>
              </div>
              <span className="absolute -bottom-3 -left-3 rotate-[-5deg] rounded-full border border-white/20 bg-night-soft px-3 py-1.5 text-[0.58rem] text-white/75 shadow-lg">
                قابل چاپ
                <Printer className="mr-1 inline size-3" aria-hidden="true" />
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="about-product" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pt-16 sm:px-6 sm:pt-24" aria-labelledby="product-purpose">
        <div className="max-w-3xl"><h2 id="product-purpose" className="font-display text-3xl leading-relaxed">دفتر ستاره چیست؟</h2><p className="mt-4 text-sm leading-8 text-ink-soft">{PRODUCT_SUMMARY}</p>
          <ul className="mt-5 grid gap-3 text-sm font-semibold sm:grid-cols-2">{PRODUCT_FEATURES.map((feature) => <li key={feature} className="flex items-center gap-2"><CheckCircle2 className="size-4 shrink-0 text-mint" aria-hidden="true" />{feature}</li>)}</ul>
          <p className="mt-5 text-sm leading-8 text-ink-soft">روش استفاده و قواعد محاسبه در <Link href="/guide" className="font-semibold text-violet-deep underline underline-offset-4">راهنمای دفتر ستاره</Link> آمده است. پیش از ثبت اطلاعات شخصی، <Link href="/privacy" className="font-semibold text-violet-deep underline underline-offset-4">توضیحات حریم خصوصی</Link> را بخوان.</p>
        </div>
      </section>

      <section id="questions" className="scroll-mt-24 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <Reveal>
            <div>
              <p className="section-eyebrow">پرسش‌های رایج</p>
              <h2 className="mt-3 font-display text-3xl leading-tight">چند چیز که شاید بخواهی بدانی</h2>
              <p className="mt-4 max-w-sm text-sm leading-7 text-muted">
                اگر پاسخ سوالت اینجا نبود، بعد از ورود می‌توانی همهٔ بخش‌ها را با حساب دمو ببینی.
              </p>
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-line bg-cream px-3.5 py-3 text-[0.68rem] text-muted">
                <ShieldCheck className="size-4 text-mint" aria-hidden="true" />
                داده‌های هر حساب از دیگری جدا نگهداری می‌شود.
              </div>
            </div>
          </Reveal>
          <div className="space-y-2.5">
            {questions.map((item, index) => (
              <Reveal key={item.question} delay={index * 0.05}>
                <details className="group rounded-2xl border border-line bg-cream px-4 py-1 open:shadow-[0_18px_50px_-32px_rgba(42,31,82,0.35)]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-sm font-semibold marker:content-none">
                    {item.question}
                    <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pb-4 text-xs leading-7 text-muted">{item.answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-deep via-[#5946e9] to-[#5e4ce8] px-6 py-12 text-center text-white shadow-[0_40px_100px_-40px_rgba(78,58,216,0.65)] sm:px-10 sm:py-16">
              <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
                <div className="absolute -right-12 -top-16 size-52 rounded-full border border-white/25" />
                <div className="absolute -bottom-24 -left-10 size-64 rounded-full border border-white/20" />
                <Star className="absolute right-[18%] top-8 size-4 fill-gold text-gold" />
                <Star className="absolute bottom-10 left-[22%] size-3 fill-white/80 text-white/80" />
              </div>
              <div className="relative mx-auto max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-night/20 px-3 py-1 text-[0.62rem] text-white">
                  <Heart className="size-3 fill-coral text-coral" aria-hidden="true" />
                  برای روزهای درس، با کمی نظم و ستاره
                </span>
                <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
                  امروز اولین صفحهٔ دفترت را بنویس
                </h2>
                <p className="mx-auto mt-3 max-w-md text-xs leading-7 text-white">
                  ورود سریع است و می‌توانی همه‌چیز را با حساب دمو ببینی. بعد، دفتر را مال خودت کن.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                  <Link href={loggedIn ? "/app" : "/auth"} className="btn bg-white px-5 text-sm text-violet-deep hover:bg-gold-soft">
                    {loggedIn ? "برگشت به دفتر" : "شروع دفتر من"}
                    <ArrowLeft className="size-4" aria-hidden="true" />
                  </Link>
                  <Link href="/auth" className="btn border border-white/40 bg-night/20 text-sm text-white hover:bg-night/30">
                    دیدن حساب دمو
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-line bg-cream/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
            <div className="max-w-xs">
              <Brand />
              <p className="mt-3 text-xs leading-6 text-muted">
                دفتر برنامه‌ریزی دانش‌آموز؛ جای گزارش‌ها، آزمون‌ها و ستاره‌های کوچک هر روز.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-6">
              <div>
                <p className="text-[0.65rem] font-bold text-ink">دفتر</p>
                <div className="mt-2 grid gap-1.5 text-[0.65rem] text-muted [&_a]:inline-flex [&_a]:min-h-8 [&_a]:items-center">
                  <a href="#features" className="hover:text-violet-deep">امکانات</a>
                  <a href="#how" className="hover:text-violet-deep">شروع کار</a>
                  <a href="#cards" className="hover:text-violet-deep">کارنامه‌ها</a>
                </div>
              </div>
              <div>
                <p className="text-[0.65rem] font-bold text-ink">حساب</p>
                <div className="mt-2 grid gap-1.5 text-[0.65rem] text-muted [&_a]:inline-flex [&_a]:min-h-8 [&_a]:items-center">
                  <Link href="/auth" className="hover:text-violet-deep">ورود با موبایل</Link>
                  <Link href="/auth" className="hover:text-violet-deep">حساب دمو</Link>
                  <a href="#questions" className="hover:text-violet-deep">پرسش‌ها</a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6"><PublicLinks /></div>
          <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-line pt-5 text-[0.6rem] text-muted sm:flex-row">
            <span>© {APP_NAME} • ساخته‌شده برای روزهای درس</span>
            <span className="flex items-center gap-1.5">
              <Star className="size-3 fill-gold text-gold" aria-hidden="true" />
              یک صفحهٔ تازه، هر روز
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
