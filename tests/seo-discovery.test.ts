import { describe, expect, it } from "vitest";
import { resolveSiteOrigin } from "@/lib/site-origin";
import { publicMetadata, PUBLIC_PATHS, serializeJsonLd } from "@/lib/seo";
import { homeStructuredData, PRODUCT_FEATURES, PRODUCT_SUMMARY } from "@/lib/public-content";

describe("site identity and discovery", () => {
  it("uses the actual loopback port when development configuration points at another local port", () => {
    expect(resolveSiteOrigin({ appUrl: "http://localhost:3000", host: "127.0.0.1:3002" })).toBe("http://127.0.0.1:3002");
    expect(resolveSiteOrigin({ host: "[::1]:4321", forwardedProto: "https" })).toBe("https://[::1]:4321");
  });

  it("keeps the configured production identity even behind an untrusted request host", () => {
    expect(resolveSiteOrigin({ siteUrl: "https://school.example", host: "attacker.example" })).toBe("https://school.example");
    expect(resolveSiteOrigin({ appUrl: "https://school.example/", host: "localhost:8000" })).toBe("https://school.example");
  });

  it.each(["evil.example", "127.0.0.1.evil.example:3002", "localhost@evil.example", "127.0.0.1:999999", "127.0.0.1:3002/path", "localhost:3002\r\nX-Test: injected"])("does not reflect hostile host %s into metadata", (host) => {
    expect(resolveSiteOrigin({ host })).toBe("http://127.0.0.1:3002");
  });

  it.each(["javascript:alert(1)", "ftp://school.example", "https://user:pass@school.example", "https://school.example/path", "https://school.example/?x=1", "https://school.example/#part", "https://school.example\\evil"])("rejects invalid configured origins: %s", (siteUrl) => {
    expect(() => resolveSiteOrigin({ siteUrl })).toThrow(/HTTP\(S\) origin/);
  });

  it("assigns self canonical and social URLs to every public page", () => {
    for (const path of PUBLIC_PATHS) {
      const metadata = publicMetadata({ path, title: "عنوان فارسی صفحه", description: "توضیح فارسی برای همین صفحه" }, "https://school.example");
      expect(metadata.alternates?.canonical).toBe(new URL(path, "https://school.example").href);
      expect(metadata.openGraph).toMatchObject({ url: new URL(path, "https://school.example").href });
      expect(metadata.robots).toMatchObject({ index: true, follow: true });
    }
  });

  it("escapes script-breaking text without changing the JSON data", () => {
    const value = { description: '</script><script>alert("x")</script>', feature: "فارسی" };
    const serialized = serializeJsonLd(value);
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(value);
  });

  it("uses factual shared visible product text and has no invented rating or price", () => {
    const data = homeStructuredData("https://school.example");
    const application = data["@graph"].find((node) => node["@type"] === "WebApplication");
    expect(application).toMatchObject({ description: PRODUCT_SUMMARY, featureList: [...PRODUCT_FEATURES] });
    expect(JSON.stringify(data)).not.toMatch(/aggregateRating|"offers"|"review"|FAQPage/);
  });
});
