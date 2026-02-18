"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { NeonButton } from "@/components/NeonButton";

export default function LoginPage() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function redirectByRole(user: { role?: string; isAdmin?: boolean; shopId?: string }) {
    if (user?.isAdmin) router.push("/admin/dashboard");
    else if (user?.role === "student") router.push("/student");
    else if (user?.role === "shop_owner") router.push("/shop");
    else if (!user?.role || user.role === "") router.push("/setup-profile");
    else router.push("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const isEmail = emailOrPhone.includes("@");
      
      // Determine redirect URL based on role (we'll let NextAuth handle this)
      let callbackUrl = "/";
      
      // Use NextAuth signIn with redirect: true
      const result = await signIn("credentials", {
        email: isEmail ? emailOrPhone : undefined,
        phone: !isEmail ? emailOrPhone : undefined,
        password,
        redirect: true,
        callbackUrl: callbackUrl,
      });

      // If redirect: true, we won't get here unless there's an error
      if (result?.error) {
        setError(result.error || "Login failed");
        return;
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please try again.");
      alert("Login failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass-card w-full max-w-md"
      >
        <h1 className="text-2xl font-bold neon-text">Login</h1>
        <p className="mt-1 text-stone-600">Use your email or phone number and password</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">Email or Phone</label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="input mt-1"
              placeholder="email@example.com or 10-digit phone"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input mt-1"
              required
            />
          </div>
          <p className="text-xs text-slate-200 border border-slate-700/60 bg-slate-950/60 rounded-lg p-2 backdrop-blur">
            If you use Email login and receive an OTP, check your <strong>Email inbox and Spam folder</strong> for the code.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <NeonButton type="submit" disabled={loading} className="w-full py-2.5">
            {loading ? "Logging in…" : "Login"}
          </NeonButton>
          <div className="relative my-4">
            <span className="block text-center text-sm text-stone-500">or</span>
          </div>
          <NeonButton
            type="button"
            onClick={handleGoogleSignIn}
            variant="secondary"
            neonColor="#a855f7"
            className="w-full py-2.5"
          >
            Sign in with Google
          </NeonButton>
        </form>
        <p className="mt-4 text-center text-stone-600">
          Don&apos;t have an account? <Link href="/register" className="text-campus-primary font-medium">Register</Link>
        </p>
      </motion.div>
    </div>
  );
}
