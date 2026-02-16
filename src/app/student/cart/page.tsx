"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type CartItem = { productId: string; name: string; price: number; quantity: number };

export default function StudentCartPage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("cart");
    if (!raw) return;
    const data = JSON.parse(raw);
    setShopId(data.shopId || null);
    setShopName(data.shopName || "");
    setItems(data.items || []);
  }, []);

  function updateQty(productId: string, delta: number) {
    setItems((prev) => {
      const next = prev
        .map((i) =>
          i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
        )
        .filter((i) => i.quantity > 0);
      if (shopId) localStorage.setItem("cart", JSON.stringify({ shopId, shopName, items: next }));
      return next;
    });
  }

  function remove(productId: string) {
    updateQty(productId, -999);
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (!shopId && items.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-stone-600">Your cart is empty.</p>
        <Link href="/student" className="btn-primary mt-4 inline-block">Browse shops</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Cart</h1>
      <p className="mt-1 text-stone-600">Order from one shop at a time. Current: {shopName}</p>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item.productId} className="card flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-medium">{item.name}</span>
              <span className="ml-2 glass-chip">₹{item.price.toFixed(2)} × {item.quantity}</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => updateQty(item.productId, -1)} className="rounded border border-stone-300 px-2 py-1 text-sm">−</button>
              <span>{item.quantity}</span>
              <button type="button" onClick={() => updateQty(item.productId, 1)} className="rounded border border-stone-300 px-2 py-1 text-sm">+</button>
              <button type="button" onClick={() => remove(item.productId)} className="text-sm text-red-600 hover:underline">Remove</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 card flex justify-between items-center">
        <span className="text-lg font-semibold">
          Total: <span className="glass-chip">₹{total.toFixed(2)}</span>
        </span>
        <Link href="/student/checkout" className="btn-primary">Proceed to checkout</Link>
      </div>
    </div>
  );
}
