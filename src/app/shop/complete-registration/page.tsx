"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type College = { id: string; name: string };

export default function CompleteShopRegistrationPage() {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopLat, setShopLat] = useState<number | null>(null);
  const [shopLng, setShopLng] = useState<number | null>(null);
  const [locationError, setLocationError] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopPhotoUrl, setShopPhotoUrl] = useState("");
  const [paymentQrUrl, setPaymentQrUrl] = useState("");
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => {
        if (u.error || u.role !== "shop_owner") {
          router.push("/login");
          return;
        }
        if (u.shopId) {
          router.push("/shop");
          return;
        }
        setChecking(false);
      })
      .catch(() => router.push("/login"));
    fetch("/api/colleges").then((r) => r.json()).then((list: College[]) => {
      setColleges(list);
      setSelectedCollegeIds(list.length ? [list[0].id] : []);
    });
  }, [router]);

  function toggleCollege(id: string) {
    setSelectedCollegeIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function getLocation() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setShopLat(pos.coords.latitude);
        setShopLng(pos.coords.longitude);
      },
      () => setLocationError("Could not get location. Allow location access.")
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopPhotoUrl) {
      setError("Please upload a photo of your shop.");
      return;
    }
    if (!paymentQrUrl) {
      setError("Please upload your payment QR code.");
      return;
    }
    if (shopLat == null || shopLng == null) {
      setError("Please tap \"Get my location\" to set your shop location.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName,
          shopAddress: shopAddress || undefined,
          shopLat,
          shopLng,
          shopPhone: shopPhone || undefined,
          shopPhotoUrl,
          paymentQrUrl,
          collegeIds: selectedCollegeIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || data.error || "Failed");
        return;
      }
      router.push("/shop");
    } finally {
      setLoading(false);
    }
  }

  if (checking) return <p className="p-8 text-stone-500">Loading…</p>;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-stone-900">Complete shop registration</h1>
      <p className="mt-1 text-stone-600">Add your shop details. Admin will approve before your shop is visible to students.</p>
      <form onSubmit={handleSubmit} className="mt-6 card space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700">Shop name *</label>
          <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} className="input mt-1" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Shop photo *</label>
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
          <input type="text" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} className="input mt-1" placeholder="e.g. Near temple" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Shop location *</label>
          <p className="text-xs text-stone-500">Turn on GPS, then tap the button below.</p>
          <button type="button" onClick={getLocation} className="btn-primary mt-1 text-sm">Get my location</button>
          {locationError && <p className="text-xs text-red-600 mt-1">{locationError}</p>}
          {shopLat != null && shopLng != null && (
            <a href={`https://www.google.com/maps?q=${shopLat},${shopLng}`} target="_blank" rel="noopener noreferrer" className="text-sm text-campus-primary hover:underline mt-2 inline-block">View on Google Maps</a>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Shop phone</label>
          <input type="tel" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} className="input mt-1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Colleges we deliver to *</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {colleges.map((c) => (
              <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={selectedCollegeIds.includes(c.id)} onChange={() => toggleCollege(c.id)} />
                <span className="text-sm">{c.name}</span>
              </label>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">Submit for approval</button>
      </form>
    </div>
  );
}
