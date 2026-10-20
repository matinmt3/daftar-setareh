import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarRange, Clock3, FileText, ScrollText, Sparkles, Star, Target } from "lucide-react";
import { requireOnboardedUser } from "@/server/auth/session";
import { getCardStats, getCards } from "@/server/services/cards";
import { formatPeriodLabel } from "@/lib/dates";
import { faMinutes, faNum, faPercent, faScoreFromPercent } from "@/lib/format";
import { PageHeader, EmptyState, SectionHeading } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ReportCardRecord } from "@/lib/types";

export const metadata: Metadata = { title: "کارنامه‌ها" };
export const dynamic = "force-dynamic";

function cardTone(card: ReportCardRecord): string {
  return card.type === "weekly" ? "violet" : "mint";
}

function signedChange(value: number | null, unit: "points" | "percent" | "count"): string {
  if (value === null) return "—";
  if (Math.abs(value) < 0.05) return "بدون تغییر";
  const magnitude = unit === "percent" ? faPercent(Math.abs(value)) : faNum(Math.abs(value));
  return `${value > 0 ? "+" : "−"}${magnitude}${unit === "points" ? " واحد درصد" : ""}`;
}

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireOnboardedUser();
  const params = await searchParams;
  const type = params.type === "monthly" ? "monthly" : params.type === "weekly" ? "weekly" : undefined;
  const cards = getCards(user, type);
  const stats = getCardStats(user.id);
  const [featured, ...rest] = cards;

  return (
    <div>
      <PageHeader
        eyebrow="جمع‌بندی خودکار"
        title="کارنامه‌های من"
        description="هر هفته و هر ماه، دفتر از گزارش‌ها و آزمون‌ها یک کارنامه می‌سازد. می‌توانی بخوانی، مقایسه کنی یا چاپش کنی."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-violet-soft text-violet-deep">
            <ScrollText className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.65rem] text-muted">همهٔ کارنامه‌ها</p>
            <p className="num mt-0.5 text-xl font-extrabold">{faNum(stats.total)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-coral-soft text-[#c73554]">
            <CalendarRange className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.65rem] text-muted">کارنامهٔ هفتگی</p>
            <p className="num mt-0.5 text-xl font-extrabold">{faNum(stats.weekly)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-mint-soft text-[#157a5b]">
            <FileText className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.65rem] text-muted">کارنامهٔ ماهانه</p>
            <p className="num mt-0.5 text-xl font-extrabold">{faNum(stats.monthly)}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-cream/80 p-2.5">
        <span className="px-2 text-[0.65rem] font-semibold text-muted">نمایش:</span>
        {[
          { value: undefined, label: "همه" },
          { value: "weekly", label: "هفتگی" },
          { value: "monthly", label: "ماهانه" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.value ? `/app/cards?type=${item.value}` : "/app/cards"}
            className={`rounded-lg px-3 py-1.5 text-[0.68rem] font-semibold transition-colors ${
              type === item.value ? "bg-night text-white" : "text-muted hover:bg-paper hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <span className="mr-auto hidden items-center gap-1.5 px-2 text-[0.6rem] text-muted sm:flex">
          <Sparkles className="size-3.5 text-gold" aria-hidden="true" />
          کارنامه‌ها با تغییر گزارش‌ها و نمره‌ها خودکار به‌روز می‌شوند
        </span>
      </div>

      {cards.length === 0 ? (
        <div className="card p-5">
          <EmptyState
            icon={<ScrollText className="size-5" aria-hidden="true" />}
            title="هنوز کارنامه‌ای ساخته نشده"
            description="وقتی یک هفتهٔ کامل گزارش یا آزمون داشته باشی، اولین کارنامه خودکار ساخته می‌شود. می‌توانی همین حالا چند گزارش ثبت کنی."
            action={<Link href="/app/reports/new" className="btn btn-primary text-xs">ثبت گزارش</Link>}
          />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,1fr)]">
          <div className="space-y-4">
            {featured ? <FeaturedCard card={featured} /> : null}
            {rest.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {rest.map((card) => <CardTile key={card.id} card={card} scale={user.gradeScale} />)}
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            <div className="card p-4">
              <SectionHeading title="کارنامه چطور ساخته می‌شود؟" className="mb-3" />
              <ol className="space-y-3 text-[0.68rem] leading-6 text-muted">
                {[
                  "گزارش‌ها و آزمون‌های هر دوره جمع‌آوری می‌شوند.",
                  "میانگین درس‌ها، ساعت مطالعه و کارها حساب می‌شوند.",
                  "روند با دورهٔ قبل مقایسه و یک جمع‌بندی فارسی نوشته می‌شود.",
                  "نسخهٔ نهایی ذخیره می‌شود و قابل چاپ است.",
                ].map((text, index) => (
                  <li key={text} className="flex gap-2.5">
                    <span className="num flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-soft text-[0.58rem] font-bold text-violet-deep">
                      {faNum(index + 1)}
                    </span>
                    {text}
                  </li>
                ))}
              </ol>
            </div>
            <div className="card p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold">
                <Star className="size-4 fill-gold text-gold" aria-hidden="true" />
                دوره‌های کامل
              </p>
              <p className="mt-1.5 text-[0.65rem] leading-6 text-muted">
                کارنامه فقط برای دوره‌های تمام‌شده ساخته می‌شود تا تصویر کامل و منصفانه‌ای از تلاشت داشته باشی.
              </p>
            </div>
            <Link href="/app/analytics" className="card group flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gold-soft text-[#8a6410]">
                <Target className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold">روند بلندمدت</p>
                <p className="mt-0.5 text-[0.6rem] text-muted">کارنامه‌ها را در تحلیل پیشرفت ببین</p>
              </div>
              <ArrowLeft className="mr-auto size-4 text-muted transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

function FeaturedCard({ card }: { card: ReportCardRecord }) {
  const data = card.data;
  return (
    <article className="card relative overflow-hidden">
      <div className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full bg-violet/10 blur-2xl" aria-hidden="true" />
      <div className="relative flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-night text-gold">
            <ScrollText className="size-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold">{data.title}</h2>
              <Badge tone={cardTone(card) === "violet" ? "violet" : "mint"} className="text-[0.55rem]">
                {card.type === "weekly" ? "هفتگی" : "ماهانه"}
              </Badge>
              <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[0.52rem] font-bold text-[#7c5c12]">
                تازه‌ترین
              </span>
            </div>
            <p className="mt-1.5 text-[0.65rem] text-muted">{formatPeriodLabel({ start: data.periodStart, end: data.periodEnd }, data.type)}</p>
          </div>
        </div>
        <Link href={`/app/cards/${card.id}`} className="btn btn-primary text-xs">
          خواندن کارنامه
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative grid grid-cols-2 divide-x divide-x-reverse divide-line border-b border-line sm:grid-cols-4">
        <div className="p-4">
          <p className="text-[0.58rem] text-muted">میانگین دوره</p>
          <p className="num mt-1 text-xl font-extrabold">
            {data.overallPercent === null ? "—" : faScoreFromPercent(data.overallPercent, data.gradeScale)}
            <span className="mr-1 text-[0.55rem] font-medium text-muted">از {faNum(data.gradeScale)}</span>
          </p>
        </div>
        <div className="p-4">
          <p className="text-[0.58rem] text-muted">مطالعه</p>
          <p className="num mt-1 text-sm font-extrabold">{faMinutes(data.studyMinutes)}</p>
        </div>
        <div className="p-4">
          <p className="text-[0.58rem] text-muted">تکمیل برنامه</p>
          <p className="num mt-1 text-sm font-extrabold">{faPercent(data.planCompletion)}</p>
        </div>
        <div className="p-4">
          <p className="text-[0.58rem] text-muted">روزهای گزارش</p>
          <p className="num mt-1 text-sm font-extrabold">{faNum(data.reportDays)} روز</p>
        </div>
      </div>

      <div className="relative grid gap-4 p-5 sm:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-[0.62rem] font-bold text-muted">جمع‌بندی کوتاه</p>
          <p className="mt-2 line-clamp-3 text-xs leading-7 text-ink-soft">
            {data.summaryLines[0] ?? "برای این دوره داده‌ای برای جمع‌بندی ثبت نشده است."}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.strengths.slice(0, 2).map((item) => (
              <span key={item} className="chip bg-mint-soft text-[0.58rem] text-[#157a5b]">{item}</span>
            ))}
            {data.needsAttention.slice(0, 2).map((item) => (
              <span key={item} className="chip bg-gold-soft text-[0.58rem] text-[#7c5c12]">{item}</span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-[#fdfaf4] p-3">
          <p className="flex items-center gap-1 text-[0.6rem] font-bold text-muted">
            <Clock3 className="size-3" aria-hidden="true" /> در مقایسه با دورهٔ قبل
          </p>
          <div className="mt-2 space-y-1.5 text-[0.62rem]">
            <div className="flex justify-between">
              <span className="text-muted">میانگین</span>
              <span className="font-bold">{signedChange(data.overallChange, "points")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">مطالعه</span>
              <span className="font-bold">{signedChange(data.studyChange, "percent")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">کارهای انجام‌شده</span>
              <span className="font-bold">{signedChange(data.taskChange, "count")}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function CardTile({ card, scale }: { card: ReportCardRecord; scale: number }) {
  const data = card.data;
  return (
    <Link href={`/app/cards/${card.id}`} className="card group flex flex-col p-4 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Badge tone={card.type === "weekly" ? "violet" : "mint"} className="text-[0.52rem]">
            {card.type === "weekly" ? "هفتگی" : "ماهانه"}
          </Badge>
          <p className="mt-2 text-xs font-bold text-ink">{formatPeriodLabel({ start: data.periodStart, end: data.periodEnd }, data.type)}</p>
        </div>
        <span className="num text-lg font-extrabold text-ink">
          {data.overallPercent === null ? "—" : faScoreFromPercent(data.overallPercent, scale)}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-[0.6rem]">
          <span className="text-muted">مطالعه</span>
          <span className="num font-semibold">{faMinutes(data.studyMinutes)}</span>
        </div>
        <Progress value={data.overallPercent ?? 0} tone={card.type === "weekly" ? "violet" : "mint"} className="h-1.5" />
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[0.58rem] text-muted">
        <span>{faNum(data.examCount)} آزمون • {faNum(data.reportDays)} روز گزارش</span>
        <span className="flex items-center gap-1 font-semibold text-violet-deep">
          دیدن
          <ArrowLeft className="size-3" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
