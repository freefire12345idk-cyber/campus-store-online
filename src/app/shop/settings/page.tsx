"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type College = { id: string; name: string };

export default function ShopSettingsPage() {
  const [shop, setShop] = useState<{
    name: string;
    address: string | null;
    phone: string | null;
    paymentQrUrl: string | null;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>([]);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/shop").then((r) => r.json()).then((s) => {
      setShop(s);
      setSelectedCollegeIds(s.shopColleges?.map((sc: { collegeId: string }) => sc.collegeId) || []);
    }).catch(() => setShop(null));
    fetch("/api/colleges").then((r) => r.json()).then(setAllColleges).catch(() => setAllColleges([]));
  }, []);

  function toggleCollege(id: string) {
    setSelectedCollegeIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function saveColleges() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/shop/colleges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeIds: selectedCollegeIds }),
      });
      if (res.ok) setMessage("Colleges updated.");
      else setMessage("Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadQrAndSave() {
    if (!paymentFile) {
      setMessage("Select an image first.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", paymentFile);
      const up = await fetch("/api/upload", { method: "POST", body: form });
      const data = await up.json();
      if (!up.ok) {
        setMessage(data.error || "Upload failed");
        return;
      }
      await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentQrUrl: data.url }),
      });
      setMessage("Payment QR updated.");
      setShop((s) => (s ? { ...s, paymentQrUrl: data.url } : null));
      setPaymentFile(null);
    } finally {
      setSaving(false);
    }
  }

  if (!shop) return <p className="text-stone-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
      <p className="mt-1 text-stone-600">Update shop details and delivery colleges.</p>

      <div className="mt-6 card">
        <h2 className="font-semibold">Delivery colleges</h2>
        <p className="text-sm text-stone-500">Select campuses you deliver to. Students from these colleges (within 1 km) will see your shop.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {allColleges.map((c) => (
            <label key={c.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCollegeIds.includes(c.id)}
                onChange={() => toggleCollege(c.id)}
              />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
        <button type="button" onClick={saveColleges} disabled={saving} className="btn-primary mt-3">
          {saving ? "Saving…" : "Save colleges"}
        </button>
      </div>

      <div className="mt-6 card">
        <h2 className="font-semibold">Payment QR / Scanner</h2>
        <p className="text-sm text-stone-500">Upload an image of your payment scanner. Students will see this at checkout to pay you.</p>
        {shop.paymentQrUrl && (
          <div className="mt-2">
            <p className="text-sm">Current:</p>
            <div className="h-32 w-32 overflow-hidden rounded border relative">
              <Image src={shop.paymentQrUrl} alt="QR" fill sizes="128px" className="object-contain" />
            </div>
          </div>
        )}
        <div className="mt-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-stone-500 file:mr-2 file:rounded file:border-0 file:bg-campus-primary file:px-3 file:py-1.5 file:text-white"
          />
          <button type="button" onClick={uploadQrAndSave} disabled={saving || !paymentFile} className="btn-primary mt-2">
            Upload & save
          </button>
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}
    </div>
  );
}
