import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SelectReady — Resume Studio",
  description: "Build a clear, credible resume with thoughtful editing and transparent job-alignment feedback.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
