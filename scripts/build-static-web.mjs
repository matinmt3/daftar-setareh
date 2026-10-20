import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const out = resolve(project, 'static-dist');
const version = JSON.parse(await readFile(join(project, 'package.json'), 'utf8')).version;
const origin = 'https://matinmt3.github.io/daftar-setareh/';
await mkdir(join(out, 'assets'), { recursive: true });
const result = await build({
  absWorkingDir: project,
  entryPoints: ['web-offline/main.tsx'],
  outfile: 'static-dist/app.js',
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2022'],
  jsx: 'automatic',
  sourcemap: false,
  metafile: true,
  legalComments: 'linked',
  external: ['*.woff2'],
  define: { 'process.env.NODE_ENV': '"production"', __APP_VERSION__: JSON.stringify(version) },
});
await copyFile(join(project, 'node_modules/@fontsource-variable/vazirmatn/files/vazirmatn-arabic-wght-normal.woff2'), join(out, 'assets/vazirmatn.woff2'));
await copyFile(join(project, 'node_modules/@fontsource-variable/vazirmatn/LICENSE'), join(out, 'assets/OFL-Vazirmatn.txt'));
await copyFile(join(project, 'public/social-preview.png'), join(out, 'assets/social-preview.png'));
let html = await readFile(join(project, 'web-offline/index.html'), 'utf8');
html = html.replace(/src=["'](?:\.\/)?main\.tsx["']/g, 'src="./app.js"');
if (!html.includes('./app.css')) html = html.replace('</head>', '<link rel="stylesheet" href="./app.css">\n</head>');
if (!html.includes('rel="manifest"')) html = html.replace('</head>', '<link rel="manifest" href="./manifest.webmanifest">\n</head>');
if (!html.includes('rel="icon"')) html = html.replace('</head>', '<link rel="icon" href="./assets/icon.svg" type="image/svg+xml">\n</head>');
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; worker-src 'self'";
if (!html.includes('Content-Security-Policy')) html = html.replace('<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">`);
await writeFile(join(out, 'index.html'), html, 'utf8');
await writeFile(join(out, 'assets/icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="#0f766e"/><path d="m64 24 12 25 28 4-20 20 5 28-25-13-25 13 5-28-20-20 28-4z" fill="#fff"/></svg>');
await writeFile(join(out, 'manifest.webmanifest'), JSON.stringify({ id: './', name: 'دفتر ستاره', short_name: 'دفتر ستاره', lang: 'fa', dir: 'rtl', start_url: './', scope: './', display: 'standalone', background_color: '#f7f8fa', theme_color: '#0f766e', description: 'دفتر مطالعه و برنامه‌ریزی مستقل با ذخیرهٔ اطلاعات در مرورگر', icons: [{ src: './assets/icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' }] }, null, 2));
await writeFile(join(out, '.nojekyll'), '');

const pages = [
  ['guide', 'راهنمای استفاده از دفتر ستاره', 'ثبت مطالعه، آزمون، برنامه، هدف و کارنامه در نسخهٔ مستقل وب دفتر ستاره.', `<h2>از ثبت مطالعه شروع کن</h2><p>در صفحهٔ امروز «ثبت مطالعه» را بزن، درس و زمان را وارد کن و ذخیره کن. یادداشت و کارهای روز اختیاری‌اند. زمان منفی و زمان اعشاری نامعتبر است؛ می‌توانی از عددهای فارسی استفاده کنی.</p><h2>برنامه، آزمون و پیشرفت</h2><p>در برنامه، جلسهٔ جدید یا برنامهٔ تکرارشونده بساز. در بخش بیشتر، درس‌ها و آزمون‌ها را مدیریت کن. نمرهٔ صفر معتبر است؛ نمرهٔ خالی در میانگین نمی‌آید. میانگین هر درس با وزن آزمون‌ها و میانگین کل از درس‌های دارای نمره محاسبه می‌شود. هدف‌ها و کارنامه‌ها در بخش پیشرفت قرار دارند.</p><h2>پشتیبان و جابه‌جایی اطلاعات</h2><p>در تنظیمات پشتیبان JSON بگیر. فایل را در محل امن نگه دار؛ پشتیبان رمزگذاری نشده است. بازیابی پس از بررسی فایل و تأیید خودت انجام می‌شود. فایل معتبر نسخهٔ مستقل اندروید را هم می‌توانی به‌صورت دستی منتقل کنی؛ همگام‌سازی خودکار وجود ندارد.</p><h2>استفاده بدون اینترنت</h2><p>پس از اولین بار بازشدن کامل نسخهٔ وب، فایل‌های برنامه برای بازشدن دوباره بدون اینترنت ذخیره می‌شوند. پاک‌کردن داده‌های مرورگر می‌تواند دفتر را پاک کند. برای چاپ کارنامه از گزینهٔ چاپ استفاده کن و در مرورگر «ذخیره به‌صورت PDF» را انتخاب کن.</p>`],
  ['about', 'دربارهٔ دفتر ستاره', 'دفتر ستاره، برنامه‌ریز تحصیلی فارسی و راست‌به‌چپ برای وب و اندروید.', `<h2>یک دفتر برای کارهای درسی</h2><p>دفتر ستاره برای ثبت زمان مطالعه، جلسه‌های درسی، نمره‌ها و هدف‌های کوچک ساخته شده است. صفحهٔ امروز کار بعدی را نشان می‌دهد و بخش پیشرفت تلاش ثبت‌شده را جمع‌بندی می‌کند.</p><h2>نسخهٔ مستقل وب</h2><p>این نسخه روی GitHub Pages منتشر می‌شود و اطلاعات هر دفتر در مرورگر همان دستگاه ذخیره می‌شوند. حساب کاربری یا ورود پیامکی ندارد. با دفتر خالی و درس‌های متناسب با پایهٔ تحصیلی شروع می‌کنی و اطلاعات خودت را ثبت می‌کنی.</p><h2>اندروید و سورس</h2><p>نسخهٔ بومی اندروید به اینترنت و سرور نیاز ندارد. وب و اندروید مستقل‌اند؛ پشتیبان معتبر JSON را می‌توانی با انتخاب خودت جابه‌جا کنی.</p><p><a href="https://github.com/matinmt3/daftar-setareh">مخزن سورس دفتر ستاره</a> · <a href="https://github.com/matinmt3/daftar-setareh/releases/latest">دریافت اندروید و فایل‌های انتشار</a></p><h2>محدودهٔ محاسبات</h2><p>عددها از اطلاعاتی که خودت ثبت می‌کنی محاسبه می‌شوند و ابزار کمکی برای برنامه‌ریزی‌اند. این برنامه جایگزین ارزیابی آموزشی حرفه‌ای نیست. گزارش خطا یا پیشنهاد بهبود را می‌توانی در بخش Issues مخزن ثبت کنی.</p>`],
  ['privacy', 'حریم خصوصی نسخهٔ مستقل وب', 'محل ذخیرهٔ اطلاعات و روش پشتیبان‌گیری و حذف داده‌های دفتر ستاره.', `<h2>اطلاعات دفتر کجا می‌ماند؟</h2><p>پروفایل، درس‌ها، گزارش‌ها، آزمون‌ها، برنامه و هدف‌ها در فضای ذخیره‌سازی مرورگر روی همان دستگاه نگهداری می‌شوند. این نسخه اطلاعات دفتر را به سرور برنامه ارسال نمی‌کند و سرویس تحلیل رفتار یا تبلیغات در آن تعبیه نشده است.</p><h2>میزبانی GitHub Pages</h2><p>برای دریافت فایل‌های برنامه به زیرساخت GitHub Pages متصل می‌شوی. ارائه‌دهندهٔ میزبانی می‌تواند اطلاعات فنی درخواست مانند نشانی IP را طبق سیاست خودش پردازش کند. اطلاعاتی که داخل دفتر می‌نویسی در فایل‌های عمومی وب یا مخزن Git ذخیره نمی‌شوند.</p><h2>مرورگر و پشتیبان</h2><p>هر کسی که به همان پروفایل مرورگر و دستگاه دسترسی داشته باشد ممکن است دفتر را باز کند. دادهٔ محلی و پشتیبان JSON رمزگذاری نشده‌اند. برای دستگاه مشترک اطلاعات حساس ثبت نکن و از قفل دستگاه استفاده کن. مرور خصوصی یا پاک‌کردن داده‌های سایت می‌تواند اطلاعات دفتر را حذف کند.</p><h2>حذف و بازیابی</h2><p>از تنظیمات می‌توانی پشتیبان بگیری، فایل معتبر را پس از تأیید بازیابی کنی یا دفتر محلی را با تأیید پاک کنی. پیش از حذف برنامه یا پاک‌کردن مرورگر پشتیبان بگیر. همگام‌سازی ابری، ارسال پیامک و انتقال خودکار اطلاعات به اندروید وجود ندارد.</p>`],
];
const safe = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
for (const [slug, title, description, content] of pages) {
  await mkdir(join(out, slug), { recursive: true });
  const page = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe(title)} | دفتر ستاره</title><meta name="description" content="${safe(description)}"><meta name="theme-color" content="#0f766e"><link rel="canonical" href="${origin}${slug}/"><meta property="og:type" content="website"><meta property="og:title" content="${safe(title)}"><meta property="og:description" content="${safe(description)}"><meta property="og:url" content="${origin}${slug}/"><meta property="og:image" content="${origin}assets/social-preview.png"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="../assets/icon.svg"><style>@font-face{font-family:Vazirmatn;src:url('../assets/vazirmatn.woff2') format('woff2');font-weight:100 900;font-display:swap}*{box-sizing:border-box}body{margin:0;background:#f7f8fa;color:#182a32;font:17px/2 Vazirmatn,system-ui,sans-serif}main{max-width:760px;margin:32px auto;padding:28px;background:white;border:1px solid #e2e8ed;border-radius:16px}nav{display:flex;flex-wrap:wrap;gap:12px}a{color:#0f766e;text-underline-offset:4px}h1{font-size:30px;line-height:1.6}h2{font-size:21px;margin-top:32px}a:focus-visible{outline:3px solid #0f766e;outline-offset:4px}@media(max-width:600px){main{margin:0;padding:22px 18px;border:0;border-radius:0}h1{font-size:26px}}</style></head><body><main><nav aria-label="راهنمای دفتر"><a href="../">باز کردن دفتر ستاره</a><a href="../guide/">راهنما</a><a href="../about/">درباره</a><a href="../privacy/">حریم خصوصی</a></nav><h1>${title}</h1>${content}<footer><p>دفتر ستاره · نسخهٔ ${version} · آخرین بازبینی ۲۰ اکتبر ۲۰۲۶</p></footer></main></body></html>`;
  await writeFile(join(out, slug, 'index.html'), page, 'utf8');
}
await writeFile(join(out, 'robots.txt'), `User-agent: *\nAllow: /daftar-setareh/\nSitemap: ${origin}sitemap.xml\n`);
await writeFile(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['', ...pages.map(p => p[0] + '/')].map(p => `<url><loc>${origin}${p}</loc></url>`).join('')}</urlset>`);
await writeFile(join(out, 'llms.txt'), `# دفتر ستاره\n\nنسخهٔ مستقل فارسی برای ثبت مطالعه، برنامه، آزمون و پیشرفت. اطلاعات دفتر در مرورگر ذخیره می‌شوند.\n\n- [دفتر](${origin})\n- [راهنما و محاسبات](${origin}guide/)\n- [درباره](${origin}about/)\n- [حریم خصوصی](${origin}privacy/)\n- [سورس](https://github.com/matinmt3/daftar-setareh)\n\nحساب پیامکی و همگام‌سازی خودکار در این نسخه وجود ندارد.\n`);
const staticFiles = [];
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.isDirectory()) await walk(join(dir, item.name));
    else if (!['sw.js', 'build-info.json', 'register-sw.js'].includes(item.name)) staticFiles.push(relative(out, join(dir, item.name)).replaceAll('\\', '/'));
  }
}
await walk(out);
const cacheHash = createHash('sha256');
for (const name of staticFiles.sort()) cacheHash.update(name).update(await readFile(join(out, name)));
const cacheVersion = cacheHash.digest('hex').slice(0, 14);
await writeFile(join(out, 'sw.js'), `const PREFIX='daftar-setareh-web-';\nconst CACHE=PREFIX+'${cacheVersion}';\nconst ASSETS=${JSON.stringify(['./', ...pages.map(p => './' + p[0] + '/'), ...staticFiles.map(p => './' + p)])};\nself.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));\nself.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));\nself.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(hit=>hit||caches.match(new URL('./',self.registration.scope).href))));return;}event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));});\n`);
// Kept external for a strict script CSP and a predictable project-relative scope.
await writeFile(join(out, 'register-sw.js'), "if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{}));}\n");
html = await readFile(join(out, 'index.html'), 'utf8');
html = html.replace('</body>', '<script src="./register-sw.js" defer></script>\n</body>');
await writeFile(join(out, 'index.html'), html);
// Include registration code in the same shell cache without hiding build errors.
const sw = await readFile(join(out, 'sw.js'), 'utf8');
await writeFile(join(out, 'sw.js'), sw.replace('const ASSETS=[', 'const ASSETS=["./register-sw.js",'));
await writeFile(join(out, 'build-info.json'), JSON.stringify({ version, sourceCommit: process.env.GITHUB_SHA || null, cacheVersion, builtAt: new Date().toISOString(), outputs: Object.keys(result.metafile.outputs), privateDataIncluded: false }, null, 2));
console.log(JSON.stringify({ output: out, version, cacheVersion, files: staticFiles.length + 3 }));
