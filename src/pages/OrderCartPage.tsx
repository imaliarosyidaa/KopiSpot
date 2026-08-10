import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  MdAdd,
  MdBookmarkAdd,
  MdDelete,
  MdFavoriteBorder,
  MdReceiptLong,
  MdRestore,
  MdShoppingCart,
} from "react-icons/md"
import { ordersApi, type Order } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import AuthModal from "@/components/ui/auth-modal"
import { useCartStore } from "@/lib/cart-store"
import { formatDate, formatRupiah } from "@/lib/format"
import { menuImageUrl } from "@/lib/menu-images"

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[#b07d3f] focus:ring-2 focus:ring-[rgba(176,125,63,0.25)]"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  PREPARING: "Disiapkan",
  READY: "Siap Diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
}

const PAYMENT_LABEL: Record<string, string> = {
  UNPAID: "Belum Dibayar",
  PAID: "Lunas",
  FAILED: "Gagal",
}

const actionPill =
  "flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-2 footer-glass-pill text-muted-foreground hover:text-foreground transition-colors"

export default function OrderCartPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const addToCart = useCartStore((s) => s.add)
  const [authOpen, setAuthOpen] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedCafe, setSelectedCafe] = useState("")
  const [savedOrderIds, setSavedOrderIds] = useState<string[]>([])
  const [wishOrderIds, setWishOrderIds] = useState<string[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    if (!user) return
    setOrdersError(null)
    setLoadingOrders(true)
    try {
      setOrders(await ordersApi.list())
    } catch (err) {
      setOrdersError(
        err instanceof Error ? err.message : "Gagal memuat keranjang.",
      )
    } finally {
      setLoadingOrders(false)
    }
  }, [user])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const handleCheckout = (o: Order) => {
    o.items.forEach((it) => {
      addToCart({
        id: it.menuItem.id,
        placeId: o.place.id,
        placeName: o.place.name,
        name: it.menuItem.name,
        price: it.menuItem.price,
        category: it.menuItem.category,
        imageUrl: it.menuItem.imageUrl,
      })
    })
    navigate("/order", { state: { step: "checkout" } })
  }

  const moveToSaved = (id: string) => {
    setSavedOrderIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setWishOrderIds((prev) => prev.filter((x) => x !== id))
  }

  const moveToWish = (id: string) => {
    setWishOrderIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setSavedOrderIds((prev) => prev.filter((x) => x !== id))
  }

  const restoreOrder = (id: string) => {
    setSavedOrderIds((prev) => prev.filter((x) => x !== id))
    setWishOrderIds((prev) => prev.filter((x) => x !== id))
  }

  const handleDelete = async (id: string) => {
    if (deletingId) return
    try {
      await ordersApi.remove(id)
      setSavedOrderIds((prev) => prev.filter((x) => x !== id))
      setWishOrderIds((prev) => prev.filter((x) => x !== id))
      await loadOrders()
    } catch (err) {
      setOrdersError(
        err instanceof Error ? err.message : "Gagal menghapus pesanan.",
      )
    } finally {
      setDeletingId(null)
    }
  }

  const unpaidOrders = orders.filter(
    (o) => o.paymentStatus !== "PAID" && o.status !== "CANCELLED",
  )
  const placeOptions = Array.from(
    new Map(unpaidOrders.map((o) => [o.place.id, o.place])).values(),
  )
  const cafeFiltered = selectedCafe
    ? unpaidOrders.filter((o) => o.place.id === selectedCafe)
    : unpaidOrders
  const activeOrders = cafeFiltered.filter(
    (o) => !savedOrderIds.includes(o.id) && !wishOrderIds.includes(o.id),
  )
  const savedOrders = cafeFiltered.filter((o) => savedOrderIds.includes(o.id))
  const wishOrders = cafeFiltered.filter((o) => wishOrderIds.includes(o.id))

  const renderOrderCard = (o: Order, bucket: "active" | "saved" | "wish") => {
    const removing = deletingId === o.id
    return (
      <div key={o.id} className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="font-bold text-foreground text-sm">
              {o.place.name}
            </div>
            <div className="text-xs text-muted-foreground">
              #{o.id.slice(-8)} · {formatDate(o.createdAt)}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="tag-pill">
              {o.paymentStatus === "PAID" ? "✓ " : ""}
              {PAYMENT_LABEL[o.paymentStatus]}
            </span>
            <span className="tag-pill">
              {STATUS_LABEL[o.status] ?? o.status}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {o.items.reduce((s, it) => s + it.quantity, 0)} item
            {o.paymentMethod ? ` · ${o.paymentMethod}` : ""}
          </span>
          <span className="font-black text-[#b07d3f]">
            {formatRupiah(o.total)}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {o.items.slice(0, 5).map((it) => (
            <img
              key={it.id}
              src={menuImageUrl(
                it.menuItem.category,
                it.menuItem.imageUrl,
                it.menuItem.name,
              )}
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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            {bucket === "active" && (
              <>
                <button
                  onClick={() => moveToSaved(o.id)}
                  className={actionPill}
                  title="Simpan untuk nanti"
                >
                  <MdBookmarkAdd className="w-3.5 h-3.5" />
                  Simpan untuk Nanti
                </button>
                <button
                  onClick={() => moveToWish(o.id)}
                  className={actionPill}
                  title="Pindahkan ke daftar keinginan"
                >
                  <MdFavoriteBorder className="w-3.5 h-3.5" />
                  Wishlist
                </button>
              </>
            )}
            {bucket === "saved" && (
              <button
                onClick={() => restoreOrder(o.id)}
                className="flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-2 bg-[#b07d3f]/15 text-[#b07d3f] hover:bg-[#b07d3f]/25 transition-colors"
              >
                <MdRestore className="w-3.5 h-3.5" />
                Kembalikan
              </button>
            )}
            {bucket === "wish" && (
              <button
                onClick={() => restoreOrder(o.id)}
                className="flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-2 bg-[#b07d3f]/15 text-[#b07d3f] hover:bg-[#b07d3f]/25 transition-colors"
              >
                <MdAdd className="w-3.5 h-3.5" />
                Pindah ke Keranjang
              </button>
            )}
            <button
              onClick={() => handleDelete(o.id)}
              disabled={removing}
              className="flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-2 footer-glass-pill text-muted-foreground hover:text-destructive transition-colors disabled:opacity-60"
              title="Hapus dari keranjang"
            >
              <MdDelete className="w-3.5 h-3.5" />
              {removing ? "Menghapus..." : "Hapus"}
            </button>
          </div>
          <button
            onClick={() => handleCheckout(o)}
            className="shrink-0 flex items-center gap-1.5 bg-[#b07d3f] text-[#1a1a1a] font-bold px-5 py-2.5 rounded-full text-sm hover:bg-[#c9974f] transition-colors"
          >
            <MdShoppingCart className="w-4 h-4" />
            Checkout
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 text-muted-foreground animate-pulse">
        Memuat...
      </div>
    )
  }

  return (
    <div className="pt-16">
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="tag-pill mb-3 inline-block">Keranjang</span>
            <h1
              className="text-3xl md:text-4xl font-black text-foreground"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Keranjang Pesanan
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Pesanan yang belum dicheckout, menunggu untuk dibayar.
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
            <div className="text-4xl mb-3">🛒</div>
            <h2 className="text-xl font-black text-foreground mb-2">
              Masuk untuk melihat keranjang
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Pesanan yang belum dicheckout tersimpan di akunmu.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm"
            >
              Masuk Sekarang
            </button>
          </div>
        ) : ordersError ? (
          <div className="text-center text-destructive py-16">
            {ordersError}
          </div>
        ) : loadingOrders ? (
          <div className="text-center text-muted-foreground animate-pulse py-16">
            Memuat keranjang...
          </div>
        ) : unpaidOrders.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center max-w-md mx-auto">
            <div className="text-4xl mb-3">☕</div>
            <h2 className="text-xl font-black text-foreground mb-2">
              Keranjang kosong
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Tidak ada pesanan yang menunggu checkout. Yuk pesan kopi sekarang.
            </p>
            <Link
              to="/order"
              className="bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm"
            >
              Mulai Pesan
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Pilih Kafe
              </label>
              <select
                value={selectedCafe}
                onChange={(e) => setSelectedCafe(e.target.value)}
                className={`${inputClass} max-w-md`}
              >
                <option value="">Semua Kafe</option>
                {placeOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.city}
                  </option>
                ))}
              </select>
            </div>

            {cafeFiltered.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">
                Tidak ada pesanan yang belum dicheckout dari kafe ini.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {activeOrders.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      <MdShoppingCart className="w-4 h-4" />
                      Siap Checkout ({activeOrders.length})
                    </div>
                    <div className="flex flex-col gap-4">
                      {activeOrders.map((o) => renderOrderCard(o, "active"))}
                    </div>
                  </div>
                )}

                {savedOrders.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      <MdBookmarkAdd className="w-4 h-4" />
                      Simpan untuk Nanti ({savedOrders.length})
                    </div>
                    <div className="flex flex-col gap-4">
                      {savedOrders.map((o) => renderOrderCard(o, "saved"))}
                    </div>
                  </div>
                )}

                {wishOrders.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      <MdFavoriteBorder className="w-4 h-4" />
                      Daftar Keinginan ({wishOrders.length})
                    </div>
                    <div className="flex flex-col gap-4">
                      {wishOrders.map((o) => renderOrderCard(o, "wish"))}
                    </div>
                  </div>
                )}

                {activeOrders.length === 0 &&
                  savedOrders.length === 0 &&
                  wishOrders.length === 0 && (
                    <div className="text-center text-muted-foreground py-16">
                      Tidak ada pesanan yang belum dicheckout dari kafe ini.
                    </div>
                  )}
              </div>
            )}
          </>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
