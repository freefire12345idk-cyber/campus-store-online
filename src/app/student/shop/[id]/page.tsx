"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ImageModal } from "@/components/ImageModal";

type Product = { id: string; name: string; price: number; description: string | null; imageUrl: string | null };
type Shop = {
  id: string;
  name: string;
  shopPhoto: string | null;
  products: Product[];
};

export default function StudentShopPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [shop, setShop] = useState<Shop | null>(null);
  const [cart, setCart] = useState<{ productId: string; name: string; price: number; quantity: number }[]>([]);
  const [productImageModal, setProductImageModal] = useState<{ open: boolean; src: string; alt: string }>({ open: false, src: "", alt: "" });

  useEffect(() => {
    fetch(`/api/shops/${id}`)
      .then((r) => r.json())
      .then((s: Shop | { error: string }) => ("error" in s ? null : s))
      .then(setShop)
      .catch(() => setShop(null));
  }, [id]);

  useEffect(() => {
    const raw = localStorage.getItem("cart");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.shopId === id) setCart(data.items || []);
    else setCart([]);
  }, [id]);

  function addToCart(product: Product, qty: number = 1) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      let next;
      if (existing) {
        next = prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      } else {
        next = [...prev, { productId: product.id, name: product.name, price: product.price, quantity: qty }];
      }
      localStorage.setItem(
        "cart",
        JSON.stringify({ shopId: id, shopName: shop?.name, items: next })
      );
      return next;
    });
  }

  if (!shop) return <p className="text-stone-500">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {shop.shopPhoto && (
            <div className="relative h-14 w-14 overflow-hidden rounded-lg">
              <Image src={shop.shopPhoto} alt="" fill sizes="56px" className="object-cover" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-stone-900">{shop.name}</h1>
        </div>
        <button
          type="button"
          onClick={() => router.push("/student/cart")}
          className="btn-primary"
        >
          Cart {cart.length > 0 ? <span className="ml-2 glass-chip">{cart.length}</span> : ""}
        </button>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shop.products.map((product) => (
          <li key={product.id} className="card flex flex-col">
            {product.imageUrl && (
              <button
                type="button"
                onClick={() => setProductImageModal({ open: true, src: product.imageUrl!, alt: product.name })}
                className="w-full h-32 rounded-lg mb-2 overflow-hidden border border-stone-200 hover:border-campus-primary focus:outline-none focus:ring-2 focus:ring-campus-primary text-left relative"
              >
                <Image src={product.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
              </button>
            )}
            <h2 className="font-medium text-stone-900">{product.name}</h2>
            {product.description && <p className="mt-1 text-sm text-stone-600">{product.description}</p>}
            <p className="mt-2">
              <span className="glass-chip">₹{product.price.toFixed(2)}</span>
            </p>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={1}
                defaultValue={1}
                id={`qty-${product.id}`}
                className="w-16 rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-center text-sm text-slate-100 focus:border-campus-primary focus:outline-none focus:ring-1 focus:ring-campus-primary"
              />
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(`qty-${product.id}`) as HTMLInputElement;
                  const v = parseInt(el?.value || "1", 10);
                  if (v > 0) addToCart(product, v);
                }}
                className="btn-primary text-sm py-1.5 px-3"
              >
                Add to cart
              </button>
            </div>
          </li>
        ))}
      </ul>
      {shop.products.length === 0 && <p className="text-stone-500">No products listed yet.</p>}
      <ImageModal
        src={productImageModal.src}
        alt={productImageModal.alt}
        open={productImageModal.open}
        onClose={() => setProductImageModal({ open: false, src: "", alt: "" })}
      />
    </div>
  );
}
