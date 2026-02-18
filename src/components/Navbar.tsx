"use client";

import { signOut } from "next-auth/react";
import { motion } from "framer-motion";

interface NavbarProps {
  userRole?: string;
  onLogout?: () => void;
  currentPath?: string;
}

export default function Navbar({ userRole, onLogout, currentPath }: NavbarProps) {
  const handleLogout = async () => {
    try {
      console.log("🔒 Starting NextAuth signOut...");
      await signOut({ 
        callbackUrl: '/', 
        redirect: true 
      });
      console.log("✅ NextAuth signOut completed");
      if (onLogout) onLogout();
    } catch (error) {
      console.error("❌ NextAuth signOut error:", error);
      // Fallback to custom logout
      try {
        console.log("🔄 Trying fallback logout...");
        const response = await fetch("/api/auth/logout", { method: "POST" });
        const result = await response.json();
        console.log("Fallback logout result:", result);
        if (onLogout) onLogout();
        // Force redirect to landing page
        window.location.href = '/';
      } catch (fallbackError) {
        console.error("❌ Fallback logout error:", fallbackError);
        // Final fallback - force redirect
        window.location.href = '/';
      }
    }
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="bg-[#0a0a0a]/90 backdrop-blur-md border-b border-cyan-500/20 sticky top-0 z-50"
    >
      <button 
        type="button" 
        onClick={handleLogout}
        className="text-sm text-stone-500 hover:text-cyan-400 transition-all duration-300 ease-in-out hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] hover:bg-[#0a0a0a]/50 px-3 py-2 rounded-md"
      >
        Logout
      </button>
    </motion.nav>
  );
}
