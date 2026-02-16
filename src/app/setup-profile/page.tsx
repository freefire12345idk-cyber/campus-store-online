"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type College = { id: string; name: string };

export default function SetupProfilePage() {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"student" | "shop_owner">("student");
  const [collegeId, setCollegeId] = useState("");
  const [section, setSection] = useState("");
  const [hostelBranch, setHostelBranch] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => {
        if (u.error) {
          router.push("/login");
          return;
        }
        if (u.role && u.role !== "") {
          if (u.role === "student") router.push("/student");
          else if (u.role === "shop_owner") router.push(u.shopId ? "/shop" : "/shop/complete-registration");
          else router.push("/");
          return;
        }
        setChecking(false);
      })
      .catch(() => router.push("/login"));
    fetch("/api/colleges").then((r) => r.json()).then((list: College[]) => {
      setColleges(list);
      if (list.length) setCollegeId(list[0].id);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (role === "student" && !collegeId) {
      setError("Select your college.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          role,
          collegeId: role === "student" ? collegeId : undefined,
          section: role === "student" ? section || undefined : undefined,
          hostelBranch: hostelBranch || undefined,
          rollNo: rollNo || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || data.error || "Setup failed");
        return;
      }
      if (data.role === "student") router.push("/student");
      else router.push("/shop/complete-registration");
    } catch (e) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (checking) return <p className="p-8 text-center text-stone-500">Loading…</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-campus-primary">Complete your profile</h1>
        <p className="mt-1 text-stone-600">You signed in with Google. Please add your phone number and role.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">Phone number *</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input mt-1" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">I am a *</label>
            <div className="mt-2 flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="role" checked={role === "student"} onChange={() => setRole("student")} />
                <span>Student</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="role" checked={role === "shop_owner"} onChange={() => setRole("shop_owner")} />
                <span>Shop owner</span>
              </label>
            </div>
          </div>
          {role === "student" && (
            <>
              <div>
                <label className="block text-sm font-medium text-stone-700">College *</label>
                <select value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="input mt-1" required>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Section</label>
                <input type="text" value={section} onChange={(e) => setSection(e.target.value)} className="input mt-1" placeholder="e.g. A, B" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Hostel / Branch</label>
                <input type="text" value={hostelBranch} onChange={(e) => setHostelBranch(e.target.value)} className="input mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Roll No.</label>
                <input type="text" value={rollNo} onChange={(e) => setRollNo(e.target.value)} className="input mt-1" />
              </div>
            </>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
