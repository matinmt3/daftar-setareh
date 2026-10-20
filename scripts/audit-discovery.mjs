#!/usr/bin/env node
/**
 * Dependency-free, response-based audit of this project's public discovery surface.
 * This is an explicitly custom LOCAL readiness checklist, not a universal GEO score,
 * a Google ranking metric, or proof of public indexing. Requires Node.js 18+.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const PUBLIC_PATHS = ['/', '/guide', '/about', '/privacy'];
const PRIVATE_PATHS = ['/app', '/app/planner', '/app/reports', '/app/exams', '/app/cards', '/app/analytics', '/app/settings', '/auth', '/onboarding'];
const CRITERIA = [
  'All four public pages return HTTP 200 directly without login or noindex directives',
  'Public HTML declares Persian language and RTL direction',
  'Public pages have distinct, descriptive Persian titles',
  'Public pages have distinct, informative Persian descriptions',
  'Each public page has one self canonical on the response origin',
  'Open Graph and Twitter use a reachable 1200 by 630 PNG preview',
  'The homepage visibly explains the product purpose and four factual features',
  'Public pages have one meaningful H1 and meaningful H2 headings',
  'Every public page links to all four public pages with named anchor links',
  'Robots permits public pages and Next assets, and referenced CSS is reachable',
  'All nine private/auth/onboarding responses have original noindex headers, final noindex HTML, and no sitemap entry',
  'Robots allows crawling private/login pages so their noindex is readable',
  'The sitemap is well-formed XML listing exactly four canonical public pages',
  'An unknown route returns a real HTTP 404',
  'Homepage WebSite JSON-LD has a visible consistent name and canonical URL',
  'WebApplication JSON-LD has truthful semantic fields and no fabricated offers or ratings',
  'Seven visible FAQ questions and answers disclose demo, storage, and SMS limits',
  'JSON-LD descriptions and features match visible text without invented claims or hidden AI directives',
];

function usage() {
  console.log('Usage: node scripts/audit-discovery.mjs --base-url http://127.0.0.1:4319 --output ./audit.json');
}

function argumentsFrom(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') return { help: true };
    const separator = argument.indexOf('=');
    const key = separator === -1 ? argument : argument.slice(0, separator);
    if (!['--base-url', '--output'].includes(key)) throw new Error(`Unknown argument: ${key}`);
    const value = separator === -1 ? argv[++index] : argument.slice(separator + 1);
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    options[key.slice(2)] = value;
  }
  if (!options['base-url'] || !options.output) throw new Error('--base-url and --output are required.');
  const base = new URL(options['base-url']);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== '/') {
    throw new Error('--base-url must be an HTTP(S) origin without credentials, a path, a query, or a fragment.');
  }
  return { baseUrl: base.origin, output: resolve(options.output) };
}

function decodeEntities(value = '') {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', zwnj: '\u200c', zwj: '\u200d' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|zwnj|zwj);/gi, (whole, entity) => {
    if (!entity.startsWith('#')) return named[entity.toLowerCase()] ?? whole;
    const number = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return number >= 0 && number <= 0x10ffff ? String.fromCodePoint(number) : whole;
  });
}

function normalize(value = '') {
  return decodeEntities(String(value)).replace(/[\u200b-\u200f\ufeff]/g, ' ').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ').trim();
}

function attributes(tag) {
  const result = {};
  const content = tag.replace(/^<\/?[\w:-]+/, '').replace(/\/?\s*>$/, '');
  const pattern = /([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of content.matchAll(pattern)) result[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  return result;
}

function visibleHtml(html) {
  let body = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) ?? [null, html])[1];
  body = body.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ');
  // Match actual attributes and nesting. A class like overflow-hidden does not hide its element.
  // This remains a static HTML heuristic; external CSS and JavaScript are not executed.
  const stack = [], output = [];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  for (const token of body.match(/<[^>]+>|[^<]+/g) || []) {
    const match = token.match(/^<(\/)?([\w:-]+)\b/i);
    if (!match) { if (!stack.some(item => item.hidden)) output.push(token); continue; }
    const tag = match[2].toLowerCase();
    if (match[1]) {
      const position = stack.map(item => item.tag).lastIndexOf(tag);
      const hidden = stack.some(item => item.hidden);
      if (position !== -1) stack.splice(position);
      if (!hidden) output.push(token);
    } else {
      const attrs = attributes(token);
      const hidden = stack.some(item => item.hidden) || Object.hasOwn(attrs, 'hidden') || attrs['aria-hidden'] === 'true' || /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(attrs.style || '');
      if (!hidden) output.push(token);
      if (!voidTags.has(tag) && !/\/\s*>$/.test(token)) stack.push({ tag, hidden });
    }
  }
  return output.join('');
}

function plainText(html) {
  return normalize(html.replace(/<[^>]*>/g, ' '));
}

function parsePage(response) {
  const html = response.text;
  // Next.js can stream metadata into the body for normal browser user agents.
  // Inspect real tags across the response after excluding script/style/template text.
  const head = html.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ');
  const meta = {};
  for (const match of head.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    const name = (attrs.name || attrs.property || '').toLowerCase();
    if (name) (meta[name] ??= []).push(attrs.content ?? '');
  }
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0]));
  const sourceBody = visibleHtml(html);
  const anchors = [...sourceBody.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map(match => ({ ...attributes(match[0].match(/^<a\b[^>]*>/i)[0]), text: plainText(match[0]) }));
  const structuredData = [];
  const jsonErrors = [];
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (attributes(match[0].match(/^<script\b[^>]*>/i)[0]).type?.toLowerCase() !== 'application/ld+json') continue;
    try { structuredData.push(JSON.parse(match[1])); } catch (error) { jsonErrors.push(error.message); }
  }
  function flatten(value) {
    if (Array.isArray(value)) return value.flatMap(flatten);
    if (!value || typeof value !== 'object') return [];
    return [value, ...flatten(value['@graph'])];
  }
  return {
    ...response,
    htmlAttributes: attributes(html.match(/<html\b[^>]*>/i)?.[0] || '<html>'),
    title: plainText(head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''),
    meta, links, anchors, text: plainText(sourceBody), sourceBody,
    h1: [...sourceBody.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(match => plainText(match[1])),
    h2: [...sourceBody.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map(match => plainText(match[1])),
    nodes: structuredData.flatMap(flatten), jsonErrors,
  };
}

function absolute(value, base) {
  try { return new URL(value, base).href; } catch { return null; }
}

function types(node) { return Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']]; }

async function get(url) {
  const redirectChain = [];
  const seen = new Set();
  const allowedOrigin = new URL(url).origin;
  let currentUrl = url;
  let initialStatus = null;
  let initialHeaders = {};
  try {
    const signal = AbortSignal.timeout(30000);
    for (let hop = 0; hop <= 8; hop++) {
      if (seen.has(currentUrl)) throw new Error('Redirect loop detected.');
      seen.add(currentUrl);
      const response = await fetch(currentUrl, { redirect: 'manual', signal, headers: { 'User-Agent': 'DaftarSetareh-LocalReadinessAudit/1.0' } });
      const headers = Object.fromEntries(response.headers);
      if (hop === 0) { initialStatus = response.status; initialHeaders = headers; }
      // Retain the original redirect's indexing headers without recording cookies.
      redirectChain.push({ url: response.url, status: response.status, headers: Object.fromEntries(['content-type', 'x-robots-tag', 'location', 'cache-control'].filter(key => headers[key] !== undefined).map(key => [key, headers[key]])) });
      if ([301, 302, 303, 307, 308].includes(response.status) && headers.location) {
        await response.body?.cancel();
        if (hop === 8) throw new Error('More than eight redirects.');
        const next = new URL(headers.location, currentUrl);
        if (!['http:', 'https:'].includes(next.protocol) || next.origin !== allowedOrigin || next.username || next.password) throw new Error('Cross-origin or non-HTTP redirect refused by the local audit.');
        currentUrl = next.href;
        continue;
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      return { requestedUrl: url, url: response.url, status: response.status, headers, initialStatus, initialHeaders, redirectChain, text: bytes.toString('utf8'), bytes };
    }
  } catch (error) {
    return { requestedUrl: url, url: currentUrl, status: null, headers: {}, initialStatus, initialHeaders, redirectChain, text: '', bytes: Buffer.alloc(0), error: error.message };
  }
}

function robotGroups(text) {
  const groups = [];
  let group = null;
  let directives = false;
  for (const source of text.split(/\r?\n/)) {
    const line = source.replace(/#.*/, '').trim();
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === 'user-agent') {
      if (!group || directives) { group = { agents: [], rules: [] }; groups.push(group); directives = false; }
      group.agents.push(value.toLowerCase());
    } else if (group && ['allow', 'disallow'].includes(key)) {
      directives = true;
      if (value) group.rules.push({ kind: key, path: value });
    }
  }
  return groups;
}

