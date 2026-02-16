"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

type College = { id: string; name: string };
type Product = { id: string; name: string; price: number };
type Shop = {
  id: string;
  name: string;
  address: string | null;
  shopPhoto: string | null;
  paymentQrUrl: string | null;
  products: Product[];
};

export default function StudentShopsPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [collegeId, setCollegeId] = useState("");
  const [lockedCollegeId, setLockedCollegeId] = useState<string | null>(null);
  const [collegeError, setCollegeError] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetch("/api/colleges")
      .then((r) => r.json())
      .then((list: College[]) => {
        setColleges(list);
        if (lockedCollegeId) setCollegeId(lockedCollegeId);
        else if (list.length) setCollegeId(list[0].id);
      })
      .catch(() => {});
  }, [lockedCollegeId]);

  useEffect(() => {
    if (!collegeId) {
      setShops([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/shops/nearby?collegeId=${collegeId}`)
      .then((r) => r.json())
      .then((data) => {
        setShops(Array.isArray(data) ? data : []);
      })
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, [collegeId]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Nearby shops (within 1 km)</h1>
      <p className="mt-1 text-stone-600">
        {lockedCollegeId ? "Your college is locked to your student profile." : "Select your college to see shops that deliver to you."}
        {" "}You can order from one shop at a time.
      </p>
      <div className="mt-4">
        <label className="block text-sm font-medium text-stone-700">Your college</label>
        <select
          value={collegeId}
          onChange={(e) => setCollegeId(e.target.value)}
          className="input mt-1 max-w-xs"
          disabled={!!lockedCollegeId || !!collegeError}
        >
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {collegeError && <p className="mt-2 text-sm text-red-600">{collegeError}</p>}
      </div>
      {loading ? (
        <p className="mt-6 text-stone-500">Loading shops…</p>
      ) : shops.length === 0 ? (
        <p className="mt-6 text-stone-500">No shops within 1 km of this college.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <li key={shop.id}>
              <Link href={`/student/shop/${shop.id}`} className="card block hover:border-campus-primary/50 transition flex gap-3">
                {shop.shopPhoto && (
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image src={shop.shopPhoto} alt="" fill sizes="80px" className="object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-semibold text-stone-900">{shop.name}</h2>
                  {shop.address && <p className="mt-1 text-sm text-stone-600">{shop.address}</p>}
                  <p className="mt-2 text-sm">
                    <span className="glass-chip">{shop.products.length} products</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
