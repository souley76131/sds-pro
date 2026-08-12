import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://sdsprotech.com/sitemap.xml",
    host: "https://sdsprotech.com",
  };
}