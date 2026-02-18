"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Only check session on initial load, not on every pathname change
    if (checkingSession) {
      fetch("/api/me")
        .then((r) => r.json())
        .then((u) => {
          setUser(u);
          if (u.error || u.role !== "ADMIN" || u.isBanned) {
            console.log("🔒 Admin access denied, redirecting to login");
            router.push("/login");
          } else {
            console.log("✅ Admin access granted");
          }
          setCheckingSession(false);
        })
        .catch(() => {
          console.log("❌ Failed to check admin session");
          router.push("/login");
          setCheckingSession(false);
        });
    }
  }, []); // Empty dependency array - only run once

  async function logout() {
    try {
      await signOut({ 
        callbackUrl: '/login',
        redirect: true 
      });
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback to custom logout
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen">
      {checkingSession ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-stone-500">Loading admin session...</div>
        </div>
      ) : (
        <>
          <header className="sticky top-0 z-10 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
              <Link href="/admin/dashboard" className="font-bold text-amber-700">Campus Store · Admin</Link>
              <nav className="flex items-center gap-4">
                <Link href="/admin/dashboard" className={pathname === "/admin/dashboard" ? "text-amber-700 font-medium" : "text-stone-600"}>Dashboard</Link>
                <Link href="/admin/reports" className={pathname === "/admin/reports" ? "text-amber-700 font-medium" : "text-stone-600"}>Reports</Link>
                <Link href="/admin/support" className={pathname === "/admin/support" ? "text-amber-700 font-medium" : "text-stone-600"}>Support</Link>
                <Navbar userRole="admin" />
              </nav>
            </div>
          </header>
          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="mx-auto max-w-6xl px-4 py-6"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
