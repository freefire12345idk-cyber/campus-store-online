"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { NeonButton } from "@/components/NeonButton";

const ResponsiveContainer = dynamic(() => import("recharts").then((m: any) => m.ResponsiveContainer), { 
  ssr: false,
  loading: () => <div className="mt-4 text-stone-500">Loading charts…</div>
}) as any;
const BarChart = dynamic(() => import("recharts").then((m: any) => m.BarChart), { 
  ssr: false,
  loading: () => <div className="mt-4 text-stone-500">Loading charts…</div>
});
const Bar = dynamic(() => import("recharts").then((m: any) => m.Bar), { 
  ssr: false,
  loading: () => <div className="mt-4 text-stone-500">Loading charts…</div>
});
const XAxis = dynamic(() => import("recharts").then((m: any) => m.XAxis), { 
  ssr: false,
  loading: () => <div className="mt-4 text-stone-500">Loading charts…</div>
});
const YAxis = dynamic(() => import("recharts").then((m: any) => m.YAxis), { 
  ssr: false,
  loading: () => <div className="mt-4 text-stone-500">Loading charts…</div>
});
const Tooltip = dynamic(() => import("recharts").then((m: any) => m.Tooltip), { 
  ssr: false,
  loading: () => <div className="mt-4 text-stone-500">Loading charts…</div>
});
const Legend = dynamic(() => import("recharts").then((m: any) => m.Legend), { 
  ssr: false,
  loading: () => <div className="mt-4 text-stone-500">Loading charts…</div>
});

type College = { id: string; name: string; latitude: number; longitude: number };
type Product = { id: string; name: string; price: number; isBanned: boolean };
type Shop = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  shopPhoto: string | null;
  isApproved: boolean;
  owner: { user: { name: string | null; phone: string | null; email: string | null } } | null;
  products: Product[];
};
type StatsShop = {
  id: string;
  name: string;
  data: { date: string; dateKey: string; accepted: number; declined: number; delivered: number }[];
};

