"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { NeonButton } from "@/components/NeonButton";
import NotificationBell from "@/components/NotificationBell";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ role?: string; isAdmin?: boolean; shopId?: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => {
        if (u.error) {
          setUser(null);
          setChecking(false);
          return;
        }
        setUser({ role: u.role, isAdmin: u.isAdmin, shopId: u.shopId });
        setChecking(false);
      })
      .catch(() => {
        setUser(null);
        setChecking(false);
      });
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="bg-[#0a0a0a]/90 backdrop-blur-md border-b border-cyan-500/20 sticky top-0 z-50"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-xl font-bold text-campus-primary">Campus Store</span>
          <nav className="flex gap-4 items-center">
            {user ? (
              <>
                {user.isAdmin && (
                  <Link 
                    href="/admin/dashboard" 
                    className="text-stone-300 hover:text-amber-400 transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] hover:bg-[#0a0a0a]/50 px-3 py-2 rounded-md"
                  >
                    Admin
                  </Link>
                )}
                {user.role === "student" && (
                  <Link 
                    href="/student" 
                    className="text-stone-300 hover:text-cyan-400 transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] hover:bg-[#0a0a0a]/50 px-3 py-2 rounded-md"
                  >
                    Shops
                  </Link>
                )}
                {user.role === "shop_owner" && (
                  <Link 
                    href="/shop" 
                    className="text-stone-300 hover:text-cyan-400 transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] hover:bg-[#0a0a0a]/50 px-3 py-2 rounded-md"
                  >
                    My Shop
                  </Link>
                )}
                <NotificationBell />
                <Navbar userRole={user.role} currentPath="/" />
              </>
            ) : (
              <>
                <NeonButton href="/login" className="px-4 py-2 text-sm">Login</NeonButton>
                <NeonButton href="/register" className="px-4 py-2 text-sm" variant="secondary">Register</NeonButton>
              </>
            )}
          </nav>
        </div>
      </motion.header>
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl glass-card"
        >
          <h1 className="text-4xl font-bold tracking-tight neon-title sm:text-5xl">
            Order from shops near your college
          </h1>
          <p className="mt-4 text-lg text-slate-200 leading-relaxed leading-loose">
            <span className="block mb-3"><strong>Students:</strong> add items to cart, pay via scanner, get delivery at campus.</span>
            <span className="block"><strong>Shops:</strong> list your store, get orders and deliver to 4–5 colleges.</span>
          </p>
          {!user && (
            <>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <NeonButton href="/register?role=student" className="text-lg px-6 py-3">
                  Register as Student
                </NeonButton>
                <NeonButton href="/register?role=shop" variant="secondary" neonColor="#f472b6" className="text-lg px-6 py-3">
                  Register as Shop
                </NeonButton>
              </div>
              <p className="mt-8 text-slate-300">
                Already have an account? <Link href="/login" className="text-campus-primary font-medium">Login</Link>
              </p>
            </>
          )}
          {user && user.role && (
            <div className="mt-10">
              <NeonButton href={user.role === "student" ? "/student" : "/shop"} className="text-lg px-6 py-3">
                Go to dashboard
              </NeonButton>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
