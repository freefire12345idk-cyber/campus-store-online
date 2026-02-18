"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { NeonButton } from "@/components/NeonButton";
import NotificationBell from "@/components/NotificationBell";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ role?: string; isAdmin?: boolean; shopId?: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => {
        if (!u.error && u.role === "") router.replace("/setup-profile");
        else if (!u.error) setUser(u);
      })
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800/70 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-xl font-bold text-campus-primary">Campus Store</span>
          <nav className="flex gap-4 items-center">
            {user ? (
              <>
                {user.isAdmin && <Link href="/admin/dashboard" className="text-stone-300 hover:text-amber-400">Admin</Link>}
                {user.role === "student" && <Link href="/student" className="text-stone-300 hover:text-campus-primary">Shops</Link>}
                {user.role === "shop_owner" && <Link href="/shop" className="text-stone-300 hover:text-campus-primary">My Shop</Link>}
                <NotificationBell />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      // Try force logout first
                      const forceLogout = await fetch("/api/auth/force-logout", { 
                        method: "POST" 
                      });
                      const result = await forceLogout.json();
                      console.log("Force logout result:", result);
                      
                      if (result.success) {
                        window.location.href = "/login";
                        return;
                      }
                      
                      // Fallback to NextAuth if force logout fails
                      await signOut({ 
                        callbackUrl: '/login',
                        redirect: true 
                      });
                      router.refresh();
                    } catch (error) {
                      console.error("Logout error:", error);
                      // Final fallback to custom logout
                      await fetch("/api/auth/logout", { method: "POST" });
                      router.refresh();
                      window.location.href = "/login";
                    }
                  }}
                  className="text-stone-300 hover:text-campus-primary"
                >
                  Logout (Force)
                </button>
              </>
            ) : (
              <>
                <NeonButton href="/login" className="px-4 py-2 text-sm">Login</NeonButton>
                <NeonButton href="/register" className="px-4 py-2 text-sm" variant="secondary">Register</NeonButton>
              </>
            )}
          </nav>
        </div>
      </header>
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
