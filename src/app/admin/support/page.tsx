"use client";

import { useEffect, useState } from "react";

type Contact = {
  id: string;
  name: string;
  whatsapp: string | null;
  telegram: string | null;
  email: string | null;
  phone: string | null;
};

export default function AdminSupportPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/admin/support")
      .then((r) => r.json())
      .then(setContacts)
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          whatsapp: whatsapp || undefined,
          telegram: telegram || undefined,
          email: email || undefined,
          phone: phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.formErrors?.[0] || data.error || "Failed");
        return;
      }
      setName("");
      setWhatsapp("");
      setTelegram("");
      setEmail("");
      setPhone("");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function removeContact(id: string) {
    if (!confirm("Remove this contact?")) return;
    await fetch(`/api/admin/support/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Support Contacts</h1>
        <p className="mt-1 text-stone-600">Add or remove developer support contacts shown to users.</p>
      </div>

      <form onSubmit={addContact} className="card space-y-3">
        <div>
          <label className="block text-sm font-medium text-stone-700">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-stone-700">WhatsApp (phone or link)</label>
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="input mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Telegram (username or link)</label>
            <input value={telegram} onChange={(e) => setTelegram(e.target.value)} className="input mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Phone (for call)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input mt-1" />
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Add contact"}
        </button>
      </form>

      <div className="card">
        <h2 className="font-semibold">Current contacts</h2>
        {loading ? (
          <p className="mt-3 text-stone-500">Loading…</p>
        ) : contacts.length === 0 ? (
          <p className="mt-3 text-stone-500">No contacts yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {contacts.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2">
                <div className="min-w-0">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-stone-500">
                    {c.whatsapp || "—"} · {c.telegram || "—"} · {c.email || "—"} · {c.phone || "—"}
                  </p>
                </div>
                <button type="button" onClick={() => removeContact(c.id)} className="text-sm text-red-400 hover:underline">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
