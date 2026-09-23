import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JobBridge — Find jobs. Apply direct.",
  description: "Job discovery and direct employer application platform.",
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body className="bg-slate-950 text-white antialiased">{children}</body></html>;
}