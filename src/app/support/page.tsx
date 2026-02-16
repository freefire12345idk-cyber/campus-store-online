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

function normalizeWhatsApp(value: string) {
  if (value.startsWith("http")) return value;
  const digits = value.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : value;
}

function normalizeTelegram(value: string) {
  if (value.startsWith("http")) return value;
  const username = value.replace("@", "");
  return username ? `https://t.me/${username}` : value;
}

export default function SupportPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/support")
      .then((r) => r.json())
      .then((list) => setContacts(Array.isArray(list) ? list.slice(0, 5) : []))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-stone-900">Support</h1>
      <p className="mt-1 text-stone-600">Contact the developer support team for urgent issues.</p>
      {loading ? (
        <p className="mt-6 text-stone-500">Loading contacts…</p>
      ) : contacts.length === 0 ? (
        <p className="mt-6 text-stone-500">No support contacts available.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {contacts.map((c) => (
            <li key={c.id} className="glass-card">
              <p className="font-semibold">{c.name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.whatsapp && (
                  <a
                    href={normalizeWhatsApp(c.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm py-1.5"
                  >
                    WhatsApp
                  </a>
                )}
                {c.telegram && (
                  <a
                    href={normalizeTelegram(c.telegram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm py-1.5"
                  >
                    Telegram
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="btn-secondary text-sm py-1.5">
                    Email
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="btn-primary text-sm py-1.5">
                    Call
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
