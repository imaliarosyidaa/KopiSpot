import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  MdAdd,
  MdArrowForward,
  MdBookmarkAdd,
  MdCheckCircle,
  MdDeleteOutline,
  MdError,
  MdFavoriteBorder,
  MdLocalShipping,
  MdPayments,
  MdReceiptLong,
  MdRemove,
  MdStorefront,
} from "react-icons/md"
import { formatRupiah } from "@/lib/format"
import { menuImageUrl } from "@/lib/menu-images"
import { useCartStore, type CartItem } from "@/lib/cart-store"
import { ordersApi, paymentsApi, type Order } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { getGuestToken } from "@/lib/guest"

const NEW_USER_COUPON = "KOPI10"

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Belum Dibayar",
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  PACKED: "Dikemas",
  PREPARING: "Disiapkan",
  READY: "Siap",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  EXPIRED: "Kedaluwarsa",
  PAYMENT_FAILED: "Gagal",
}

type StoreGroup = {
  id: string
  name: string
  items: CartItem[]
}

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  label: string
}): React.JSX.Element {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate)
  }, [indeterminate])

  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="h-4 w-4 accent-primary"
      />
      <span className="sr-only">{label}</span>
    </label>
  )
}

export default function OrderCartPage(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const items = useCartStore((state) => state.items)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)
  const saveForLater = useCartStore((state) => state.saveForLater)
  const moveFromWishlist = useCartStore((state) => state.moveFromWishlist)
  const wishlist = useCartStore((state) => state.wishlist)
  const clear = useCartStore((state) => state.clear)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)

  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true)
    try {
      const token = getGuestToken()
      const result = user
        ? await ordersApi.list()
        : token
          ? await ordersApi.list({ guestTokens: [token] })
          : []
      setOrders(result)
    } catch {
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }, [user])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const groups = useMemo<StoreGroup[]>(() => {
    const grouped = new Map<string, StoreGroup>()
    items.forEach((item) => {
      const current = grouped.get(item.placeId)
      if (current) current.items.push(item)
      else grouped.set(item.placeId, { id: item.placeId, name: item.placeName, items: [item] })
    })
    return Array.from(grouped.values())
  }, [items])

  const validItems = items
  const allSelected = validItems.length > 0 && validItems.every((item) => selectedIds.includes(item.id))
  const selectedItems = items.filter((item) => selectedIds.includes(item.id))
  const selectedTotal = selectedItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const selectedCount = selectedItems.reduce((total, item) => total + item.quantity, 0)

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => items.some((item) => item.id === id)))
  }, [items])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const orderId = params.get("order_id")
    const payment = params.get("payment")
    const transactionStatus = params.get("transaction_status")
    const isSuccess = payment === "success" || ["settlement", "capture"].includes(transactionStatus ?? "")
    const isFailure = payment === "failed" || ["cancel", "deny", "expire"].includes(transactionStatus ?? "")
    const isPending = payment === "pending" || transactionStatus === "pending" || params.get("action") === "back"
    if (!orderId || (!isSuccess && !isFailure && !isPending)) return

    if (isSuccess) {
      clear()
      setNotice("Pembayaran diterima. Pesanan sedang diproses.")
      const guestToken = getGuestToken()
      void paymentsApi
        .syncStatus(orderId, guestToken)
        .catch(() => null)
        .finally(() => void loadOrders())
    } else {
      setNotice(
        isPending
          ? "Pembayaran belum selesai."
          : "Pembayaran dibatalkan. Produk tetap tersimpan di keranjang.",
      )
    }
    navigate("/order/keranjang", { replace: true })
  }, [clear, location.search, navigate])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 3600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const toggleItem = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    )
  }

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : validItems.map((item) => item.id))
  }

  const toggleStore = (group: StoreGroup) => {
    const groupIds = group.items.map((item) => item.id)
    const groupSelected = groupIds.every((id) => selectedIds.includes(id))
    setSelectedIds((current) =>
      groupSelected
        ? current.filter((id) => !groupIds.includes(id))
        : Array.from(new Set([...current, ...groupIds])),
    )
  }

  const removeSelected = () => {
    if (selectedIds.length === 0) return
    selectedIds.forEach((id) => remove(id))
    setSelectedIds([])
    setNotice("Produk terpilih berhasil dihapus dari keranjang.")
  }

  const checkout = () => {
    if (selectedItems.length === 0) {
      setNotice("Pilih minimal satu produk untuk checkout.")
      return
    }
    const storeIds = Array.from(new Set(selectedItems.map((item) => item.placeId)))
    if (storeIds.length > 1) {
      setNotice("Checkout saat ini hanya dapat dilakukan untuk satu toko. Pilih satu toko terlebih dahulu.")
      return
    }
    sessionStorage.setItem("Coffidoor_checkout_items", JSON.stringify(selectedItems))
    navigate("/order/checkout")
  }

  const payOrder = async (order: Order) => {
    const guestToken = user ? undefined : getGuestToken()
    setPayingOrderId(order.id)
    try {
      const payment = await paymentsApi.create({
        orderId: order.id,
        amount: order.total,
        guestToken,
      })
      if (payment.redirect_url) {
        window.location.assign(payment.redirect_url)
        return
      }
      setNotice("Pembayaran tidak dapat diproses saat ini.")
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Gagal memulai pembayaran.")
    } finally {
      setPayingOrderId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-40 pt-24 sm:pb-32">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="tag-pill mb-3 inline-block">Marketplace</span>
            <h1 className="text-3xl font-black text-foreground sm:text-4xl" style={{ fontFamily: "'Fraunces', serif" }}>
              Keranjang
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Periksa produk pilihanmu sebelum menyelesaikan pesanan.</p>
          </div>
          <Link to="/order" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary">
            <MdAdd /> Tambah Produk
          </Link>
        </div>

        {notice && (
          <div role="status" className="mb-5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground">
            {notice}
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-card/70 px-4 py-3">
              <div className="flex items-center gap-3">
                <IndeterminateCheckbox checked={allSelected} indeterminate={selectedIds.length > 0 && !allSelected} onChange={toggleAll} label="Pilih semua produk" />
                <span className="text-sm font-bold text-foreground">Pilih Semua</span>
                <span className="text-xs text-muted-foreground">({items.length} produk)</span>
              </div>
              <button type="button" onClick={removeSelected} disabled={selectedIds.length === 0} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40">
                <MdDeleteOutline className="h-5 w-5" /> Hapus
              </button>
            </div>

            {groups.map((group) => {
              const groupIds = group.items.map((item) => item.id)
              const selectedInGroup = groupIds.filter((id) => selectedIds.includes(id)).length
              return (
                <section key={group.id} className="overflow-hidden rounded-2xl border border-border bg-card/60 shadow-sm">
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-3">
                      <IndeterminateCheckbox checked={selectedInGroup === group.items.length} indeterminate={selectedInGroup > 0 && selectedInGroup < group.items.length} onChange={() => toggleStore(group)} label={`Pilih semua produk dari ${group.name}`} />
                      <MdStorefront className="h-5 w-5 text-primary" />
                      <strong className="text-sm text-foreground">{group.name}</strong>
                      <span className="hidden text-xs text-muted-foreground sm:inline">Voucher toko tersedia</span>
                    </div>
                    <Link to={`/places/${group.id}`} className="text-xs font-bold text-primary hover:underline">Kunjungi Toko</Link>
                  </header>
                  <div className="divide-y divide-border">
                    {group.items.map((item) => {
                      const checked = selectedIds.includes(item.id)
                      return (
                        <article key={item.id} className={`grid grid-cols-[auto_1fr] gap-3 px-4 py-4 transition sm:grid-cols-[auto_84px_1fr_auto] sm:items-center sm:gap-4 sm:px-5 ${checked ? "bg-primary/4.5" : ""}`}>
                          <IndeterminateCheckbox checked={checked} onChange={() => toggleItem(item.id)} label={`Pilih ${item.name}`} />
                          <img src={menuImageUrl(item.category, item.imageUrl, item.name)} alt={item.name} className="h-20 w-20 rounded-xl border border-border object-cover sm:h-21 sm:w-21" loading="lazy" />
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-foreground sm:text-base">{item.name}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">Variasi standar · Tersedia</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              <span className="rounded-md bg-primary/10 px-2 py-1 font-bold text-primary">Voucher {NEW_USER_COUPON}</span>
                              <button type="button" onClick={() => saveForLater(item.id)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
                                <MdBookmarkAdd /> Simpan
                              </button>
                              <button type="button" onClick={() => remove(item.id)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive">
                                <MdDeleteOutline /> Hapus
                              </button>
                            </div>
                          </div>
                          <div className="col-start-2 flex items-center justify-between gap-4 sm:col-auto sm:flex-col sm:items-end">
                            <div className="text-right"><div className="text-xs text-muted-foreground">Harga satuan</div><div className="font-black text-primary">{formatRupiah(item.price)}</div></div>
                            <div className="flex items-center rounded-lg border border-border bg-background">
                              <button type="button" onClick={() => setQuantity(item.id, Math.max(1, item.quantity - 1))} className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={`Kurangi ${item.name}`}>
                                <MdRemove />
                              </button>
                              <span className="flex h-8 min-w-8 items-center justify-center border-x border-border px-2 text-sm font-bold">{item.quantity}</span>
                              <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={`Tambah ${item.name}`}>
                                <MdAdd />
                              </button>
                            </div>
                            <div className="text-right"><div className="text-xs text-muted-foreground">Subtotal</div><div className="font-black text-foreground">{formatRupiah(item.price * item.quantity)}</div></div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between border-t border-border bg-primary/[0.035] px-4 py-3 text-xs sm:px-5">
                    <span className="text-muted-foreground">Voucher toko <strong className="text-primary">{NEW_USER_COUPON}</strong> aktif saat checkout</span>
                    <span className="font-bold text-foreground">{group.items.length} produk</span>
                  </div>
                </section>
              )
            })}

            {wishlist.length > 0 && (
              <section className="rounded-2xl border border-border bg-card/50 px-4 py-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <MdFavoriteBorder className="text-primary" /> Wishlist ({wishlist.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {wishlist.map((item) => (
                    <button type="button" key={item.id} onClick={() => moveFromWishlist(item.id)} className="rounded-xl border border-border px-3 py-2 text-left text-xs hover:border-primary">
                      <span className="block font-bold text-foreground">{item.name}</span>
                      <span className="text-muted-foreground">Pindahkan ke keranjang</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <MdReceiptLong className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black text-foreground">Riwayat Pesanan</h2>
          </div>

          {loadingOrders ? (
            <div className="glass-card animate-pulse rounded-3xl px-6 py-16 text-center text-muted-foreground">
              Memuat pesanan...
            </div>
          ) : orders.length === 0 ? (
            <div className="glass-card rounded-3xl px-6 py-12 text-center text-muted-foreground">
              Belum ada pesanan.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const isUnpaid = order.paymentStatus !== "PAID"
                const statusIcon =
                  order.status === "SHIPPED" ? (
                    <MdLocalShipping />
                  ) : order.status === "COMPLETED" ? (
                    <MdCheckCircle />
                  ) : order.status === "CANCELLED" ||
                    order.status === "EXPIRED" ||
                    order.status === "PAYMENT_FAILED" ? (
                    <MdError />
                  ) : null
                return (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-border bg-card/60 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="truncate text-sm font-bold text-foreground">
                            {order.place.name}
                          </strong>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                            {ORDER_STATUS_LABEL[order.status] ?? order.status}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          #{order.id.slice(-8)} · {order.items.length} item ·{" "}
                          {formatRupiah(order.total)}
                        </div>
                      </div>
                      {isUnpaid ? (
                        <button
                          type="button"
                          onClick={() => payOrder(order)}
                          disabled={payingOrderId === order.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <MdPayments />
                          {payingOrderId === order.id ? "Memproses..." : "Bayar"}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          {statusIcon}
                          {ORDER_STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.items.slice(0, 4).map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5"
                        >
                          <img
                            src={menuImageUrl(
                              it.menuItem.category,
                              it.menuItem.imageUrl,
                              it.menuItem.name,
                            )}
                            alt={it.menuItem.name}
                            className="h-9 w-9 rounded-lg object-cover"
                            loading="lazy"
                          />
                          <span className="text-xs text-foreground">
                            {it.menuItem.name} ×{it.quantity}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <span className="self-center text-xs text-muted-foreground">
                          +{order.items.length - 4} lainnya
                        </span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

      </div>

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 py-3 shadow-[0_-12px_30px_rgba(17,17,19,0.08)] backdrop-blur-xl sm:py-4">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <IndeterminateCheckbox checked={allSelected} indeterminate={selectedIds.length > 0 && !allSelected} onChange={toggleAll} label="Pilih semua produk" />
              <span className="hidden text-sm text-foreground sm:inline">Pilih Semua</span>
            </div>
            <button type="button" onClick={removeSelected} disabled={selectedIds.length === 0} className="hidden text-sm font-semibold text-muted-foreground hover:text-destructive disabled:opacity-40 sm:inline">Hapus</button>
            <div className="ml-auto text-right">
              <div className="text-xs text-muted-foreground">{selectedCount} item terpilih</div>
              <div className="text-lg font-black text-primary">{formatRupiah(selectedTotal)}</div>
            </div>
            <button type="button" onClick={checkout} disabled={selectedItems.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
              Checkout <MdArrowForward />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
