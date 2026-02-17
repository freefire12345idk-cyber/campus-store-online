"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { NeonButton } from "@/components/NeonButton";

type College = { id: string; name: string };

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const [role, setRole] = useState<"student" | "shop_owner">(
    roleParam === "shop" ? "shop_owner" : "student"
  );
  const [colleges, setColleges] = useState<College[]>([
    { id: "lnct", name: "LNCT" },
    { id: "lnct-s", name: "LNCT-S" },
    { id: "lnct-e", name: "LNCT-E" },
    { id: "lnct-u", name: "LNCT-U" },
    { id: "tit", name: "TIT" },
    { id: "oriental", name: "ORIENTAL" },
    { id: "uit-rgpv", name: "UIT-RGPV" }
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to fetch from API, but keep hardcoded colleges as primary source
    fetch("/api/colleges")
      .then((r) => r.json())
      .then((data) => {
        // Only use API data if it's not empty
        if (data.length > 0) {
          setColleges(data);
        }
      })
      .catch(() => {
        // Keep hardcoded colleges on error
        console.log("Using hardcoded colleges");
      });
  }, []);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [section, setSection] = useState("");
  const [hostelBranch, setHostelBranch] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopLat, setShopLat] = useState<number | null>(null);
  const [shopLng, setShopLng] = useState<number | null>(null);
  const [locationError, setLocationError] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopPhotoUrl, setShopPhotoUrl] = useState("");
  const [paymentQrUrl, setPaymentQrUrl] = useState("");
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>([]);

  function toggleCollege(id: string) {
    setSelectedCollegeIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function getShopLocation() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setShopLat(pos.coords.latitude);
        setShopLng(pos.coords.longitude);
      },
      () => setLocationError("Could not get location. Allow location access or enter manually.")
    );
  }

  async function sendOtp() {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setSendingOtp(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("OTP Send Error:", data);
        setError(data.error || "Failed to send OTP");
        return;
      }
      setOtpSent(true);
      if (data.otp && process.env.NODE_ENV === "development") {
        setError(`Development OTP: ${data.otp}`);
      } else {
        setError(""); // Clear any previous errors
      }
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOtp() {
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }
    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    setVerifyingOtp(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email: email.trim(), token: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        return;
      }
      setOtpVerified(true);
      setOtpSent(false);
      setOtp("");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    
    // Student validation
    if (role === "student") {
      if (!collegeId) {
        setError("Please select a college");
        return;
      }
      if (!section.trim()) {
        setError("Section is required");
        return;
      }
      if (!hostelBranch.trim()) {
        setError("Branch is required");
        return;
      }
      if (!rollNo.trim()) {
        setError("Roll number is required");
        return;
      }
      if (!phone.trim() || phone.length !== 10) {
        setError("Phone number must be exactly 10 digits");
        return;
      }
    }
    
    // Shop owner validation
    if (role === "shop_owner") {
      if (!shopPhotoUrl) {
        setError("Please upload a photo of your shop.");
        return;
      }
      if (!paymentQrUrl) {
        setError("Please upload your payment QR code image.");
        return;
      }
      if (shopLat == null || shopLng == null) {
        setError("Please tap \"Get my location\" to set your shop location.");
        return;
      }
      if (selectedCollegeIds.length === 0) {
        setError("Please select at least one college to deliver to");
        return;
      }
    }
    
    // Common validation
    if (!email.trim() || !email.includes("@")) {
      setError("Valid email is required");
      return;
    }
    if (!phone.trim() || phone.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!otpVerified) {
      setError("Please verify your email with OTP");
      return;
    }
    setLoading(true);
    try {
      const url = "/api/auth/register";
      const body =
        role === "student"
          ? {
              role: "student",
              email: email.trim(),
              phone,
              password,
              name: name || undefined,
              collegeId,
              section: section.trim(),
              hostelBranch: hostelBranch.trim(),
              rollNo: rollNo.trim(),
              otpVerified,
            }
          : {
              role: "shop_owner",
              email: email.trim(),
              phone,
              password,
              name: name || undefined,
              shopName,
              shopAddress: shopAddress || undefined,
              shopLat: shopLat!,
              shopLng: shopLng!,
              shopPhone: shopPhone || undefined,
              shopPhotoUrl,
              paymentQrUrl,
              collegeIds: selectedCollegeIds,
              otpVerified,
            };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      if (data.user?.role === "student") router.push("/student");
      else if (data.user?.role === "shop_owner") router.push("/shop");
      else router.push("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass-card w-full max-w-md"
      >
        <h1 className="text-2xl font-bold neon-text">Register</h1>
        <div className="mt-2 flex gap-3 justify-center items-center">
          <NeonButton
            type="button"
            onClick={() => setRole("student")}
            variant={role === "student" ? "primary" : "ghost"}
            neonColor="#22d3ee"
            className="px-4 py-2 text-sm flex-shrink-0"
          >
            Student
          </NeonButton>
          <NeonButton
            type="button"
            onClick={() => setRole("shop_owner")}
            variant={role === "shop_owner" ? "primary" : "ghost"}
            neonColor="#f472b6"
            className="px-4 py-2 text-sm flex-shrink-0"
          >
            Shop Owner
          </NeonButton>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">Email *</label>
            <div className="flex gap-2 mt-1">
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="input flex-1" 
                placeholder="you@example.com" 
                disabled={otpVerified}
                required 
              />
              {!otpVerified && (
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={sendingOtp || !email.includes("@")}
                  className="btn-primary px-3 py-2 text-sm whitespace-nowrap"
                >
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>
              )}
            </div>
            {otpVerified && (
              <p className="mt-1 text-sm text-green-600">✓ Email verified</p>
            )}
          </div>
          
          {otpSent && !otpVerified && (
            <div>
              <label className="block text-sm font-medium text-stone-700">Enter 6-digit OTP *</label>
              <div className="flex gap-2 mt-1">
                <input 
                  type="text" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} 
                  className="input flex-1" 
                  placeholder="123456" 
                  maxLength={6}
                  required 
                />
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={verifyingOtp || otp.length !== 6}
                  className="btn-primary px-3 py-2 text-sm whitespace-nowrap"
                >
                  {verifyingOtp ? "Verifying..." : "Verify"}
                </button>
              </div>
              <p className="mt-1 text-xs text-stone-500">Also check your spam inbox for the OTP email.</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-700">Phone *</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input mt-1" placeholder="Enter 10-digit number" maxLength={10} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Password * (min 6)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input mt-1" minLength={6} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" />
          </div>

          {role === "student" && (
            <>
              <div>
                <label className="block text-sm font-medium text-stone-700">College *</label>
                <select value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="input mt-1" required>
                  <option value="">Select college</option>
                  {colleges?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  )) || []}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Section *</label>
                <input type="text" value={section} onChange={(e) => setSection(e.target.value)} className="input mt-1" placeholder="e.g. A, B, C" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Branch *</label>
                <input type="text" value={hostelBranch} onChange={(e) => setHostelBranch(e.target.value)} className="input mt-1" placeholder="e.g. CSE, IT, ECE" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Roll No *</label>
                <input type="text" value={rollNo} onChange={(e) => setRollNo(e.target.value)} className="input mt-1" placeholder="e.g. 2021UCS123" required />
              </div>
            </>
          )}

          {role === "shop_owner" && (
            <>
              <div>
                <label className="block text-sm font-medium text-stone-700">Shop name *</label>
                <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} className="input mt-1" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Shop photo *</label>
                <p className="text-xs text-stone-500">Upload a photo of your shop. Admin will verify before approving.</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const form = new FormData();
                    form.append("file", file);
                    const res = await fetch("/api/upload", { method: "POST", body: form });
                    const data = await res.json();
                    if (res.ok && data.url) setShopPhotoUrl(data.url);
                  }}
                  className="mt-1 block w-full text-sm text-stone-500 file:mr-2 file:rounded file:border-0 file:bg-campus-primary file:px-3 file:py-1.5 file:text-white"
                />
                {shopPhotoUrl && (
                  <div className="mt-2 h-24 w-24 overflow-hidden rounded border relative">
                    <Image src={shopPhotoUrl} alt="Shop" fill sizes="96px" className="object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Payment QR code *</label>
                <p className="text-xs text-stone-500">Upload a clear photo of your payment scanner/QR so students can pay you.</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const form = new FormData();
                    form.append("file", file);
                    const res = await fetch("/api/upload", { method: "POST", body: form });
                    const data = await res.json();
                    if (res.ok && data.url) setPaymentQrUrl(data.url);
                  }}
                  className="mt-1 block w-full text-sm text-stone-500 file:mr-2 file:rounded file:border-0 file:bg-campus-primary file:px-3 file:py-1.5 file:text-white"
                />
                {paymentQrUrl && (
                  <div className="mt-2 h-24 w-24 overflow-hidden rounded border relative">
                    <Image src={paymentQrUrl} alt="QR" fill sizes="96px" className="object-contain" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Landmark / Dukaan ka pata (optional)</label>
                <input type="text" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} className="input mt-1" placeholder="e.g. Near temple, Main road" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Shop location *</label>
                <p className="text-xs text-stone-500">Turn on GPS. Tap the button below — your location will be set. Then confirm on the map link.</p>
                <NeonButton type="button" onClick={getShopLocation} variant="secondary" neonColor="#22d3ee" className="mt-1 text-sm">
                  Get my location
                </NeonButton>
                {locationError && <p className="text-xs text-red-600 mt-1">{locationError}</p>}
                {shopLat != null && shopLng != null && (
                  <p className="mt-2 text-sm text-green-700">
                    Location set.{" "}
                    <a href={`https://www.google.com/maps?q=${shopLat},${shopLng}`} target="_blank" rel="noopener noreferrer" className="text-campus-primary underline">
                      View on Google Maps
                    </a>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Shop phone</label>
            {loading ? "Registering…" : "Register"}
          </NeonButton>
        </form>
        <p className="mt-4 text-center text-stone-600">
          Already have an account? <Link href="/login" className="text-campus-primary font-medium">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