export default function AdminDashboardPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ last24hTotal: number; shops: StatsShop[] } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newCollegeLat, setNewCollegeLat] = useState("");
  const [newCollegeLng, setNewCollegeLng] = useState("");

  const loadShops = useCallback(() => {
    return fetch("/api/admin/shops").then((r) => r.json()).then(setShops).catch(() => setShops([]));
  }, []);
  const loadColleges = useCallback(() => {
    return fetch("/api/admin/colleges").then((r) => r.json()).then(setColleges).catch(() => setColleges([]));
  }, []);
  const load = useCallback(() => {
    setLoading(true);
    Promise.all([loadShops(), loadColleges()]).finally(() => setLoading(false));
  }, [loadColleges, loadShops]);
  const loadStats = useCallback(() => {
    setStatsLoading(true);
    fetch("/api/admin/stats")
      .then((r) => {
        console.log("Stats response:", r);
        return r.json();
      })
      .then((data) => {
        console.log("Stats data:", data);
        setStats(data);
      })
      .catch((error) => {
        console.error("Stats error:", error);
        setStats(null);
      })
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    load();
    loadStats();
  }, [load, loadStats]);

  async function approve(id: string) {
    await fetch(`/api/admin/shops/${id}/approve`, { method: "PATCH" });
    load();
  }

  async function reject(id: string) {
    await fetch(`/api/admin/shops/${id}/reject`, { method: "PATCH" });
    load();
  }

  async function addCollege(e: React.FormEvent) {
    e.preventDefault();
    const lat = parseFloat(newCollegeLat);
    const lng = parseFloat(newCollegeLng);
    if (!newCollegeName.trim() || isNaN(lat) || isNaN(lng)) return;
    const res = await fetch("/api/admin/colleges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCollegeName.trim(), latitude: lat, longitude: lng }),
    });
    if (res.ok) {
      setNewCollegeName("");
      setNewCollegeLat("");
      setNewCollegeLng("");
      loadColleges();
    }
  }

  async function deleteCollege(id: string) {
    if (!confirm("Delete this college? Students/shops linked to it may be affected.")) return;
    await fetch(`/api/admin/colleges/${id}`, { method: "DELETE" });
    loadColleges();
  }

  const mapsUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps?q=${lat},${lng}`;

  async function toggleBan(productId: string, isBanned: boolean) {
    await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned }),
    });
    loadShops();
  }

  if (loading) return <p className="text-stone-500">Loading…</p>;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-stone-900">Admin Dashboard</h1>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card md:col-span-1">
          <h2 className="font-semibold text-lg">Last 24 Hours</h2>
          <p className="text-sm text-stone-500 mt-1">Total orders across all shops</p>
          <div className="mt-4 text-4xl font-bold text-campus-primary">
            {statsLoading ? "—" : (
              <span className="inline-flex items-center rounded-full border border-slate-700/60 bg-slate-950/70 px-4 py-1 text-3xl text-slate-100 backdrop-blur">
                {stats?.last24hTotal ?? 0}
              </span>
            )}
          </div>
        </div>
        <div className="card md:col-span-2">
          <h2 className="font-semibold text-lg">6-Day Order Trends</h2>
          <p className="text-sm text-stone-500 mt-1">Accepted, declined, and delivered totals per shop</p>
          {statsLoading ? (
            <p className="mt-4 text-stone-500">Loading charts…</p>
          ) : stats?.shops?.length ? (
            <div className="mt-4 space-y-6">
              {stats.shops.map((shop) => (
                <div key={shop.id} className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{shop.name}</p>
                    <span className="text-xs text-stone-500">Last 6 days</span>
                  </div>
                  <div className="mt-3 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={shop.data}>
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(15, 23, 42, 0.9)",
                            border: "1px solid rgba(148, 163, 184, 0.2)",
                            borderRadius: "10px",
                            color: "#e2e8f0",
                          }}
                          cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                        />
                        <Legend />
                        <Bar dataKey="accepted" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="declined" fill="#f472b6" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="delivered" fill="#34d399" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-stone-500">No orders yet.</p>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="font-semibold text-lg">Manage Colleges</h2>
        <p className="text-sm text-stone-500 mt-1">Add or remove colleges. Students and shops use this list.</p>
        <form onSubmit={addCollege} className="mt-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-stone-600">Name</label>
            <input type="text" value={newCollegeName} onChange={(e) => setNewCollegeName(e.target.value)} className="input mt-1 w-40" placeholder="e.g. TIT" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600">Latitude</label>
            <input type="number" step="any" value={newCollegeLat} onChange={(e) => setNewCollegeLat(e.target.value)} className="input mt-1 w-28" placeholder="23.26" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600">Longitude</label>
            <input type="number" step="any" value={newCollegeLng} onChange={(e) => setNewCollegeLng(e.target.value)} className="input mt-1 w-28" placeholder="77.41" required />
          </div>
          <NeonButton type="submit" className="text-sm py-2">Add College</NeonButton>
        </form>
        <ul className="mt-4 space-y-2">
          {colleges.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
              <span className="font-medium">{c.name}</span>
              <span className="text-sm text-stone-500">({c.latitude}, {c.longitude})</span>
              <button type="button" onClick={() => deleteCollege(c.id)} className="text-sm text-red-600 hover:underline">Delete</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-lg">Pending Shops</h2>
        <p className="text-sm text-stone-500 mt-1">Review and approve shops. Only approved shops are visible to students.</p>
        {shops.length === 0 ? (
          <p className="mt-4 text-stone-500">No shops registered yet.</p>
        ) : (
          <ul className="mt-4 space-y-6">
            {shops.map((shop) => (
              <li key={shop.id} className="card">
                <div className="flex flex-wrap gap-4">
                  {shop.shopPhoto && (
                    <div className="h-28 w-28 overflow-hidden rounded-lg border relative">
                      <Image src={shop.shopPhoto} alt={shop.name} fill sizes="112px" className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{shop.name}</h3>
                    <p className="text-sm text-stone-500">{shop.address || "—"}</p>
                    <p className="text-sm text-stone-600 mt-2">
                      <strong>Owner Name:</strong> {shop.owner?.user?.name ?? "—"}<br />
                      <strong>Email:</strong> {shop.owner?.user?.email ?? "—"}<br />
                      <strong>Phone:</strong> {shop.owner?.user?.phone ?? "—"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <a href={mapsUrl(shop.latitude, shop.longitude)} target="_blank" rel="noopener noreferrer" className="text-sm text-campus-primary hover:underline">
                        View on Google Maps
                      </a>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${shop.isApproved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                        {shop.isApproved ? "Approved" : "Pending"}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {!shop.isApproved && (
                        <NeonButton type="button" onClick={() => approve(shop.id)} className="text-sm py-1.5">
                          Approve
                        </NeonButton>
                      )}
                      {shop.isApproved && (
                        <NeonButton type="button" onClick={() => reject(shop.id)} variant="secondary" neonColor="#f59e0b" className="text-sm py-1.5">
                          Reject
                        </NeonButton>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="font-semibold text-lg">Manage Products</h2>
        <p className="text-sm text-stone-500 mt-1">Ban products to hide them from the student marketplace.</p>
        <div className="mt-4 space-y-6">
          {shops.map((shop) => (
            <div key={shop.id} className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{shop.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${shop.isApproved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                  {shop.isApproved ? "Approved" : "Pending"}
                </span>
              </div>
              {shop.products.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">No products yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {shop.products.map((product) => (
                    <li key={product.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2">
                      <div className="min-w-0">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm">
                          <span className="glass-chip">₹{product.price.toFixed(2)}</span>
                        </p>
                      </div>
                      <NeonButton
                        type="button"
                        onClick={() => toggleBan(product.id, !product.isBanned)}
                        variant={product.isBanned ? "secondary" : "primary"}
                        neonColor={product.isBanned ? "#34d399" : "#f472b6"}
                        className="text-sm py-1.5"
                      >
                        {product.isBanned ? "Unban" : "Ban"}
                      </NeonButton>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
