import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { NeonCursor } from "@/components/NeonCursor";
import { NeonBackground } from "@/components/NeonBackground";

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
        <Providers>
          <NeonBackground />
          {children}
          <NeonCursor />
        </Providers>
      </body>
    </html>
  );
}
