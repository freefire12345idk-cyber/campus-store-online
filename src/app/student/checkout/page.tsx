"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageModal } from "@/components/ImageModal";

type College = { id: string; name: string };
type CartItem = { productId: string; name: string; price: number; quantity: number };

export default function StudentCheckoutPage() {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [collegeId, setCollegeId] = useState("");
  const [lockedCollegeId, setLockedCollegeId] = useState<string | null>(null);
  const [collegeError, setCollegeError] = useState("");
  const [hostelBranch, setHostelBranch] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shopQrUrl, setShopQrUrl] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => {
        if (u?.collegeId) {
          setLockedCollegeId(u.collegeId);
          setCollegeId(u.collegeId);
        } else if (!u?.error) {
          setCollegeError("College missing from profile.");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/colleges").then((r) => r.json()).then((list: College[]) => {
      setColleges(list);
      if (lockedCollegeId) setCollegeId(lockedCollegeId);
      else if (list.length) setCollegeId(list[0].id);
    });
    const raw = localStorage.getItem("cart");
    if (!raw) return;
    const data = JSON.parse(raw);
    setShopId(data.shopId);
    setShopName(data.shopName);
    setItems(data.items || []);
    if (data.shopId) {
      fetch(`/api/shops/${data.shopId}`).then((r) => r.json()).then((s: { paymentQrUrl?: string }) => setShopQrUrl(s.paymentQrUrl || null));
    }
  }, [lockedCollegeId]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function uploadProof(): Promise<string> {
    if (!paymentFile) throw new Error("Please attach payment screenshot");
    const form = new FormData();
    form.append("file", paymentFile);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url;
  }

  async function placeOrder() {
    if (!shopId || items.length === 0) {
      setError("Cart is empty.");
      return;
    }
    if (!collegeId) {
      setError("Select delivery college.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const url = await uploadProof();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          collegeId,
          hostelBranch: hostelBranch || undefined,
          rollNo: rollNo || undefined,
          paymentProofUrl: url,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data.error;
        setError(typeof err === "string" ? err : err?.message || "Order failed");
        return;
      }
      localStorage.removeItem("cart");
      router.push("/student/orders");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!shopId && items.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-stone-600">Your cart is empty.</p>
        <button type="button" onClick={() => router.push("/student")} className="btn-primary mt-4">Browse shops</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900">Checkout</h1>
      <p className="mt-1 text-stone-600">Pay in advance. Attach payment screenshot to place order.</p>

      <div className="mt-6 card">
        <h2 className="font-semibold">Delivery details</h2>
        <p className="text-sm text-stone-500">
          {lockedCollegeId ? "Delivery college is locked to your profile." : "You can change delivery college here."}
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-stone-700">Delivery college *</label>
            <select
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              className="input mt-1"
              disabled={!!lockedCollegeId || !!collegeError}
            >
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {collegeError && <p className="mt-2 text-sm text-red-600">{collegeError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Hostel / Branch</label>
            <input type="text" value={hostelBranch} onChange={(e) => setHostelBranch(e.target.value)} className="input mt-1" placeholder="e.g. Boys Hostel A" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Roll No.</label>
            <input type="text" value={rollNo} onChange={(e) => setRollNo(e.target.value)} className="input mt-1" />
          </div>
        </div>
      </div>

      <div className="mt-6 card">
        <h2 className="font-semibold">Order summary</h2>
        <p className="text-sm text-stone-500">Shop: {shopName}</p>
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((i) => (
            <li key={i.productId}>
              {i.name} × {i.quantity} — <span className="glass-chip">₹{(i.price * i.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-lg font-semibold">
          Total: <span className="glass-chip">₹{total.toFixed(2)}</span>
        </p>
      </div>

      <div className="mt-6 card">
        <h2 className="font-semibold">Payment</h2>
        <p className="text-sm text-stone-500">Pay this amount to the shop using their scanner/QR. Click the QR to open full size and scan, then attach screenshot below.</p>
        {shopQrUrl ? (
          <div className="mt-3">
            <p className="text-sm font-medium">Shop payment QR (click to open full size):</p>
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="mt-2 block rounded border border-stone-200 hover:border-campus-primary focus:outline-none focus:ring-2 focus:ring-campus-primary"
            >
              <div className="relative h-40 w-40 overflow-hidden rounded">
                <Image src={shopQrUrl} alt="Payment QR" fill sizes="160px" className="object-contain" />
              </div>
            </button>
            <ImageModal src={shopQrUrl} alt="Payment QR - scan to pay" open={qrModalOpen} onClose={() => setQrModalOpen(false)} />
          </div>
        ) : (
          <p className="mt-2 text-amber-700 text-sm">Shop has not added a payment QR yet. You can still upload your payment screenshot if you paid via other means.</p>
        )}
        <div className="mt-4">
          <label className="block text-sm font-medium text-stone-700">Upload payment screenshot *</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm text-stone-500 file:mr-2 file:rounded file:border-0 file:bg-campus-primary file:px-3 file:py-1.5 file:text-white"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Back</button>
        <button type="button" onClick={placeOrder} disabled={loading || !paymentFile} className="btn-primary">
          {loading ? "Placing order…" : "Place order"}
        </button>
      </div>
    </div>
  );
}
