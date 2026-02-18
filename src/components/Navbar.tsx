"use client";

import { signOut } from "next-auth/react";

interface NavbarProps {
  userRole?: string;
  onLogout?: () => void;
}

export default function Navbar({ userRole, onLogout }: NavbarProps) {
  const handleLogout = async () => {
    try {
      await signOut({ 
        callbackUrl: '/login',
        redirect: true 
      });
      if (onLogout) onLogout();
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback to custom logout
      await fetch("/api/auth/logout", { method: "POST" });
      if (onLogout) onLogout();
    }
  };

  return (
    <button 
      type="button" 
      onClick={handleLogout}
      className="text-sm text-stone-500 hover:text-stone-700"
    >
      Logout
    </button>
  );
}
