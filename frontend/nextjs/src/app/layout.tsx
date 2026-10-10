import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "mustafagokselgokmen",
    template: "%s · mustafagokselgokmen",
  },
  description:
    "One API contract, several backend implementations, and web, Android and iOS clients that behave the same way.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
