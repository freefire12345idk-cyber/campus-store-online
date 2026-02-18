"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => {
        if (u.error || !u.isAdmin || u.isBanned) {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, [pathname, router]);

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
      <header className="sticky top-0 z-10 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/admin/dashboard" className="font-bold text-amber-700">Campus Store · Admin</Link>
          <nav className="flex items-center gap-4">
            <Link href="/admin/dashboard" className={pathname === "/admin/dashboard" ? "text-amber-700 font-medium" : "text-stone-600"}>Dashboard</Link>
            <Link href="/admin/reports" className={pathname === "/admin/reports" ? "text-amber-700 font-medium" : "text-stone-600"}>Reports</Link>
            <Link href="/admin/support" className={pathname === "/admin/support" ? "text-amber-700 font-medium" : "text-stone-600"}>Support</Link>
            <button type="button" onClick={logout} className="text-sm text-stone-500 hover:text-stone-700">Logout</button>
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
    </div>
  );
}
