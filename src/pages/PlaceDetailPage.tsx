import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MdArrowBack, MdDelete, MdSend } from "react-icons/md";
import { placesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import StarRating from "@/components/ui/star-rating";
import AuthModal from "@/components/ui/auth-modal";
import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns-1";
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
  viewCount: number;
  commentCount: number;
  comments: {
    id: string;
    body: string;
    createdAt: string;
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
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      await placesApi.rate(id, value);
      await load();
    } catch {
      // ignore rating errors (e.g. offline)
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!user) {
      setAuthOpen(true);
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
      await placesApi.comment(id, body);
      setReviewBody("");
      await load();
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
      await load();
    } catch {
      // ignore
    }
  };

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

  const testimonials: Testimonial[] = place.comments.map((comment) => ({
    id: comment.id,
    text: comment.body,
    image: comment.user.image,
    name: comment.user.name ?? "Pengguna",
    role: timeAgo(comment.createdAt),
    onDelete: user?.id === comment.user.id ? () => handleDeleteReview(comment.id) : undefined,
  }));
  const columnSize = Math.ceil(testimonials.length / 3);
  const firstColumn = testimonials.slice(0, columnSize);
  const secondColumn = testimonials.slice(columnSize, columnSize * 2);
  const thirdColumn = testimonials.slice(columnSize * 2);

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
                  {place.avgRating ? place.avgRating.toFixed(1) : "—"}
                </span>
                <div>
                  <StarRating rating={Math.round(place.avgRating ?? 0)} size="w-5 h-5" />
                  <div className="text-muted-foreground text-xs mt-0.5">
                    {place.ratingCount.toLocaleString()} rating
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Beri ratingmu</div>
              <StarRating rating={0} interactive size="w-7 h-7" onRate={handleRate} />
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
          <div className="mb-6">
            <span className="tag-pill mb-3 inline-block">Kata Mereka</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
              Ulasan ({place.commentCount})
            </h2>
          </div>

          <form onSubmit={handleReview} className="glass-card rounded-2xl p-5 mb-6">
            <textarea
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              placeholder={user ? "Tulis ulasanmu tentang kafe ini..." : "Masuk untuk menulis ulasan"}
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#d1d5db] focus:ring-2 focus:ring-[rgba(209,213,219,0.25)] resize-none"
            />
            {reviewError && <p className="text-sm text-destructive mt-2">{reviewError}</p>}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">{user ? `Sebagai ${user.name ?? user.email}` : "Kamu harus login untuk berpartisipasi."}</span>
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
              Belum ada ulasan. Jadilah yang pertama! ✨
            </div>
          ) : (
            <div className="testimonials-viewport flex max-h-[740px] justify-center gap-4 overflow-hidden sm:gap-6">
              <TestimonialsColumn testimonials={firstColumn} duration={15} />
              <TestimonialsColumn testimonials={secondColumn.length ? secondColumn : firstColumn} className="hidden md:block" duration={19} />
              <TestimonialsColumn testimonials={thirdColumn.length ? thirdColumn : firstColumn} className="hidden lg:block" duration={17} />
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
