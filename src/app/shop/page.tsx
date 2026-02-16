"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ShopDashboardPage() {
  const [shop, setShop] = useState<{ name: string; shopColleges: { college: { name: string } }[] } | null>(null);
  const [ordersCount, setOrdersCount] = useState(0);

  useEffect(() => {
    fetch("/api/shop").then((r) => r.json()).then(setShop).catch(() => setShop(null));
    fetch("/api/orders").then((r) => r.json()).then((list: unknown[]) => setOrdersCount(list.length)).catch(() => {});
  }, []);

  if (!shop) return <p className="text-stone-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{shop.name}</h1>
      <p className="mt-1 text-stone-600">Manage products, orders and delivery colleges.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/shop/products" className="card hover:border-campus-primary/50 transition">
          <h2 className="font-semibold">Products</h2>
          <p className="text-sm text-stone-500">Add and edit items students can order.</p>
        </Link>
        <Link href="/shop/orders" className="card hover:border-campus-primary/50 transition">
          <h2 className="font-semibold">Orders</h2>
          <p className="text-sm text-stone-500">{ordersCount} order(s). Accept/decline and update status.</p>
        </Link>
      </div>
      <div className="mt-4 card">
        <h2 className="font-semibold">Delivery colleges</h2>
        <p className="text-sm text-stone-500">You deliver to: {shop.shopColleges?.map((sc) => sc.college.name).join(", ") || "None"}. Change in Settings.</p>
      </div>
    </div>
  );
}
