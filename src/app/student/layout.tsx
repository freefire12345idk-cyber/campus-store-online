"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => {
        if (u.error || u.role !== "student" || u.isBanned) {
          router.push("/login");
          return;
        }
      })
      .catch(() => router.push("/login"));
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((list: { read: boolean }[]) => setNotifCount(list.filter((n) => !n.read).length))
      .catch(() => {});
  }, [pathname, router]);

  async function logout() {
    try {
      await signOut({ callbackUrl: '/login' });
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
          <Link href="/student" className="font-bold text-campus-primary">Campus Store</Link>
          <nav className="flex items-center gap-4">
            <Link href="/student" className={pathname === "/student" ? "text-campus-primary font-medium" : "text-stone-600"}>Shops</Link>
            <Link href="/student/cart" className={pathname === "/student/cart" ? "text-campus-primary font-medium" : "text-stone-600"}>Cart</Link>
            <Link href="/student/orders" className={pathname === "/student/orders" ? "text-campus-primary font-medium" : "text-stone-600"}>Orders</Link>
            <Link href="/support" className={pathname === "/support" ? "text-campus-primary font-medium" : "text-stone-600"}>Support</Link>
            <Link href="/student/notifications" className="relative text-stone-600">
              Notifications
              {notifCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {notifCount}
                </span>
              )}
            </Link>
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
