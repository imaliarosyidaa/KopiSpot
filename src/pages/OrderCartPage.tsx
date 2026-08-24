import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  MdAdd,
  MdArrowForward,
  MdBookmarkAdd,
  MdCheckCircle,
  MdClose,
  MdDeleteOutline,
  MdEdit,
  MdError,
  MdFavoriteBorder,
  MdLocalShipping,
  MdPayments,
  MdPhotoCamera,
  MdReceiptLong,
  MdRemove,
  MdStar,
  MdStarOutline,
  MdStorefront,
} from "react-icons/md"
import { formatRupiah } from "@/lib/format"
import { menuImageUrl } from "@/lib/menu-images"
import { useCartStore, type CartItem } from "@/lib/cart-store"
import {
  ordersApi,
  paymentsApi,
  reviewsApi,
  uploadFile,
  type Order,
  type Review,
  type ReviewOrderItem,
  type ReviewOrderRef,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/lib/notification-context"
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

type TabKey = "keranjang" | "unpaid" | "packed" | "shipped" | "completed" | "mine"

type ReviewDraft = {
  mode: "create" | "edit"
  orderItem: ReviewOrderItem
  order: ReviewOrderRef
  existing?: Review
}

function orderTab(o: Order): "unpaid" | "packed" | "shipped" | "completed" {
  if (o.paymentStatus !== "PAID") return "unpaid"
  if (o.status === "SHIPPED") return "shipped"
  if (o.status === "COMPLETED") return "completed"
  return "packed"
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

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }): React.JSX.Element {
  const [hover, setHover] = useState(0)
  return (
    <div className="inline-flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= (hover || value)
        const common = {
          onMouseEnter: onChange ? () => setHover(n) : undefined,
          onClick: onChange ? () => onChange(n) : undefined,
          "aria-label": `${n} bintang`,
          className: "h-7 w-7 transition",
        }
        return onChange ? (
          <button key={n} type="button" {...common}>
            {active ? (
              <MdStar className="h-7 w-7 text-yellow-400" />
            ) : (
              <MdStarOutline className="h-7 w-7 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span key={n} className="text-lg">
            {active ? (
              <MdStar className="h-6 w-6 text-yellow-400" />
            ) : (
              <MdStarOutline className="h-6 w-6 text-muted-foreground" />
            )}
          </span>
        )
      })}
    </div>
  )
}

