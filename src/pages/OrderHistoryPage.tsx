import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdReceiptLong, MdShoppingCart } from "react-icons/md";
import { ordersApi, type Order } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/ui/auth-modal";
import { formatDate, formatRupiah } from "@/lib/format";
import { menuImageUrl } from "@/lib/menu-images";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  PREPARING: "Disiapkan",
  READY: "Siap Diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const PAYMENT_LABEL: Record<string, string> = {
  UNPAID: "Belum Dibayar",
  PAID: "Lunas",
  FAILED: "Gagal",
};

export default function OrderHistoryPage() {
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setOrdersError(null);
    setLoadingOrders(true);
    try {
      setOrders(await ordersApi.list());
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : "Gagal memuat riwayat.");
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 text-muted-foreground animate-pulse">
        Memuat...
      </div>
    );
  }

  return (
    <div className="pt-16">
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="tag-pill mb-3 inline-block">Riwayat</span>
            <h1 className="text-3xl md:text-4xl font-black text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
              Riwayat Pesanan
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Semua pesanan dan transaksimu yang tersimpan di akun.
            </p>
          </div>
          <Link
            to="/order"
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#b07d3f] text-[#1a1a1a] font-bold text-sm hover:bg-[#c9974f] transition-colors"
          >
            <MdShoppingCart className="w-4 h-4" />
            Pesan Kopi
          </Link>
        </div>

        {!user ? (
          <div className="glass-card rounded-3xl p-10 text-center max-w-md mx-auto">
            <div className="text-4xl mb-3">📦</div>
            <h2 className="text-xl font-black text-foreground mb-2">Masuk untuk melihat pesanan</h2>
            <p className="text-muted-foreground text-sm mb-6">Riwayat pesanan tersimpan di akunmu.</p>
            <button
              onClick={() => setAuthOpen(true)}
              className="bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm"
            >
              Masuk Sekarang
            </button>
          </div>
        ) : ordersError ? (
          <div className="text-center text-destructive py-16">{ordersError}</div>
        ) : loadingOrders ? (
          <div className="text-center text-muted-foreground animate-pulse py-16">Memuat riwayat...</div>
        ) : orders.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center max-w-md mx-auto">
            <div className="text-4xl mb-3">☕</div>
            <h2 className="text-xl font-black text-foreground mb-2">Belum ada pesanan</h2>
            <p className="text-muted-foreground text-sm mb-6">Pesanan dan transaksimu akan muncul di sini.</p>
            <Link
              to="/order"
              className="bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm"
            >
              Mulai Pesan
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((o) => (
              <div key={o.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="font-bold text-foreground text-sm">{o.place.name}</div>
                    <div className="text-xs text-muted-foreground">
                      #{o.id.slice(-8)} · {formatDate(o.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="tag-pill">
                      {o.paymentStatus === "PAID" ? "✓ " : ""}
                      {PAYMENT_LABEL[o.paymentStatus]}
                    </span>
                    <span className="tag-pill">{STATUS_LABEL[o.status] ?? o.status}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {o.items.reduce((s, it) => s + it.quantity, 0)} item
                    {o.paymentMethod ? ` · ${o.paymentMethod}` : ""}
                  </span>
                  <span className="font-black text-[#b07d3f]">{formatRupiah(o.total)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {o.items.slice(0, 5).map((it) => (
                    <img
                      key={it.id}
                      src={menuImageUrl(it.menuItem.category, it.menuItem.imageUrl, it.menuItem.name)}
                      alt={it.menuItem.name}
                      title={it.menuItem.name}
                      className="w-11 h-11 rounded-xl object-cover border border-border"
                      loading="lazy"
                    />
                  ))}
                  {o.items.length > 5 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{o.items.length - 5} lainnya
                    </span>
                  )}
                </div>
                {o.note && (
                  <div className="mt-2 text-xs text-muted-foreground bg-[rgba(140,95,40,0.06)] rounded-lg px-3 py-2">
                    <MdReceiptLong className="w-3.5 h-3.5 inline mr-1" />
                    Catatan: {o.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
