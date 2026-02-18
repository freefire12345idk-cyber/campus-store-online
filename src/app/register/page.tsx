"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  const [shopPhotoFile, setShopPhotoFile] = useState<File | null>(null);
  const [shopPhotoUrl, setShopPhotoUrl] = useState("");
  const [paymentQrFile, setPaymentQrFile] = useState<File | null>(null);
  const [paymentQrUrl, setPaymentQrUrl] = useState("");
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");

  function toggleCollege(id: string) {
    setSelectedCollegeIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function openModal(imageUrl: string, title: string) {
    setModalImage(imageUrl);
    setModalTitle(title);
  }

  function closeModal() {
    setModalImage(null);
    setModalTitle("");
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
    
    console.log("🚀 handleSubmit STARTED", { role, email, phone, shopPhotoFile, shopPhotoUrl, paymentQrFile, paymentQrUrl });
    
    // Common validation
    if (!email.trim() || !email.includes("@")) {
      console.log("❌ Email validation failed");
      setError("Valid email is required");
      return;
    }
    if (!phone.trim() || phone.length !== 10) {
      console.log("❌ Phone validation failed");
      setError("Phone number must be exactly 10 digits");
      return;
    }
    if (password.length < 6) {
      console.log("❌ Password validation failed");
      setError("Password must be at least 6 characters");
      return;
    }
    if (!otpVerified) {
      console.log("❌ OTP validation failed");
      setError("Please verify your email with OTP");
      return;
    }
    
    // Role-specific validation
    if (role === "student") {
      if (!collegeId) {
        console.log("❌ College validation failed");
        setError("Please select your college");
        return;
      }
      if (!section.trim()) {
        console.log("❌ Section validation failed");
        setError("Please enter your section");
        return;
      }
      if (!hostelBranch.trim()) {
        console.log("❌ Hostel validation failed");
        setError("Please enter your hostel/branch");
        return;
      }
      if (!rollNo.trim()) {
        console.log("❌ Roll number validation failed");
        setError("Please enter your roll number");
        return;
      }
    }
    
    // Shop owner validation
    if (role === "shop_owner") {
      console.log("🔍 Shop validation check", { shopPhotoFile, shopPhotoUrl, paymentQrFile, paymentQrUrl });
      
      // Check if files are selected OR URLs are set (either one must be true)
      const hasShopPhoto = shopPhotoFile !== null || shopPhotoUrl !== "";
      const hasPaymentQr = paymentQrFile !== null || paymentQrUrl !== "";
      
      if (!hasShopPhoto) {
        console.log("❌ Shop photo validation failed - no file or URL");
        setError("Please upload a photo of your shop.");
        return;
      }
      
      if (!hasPaymentQr) {
        console.log("❌ Payment QR validation failed - no file or URL");
        setError("Please upload your payment QR code image.");
        return;
      }
      
      if (shopLat == null || shopLng == null) {
        console.log("❌ Location validation failed");
        setError("Please tap \"Get my location\" to set your shop location.");
        return;
      }
      
      if (selectedCollegeIds.length === 0) {
        console.log("❌ College selection validation failed", { selectedCollegeIds });
        setError("Please select at least one college to deliver to");
        return;
      }
    }
    
    console.log("✅ All validation passed, proceeding with submission");
    
    setLoading(true);
    try {
      console.log("📤 Starting file upload process...");
      // Upload files if they exist but URLs don't
      let finalShopPhotoUrl = shopPhotoUrl;
      let finalPaymentQrUrl = paymentQrUrl;
      
      if (shopPhotoFile && !shopPhotoUrl) {
        console.log("📷 Uploading shop photo...");
        const form = new FormData();
        form.append("file", shopPhotoFile);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        console.log("📷 Shop photo upload response:", { ok: res.ok, data, error: data.error });
        if (res.ok && data.url) {
          finalShopPhotoUrl = data.url;
          console.log("📷 Shop photo URL set:", data.url);
        } else {
          console.log("❌ Shop photo upload failed:", data.error || "Unknown error");
          setError(`Shop photo upload failed: ${data.error || "Unknown error"}`);
          return;
        }
      }
      
      if (paymentQrFile && !paymentQrUrl) {
        console.log("📱 Uploading payment QR...");
        const form = new FormData();
        form.append("file", paymentQrFile);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        console.log("📱 Payment QR upload response:", { ok: res.ok, data, error: data.error });
        if (res.ok && data.url) {
          finalPaymentQrUrl = data.url;
          console.log("📱 Payment QR URL set:", data.url);
        } else {
          console.log("❌ Payment QR upload failed:", data.error || "Unknown error");
          setError(`Payment QR upload failed: ${data.error || "Unknown error"}`);
          return;
        }
      }
      
      console.log("📋 Preparing API request body...");
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
              shopPhotoUrl: finalShopPhotoUrl,
              paymentQrUrl: finalPaymentQrUrl,
              collegeIds: selectedCollegeIds,
              otpVerified,
            };
      
      console.log("📤 Sending API request:", { url, body });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      console.log("📤 API request sent, waiting for response...");
      const data = await res.json();
      console.log("📥 API response received:", { status: res.status, ok: res.ok, data });
      
      if (!res.ok) {
        console.log("❌ API request failed:", data.error);
        setError(data.error || "Registration failed");
        return;
      }
      
      console.log("✅ Registration successful, redirecting...");
      if (data.user?.role === "student") {
        console.log("🎓 Redirecting to student dashboard");
        router.push("/student");
      } else if (data.user?.role === "shop_owner") {
        console.log("🏪 Redirecting to pending approval page");
        router.push("/register/pending-approval");
      } else {
        console.log("🏠 Redirecting to home");
        router.push("/");
      }
    } catch (error) {
      console.error("💥 Registration error:", error);
      setError("Registration failed. Please try again.");
    } finally {
      console.log("🏁 Registration process completed");
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
                  accept=".jpg,.jpeg,.png"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    console.log("📷 Shop photo file selected:", { file, name: file?.name, size: file?.size });
                    if (!file) return;
                    
                    // Frontend file size check (5MB limit)
                    const maxSize = 5 * 1024 * 1024; // 5MB
                    if (file.size > maxSize) {
                      console.log("❌ Shop photo too large:", { size: file.size, maxSize });
                      setError("File too large! Please upload under 5MB");
                      // Clear the input
                      e.target.value = '';
                      setShopPhotoFile(null);
                      setShopPhotoUrl("");
                      return;
                    }
                    
                    // MIME type check
                    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                    if (!allowedTypes.includes(file.type)) {
                      console.log("❌ Invalid file type:", { type: file.type });
                      setError("Only JPG, JPEG, and PNG files are allowed");
                      // Clear the input
                      e.target.value = '';
                      setShopPhotoFile(null);
                      setShopPhotoUrl("");
                      return;
                    }
                    
                    setShopPhotoFile(file);
                    console.log("📷 Shop photo state updated");
                    
                    // Create unique filename (simplified format)
                    const timestamp = Date.now();
                    const uniqueFilename = `shop_photo_${timestamp}.${file.name.split('.').pop()}`;
                    
                    const form = new FormData();
                    form.append("file", file);
                    form.append("filename", uniqueFilename); // Add unique filename
                    
                    const res = await fetch("/api/upload", { method: "POST", body: form });
                    const data = await res.json();
                    console.log("📷 Shop photo upload response:", { ok: res.ok, data, error: data.error });
                    if (res.ok && data.url) {
                      setShopPhotoUrl(data.url);
                      console.log("📷 Shop photo URL set:", data.url);
                    } else {
                      console.log("❌ Shop photo upload failed:", data.error || "Unknown error");
                      setError(`Shop photo upload failed: ${data.error || "Unknown error"}`);
                      // Clear the input on failure
                      e.target.value = '';
                      setShopPhotoFile(null);
                    }
                  }}
                  className="mt-1 block w-full text-sm text-stone-500 file:mr-2 file:rounded file:border-0 file:bg-campus-primary file:px-3 file:py-1.5 file:text-white"
                />
                {shopPhotoUrl && (
                  <div 
                    className="mt-2 h-24 w-24 overflow-hidden rounded border relative cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openModal(shopPhotoUrl, "Shop Photo")}
                  >
                    <Image src={shopPhotoUrl} alt="Shop" fill sizes="96px" className="object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Payment QR code *</label>
                <p className="text-xs text-stone-500">Upload a clear photo of your payment scanner/QR so students can pay you.</p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    console.log("📱 Payment QR file selected:", { file, name: file?.name, size: file?.size });
                    if (!file) return;
                    
                    // Frontend file size check (5MB limit)
                    const maxSize = 5 * 1024 * 1024; // 5MB
                    if (file.size > maxSize) {
                      console.log("❌ Payment QR too large:", { size: file.size, maxSize });
                      setError("File too large! Please upload under 5MB");
                      // Clear the input
                      e.target.value = '';
                      setPaymentQrFile(null);
                      setPaymentQrUrl("");
                      return;
                    }
                    
                    // MIME type check
                    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                    if (!allowedTypes.includes(file.type)) {
                      console.log("❌ Invalid file type:", { type: file.type });
                      setError("Only JPG, JPEG, and PNG files are allowed");
                      // Clear the input
                      e.target.value = '';
                      setPaymentQrFile(null);
                      setPaymentQrUrl("");
                      return;
                    }
                    
                    setPaymentQrFile(file);
                    console.log("📱 Payment QR state updated");
                    
                    // Create unique filename (simplified format)
                    const timestamp = Date.now();
                    const uniqueFilename = `shop_qr_${timestamp}.${file.name.split('.').pop()}`;
                    
                    const form = new FormData();
                    form.append("file", file);
                    form.append("filename", uniqueFilename); // Add unique filename
                    
                    const res = await fetch("/api/upload", { method: "POST", body: form });
                    const data = await res.json();
                    console.log("📱 Payment QR upload response:", { ok: res.ok, data, error: data.error });
                    if (res.ok && data.url) {
                      setPaymentQrUrl(data.url);
                      console.log("📱 Payment QR URL set:", data.url);
                    } else {
                      console.log("❌ Payment QR upload failed:", data.error || "Unknown error");
                      setError(`Payment QR upload failed: ${data.error || "Unknown error"}`);
                      // Clear the input on failure
                      e.target.value = '';
                      setPaymentQrFile(null);
                    }
                  }}
                  className="mt-1 block w-full text-sm text-stone-500 file:mr-2 file:rounded file:border-0 file:bg-campus-primary file:px-3 file:py-1.5 file:text-white"
                />
                {paymentQrUrl && (
                  <div 
                    className="mt-2 h-24 w-24 overflow-hidden rounded border relative cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openModal(paymentQrUrl, "Payment QR Code")}
                  >
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
                <input type="tel" value={shopPhone} onChange={(e) => setShopPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="input mt-1" maxLength={10} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Shop location *</label>
                <NeonButton
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      setError("Geolocation is not supported");
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setShopLat(pos.coords.latitude);
                        setShopLng(pos.coords.longitude);
                        setError("");
                      },
                      () => setError("Failed to get location")
                    );
                  }}
                  neonColor="#22d3ee"
                  className="w-full py-2"
                >
                  Get my location
                </NeonButton>
                {shopLat && shopLng && (
                  <p className="mt-2 text-sm text-green-700">
                    Location set.{" "}
                    <a href={`https://www.google.com/maps?q=${shopLat},${shopLng}`} target="_blank" rel="noopener noreferrer" className="text-campus-primary underline">
                      View on Google Maps
                    </a>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Colleges we deliver to * (select at least one)</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colleges?.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        value={c.id}
                        checked={selectedCollegeIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCollegeIds([...selectedCollegeIds, c.id]);
                          } else {
                            setSelectedCollegeIds(selectedCollegeIds.filter((id) => id !== c.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{c.name}</span>
                    </label>
                  )) || []}
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <NeonButton type="submit" disabled={loading} className="w-full py-2.5">
            {loading ? "Registering…" : "Register"}
          </NeonButton>
        </form>
        <p className="mt-4 text-center text-stone-600">
          Already have an account? <Link href="/login" className="text-campus-primary font-medium">Login</Link>
        </p>
      </motion.div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {modalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={closeModal}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative z-10 bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 z-20 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 rounded-full p-2 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Modal Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{modalTitle}</h3>
              </div>
              
              {/* Image Container */}
              <div className="relative flex items-center justify-center">
                <img
                  src={modalImage}
                  alt={modalTitle}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
