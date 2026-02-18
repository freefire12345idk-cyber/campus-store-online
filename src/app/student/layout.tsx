"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/Navbar";

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

  return (
    <div className="min-h-screen">
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="bg-[#0a0a0a]/90 backdrop-blur-md border-b border-cyan-500/20 sticky top-0 z-50"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/student" className="font-bold text-campus-primary">Campus Store</Link>
          <nav className="flex items-center gap-4">
            <Link 
              href="/student" 
              className={`${pathname === "/student" ? "text-cyan-400 font-medium" : "text-stone-600"} transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] hover:text-cyan-400 hover:bg-[#0a0a0a]/50 px-3 py-2 rounded-md`}
            >
              Shops
            </Link>
            <Link 
              href="/student/cart" 
              className={`${pathname === "/student/cart" ? "text-cyan-400 font-medium" : "text-stone-600"} transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] hover:text-cyan-400 hover:bg-[#0a0a0a]/50 px-3 py-2 rounded-md`}
            >
              Cart
            </Link>
            <Link 
              href="/student/orders" 
              className={`${pathname === "/student/orders" ? "text-cyan-400 font-medium" : "text-stone-600"} transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] hover:text-cyan-400 hover:bg-[#0a0a0a]/50 px-3 py-2 rounded-md`}
            >
              Orders
            </Link>
            <Link 
              href="/support" 
              className={`${pathname === "/support" ? "text-cyan-400 font-medium" : "text-stone-600"} transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] hover:text-cyan-400 hover:bg-[#0a0a0a]/50 px-3 py-2 rounded-md`}
            >
              Support
            </Link>
            <Link href="/student/notifications" className="relative text-stone-600 transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] hover:text-cyan-400 hover:bg-[#0a0a0a]/50 px-3 py-2 rounded-md">
              Notifications
              {notifCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {notifCount}
                </span>
              )}
            </Link>
            <Navbar userRole="student" currentPath={pathname} />
          </nav>
        </div>
      </motion.header>
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
