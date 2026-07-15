"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, MailOpen, Trash2, Eye, RefreshCw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAdminPermissions } from "@/app/admin/_components/admin-permissions-provider";
import { formatDate } from "@/lib/utils/format";
import toast from "react-hot-toast";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const { hasPerm } = useAdminPermissions();
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [page, setPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const limit = 10;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("filter", filter);
      const res = await fetch(`/api/admin/messages?${params}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        setTotal(data.total);
      }
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleMarkRead = async (id: string) => {
    await fetch("/api/admin/messages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_read: true }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this message?")) return;
    const res = await fetch(`/api/admin/messages?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      toast.success("Message deleted");
      fetchMessages();
    } else {
      toast.error("Failed to delete");
    }
  };

  const openMessage = (msg: Message) => {
    setSelectedMessage(msg);
    if (!msg.is_read) handleMarkRead(msg.id);
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium">Inbox</span>
        <h1 className="text-2xl font-serif font-bold text-charcoal mt-1">Messages</h1>
        <p className="text-[13px] text-charcoal-muted mt-0.5">Manage contact form submissions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button onClick={() => { setFilter("all"); setPage(1); }} className={`border p-4 text-left transition-all rounded-xl ${filter === "all" ? "border-charcoal bg-charcoal text-ivory shadow-sm" : "bg-white border-ivory-dark/60 hover:shadow-sm"}`}>
          <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /><span className="text-sm font-medium">All Messages</span></div>
          <p className="mt-1 text-2xl font-bold">{total}</p>
        </button>
        <button onClick={() => { setFilter("unread"); setPage(1); }} className={`border p-4 text-left transition-all rounded-xl ${filter === "unread" ? "border-amber-400 bg-amber-50 text-amber-900 shadow-sm" : "bg-white border-ivory-dark/60 hover:shadow-sm"}`}>
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-amber-600" /><span className="text-sm font-medium">Unread</span></div>
          <p className="mt-1 text-2xl font-bold">{unreadCount}</p>
        </button>
        <button onClick={() => { setFilter("read"); setPage(1); }} className={`border p-4 text-left transition-all rounded-xl ${filter === "read" ? "border-green-400 bg-green-50 text-green-900 shadow-sm" : "bg-white border-ivory-dark/60 hover:shadow-sm"}`}>
          <div className="flex items-center gap-2"><MailOpen className="h-4 w-4 text-green-600" /><span className="text-sm font-medium">Read</span></div>
          <p className="mt-1 text-2xl font-bold">{total - unreadCount}</p>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-ivory-dark/60 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] text-charcoal-muted uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">From</th>
                <th className="px-5 py-3 font-medium">Subject</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-16 text-center text-charcoal-muted"><RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Loading...</td></tr>
              ) : messages.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-16 text-center text-charcoal-muted"><Mail className="h-8 w-8 mx-auto mb-2 text-charcoal-muted" />No messages</td></tr>
              ) : messages.map((msg) => (
                <tr key={msg.id} className={`border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors cursor-pointer ${!msg.is_read ? "bg-amber-50/20" : ""}`} onClick={() => openMessage(msg)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {!msg.is_read && <div className="h-2 w-2 bg-amber-500 rounded-full flex-shrink-0" />}
                      <div>
                        <p className="font-medium text-charcoal">{msg.name}</p>
                        <p className="text-[11px] text-charcoal-muted">{msg.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-charcoal-muted">{msg.subject || "(no subject)"}</td>
                  <td className="px-5 py-3 text-[12px] text-charcoal-muted">{formatDate(msg.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openMessage(msg)} className="p-1.5 text-charcoal-muted hover:bg-ivory-dark/40 hover:text-charcoal rounded-md transition-colors"><Eye className="h-4 w-4" /></button>
                      {hasPerm("marketing", "delete") && (
                        <button onClick={() => handleDelete(msg.id)} className="p-1.5 text-charcoal-muted hover:bg-rose-50 hover:text-rose-500 rounded-md transition-colors"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-charcoal-muted">{total} messages total</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-[12px] border border-ivory-dark/60 hover:bg-ivory-dark/40 disabled:opacity-40 rounded-lg">Previous</button>
            <span className="px-3 py-1.5 text-[12px] text-charcoal-muted">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-[12px] border border-ivory-dark/60 hover:bg-ivory-dark/40 disabled:opacity-40 rounded-lg">Next</button>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      <Modal isOpen={!!selectedMessage} onClose={() => setSelectedMessage(null)} title="Message" size="md">
        {selectedMessage && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-ivory-dark/60">
              <div className="h-10 w-10 bg-charcoal text-ivory rounded-full flex items-center justify-center text-sm font-bold">{selectedMessage.name.charAt(0).toUpperCase()}</div>
              <div>
                <p className="font-medium text-charcoal">{selectedMessage.name}</p>
                <p className="text-[12px] text-charcoal-muted">{selectedMessage.email}</p>
              </div>
              <span className="ml-auto text-[11px] text-charcoal-muted">{formatDate(selectedMessage.created_at)}</span>
            </div>
            {selectedMessage.subject && <p className="text-[13px] font-medium text-charcoal">{selectedMessage.subject}</p>}
            <div className="bg-ivory-dark/20 border border-ivory-dark/40 rounded-lg p-4">
              <p className="text-[13px] text-charcoal whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedMessage(null)}>Close</Button>
              <a href={`mailto:${selectedMessage.email}`} className="inline-flex"><Button size="sm">Reply via Email</Button></a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
