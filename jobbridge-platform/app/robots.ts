import type { MetadataRoute } from "next";
export default function robots():MetadataRoute.Robots {
  return {
    rules:{userAgent:"*",allow:"/"},
    sitemap:"https://jobbridge-india.vercel.app/sitemap.xml"
  };
}
