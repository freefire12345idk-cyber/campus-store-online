"use client";

import { useEffect, useState } from "react";

type Report = {
  id: string;
  type: string;
  description: string;
  attachmentUrl: string | null;
  status: string;
  createdAt: string;
  reporter: { name: string | null; email: string | null; phone: string | null };
  shop: { id: string; name: string } | null;
  student: { id: string; user: { name: string | null; email: string | null; phone: string | null } } | null;
  product: { id: string; name: string } | null;
  order: { id: string } | null;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  async function updateReport(id: string, payload: Record<string, unknown>) {
    setActioningId(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) load();
    } finally {
      setActioningId(null);
    }
  }

  if (loading) return <p className="text-stone-500">Loading reports…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Reports</h1>
      <p className="mt-1 text-stone-600">Review owner and student reports and take action.</p>
      {reports.length === 0 ? (
        <p className="mt-6 text-stone-500">No reports yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {reports.map((report) => (
            <li key={report.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {report.type === "fake_payment" ? "Fake payment report" : "Bad product report"}
                  </p>
                  <p className="text-sm text-stone-500">
                    Status: {report.status} · {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateReport(report.id, { status: "resolved" })}
                    disabled={actioningId === report.id}
                    className="btn-secondary text-sm py-1.5"
                  >
                    Mark resolved
                  </button>
                  {report.shop && (
                    <button
                      type="button"
                      onClick={() => updateReport(report.id, { banShop: true, status: "resolved" })}
                      disabled={actioningId === report.id}
                      className="btn-primary text-sm py-1.5"
                    >
                      Ban shop
                    </button>
                  )}
                  {report.student && (
                    <button
                      type="button"
                      onClick={() => updateReport(report.id, { banStudent: true, status: "resolved" })}
                      disabled={actioningId === report.id}
                      className="btn-primary text-sm py-1.5"
                    >
                      Ban student
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm text-stone-600">{report.description}</p>
              <div className="mt-3 grid gap-2 text-sm text-stone-500 sm:grid-cols-2">
                <div>
                  <p className="font-medium text-stone-700">Reporter</p>
                  <p>{report.reporter.name || "—"}</p>
                  <p>{report.reporter.email || report.reporter.phone || "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-stone-700">Order</p>
                  <p>{report.order ? `#${report.order.id.slice(-6)}` : "—"}</p>
                  <p>{report.product?.name || "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-stone-700">Shop</p>
                  <p>{report.shop?.name || "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-stone-700">Student</p>
                  <p>{report.student?.user.name || "—"}</p>
                  <p>{report.student?.user.email || report.student?.user.phone || "—"}</p>
                </div>
              </div>
              {report.attachmentUrl && (
                <div className="mt-3">
                  <a
                    href={report.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-campus-primary hover:underline"
                  >
                    View attachment
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
