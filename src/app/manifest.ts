import type { MetadataRoute } from "next";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return { name: APP_NAME, short_name: APP_NAME, description: APP_DESCRIPTION, lang: "fa", dir: "rtl", start_url: "/", scope: "/", display: "standalone", background_color: "#fbf8f1", theme_color: "#4e3ad8", categories: ["education", "productivity"], icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }, { src: "/apple-icon.png", sizes: "180x180", type: "image/png" }] };
}
