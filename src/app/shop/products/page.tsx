"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Product = { id: string; name: string; price: number; description: string | null; imageUrl: string | null; isBanned: boolean };

export default function ShopProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  function load() {
    fetch("/api/shop/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/shop/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price: Number(price),
        description: description || undefined,
        imageUrl: imageUrl || undefined,
      }),
    });
    if (res.ok) {
      setName("");
      setPrice("");
      setDescription("");
      setImageUrl("");
      setShowForm(false);
      load();
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/shop/products/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className="text-stone-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Products</h1>
        <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "Add product"}
        </button>
      </div>
      {showForm && (
        <form onSubmit={addProduct} className="mt-6 card space-y-3">
          <div>
            <label className="block text-sm font-medium text-stone-700">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Price (₹) *</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input mt-1" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Product photo</label>
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
                if (res.ok && data.url) setImageUrl(data.url);
              }}
              className="mt-1 block w-full text-sm text-stone-500 file:mr-2 file:rounded file:border-0 file:bg-campus-primary file:px-3 file:py-1.5 file:text-white"
            />
            {imageUrl && (
              <div className="mt-2 h-20 w-20 overflow-hidden rounded border relative">
                <Image src={imageUrl} alt="Product" fill sizes="80px" className="object-cover" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="input mt-1" />
          </div>
          <button type="submit" className="btn-primary">Save</button>
        </form>
      )}
      <ul className="mt-6 space-y-3">
        {products.map((p) => (
          <li key={p.id} className="card flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {p.imageUrl && (
                <div className="h-14 w-14 overflow-hidden rounded border relative">
                  <Image src={p.imageUrl} alt={p.name} fill sizes="56px" className="object-cover" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{p.name}</p>
                  {p.isBanned && (
                    <span className="rounded-full border border-red-500/60 bg-red-500/10 px-2 py-0.5 text-xs text-red-200">
                      Banned
                    </span>
                  )}
                </div>
                <p className="text-sm">
                  <span className="glass-chip">₹{p.price.toFixed(2)}</span>
                </p>
                {p.description && <p className="text-sm text-stone-600">{p.description}</p>}
              </div>
            </div>
            <button type="button" onClick={() => deleteProduct(p.id)} className="text-sm text-red-600 hover:underline">Delete</button>
          </li>
        ))}
      </ul>
      {products.length === 0 && !showForm && <p className="mt-4 text-stone-500">No products yet. Add items students can order.</p>}
    </div>
  );
}
