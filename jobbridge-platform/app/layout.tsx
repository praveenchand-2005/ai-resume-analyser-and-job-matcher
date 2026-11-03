import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "JobBridge India — Discover jobs. Apply direct.", template: "%s | JobBridge India" },
  description: "Discover source-linked job opportunities across India. Read practical application guides and apply directly through original employer and official recruitment websites.",
  applicationName: "JobBridge India",
  keywords: ["jobs in India", "fresher jobs", "government jobs", "private jobs", "career guides", "job application"],
  robots: { index: true, follow: true },
  openGraph: { type: "website", title: "JobBridge India", description: "Discover jobs and apply through original sources.", siteName: "JobBridge India" },
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en-IN"><body className="bg-slate-950 text-white antialiased">{children}</body></html>;
}
