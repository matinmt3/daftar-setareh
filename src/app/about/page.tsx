import Link from "next/link";
import { PublicPage, StructuredData } from "@/components/public-discovery";
import { PRODUCT_FEATURES, PRODUCT_SUMMARY, PUBLIC_CONTENT, publicPageStructuredData } from "@/lib/public-content";
import { publicMetadata } from "@/lib/seo";
import { getSiteOrigin } from "@/lib/seo-server";

const page = PUBLIC_CONTENT.about;
export async function generateMetadata() { return publicMetadata(page, await getSiteOrigin()); }

export default async function AboutPage() {
  return <PublicPage heading={page.heading} description={page.description}>
    <StructuredData value={publicPageStructuredData(page, await getSiteOrigin(), "AboutPage")} />
    <section><h2>دفتر ستاره چیست؟</h2><p>{PRODUCT_SUMMARY}</p></section>
    <section><h2>ابزارهای موجود</h2><ul className="list-inside list-disc">{PRODUCT_FEATURES.map((feature) => <li key={feature}>{feature}</li>)}</ul><p className="mt-3">رابط فارسی و راست‌به‌چپ، تاریخ شمسی، مدیریت درس‌ها، گزارش‌های اصلی و تکمیلی، جلسه‌های هفتگی، هدف‌ها و کارنامهٔ قابل چاپ در برنامه وجود دارند. <Link href="/guide">راهنمای استفاده</Link> روش کار و قاعدهٔ محاسبات را توضیح می‌دهد.</p></section>
    <section><h2>تصویرها و عددهای معرفی</h2><p>نمره‌ها، زمان‌ها و نمودارهای صفحهٔ معرفی نمونهٔ نمایشی رابط هستند؛ آمار کاربران، نتیجهٔ یک دانش‌آموز واقعی یا تضمین پیشرفت نیستند. حساب دمو نیز برای امتحان کردن امکانات با دادهٔ نمونه است.</p></section>
    <section><h2>محدودهٔ این ابزار</h2><p>دفتر ستاره کمک می‌کند برنامه و تلاش‌های ثبت‌شدهٔ خودت را مرور کنی؛ جای آموزش، قضاوت معلم یا کارنامهٔ رسمی مدرسه را نمی‌گیرد و نتیجهٔ تحصیلی تضمین نمی‌کند. این صفحه امکانات نسخهٔ وب را توصیف می‌کند؛ ورود و ثبت تغییرها به سرور برنامه نیاز دارد.</p></section>
    <section><h2>پیش از شروع</h2><p><Link href="/privacy">نحوهٔ نگهداری اطلاعات</Link> را بخوان و برای آشنایی اولیه از <Link href="/auth">ورود یا حساب نمایشیِ فعال</Link> استفاده کن. اطلاعات واقعی را فقط در حساب شخصی و روی نسخه‌ای با تنظیمات مورد اعتماد ثبت کن.</p></section>
  </PublicPage>;
}
