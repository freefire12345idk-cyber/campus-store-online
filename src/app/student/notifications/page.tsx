"use client";

import { useState, useEffect } from "react";

type Notif = { id: string; title: string; body: string; read: boolean; createdAt: string };

export default function StudentNotificationsPage() {
  const [list, setList] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  if (loading) return <p className="text-stone-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Notifications</h1>
      {list.length === 0 ? (
        <p className="mt-4 text-stone-500">No notifications.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {list.map((n) => (
            <li
              key={n.id}
              className={`card cursor-pointer ${!n.read ? "border-l-4 border-l-campus-primary" : ""}`}
              onClick={() => !n.read && markRead(n.id)}
            >
              <p className="font-medium">{n.title}</p>
              <p className="text-sm text-stone-600">{n.body}</p>
              <p className="mt-1 text-xs text-stone-400">{new Date(n.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