function ReviewModal({
  draft,
  guestToken,
  canUpload,
  onClose,
  onSaved,
}: {
  draft: ReviewDraft
  guestToken: string | undefined
  canUpload: boolean
  onClose: () => void
  onSaved: (review: Review) => void
}): React.JSX.Element {
  const [rating, setRating] = useState(draft.existing?.rating ?? 0)
  const [comment, setComment] = useState(draft.existing?.comment ?? "")
  const [images, setImages] = useState<string[]>(draft.existing?.images ?? [])
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const submit = async () => {
    if (rating < 1) {
      setError("Pilih rating 1–5 bintang.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const body = {
        rating,
        comment: comment.trim() || undefined,
        images,
      }
      const result =
        draft.mode === "create"
          ? await reviewsApi.create({
              orderItemId: draft.orderItem.id,
              orderId: draft.order.id,
              rating,
              comment: comment.trim() || undefined,
              images,
              guestToken,
            })
          : await reviewsApi.update(draft.existing!.id, body, guestToken)
      onSaved(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan ulasan.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || !canUpload) return
    const list = Array.from(files).slice(0, 5 - images.length)
    for (const file of list) {
      try {
        setUploading(true)
        const { url } = await uploadFile(file, "reviews")
        setImages((prev) => [...prev, url])
      } catch {
        setError("Gagal mengunggah gambar.")
      } finally {
        setUploading(false)
      }
    }
  }

  const item = draft.orderItem.menuItem

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-card sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-lg font-black text-foreground">
            {draft.mode === "create" ? "Beri Penilaian" : "Edit Penilaian"}
          </h3>
          <button type="button" onClick={onClose} aria-label="Tutup" className="text-muted-foreground hover:text-foreground">
            <MdClose className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="flex items-center gap-3">
            <img
              src={menuImageUrl(item.category, item.imageUrl, item.name)}
              alt={item.name}
              className="h-16 w-16 rounded-xl border border-border object-cover"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-foreground">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {draft.order.place.name} · {formatRupiah(item.price)} ×{draft.orderItem.quantity}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-foreground">Rating</div>
            <Stars value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Komentar</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Ceritakan pengalaman kamu dengan produk ini..."
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {canUpload && (
            <div>
              <div className="mb-2 text-sm font-semibold text-foreground">Foto (opsional)</div>
              <div className="flex flex-wrap gap-2">
                {images.map((src, i) => (
                  <div key={i} className="relative h-16 w-16">
                    <img src={src} alt="" className="h-16 w-16 rounded-xl border border-border object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label="Hapus foto"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                    >
                      <MdClose className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    <MdPhotoCamera className="h-5 w-5" />
                    <span className="text-[10px]">{uploading ? "..." : "Tambah"}</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    void handleFiles(e.target.files)
                    e.target.value = ""
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
              {error}
            </div>
          )}
        </div>

        <footer className="flex items-center gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : draft.mode === "create" ? "Kirim Penilaian" : "Simpan Perubahan"}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default function OrderCartPage(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { refresh: refreshNotifications } = useNotifications()
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

  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null)
  const [tab, setTab] = useState<TabKey>(items.length > 0 ? "keranjang" : "unpaid")

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

  const loadReviews = useCallback(async () => {
    try {
      const token = getGuestToken()
      const result = user ? await reviewsApi.mine() : await reviewsApi.mine(token)
      setReviews(result)
    } catch {
      setReviews([])
    }
  }, [user])

  useEffect(() => {
    void loadOrders()
    void loadReviews()
  }, [loadOrders, loadReviews])

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
        .finally(() => {
          void loadOrders()
          void loadReviews()
          refreshNotifications()
        })
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

  const reviewedIds = useMemo(() => new Set(reviews.map((r) => r.orderItemId)), [reviews])

  const openCreate = (item: Order["items"][number], order: Order) => {
    setReviewDraft({
      mode: "create",
      orderItem: {
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        menuItem: item.menuItem,
      },
      order: {
        id: order.id,
        createdAt: order.createdAt,
        place: { id: order.place.id, name: order.place.name },
      },
    })
  }

  const openEdit = (review: Review) => {
    setReviewDraft({
      mode: "edit",
      orderItem: review.orderItem,
      order: review.order,
      existing: review,
    })
  }

  const handleSaved = (review: Review) => {
    setReviews((prev) => {
      const exists = prev.some((r) => r.id === review.id)
      return exists ? prev.map((r) => (r.id === review.id ? review : r)) : [review, ...prev]
    })
    setNotice("Penilaian berhasil disimpan.")
    setReviewDraft(null)
  }

  const deleteReview = async (id: string) => {
    if (!window.confirm("Hapus penilaian ini?")) return
    try {
      await reviewsApi.remove(id, user ? undefined : getGuestToken())
      setReviews((prev) => prev.filter((r) => r.id !== id))
      setNotice("Penilaian dihapus.")
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Gagal menghapus penilaian.")
    }
  }

  const orderTabs = useMemo(() => {
    const map: Record<"unpaid" | "packed" | "shipped" | "completed", Order[]> = {
      unpaid: [],
      packed: [],
      shipped: [],
      completed: [],
    }
    for (const o of orders) {
      map[orderTab(o)].push(o)
    }
    return map
  }, [orders])

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "keranjang", label: "Keranjang", count: items.length },
    { key: "unpaid", label: "Belum Bayar", count: orderTabs.unpaid.length },
    { key: "packed", label: "Dikemas", count: orderTabs.packed.length },
    { key: "shipped", label: "Dikirim", count: orderTabs.shipped.length },
    { key: "completed", label: "Selesai", count: orderTabs.completed.length },
    { key: "mine", label: "Penilaian Saya", count: reviews.length },
  ]

  const statusIcon = (status: string) =>
    status === "SHIPPED" ? (
      <MdLocalShipping />
    ) : status === "COMPLETED" ? (
      <MdCheckCircle />
    ) : status === "CANCELLED" || status === "EXPIRED" || status === "PAYMENT_FAILED" ? (
      <MdError />
    ) : null

  return (
    <div className="min-h-screen bg-background pb-40 pt-24 sm:pb-32">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="tag-pill mb-3 inline-block">Marketplace</span>
            <h1 className="text-3xl font-black text-foreground sm:text-4xl" style={{ fontFamily: "'Fraunces', serif" }}>
              Keranjang
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Periksa produk pilihanmu dan kelola pesanan.</p>
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

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card/60 text-foreground hover:border-primary"
                }`}
              >
                {t.label}
                <span className={`rounded-full px-1.5 text-xs font-black ${active ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"}`}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>

        {tab === "keranjang" && (
          <>
            {items.length > 0 ? (
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
            ) : (
              <div className="glass-card rounded-3xl px-6 py-12 text-center text-muted-foreground">
                Keranjang masih kosong.
              </div>
            )}
          </>
        )}

        {(tab === "unpaid" || tab === "packed" || tab === "shipped" || tab === "completed") && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <MdReceiptLong className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-black text-foreground">
                {tab === "unpaid" ? "Belum Bayar" : tab === "packed" ? "Dikemas" : tab === "shipped" ? "Dikirim" : "Selesai"}
              </h2>
            </div>

            {loadingOrders ? (
              <div className="glass-card animate-pulse rounded-3xl px-6 py-16 text-center text-muted-foreground">
                Memuat pesanan...
              </div>
            ) : orderTabs[tab as "unpaid" | "packed" | "shipped" | "completed"].length === 0 ? (
              <div className="glass-card rounded-3xl px-6 py-12 text-center text-muted-foreground">
                Tidak ada pesanan di tab ini.
              </div>
            ) : (
              <div className="space-y-3">
                {orderTabs[tab as "unpaid" | "packed" | "shipped" | "completed"].map((order) => {
                  const isUnpaid = order.paymentStatus !== "PAID"
                  return (
                    <article key={order.id} className="rounded-2xl border border-border bg-card/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <strong className="truncate text-sm font-bold text-foreground">{order.place.name}</strong>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                              {ORDER_STATUS_LABEL[order.status] ?? order.status}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            #{order.id.slice(-8)} · {order.items.length} item · {formatRupiah(order.total)}
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
                            {statusIcon(order.status)}
                            {ORDER_STATUS_LABEL[order.status] ?? order.status}
                          </span>
                        )}
                      </div>

                      {tab === "completed" ? (
                        <div className="mt-3 divide-y divide-border border-t border-border">
                          {order.items.map((it) => {
                            const reviewed = reviewedIds.has(it.id)
                            return (
                              <div key={it.id} className="flex items-center gap-3 py-3 first:pt-3">
                                <img
                                  src={menuImageUrl(it.menuItem.category, it.menuItem.imageUrl, it.menuItem.name)}
                                  alt={it.menuItem.name}
                                  className="h-12 w-12 rounded-xl border border-border object-cover"
                                  loading="lazy"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-bold text-foreground">{it.menuItem.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatRupiah(it.price)} ×{it.quantity}
                                  </div>
                                </div>
                                {reviewed ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const rev = reviews.find((r) => r.orderItemId === it.id)
                                      if (rev) openEdit(rev)
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/10"
                                  >
                                    <MdEdit /> Lihat/Edit
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openCreate(it, order)}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground transition hover:opacity-90"
                                  >
                                    Beri Penilaian
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {order.items.slice(0, 4).map((it) => (
                            <div key={it.id} className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5">
                              <img
                                src={menuImageUrl(it.menuItem.category, it.menuItem.imageUrl, it.menuItem.name)}
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
                            <span className="self-center text-xs text-muted-foreground">+{order.items.length - 4} lainnya</span>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {tab === "mine" && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <MdStar className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-black text-foreground">Penilaian Saya</h2>
            </div>

            {reviews.length === 0 ? (
              <div className="glass-card rounded-3xl px-6 py-12 text-center text-muted-foreground">
                Kamu belum memberi penilaian.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-border bg-card/60 p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={menuImageUrl(
                          review.orderItem.menuItem.category,
                          review.orderItem.menuItem.imageUrl,
                          review.orderItem.menuItem.name,
                        )}
                        alt={review.orderItem.menuItem.name}
                        className="h-14 w-14 rounded-xl border border-border object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-foreground">{review.orderItem.menuItem.name}</div>
                        <div className="text-xs text-muted-foreground">{review.order.place.name}</div>
                        <div className="mt-1">
                          <Stars value={review.rating} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(review)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/10"
                        >
                          <MdEdit /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteReview(review.id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-destructive hover:text-destructive"
                        >
                          <MdDeleteOutline /> Hapus
                        </button>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-3 rounded-xl bg-background px-3 py-2 text-sm text-foreground">{review.comment}</p>
                    )}
                    {review.images.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {review.images.map((src, i) => (
                          <img key={i} src={src} alt="" className="h-16 w-16 rounded-xl border border-border object-cover" />
                        ))}
                      </div>
                    )}
                    <div className="mt-3 text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {tab === "keranjang" && items.length > 0 && (
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

      {reviewDraft && (
        <ReviewModal
          draft={reviewDraft}
          guestToken={user ? undefined : getGuestToken()}
          canUpload={Boolean(user)}
          onClose={() => setReviewDraft(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
