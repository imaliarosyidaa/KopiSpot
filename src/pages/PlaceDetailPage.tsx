import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MdArrowBack, MdCheckCircle, MdDelete, MdSend } from "react-icons/md";
import { placesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import StarRating from "@/components/ui/star-rating";
import AuthModal from "@/components/ui/auth-modal";
import { formatRupiah, formatDate, timeAgo } from "@/lib/format";

interface PlaceDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  city: string;
  price: string;
  openHours: string;
  imageUrl: string;
  createdAt: string;
  tags: string[];
  wifi: boolean;
  cozy: boolean;
  avgRating: number;
  ratingCount: number;
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  viewCount: number;
  commentCount: number;
  comments: {
    id: string;
    body: string;
    createdAt: string;
    rating: number | null;
    user: { id: string; name: string | null; image: string | null };
  }[];
  menuItems: { id: string; name: string; price: number; category: string }[];
}

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewFilter, setReviewFilter] = useState<number | null>(null);
  const [reviewSort, setReviewSort] = useState<"relevant" | "newest" | "highest" | "lowest">("relevant");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateRatingSummary = (value: number, previousValue: number | null) => {
    setPlace((current) => {
      if (!current) return current;
      const breakdown = { ...current.ratingBreakdown };
      if (previousValue) breakdown[previousValue as 1 | 2 | 3 | 4 | 5] -= 1;
      breakdown[value as 1 | 2 | 3 | 4 | 5] += 1;
      const ratingCount = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
      const ratingTotal = Object.entries(breakdown).reduce(
        (sum, [rating, count]) => sum + Number(rating) * count,
        0,
      );
      return {
        ...current,
        ratingBreakdown: breakdown,
        ratingCount,
        avgRating: ratingCount ? ratingTotal / ratingCount : 0,
      };
    });
  };

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      setPlace(await placesApi.detail(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (id) {
      placesApi.view(id).catch(() => {});
    }
  }, [id]);

  const handleRate = async (value: number) => {
    if (!id) return;
    if (!user) {
      setAuthOpen(true);
      return;
    }
    try {
      const previousValue = reviewRating || place?.comments.find((comment) => comment.user.id === user.id)?.rating || null;
      await placesApi.rate(id, value);
      updateRatingSummary(value, previousValue);
      setReviewRating(value);
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : "Gagal menyimpan rating.");
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!reviewRating) {
      setReviewError("Pilih rating bintang terlebih dahulu.");
      return;
    }
    const body = reviewBody.trim();
    if (!body) {
      setReviewError("Ulasan tidak boleh kosong.");
      return;
    }
    setSubmitting(true);
    setReviewError(null);
    try {
      const createdReview = await placesApi.comment(id, body, reviewRating);
      setReviewBody("");
      setPlace((current) => {
        if (!current) return current;
        const existingReview = current.comments.find((comment) => comment.user.id === user.id);
        const comments = existingReview
          ? current.comments.map((comment) => comment.id === existingReview.id ? { ...comment, ...createdReview } : comment)
          : [createdReview, ...current.comments];
        return { ...current, comments, commentCount: comments.length };
      });
      updateRatingSummary(reviewRating, place.comments.find((comment) => comment.user.id === user.id)?.rating ?? null);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Gagal mengirim ulasan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (commentId: string) => {
    if (!id) return;
    try {
      await placesApi.deleteComment(id, commentId);
      setPlace((current) => {
        if (!current) return current;
        const removed = current.comments.find((comment) => comment.id === commentId);
        const comments = current.comments.filter((comment) => comment.id !== commentId);
        if (!removed?.rating) return { ...current, comments, commentCount: comments.length };
        const breakdown = { ...current.ratingBreakdown };
        breakdown[removed.rating as 1 | 2 | 3 | 4 | 5] -= 1;
        const ratingCount = Math.max(0, current.ratingCount - 1);
        const ratingTotal = Object.entries(breakdown).reduce((sum, [rating, count]) => sum + Number(rating) * count, 0);
        return { ...current, comments, commentCount: comments.length, ratingBreakdown: breakdown, ratingCount, avgRating: ratingCount ? ratingTotal / ratingCount : 0 };
      });
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : "Gagal menghapus ulasan.");
    }
  };

  const filteredReviews = useMemo(() => {
    const reviews = reviewFilter
      ? (place?.comments ?? []).filter((comment) => comment.rating === reviewFilter)
      : (place?.comments ?? []);
    return [...reviews].sort((a, b) => {
      if (reviewSort === "highest") return (b.rating ?? 0) - (a.rating ?? 0);
      if (reviewSort === "lowest") return (a.rating ?? 0) - (b.rating ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [place?.comments, reviewFilter, reviewSort]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-card rounded-3xl p-10 text-center max-w-md">
          <div className="text-4xl mb-3">☕</div>
          <h1 className="text-xl font-black text-foreground mb-2">Kafe tidak ditemukan</h1>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#d1d5db] text-[#111113] font-black px-6 py-3 rounded-full text-sm"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Memuat kafe...</div>
      </div>
    );
  }

  const menuGroups = place.menuItems.reduce<Record<string, typeof place.menuItems>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="pt-16">
      {/* Header */}
      <div className="relative h-72 md:h-[420px] bg-muted overflow-hidden">
        {place.imageUrl && (
          <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
        <button
          onClick={() => navigate("/")}
          className="absolute top-5 left-5 flex items-center gap-2 footer-glass-pill px-4 py-2 rounded-full text-sm font-semibold text-white"
        >
          <MdArrowBack className="w-4 h-4" />
          Kembali
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="tag-pill">{place.category}</span>
            {place.tags.map((t) => (
              <span key={t} className="tag-pill">{t}</span>
            ))}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            {place.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-white/85 text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {place.address}, {place.city}
            </span>
            <span>🕐 {place.openHours}</span>
            <span>👁 {place.viewCount.toLocaleString()} dilihat</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-12 py-12 space-y-12">
        {/* Rating + Deskripsi */}
        <div className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-[#d1d5db]" style={{ fontFamily: "'Fraunces', serif" }}>
                  {place.ratingCount ? place.avgRating.toFixed(1).replace(".", ",") : "—"}
                </span>
                <div>
                  {place.ratingCount ? <StarRating rating={Math.round(place.avgRating)} size="w-5 h-5" /> : <span className="text-sm text-muted-foreground">Belum ada ulasan</span>}
                  <div className="text-muted-foreground text-xs mt-0.5">
                    {place.ratingCount.toLocaleString()} ulasan
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Beri ratingmu</div>
              <StarRating rating={reviewRating} interactive size="w-7 h-7" onRate={(value) => { setReviewRating(value); void handleRate(value); }} />
            </div>
          </div>
          <div className="border-t border-border pt-5 mb-5">
            <h3 className="font-black text-foreground mb-4">Rating & Ulasan</h3>
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_2fr] gap-3">
              {[5, 4, 3, 2, 1].map((value) => {
                const count = place.ratingBreakdown[value as 1 | 2 | 3 | 4 | 5] ?? 0;
                const width = place.ratingCount ? `${(count / place.ratingCount) * 100}%` : "0%";
                return (
                  <button key={value} type="button" onClick={() => setReviewFilter(reviewFilter === value ? null : value)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                    <span className="w-7 text-left">{value} ★</span>
                    <span className="h-2 flex-1 rounded-full bg-muted overflow-hidden"><span className="block h-full rounded-full bg-[#d1d5db]" style={{ width }} /></span>
                    <span className="w-7 text-right">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">{place.description}</p>
        </div>

        {/* Menu */}
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="tag-pill mb-3 inline-block">Menu & Harga</span>
              <h2 className="text-3xl md:text-4xl font-black text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                Menu {place.name}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(menuGroups).map(([group, items]) => (
              <div key={group} className="glass-card rounded-2xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#d1d5db] mb-3">{group}</h3>
                <div className="flex flex-col gap-2.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground">{item.name}</span>
                      <span className="text-sm font-semibold text-muted-foreground">{formatRupiah(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ulasan */}
        <div>
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
            <span className="tag-pill mb-3 inline-block">Kata Mereka</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
              Ulasan ({place.commentCount})
            </h2>
            </div>
            <select value={reviewSort} onChange={(e) => setReviewSort(e.target.value as typeof reviewSort)} className="rounded-full border border-border bg-card px-4 py-2 text-xs text-foreground outline-none">
              <option value="relevant">Paling relevan</option>
              <option value="newest">Terbaru</option>
              <option value="highest">Rating tertinggi</option>
              <option value="lowest">Rating terendah</option>
            </select>
          </div>

          <form onSubmit={handleReview} className="glass-card rounded-2xl p-5 mb-6">
            <div className="mb-3">
              <p className="text-sm font-bold text-foreground mb-2">Bagaimana pengalaman Anda?</p>
              <StarRating rating={reviewRating} interactive size="w-7 h-7" onRate={setReviewRating} />
            </div>
            <textarea
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              maxLength={2000}
              placeholder={user ? "Ceritakan pengalaman Anda dengan toko ini..." : "Masuk untuk menulis ulasan"}
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#d1d5db] focus:ring-2 focus:ring-[rgba(209,213,219,0.25)] resize-none"
            />
            {reviewError && <p className="text-sm text-destructive mt-2">{reviewError}</p>}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">{user ? `${reviewBody.length}/2000 · Sebagai ${user.name ?? user.email}` : "Kamu harus login untuk berpartisipasi."}</span>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-[#d1d5db] text-[#111113] font-black px-5 py-2.5 rounded-full text-sm hover:bg-[#f3f4f6] transition-colors disabled:opacity-60"
              >
                <MdSend className="w-4 h-4" />
                {submitting ? "Mengirim..." : "Kirim Ulasan"}
              </button>
            </div>
          </form>

          {place.comments.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">
              <p className="font-bold text-foreground mb-1">Belum Ada Ulasan</p>
              Jadilah pelanggan pertama yang memberikan ulasan untuk toko ini.
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">Tidak ada ulasan dengan filter ini.</div>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((review) => (
                <article key={review.id} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground overflow-hidden shrink-0">
                      {review.user.image ? <img src={review.user.image} alt="" className="w-full h-full object-cover" /> : (review.user.name ?? "P").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{review.user.name ?? "Pengguna"}</span>
                        <MdCheckCircle className="text-emerald-500 w-4 h-4" title="Pembelian terverifikasi" />
                        <span className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</span>
                        {user?.id === review.user.id && <button type="button" onClick={() => handleDeleteReview(review.id)} className="ml-auto text-xs text-muted-foreground hover:text-destructive"><MdDelete className="w-4 h-4" /></button>}
                      </div>
                      <StarRating rating={review.rating ?? 0} size="w-4 h-4" />
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Terdaftar sejak {formatDate(place.createdAt ?? new Date().toISOString())}
        </p>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
