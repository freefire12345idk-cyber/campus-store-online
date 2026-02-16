"use client";

import { useState, useEffect } from "react";

type Order = {
  id: string;
  status: string;
  totalAmount: number;
  paymentProofUrl: string | null;
  deliveryOtp: string | null;
  hostelBranch: string | null;
  rollNo: string | null;
  createdAt: string;
  shop: { name: string; owner: { user: { id: string; name: string | null } } | null };
  college: { name: string };
  items: { product: { id: string; name: string }; quantity: number; price: number }[];
};

const statusLabels: Record<string, string> = {
  pending_payment: "Pending payment",
  pending_accept: "Pending (shop will accept/decline)",
  accepted: "Accepted",
  declined: "Declined",
  preparing: "Preparing",
  out_for_delivery: "On the way",
  reached_location: "Reached at location",
  delivered: "Delivered",
};

export default function StudentOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportOrderId, setReportOrderId] = useState<string | null>(null);
  const [reportProductId, setReportProductId] = useState<string>("");
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

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);
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

  if (loading) return <p className="text-stone-500">Loading orders…</p>;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <h1 className="text-2xl font-bold text-stone-900">My Orders</h1>
      <p className="mt-1 text-stone-600">Track your orders and chat with shops after acceptance.</p>
      {orders.length === 0 ? (
        <p className="mt-4 text-stone-500">No orders yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{order.shop.name}</p>
                  <p className="text-sm text-stone-500">#{order.id.slice(-6)} · {order.college.name}</p>
                  <p className="text-sm text-stone-600">
                    <span className="glass-chip">₹{order.totalAmount.toFixed(2)}</span> · {statusLabels[order.status] || order.status}
                  </p>
                  {order.deliveryOtp && (order.status === "out_for_delivery" || order.status === "reached_location" || order.status === "delivered") && (
                    <p className="mt-1 text-sm font-mono text-campus-primary">OTP: {order.deliveryOtp}</p>
                  )}
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  order.status === "delivered" ? "bg-green-100 text-green-800" :
                  order.status === "reached_location" ? "bg-teal-100 text-teal-800" :
                  order.status === "declined" ? "bg-red-100 text-red-800" :
                  "bg-amber-100 text-amber-800"
                }`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              <ul className="mt-2 text-sm text-stone-600">
                {order.items.map((item, idx) => (
                  <li key={idx}>{item.product.name} × {item.quantity}</li>
                ))}
              </ul>
              {order.status !== "pending_accept" && order.status !== "declined" && order.shop.owner?.user.id && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setChatOrderId(chatOrderId === order.id ? null : order.id);
                      setChatPartnerId(order.shop.owner?.user.id || null);
                      setChatError("");
                    }}
                    className="btn-primary text-sm py-1.5"
                  >
                    Chat with shop
                  </button>
                </div>
              )}
              {chatOrderId === order.id && chatPartnerId === order.shop.owner?.user.id && (
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
                                  msg.senderId === order.shop.owner?.user.id ? 'justify-start' : 'justify-end'
                                } mb-2`}
                              >
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                                  msg.senderId === order.shop.owner?.user.id 
                                    ? 'bg-slate-800/80 text-stone-200 rounded-bl-none' 
                                    : 'bg-gradient-to-r from-campus-primary/30 to-campus-secondary/30 text-white rounded-br-none border border-campus-primary/20'
                                }`}>
                                  {msg.senderId === order.shop.owner?.user.id && (
                                    <p className="text-xs text-slate-400 mb-1 font-medium">Shop</p>
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
              {order.status === "delivered" && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setReportOrderId(reportOrderId === order.id ? null : order.id);
                      setReportProductId(order.items[0]?.product.id || "");
                      setReportDescription("");
                      setReportFile(null);
                      setReportMessage("");
                    }}
                    className="btn-secondary text-sm py-1.5"
                  >
                    Report bad product
                  </button>
                  {reportOrderId === order.id && (
                    <div className="mt-3 space-y-3 rounded-lg border border-slate-800/60 bg-slate-950/40 p-3">
                      <div>
                        <label className="block text-sm font-medium text-stone-700">Product</label>
                        <select
                          value={reportProductId}
                          onChange={(e) => setReportProductId(e.target.value)}
                          className="input mt-1"
                        >
                          {order.items.map((item) => (
                            <option key={item.product.id} value={item.product.id}>{item.product.name}</option>
                          ))}
                        </select>
                      </div>
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
                        <label className="block text-sm font-medium text-stone-700">Upload product photo</label>
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
                        onClick={async () => {
                          if (!reportDescription.trim()) {
                            setReportMessage("Please describe the issue.");
                            return;
                          }
                          if (!reportFile) {
                            setReportMessage("Please upload a photo.");
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
                                type: "bad_product",
                                description: reportDescription,
                                attachmentUrl: uploadData.url,
                                orderId: order.id,
                                productId: reportProductId,
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
                        }}
                        disabled={reporting}
                        className="btn-primary text-sm py-1.5"
                      >
                        {reporting ? "Submitting…" : "Submit report"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
