"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Check, X, Trash2, RefreshCw, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/format";
import toast from "react-hot-toast";

interface Review {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  product?: { name: string; slug: string };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("filter", filter);
      const res = await fetch(`/api/admin/reviews?${params}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
        setTotal(data.total);
      }
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleApprove = async (id: string) => {
    const res = await fetch("/api/admin/reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_approved: true }),
    });
    if (res.ok) { toast.success("Review approved"); fetchReviews(); }
  };

  const handleReject = async (id: string) => {
    const res = await fetch("/api/admin/reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_approved: false }),
    });
    if (res.ok) { toast.success("Review hidden"); fetchReviews(); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this review permanently?")) return;
    const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Review deleted"); fetchReviews(); }
  };

  const pendingCount = reviews.filter((r) => !r.is_approved).length;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium">Moderation</span>
        <h1 className="text-2xl font-serif font-bold text-charcoal mt-1">Reviews</h1>
        <p className="text-[13px] text-charcoal-muted/60 mt-0.5">Moderate product reviews from customers</p>
      </div>

      {/* Filter Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button onClick={() => { setFilter("all"); setPage(1); }} className={`border p-4 text-left transition-all rounded-xl ${filter === "all" ? "border-charcoal bg-charcoal text-ivory shadow-sm" : "bg-white border-ivory-dark/60 hover:shadow-sm"}`}>
          <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /><span className="text-sm font-medium">All Reviews</span></div>
          <p className="mt-1 text-2xl font-bold">{total}</p>
        </button>
        <button onClick={() => { setFilter("pending"); setPage(1); }} className={`border p-4 text-left transition-all rounded-xl ${filter === "pending" ? "border-amber-400 bg-amber-50 text-amber-900 shadow-sm" : "bg-white border-ivory-dark/60 hover:shadow-sm"}`}>
          <div className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-600" /><span className="text-sm font-medium">Pending Approval</span></div>
          <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
        </button>
        <button onClick={() => { setFilter("approved"); setPage(1); }} className={`border p-4 text-left transition-all rounded-xl ${filter === "approved" ? "border-green-400 bg-green-50 text-green-900 shadow-sm" : "bg-white border-ivory-dark/60 hover:shadow-sm"}`}>
          <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span className="text-sm font-medium">Approved</span></div>
          <p className="mt-1 text-2xl font-bold">{total - pendingCount}</p>
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white border border-ivory-dark/60 rounded-xl p-16 text-center"><RefreshCw className="h-5 w-5 animate-spin mx-auto text-charcoal-muted/40" /></div>
        ) : reviews.length === 0 ? (
          <div className="bg-white border border-ivory-dark/60 rounded-xl p-16 text-center"><Star className="h-8 w-8 mx-auto mb-2 text-charcoal-muted/20" /><p className="text-sm text-charcoal-muted/50">No reviews found</p></div>
        ) : reviews.map((review) => (
          <div key={review.id} className={`bg-white border rounded-xl p-5 shadow-sm transition-colors ${review.is_approved ? "border-ivory-dark/60" : "border-amber-300 bg-amber-50/20"}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 bg-charcoal text-ivory rounded-full flex items-center justify-center text-[10px] font-bold">{review.user_name.charAt(0).toUpperCase()}</div>
                  <span className="text-[13px] font-medium text-charcoal">{review.user_name}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-gold text-gold" : "text-charcoal/20"}`} />
                    ))}
                  </div>
                  <Badge variant={review.is_approved ? "success" : "warning"}>{review.is_approved ? "Approved" : "Pending"}</Badge>
                </div>
                {review.product && (
                  <p className="text-[11px] text-charcoal-muted/50 mb-1">on <span className="font-medium">{review.product.name}</span></p>
                )}
                {review.comment && <p className="text-[13px] text-charcoal-muted mt-2">{review.comment}</p>}
                <p className="text-[11px] text-charcoal-muted/40 mt-2">{formatDate(review.created_at)}</p>
              </div>
              <div className="flex items-center gap-1 ml-4">
                {!review.is_approved && (
                  <button onClick={() => handleApprove(review.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Approve"><Check className="h-4 w-4" /></button>
                )}
                {review.is_approved && (
                  <button onClick={() => handleReject(review.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Hide"><X className="h-4 w-4" /></button>
                )}
                <button onClick={() => handleDelete(review.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-charcoal-muted/50">{total} reviews total</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-[12px] border border-ivory-dark/60 hover:bg-ivory-dark/40 disabled:opacity-40 rounded-lg">Previous</button>
            <span className="px-3 py-1.5 text-[12px] text-charcoal-muted">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-[12px] border border-ivory-dark/60 hover:bg-ivory-dark/40 disabled:opacity-40 rounded-lg">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