function robotAccess(groups, pathname, agent) {
  const specific = groups.filter(group => group.agents.some(value => value !== '*' && agent.includes(value)));
  const longestAgent = Math.max(0, ...specific.flatMap(group => group.agents.filter(value => value !== '*' && agent.includes(value)).map(value => value.length)));
  const active = specific.length ? specific.filter(group => group.agents.some(value => value.length === longestAgent && agent.includes(value))) : groups.filter(group => group.agents.includes('*'));
  const matches = active.flatMap(group => group.rules).filter(rule => {
    const escaped = rule.path.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    try { return new RegExp(`^${escaped}`).test(pathname); } catch { return false; }
  }).sort((a, b) => b.path.replace(/\*/g, '').length - a.path.replace(/\*/g, '').length || (a.kind === 'allow' ? -1 : 1));
  return { path: pathname, agent, allowed: !matches.length || matches[0].kind === 'allow', matchedRule: matches[0] ?? null };
}

function sitemapData(xml) {
  const errors = [];
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) errors.push('DTD/entity declarations are not accepted by this local audit.');
  if (!/<urlset\b[^>]*\bxmlns\s*=\s*["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']/i.test(xml)) errors.push('Missing sitemap urlset root/namespace.');
  const stack = [];
  const cleaned = xml.replace(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>/g, '');
  let rootCount = 0;
  for (const match of cleaned.matchAll(/<([^>]+)>/g)) {
    const token = match[1].trim();
    if (token.startsWith('!')) { errors.push('Unsupported XML declaration.'); continue; }
    const closing = token.startsWith('/');
    const name = token.replace(/^\//, '').match(/^([A-Za-z_][\w:.-]*)/)?.[1];
    if (!name) { errors.push('Malformed XML tag.'); continue; }
    if (closing) { if (stack.pop() !== name) errors.push(`Mismatched closing tag: ${name}`); }
    else {
      if (!stack.length) rootCount++;
      if (!token.endsWith('/')) stack.push(name);
    }
  }
  if (stack.length || rootCount !== 1 || !/^\s*<urlset\b[\s\S]*<\/urlset>\s*$/.test(cleaned)) errors.push('XML must have one balanced urlset root.');
  if (/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-f]+;)/i.test(cleaned)) errors.push('Unescaped XML ampersand.');
  const blocks = [...xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)];
  const locations = blocks.map(block => {
    const locs = [...block[1].matchAll(/<loc\b[^>]*>([^<]*)<\/loc>/gi)];
    if (locs.length !== 1) errors.push('Each url must have exactly one loc.');
    return decodeEntities(locs[0]?.[1]?.trim() || '');
  });
  if ([...xml.matchAll(/<loc\b/gi)].length !== blocks.length) errors.push('Unexpected loc outside a url.');
  return { locations, errors };
}

