import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { NeonCursor } from "@/components/NeonCursor";
import { NeonBackground } from "@/components/NeonBackground";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Campus Store – Order from nearby shops",
  description: "Order from shops near your college. Students & shop owners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ErrorBoundary>
          <Providers>
            <NeonBackground />
            {children}
            <NeonCursor />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
