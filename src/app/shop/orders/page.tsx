"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ImageModal } from "@/components/ImageModal";

type Order = {
  id: string;
  status: string;
  totalAmount: number;
  paymentProofUrl: string | null;
  deliveryOtp: string | null;
  hostelBranch: string | null;
  rollNo: string | null;
  college: { name: string };
  student: { user: { id: string; name: string | null; phone: string | null; email: string | null }; hostelBranch: string | null; rollNo: string | null };
  items: { product: { name: string }; quantity: number; price: number }[];
};

const statusOptions: { value: string; label: string; color: string }[] = [
  { value: "accepted", label: "Accept", color: "bg-green-600" },
  { value: "declined", label: "Decline", color: "bg-red-600" },
  { value: "preparing", label: "Preparing", color: "bg-amber-600" },
  { value: "out_for_delivery", label: "Out for delivery", color: "bg-blue-600" },
  { value: "reached_location", label: "Reached at location", color: "bg-teal-600" },
  { value: "delivered", label: "Delivered", color: "bg-emerald-700" },
];

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<{ orderId: string; status: string } | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; src: string }>({ open: false, src: "" });
  const [reportOrderId, setReportOrderId] = useState<string | null>(null);
  const [reportDescription, setReportDescription] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [chatPartnerId, setChatPartnerId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ id: string; senderId: string; receiverId: string; content: string; createdAt: string; orderId?: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState("");

  function load() {
    fetch("/api/orders")
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);
  useEffect(() => {
    if (!chatPartnerId) return;
    let mounted = true;
    const fetchMessages = async () => {
      setChatLoading(true);
      try {
        const res = await fetch(`/api/messages?userId=${chatPartnerId}${chatOrderId ? `&orderId=${chatOrderId}` : ''}`);
        const data = await res.json();
        if (mounted && res.ok) setChatMessages(data);
      } finally {
        if (mounted) setChatLoading(false);
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [chatPartnerId, chatOrderId]);

  async function updateStatus(orderId: string, status: string) {
    setUpdating({ orderId, status });
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      load();
    } finally {
      setUpdating(null);
    }
  }

  const canShowButton = (order: Order, value: string) => {
    const flow = ["pending_accept", "accepted", "preparing", "out_for_delivery", "reached_location", "delivered"];
    const idx = flow.indexOf(order.status);
    const targetIdx = flow.indexOf(value);
    if (value === "declined") return order.status === "pending_accept";
    if (value === "accepted") return order.status === "pending_accept";
    if (value === "preparing") return order.status === "accepted";
    if (value === "out_for_delivery") return order.status === "preparing";
    if (value === "reached_location") return order.status === "out_for_delivery";
    if (value === "delivered") return order.status === "reached_location";
    return false;
  };
  const canContactStudent = (status: string) =>
    ["accepted", "preparing", "out_for_delivery", "reached_location", "delivered"].includes(status);

  async function sendMessage() {
    if (!chatPartnerId) return;
    if (!chatInput.trim()) return;
    setChatSending(true);
    setChatError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: chatPartnerId, content: chatInput, orderId: chatOrderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChatError(data.error || "Failed to send");
        return;
      }
      setChatInput("");
      setChatMessages((prev) => [...prev, data]);
    } finally {
      setChatSending(false);
    }
  }

  async function submitReport(orderId: string) {
    if (!reportDescription.trim()) {
      setReportMessage("Please describe the issue.");
      return;
    }
    if (!reportFile) {
      setReportMessage("Please upload the payment screenshot.");
      return;
    }
    setReportMessage("");
    setReporting(true);
    try {
      const form = new FormData();
      form.append("file", reportFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setReportMessage(uploadData.error || "Upload failed");
        return;
      }
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "fake_payment",
          description: reportDescription,
          attachmentUrl: uploadData.url,
          orderId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReportMessage(data.error || "Report failed");
        return;
      }
      setReportMessage("Report submitted to admin.");
      setReportOrderId(null);
      setReportDescription("");
      setReportFile(null);
    } finally {
      setReporting(false);
    }
  }

  if (loading) return <p className="text-stone-500">Loading…</p>;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <h1 className="text-2xl font-bold text-stone-900">Shop Orders</h1>
      <p className="mt-1 text-stone-600">Manage incoming orders and chat with students.</p>
      {orders.length === 0 ? (
        <p className="mt-6 text-stone-500">No orders yet.</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {orders.map((order) => (
            <li key={order.id} className="card">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="font-medium">
                    #{order.id.slice(-6)} · <span className="glass-chip">₹{order.totalAmount.toFixed(2)}</span>
                  </p>
                  <p className="text-sm text-stone-500">
                    {order.student.user.name || "—"} · {order.college.name}
                    {order.hostelBranch && ` · ${order.hostelBranch}`}
                    {order.rollNo && ` · Roll ${order.rollNo}`}
                  </p>
                  {canContactStudent(order.status) ? (
                    <p className="text-sm text-stone-600 mt-0.5">
                      <strong>Student contact:</strong> Phone {order.student.user.phone ?? "—"} · Email {order.student.user.email ?? "—"}
                    </p>
                  ) : (
                    <p className="text-sm text-stone-600 mt-0.5">
                      <strong>Student contact:</strong> Available after acceptance
                    </p>
                  )}
                  <p className="text-sm text-stone-600">Status: {order.status.replace(/_/g, " ")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((opt) => {
                    const isActive = order.status === opt.value;
                    const canClick = canShowButton(order, opt.value);
                    const isUpdating = updating?.orderId === order.id && updating?.status === opt.value;
                    const borderClass = `border-2 ${opt.value === "declined" ? "border-red-500" : opt.value === "accepted" ? "border-green-600" : opt.value === "preparing" ? "border-amber-600" : opt.value === "out_for_delivery" ? "border-blue-600" : opt.value === "reached_location" ? "border-teal-600" : "border-emerald-700"}`;
                    if (canClick) {
                      return (
                        <motion.button
                          key={opt.value}
                          type="button"
                          disabled={!!updating}
                          onClick={() => updateStatus(order.id, opt.value)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-60 disabled:cursor-not-allowed ${borderClass}`}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {isUpdating ? (
                            <span className="inline-block w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin align-middle" />
                          ) : (
                            opt.label
                          )}
                        </motion.button>
                      );
                    }
                    if (isActive) {
                      return (
                        <motion.span
                          key={opt.value}
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white ${opt.color}`}
                        >
                          {opt.label}
                        </motion.span>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
              {canContactStudent(order.status) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {order.student.user.phone && (
                    <a href={`tel:${order.student.user.phone}`} className="btn-secondary text-sm py-1.5 px-3">
                      Call student
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setChatOrderId(chatOrderId === order.id ? null : order.id);
                      setChatPartnerId(order.student.user.id);
                      setChatError("");
                    }}
                    className="btn-primary text-sm py-1.5 px-3"
                  >
                    Chat with student
                  </button>
                </div>
              )}
              {order.paymentProofUrl && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-stone-700">Payment proof (click to zoom):</p>
                  <button
                    type="button"
                    onClick={() => setPaymentModal({ open: true, src: order.paymentProofUrl! })}
                    className="mt-2 block rounded border border-stone-200 hover:border-campus-primary focus:outline-none focus:ring-2 focus:ring-campus-primary"
                  >
                    <div className="relative h-32 w-40 overflow-hidden rounded">
                      <Image src={order.paymentProofUrl} alt="Payment" fill sizes="160px" className="object-contain" />
                    </div>
                  </button>
                </div>
              )}
              <ul className="mt-3 text-sm text-stone-600">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.product.name} × {item.quantity} — <span className="glass-chip">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              {order.deliveryOtp && (
                <p className="mt-2 text-sm font-mono text-campus-primary">Delivery OTP: {order.deliveryOtp}</p>
              )}
              {chatOrderId === order.id && chatPartnerId === order.student.user.id && (
                <div className="mt-4 rounded-lg border border-slate-800/60 bg-slate-950/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-stone-200">You are chatting regarding Order #{order.id.slice(-6)}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setChatOrderId(null);
                        setChatPartnerId(null);
                      }}
                      className="text-xs text-stone-400 hover:text-stone-200"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-3 max-h-80 space-y-2 overflow-y-auto" ref={(el) => {
                    if (el) {
                      setTimeout(() => {
                        el.scrollTop = el.scrollHeight;
                      }, 100);
                    }
                  }}>
                    {chatLoading ? (
                      <p className="text-sm text-stone-500">Loading messages…</p>
                    ) : chatMessages.length === 0 ? (
                      <p className="text-sm text-stone-500">No messages yet.</p>
                    ) : (
                      <>
                        {chatMessages.map((msg, index) => {
                          const prevMsg = index > 0 ? chatMessages[index - 1] : null;
                          const showSeparator = prevMsg && prevMsg.orderId && msg.orderId && prevMsg.orderId !== msg.orderId;
                          
                          return (
                            <div key={msg.id}>
                              {showSeparator && (
                                <div className="py-2 text-center">
                                  <div className="inline-block px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-400">
                                    --- End of Previous Order Conversation ---
                                  </div>
                                </div>
                              )}
                              <div
                                className={`flex ${
                                  msg.senderId === order.student.user.id ? 'justify-start' : 'justify-end'
                                } mb-2`}
                              >
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                                  msg.senderId === order.student.user.id 
                                    ? 'bg-slate-800/80 text-stone-200 rounded-bl-none' 
                                    : 'bg-gradient-to-r from-campus-primary/30 to-campus-secondary/30 text-white rounded-br-none border border-campus-primary/20'
                                }`}>
                                  {msg.senderId === order.student.user.id && (
                                    <p className="text-xs text-slate-400 mb-1 font-medium">Student</p>
                                  )}
                                  <p className="break-words">{msg.content}</p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                  {chatError && <p className="mt-2 text-sm text-amber-400">{chatError}</p>}
                  <div className="mt-3 flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message"
                      className="input flex-1"
                    />
                    <button type="button" onClick={sendMessage} disabled={chatSending} className="btn-primary px-4">
                      {chatSending ? "Sending…" : "Send"}
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setReportOrderId(reportOrderId === order.id ? null : order.id);
                    setReportMessage("");
                    setReportDescription("");
                    setReportFile(null);
                  }}
                  className="btn-secondary text-sm py-1.5"
                >
                  Report fake payment
                </button>
                {reportOrderId === order.id && (
                  <div className="mt-3 space-y-3 rounded-lg border border-slate-800/60 bg-slate-950/40 p-3">
                    <div>
                      <label className="block text-sm font-medium text-stone-700">Describe the issue</label>
                      <textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        className="input mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700">Upload payment screenshot</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                        className="mt-1 block w-full text-sm text-stone-500 file:mr-2 file:rounded file:border-0 file:bg-campus-primary file:px-3 file:py-1.5 file:text-white"
                      />
                    </div>
                    {reportMessage && <p className="text-sm text-amber-400">{reportMessage}</p>}
                    <button
                      type="button"
                      onClick={() => submitReport(order.id)}
                      disabled={reporting}
                      className="btn-primary text-sm py-1.5"
                    >
                      {reporting ? "Submitting…" : "Submit report"}
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <ImageModal
        src={paymentModal.src}
        alt="Payment proof"
        open={paymentModal.open}
        onClose={() => setPaymentModal({ open: false, src: "" })}
      />
    </div>
  );
}
