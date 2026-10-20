const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const FALLBACK = "http://127.0.0.1:3002";

type OriginOptions = { siteUrl?: string; appUrl?: string; host?: string | null; forwardedProto?: string | null };

function parseOrigin(value: string, name: string): URL {
  try {
    const url = new URL(value);
    if (!/^https?:\/\/[^/?#\\]+\/?$/i.test(value) || !["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error();
    return url;
  } catch {
    throw new Error(`${name} must be an HTTP(S) origin without credentials, path, query or fragment.`);
  }
}

/** Only a configured public origin or an exact local request host may identify the site. */
export function resolveSiteOrigin({ siteUrl, appUrl, host, forwardedProto }: OriginOptions = {}): string {
  if (siteUrl?.trim()) return parseOrigin(siteUrl.trim(), "SITE_URL").origin;
  const configured = appUrl?.trim() ? parseOrigin(appUrl.trim(), "NEXT_PUBLIC_APP_URL") : null;
  if (configured && !LOOPBACK_HOSTS.has(configured.hostname)) return configured.origin;
  if (host && /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)) {
    try {
      const local = new URL(`${forwardedProto === "https" ? "https" : "http"}://${host}`);
      if (LOOPBACK_HOSTS.has(local.hostname)) return local.origin;
    } catch {
      // Invalid ports/hosts must not be reflected into canonical URLs.
    }
  }
  return configured?.origin ?? FALLBACK;
}