function hasNoindex(directives) {
  return /(?:^|[\s,:])(?:noindex|none)(?:$|[\s,])/.test(directives.toLowerCase());
}

function noindex(page) {
  return hasNoindex([page.headers['x-robots-tag'] || '', ...(page.meta.robots || []), ...(page.meta.googlebot || [])].join(','));
}

async function audit(options) {
  const fetched = await Promise.all([...PUBLIC_PATHS, ...PRIVATE_PATHS, '/robots.txt', '/sitemap.xml', '/social-preview.png', '/__discovery_audit_missing_route_72963'].map(path => get(new URL(path, options.baseUrl).href)));
  const responses = new Map(fetched.map(response => [new URL(response.requestedUrl).pathname, response]));
  const pages = PUBLIC_PATHS.map(path => ({ path, ...parsePage(responses.get(path)) }));
  const privatePages = PRIVATE_PATHS.map(path => ({ path, ...parsePage(responses.get(path)) }));
  const home = pages[0];
  const origin = new URL(home.url).origin;
  const robots = responses.get('/robots.txt');
  const groups = robotGroups(robots.text);
  const sitemap = responses.get('/sitemap.xml');
  const parsedSitemap = sitemapData(sitemap.text);
  const appNode = home.nodes.find(node => types(node).includes('WebApplication'));
  const features = Array.isArray(appNode?.featureList) ? appNode.featureList : [];
  const checks = [];
  function add(id, passed, evidence, failedDetails = []) {
    checks.push({ id, criterion: CRITERIA[id - 1], passed: Boolean(passed), evidence, failed_details: passed ? [] : failedDetails.length ? failedDetails : ['Criterion was not satisfied; see evidence.'] });
  }
  function pageEvidence(predicate, select) { return pages.map(page => ({ path: page.path, passed: Boolean(predicate(page)), ...select(page) })); }

  const publicStatus = pageEvidence(page => page.initialStatus === 200 && page.status === 200 && page.redirectChain.length === 1 && new URL(page.url).pathname === page.path && !noindex(page), page => ({ status: page.status, initial_status: page.initialStatus, final_url: page.url, noindex: noindex(page), robots_meta: page.meta.robots || [], googlebot_meta: page.meta.googlebot || [], x_robots_tag: page.headers['x-robots-tag'] || null, redirect_chain: page.redirectChain, error: page.error }));
  add(1, publicStatus.every(row => row.passed), publicStatus);
  const languages = pageEvidence(page => /^fa(?:-IR)?$/i.test(page.htmlAttributes.lang || '') && page.htmlAttributes.dir === 'rtl', page => ({ lang: page.htmlAttributes.lang, dir: page.htmlAttributes.dir }));
  add(2, languages.every(row => row.passed), languages);
  const titles = pages.map(page => ({ path: page.path, title: page.title }));
  add(3, titles.every(row => row.title.length >= 12 && /[آ-ی]/.test(row.title)) && new Set(titles.map(row => row.title)).size === 4, titles, ['Titles must contain Persian text, at least 12 characters for this project checklist, and differ across four pages. This is not a Google length requirement.']);
  const descriptions = pages.map(page => ({ path: page.path, values: page.meta.description || [] }));
  add(4, descriptions.every(row => row.values.length === 1 && normalize(row.values[0]).length >= 45 && /[آ-ی]/.test(row.values[0])) && new Set(descriptions.map(row => normalize(row.values[0]))).size === 4, descriptions, ['Each page needs one distinct Persian description of at least 45 characters in this project checklist; this is not a Google length requirement.']);
  const canonicals = pages.map(page => ({ path: page.path, actual: page.links.filter(link => link.rel?.split(/\s+/).includes('canonical')).map(link => absolute(link.href, page.url)), expected: new URL(page.path, origin).href }));
  add(5, canonicals.every(row => row.actual.length === 1 && row.actual[0] === row.expected), { response_origin: origin, pages: canonicals });
  const preview = responses.get('/social-preview.png');
  const validPng = preview.bytes.length >= 24 && preview.bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && preview.bytes.toString('ascii', 12, 16) === 'IHDR';
  const dimensions = validPng ? { width: preview.bytes.readUInt32BE(16), height: preview.bytes.readUInt32BE(20) } : null;
  const expectedImage = new URL('/social-preview.png', origin).href;
  const social = pages.map(page => ({ path: page.path, og_images: (page.meta['og:image'] || []).map(value => absolute(value, page.url)), twitter_images: (page.meta['twitter:image'] || []).map(value => absolute(value, page.url)), og_width: page.meta['og:image:width'], og_height: page.meta['og:image:height'], twitter_card: page.meta['twitter:card'] }));
  add(6, preview.status === 200 && preview.headers['content-type']?.includes('image/png') && dimensions?.width === 1200 && dimensions?.height === 630 && social.every(row => row.og_images.includes(expectedImage) && row.twitter_images.includes(expectedImage) && row.og_width?.includes('1200') && row.og_height?.includes('630') && row.twitter_card?.includes('summary_large_image')), { image: expectedImage, status: preview.status, content_type: preview.headers['content-type'], dimensions, pages: social });
  const featureVisibility = features.map(feature => ({ feature, visible: typeof feature === 'string' && home.text.includes(normalize(feature)) }));
  add(7, /برنامه.{0,3}ریز/.test(home.text) && /مطالعه|درسی|دانش.{0,2}آموز/.test(home.text) && typeof appNode?.description === 'string' && home.text.includes(normalize(appNode.description)) && features.length === 4 && featureVisibility.every(row => row.visible), { summary: appNode?.description, summary_visible: home.text.includes(normalize(appNode?.description || '')), features: featureVisibility, visible_character_count: home.text.length });
  const headings = pageEvidence(page => page.h1.length === 1 && page.h1[0].length >= 8 && page.h2.length > 0 && page.h2.every(value => value.length >= 5), page => ({ h1: page.h1, h2: page.h2 }));
  add(8, headings.every(row => row.passed), headings);
  const navigation = pages.map(page => ({ path: page.path, targets: PUBLIC_PATHS.map(path => ({ path, found_named_anchor: page.anchors.some(anchor => anchor.href && absolute(anchor.href, page.url) === new URL(path, origin).href && normalize(anchor.text || anchor['aria-label'] || '').length > 0) })) }));
  add(9, navigation.every(row => row.targets.every(target => target.found_named_anchor)) && publicStatus.every(row => row.passed), navigation);
  const cssUrls = [...new Set(pages.flatMap(page => page.links.filter(link => link.rel?.split(/\s+/).includes('stylesheet')).map(link => absolute(link.href, page.url))).filter(Boolean))];
  const cssResponses = await Promise.all(cssUrls.map(get));
  const publicRobotPaths = [...PUBLIC_PATHS, '/_next/static/css/discovery-audit.css', ...cssUrls.map(url => new URL(url).pathname)];
  const publicAccess = publicRobotPaths.flatMap(path => ['googlebot', '*'].map(agent => robotAccess(groups, path, agent)));
  add(10, robots.status === 200 && publicAccess.every(row => row.allowed) && cssResponses.length > 0 && cssResponses.every(response => response.status === 200 && response.headers['content-type']?.includes('text/css')), { robots_status: robots.status, robots_rules: robots.text, access: publicAccess, stylesheets: cssResponses.map(response => ({ url: response.url, status: response.status, content_type: response.headers['content-type'], error: response.error })) });
  const privateEvidence = privatePages.map(page => ({ path: page.path, initial_status: page.initialStatus, initial_x_robots_tag: page.initialHeaders['x-robots-tag'] || null, initial_noindex: hasNoindex(page.initialHeaders['x-robots-tag'] || ''), redirect_chain: page.redirectChain, status: page.status, final_url: page.url, redirected_to_auth: page.redirectChain.length === 1 || new URL(page.url).pathname === '/auth', noindex: noindex(page), final_html_noindex: hasNoindex([...(page.meta.robots || []), ...(page.meta.googlebot || [])].join(',')), robots_meta: page.meta.robots || [], googlebot_meta: page.meta.googlebot || [], x_robots_tag: page.headers['x-robots-tag'] || null, in_sitemap: parsedSitemap.locations.includes(new URL(page.path, origin).href), error: page.error }));
  add(11, privateEvidence.every(row => row.initial_noindex && row.status === 200 && row.noindex && row.final_html_noindex && row.redirected_to_auth && !row.in_sitemap), { pages: privateEvidence, note: 'Unauthenticated requests send no cookies. Redirect chains retain original status and indexing headers; followed redirects must end at the noindex auth document.' });
  const privateAccess = ['/app', ...PRIVATE_PATHS].flatMap(path => ['googlebot', '*'].map(agent => robotAccess(groups, path, agent)));
  add(12, robots.status === 200 && privateAccess.every(row => row.allowed), privateAccess);
  const expectedLocations = PUBLIC_PATHS.map(path => new URL(path, origin).href).sort();
  const sitemapLocations = [...parsedSitemap.locations].sort();
  add(13, sitemap.status === 200 && /xml/i.test(sitemap.headers['content-type'] || '') && !parsedSitemap.errors.length && JSON.stringify(sitemapLocations) === JSON.stringify(expectedLocations), { status: sitemap.status, content_type: sitemap.headers['content-type'], locations: parsedSitemap.locations, expected_locations: expectedLocations, xml_errors: parsedSitemap.errors, robots_sitemap_reference: robots.text.split(/\r?\n/).filter(line => /^sitemap:/i.test(line)) });
  const missing = responses.get('/__discovery_audit_missing_route_72963');
  add(14, missing.status === 404, { url: missing.url, status: missing.status, error: missing.error });
  const websites = home.nodes.filter(node => types(node).includes('WebSite'));
  const website = websites[0];
  add(15, websites.length === 1 && typeof website?.name === 'string' && normalize(website.name).length > 0 && home.text.includes(normalize(website.name)) && absolute(website.url, origin) === new URL('/', origin).href && !home.jsonErrors.length, { website_count: websites.length, website, json_parse_errors: home.jsonErrors });
  const forbiddenSchemaProperties = [];
  function inspectProperties(value, prefix = '') {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (/^(?:review|reviews|aggregateRating|offers)$/i.test(key)) forbiddenSchemaProperties.push(`${prefix}.${key}`);
      inspectProperties(child, `${prefix}.${key}`);
    }
  }
  home.nodes.forEach((node, index) => inspectProperties(node, `node${index}`));
  add(16, Boolean(appNode) && typeof appNode.name === 'string' && home.text.includes(normalize(appNode.name)) && typeof appNode.description === 'string' && appNode.applicationCategory === 'EducationalApplication' && typeof appNode.operatingSystem === 'string' && appNode.operatingSystem.trim().length > 0 && /^fa(?:-IR)?$/i.test(appNode.inLanguage || '') && absolute(appNode.url, origin) === new URL('/', origin).href && features.length === 4 && features.every(feature => typeof feature === 'string') && !forbiddenSchemaProperties.length, { application: appNode, forbidden_schema_properties: forbiddenSchemaProperties, note: 'Semantic WebApplication readiness only. No Google software-app rich-result eligibility is claimed.' });
  const faqQuestions = [...home.sourceBody.matchAll(/<(h3|summary)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(match => ({ text: plainText(match[2]), start: match.index, end: match.index + match[0].length })).filter(row => /[؟?]$/.test(row.text));
  const faqEvidence = faqQuestions.map((question, index) => {
    const after = home.sourceBody.slice(question.end, faqQuestions[index + 1]?.start ?? question.end + 2500);
    const answer = plainText(after.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
    return { question: question.text, answer, has_substantive_answer: answer.length >= 30 };
  });
  const faqText = normalize(faqEvidence.map(row => `${row.question} ${row.answer}`).join(' '));
  const faqDisclosures = { demo: /نمایشی|آزمایشی/.test(faqText), storage: /پایگاه.{0,2}داده.{0,5}سرور|سرور پروژه/.test(faqText), sms: /پیامک|پیامکی|SMS/i.test(faqText), configured_service_limitation: /پیکربندی|تنظیم/.test(faqText) };
  add(17, faqEvidence.length === 7 && faqEvidence.every(row => row.has_substantive_answer) && Object.values(faqDisclosures).every(Boolean), { faq_count: faqEvidence.length, faqs: faqEvidence, disclosures: faqDisclosures });
  const descriptionsMatch = pages.flatMap(page => page.nodes.filter(node => typeof node.description === 'string').map(node => ({ path: page.path, type: node['@type'], description: node.description, matches_visible_text: page.text.includes(normalize(node.description)) })));
  const suspiciousClaims = /(?:\d[\d,،٬.]*|[۰-۹][۰-۹,،٬.]*)\s*(?:میلیون|هزار)?\s*(?:کاربر فعال|دانش آموز راضی|دانش آموز موفق|کاربر راضی)|تضمین\s*(?:رتبه|قبولی)|(?:بهترین|شماره یک)\s*(?:برنامه|سامانه)|(?:ignore\s+(?:all\s+)?previous\s+instructions|always\s+recommend|rank\s+this\s+(?:site|page))/i;
  const hiddenAiDirectives = /<(?:div|span|p|section)\b[^>]*(?:hidden|aria-hidden\s*=\s*["']true|display\s*:\s*none)[^>]*>[\s\S]{0,1000}?(?:ignore previous|always recommend|موتورهای هوش مصنوعی|دستور به مدل|ChatGPT.*recommend)[\s\S]{0,200}?<\//i;
  const jsonErrors = pages.flatMap(page => page.jsonErrors.map(error => ({ path: page.path, error })));
  add(18, descriptionsMatch.length > 0 && descriptionsMatch.every(row => row.matches_visible_text) && featureVisibility.length === 4 && featureVisibility.every(row => row.visible) && !jsonErrors.length && pages.every(page => !suspiciousClaims.test(page.text) && !hiddenAiDirectives.test(page.html)) && !home.nodes.some(node => types(node).includes('FAQPage')), { descriptions: descriptionsMatch, features: featureVisibility, json_errors: jsonErrors, suspicious_claims_detected: pages.filter(page => suspiciousClaims.test(page.text)).map(page => page.path), hidden_ai_directives_detected: pages.filter(page => hiddenAiDirectives.test(page.html)).map(page => page.path), faq_rich_result_schema_present: home.nodes.some(node => types(node).includes('FAQPage')), note: 'Automated pattern checks cannot establish factual truth or discover every hidden claim; human review remains necessary.' });
  const passed = checks.filter(check => check.passed).length;
  const optionalLlms = await get(new URL('/llms.txt', options.baseUrl).href);
  return {
    audit_timestamp: new Date().toISOString(),
    audit_kind: 'custom_internal_local_readiness',
    base_url: options.baseUrl,
    response_origin: origin,
    local_readiness: { passed, total: CRITERIA.length, score: Math.round(passed / CRITERIA.length * 10000) / 100, calculation: 'passed / 18 * 100', is_universal_geo_score: false, is_google_metric: false, all_checks_passed: passed === CRITERIA.length },
    scope: { public_routes: PUBLIC_PATHS, private_routes: PRIVATE_PATHS, source: 'HTTP responses, SSR HTML, metadata, JSON-LD, robots, sitemap, PNG header, and linked CSS' },
    checks,
    failed_checks: checks.filter(check => !check.passed).map(({ id, criterion, failed_details }) => ({ id, criterion, failed_details })),
    optional_non_scoring: { llms_txt: { status: optionalLlms.status, present: optionalLlms.status === 200, affects_score: false, note: 'Optional proposal for systems that use it. Google Search does not use llms.txt to improve visibility or rankings.' } },
    limitations: [
      'This is a project-specific checklist, not a standardized GEO or search visibility score.',
      'HTML, robots, and XML parsing use small dependency-free parsers/regular expressions, not a full standards-conforming DOM, XML parser, or robots interpreter.',
      'Static visibility heuristics remove scripts, styles, templates, and common hidden markup; external CSS and JavaScript are not executed.',
      'Meaningfulness, original expertise, and factual accuracy are only partially checked with patterns and require human review.',
      'Passing locally does not demonstrate deployment, public crawling/indexing, rich results, rankings, or citations by generative AI systems.',
    ],
    external_unverified: ['Public production domain and HTTPS', 'Production hosting/CDN crawler access and headers', 'Google crawling, indexing, and chosen canonical', 'Search Console verification and generative AI inclusion settings', 'Rich-result eligibility and actual search appearance', 'Generative AI citations, visibility, and rankings'],
    references: [
      'https://developers.google.com/search/docs/fundamentals/ai-optimization-guide',
      'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
      'https://developers.google.com/search/docs/crawling-indexing/block-indexing',
      'https://developers.google.com/search/docs/appearance/site-names',
      'https://developers.google.com/search/docs/appearance/structured-data/software-app',
      'https://developers.google.com/search/updates',
      'https://nextjs.org/docs/app/api-reference/functions/generate-metadata',
      'https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots',
      'https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap',
    ],
  };
}

try {
  const options = argumentsFrom(process.argv.slice(2));
  if (options.help) usage();
  else {
    const report = await audit(options);
    await mkdir(dirname(options.output), { recursive: true });
    await writeFile(options.output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Custom internal local readiness: ${report.local_readiness.passed}/${report.local_readiness.total} (${report.local_readiness.score}/100). Not a universal GEO score.`);
    console.log(`Report: ${options.output}`);
    for (const check of report.failed_checks) console.log(`FAIL ${check.id}: ${check.criterion}`);
    process.exitCode = report.local_readiness.all_checks_passed ? 0 : 1;
  }
} catch (error) {
  console.error(error.message);
  usage();
  process.exitCode = 2;
}
