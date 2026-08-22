import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  MdAdd,
  MdArrowBack,
  MdBookmarkAdd,
  MdCheckCircle,
  MdClose,
  MdDelete,
  MdFavoriteBorder,
  MdLocationOn,
  MdPayments,
  MdReceiptLong,
  MdRemove,
  MdRestore,
  MdShoppingCart,
  MdUpload,
} from "react-icons/md"
import { QRCodeSVG } from "qrcode.react"
import {
  menusApi,
  ordersApi,
  paymentsApi,
  placesApi,
  uploadFile,
  type MenuItemOption,
  type Order,
  type PlaceListItem,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import AuthModal from "@/components/ui/auth-modal"
import MenuProductCard from "@/components/ui/menu-product-card"
import {
  cartCount,
  cartSubtotal,
  useCartStore,
  type CartItem,
} from "@/lib/cart-store"
import { formatRupiah } from "@/lib/format"
import { menuImageUrl } from "@/lib/menu-images"

type Step = "menu" | "cart" | "checkout" | "pay" | "done"

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[#d1d5db] focus:ring-2 focus:ring-[rgba(209,213,219,0.25)]"

const PAYMENT_METHODS = [
  "QRIS",
  "Virtual Account",
  "E-Wallet (GoPay / OVO / DANA)",
  "Kartu Kredit / Debit",
  "Bayar di Kafe",
]

const PAYMENT_LABEL: Record<string, string> = {
  UNPAID: "Belum Dibayar",
  PAID: "Lunas",
  FAILED: "Gagal",
}

const NEW_USER_COUPON = "KOPI10"
const NEW_USER_DISCOUNT_RATE = 0.1

function discountedAmount(value: number): number {
  return Math.max(1000, Math.round(value * (1 - NEW_USER_DISCOUNT_RATE)))
}

const STEPS: { key: Step; label: string }[] = [
  { key: "menu", label: "Pesan" },
  { key: "cart", label: "List Order" },
  { key: "checkout", label: "Checkout" },
  { key: "pay", label: "Pembayaran" },
]

function vaNumber(orderId: string): string {
  const digits = orderId.replace(/\D/g, "").slice(-12)
  return `988${digits || "000000000001"}`
}

function billingSummary(order: Order | null): string {
  return order?.billingAddress?.replace(/\n/g, " · ") ?? "-"
}

function guestTokenFor(orderId: string): string | undefined {
  if (typeof window === "undefined") return undefined
  return sessionStorage.getItem(`Coffidoor_guest_order_${orderId}`) ?? undefined
}

export default function OrderPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const items = useCartStore((s) => s.items)
  const savedForLater = useCartStore((s) => s.savedForLater)
  const wishlist = useCartStore((s) => s.wishlist)
  const add = useCartStore((s) => s.add)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const remove = useCartStore((s) => s.remove)
  const clear = useCartStore((s) => s.clear)
  const saveForLater = useCartStore((s) => s.saveForLater)
  const restoreSaved = useCartStore((s) => s.restoreSaved)
  const removeSaved = useCartStore((s) => s.removeSaved)
  const moveToWishlist = useCartStore((s) => s.moveToWishlist)
  const moveFromWishlist = useCartStore((s) => s.moveFromWishlist)
  const removeFromWishlist = useCartStore((s) => s.removeFromWishlist)

  const initialStep = (location.state as { step?: Step } | null)?.step
  const [step, setStep] = useState<Step>(() =>
    initialStep && initialStep !== "done" ? initialStep : "menu",
  )
  const [places, setPlaces] = useState<PlaceListItem[]>([])
  const [selectedPlaceId, setSelectedPlaceId] = useState("")
  const [menus, setMenus] = useState<MenuItemOption[]>([])
  const [loadingMenus, setLoadingMenus] = useState(true)
  const [menuError, setMenuError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [paymentRedirectState, setPaymentRedirectState] = useState<
    "success" | "failed" | null
  >(null)

  const [authOpen, setAuthOpen] = useState(false)
  const [note, setNote] = useState("")
  const [billing, setBilling] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  })
  const [billingError, setBillingError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0])
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)
  const [showMidtransPanel, setShowMidtransPanel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [proofName, setProofName] = useState("")
  const [uploadingProof, setUploadingProof] = useState(false)

  const count = cartCount(items)
  const subtotal = cartSubtotal(items)
  const discountedSubtotal = discountedAmount(subtotal)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const paymentStatus = params.get("payment")
    const orderId = params.get("order_id")

    if (!orderId || !paymentStatus) return

    setPaymentRedirectState(paymentStatus === "success" ? "success" : "failed")

    if (paymentStatus === "success") {
      setError("Pembayaran diterima Midtrans. Status pesanan akan diperbarui setelah konfirmasi server.")
      setStep("done")
      clear()
      void paymentsApi.syncStatus(orderId).catch(() => null)
      return
    }

    setError("Pembayaran gagal atau dibatalkan. Silakan ulang proses checkout.")
    setStep("pay")
  }, [clear, location.search])

  useEffect(() => {
    placesApi
      .list()
      .then(setPlaces)
      .catch(() => setPlaces([]))
  }, [])

  useEffect(() => {
    if (user && !billing.name) {
      setBilling((b) => ({ ...b, name: user.name ?? "" }))
    }
  }, [user, billing.name])

  useEffect(() => {
    let active = true
    setLoadingMenus(true)
    setMenuError(null)
    menusApi
      .list(selectedPlaceId || undefined)
      .then((data) => {
        if (active) setMenus(data)
      })
      .catch((err) => {
        if (active)
          setMenuError(
            err instanceof Error ? err.message : "Gagal memuat menu.",
          )
      })
      .finally(() => {
        if (active) setLoadingMenus(false)
      })
    return () => {
      active = false
    }
  }, [selectedPlaceId])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(t)
  }, [notice])

  const handleBuyNow = (item: Omit<CartItem, "quantity">) => {
    sessionStorage.setItem(
      "Coffidoor_checkout_items",
      JSON.stringify([{ ...item, quantity: 1 }]),
    )
    navigate("/order/checkout")
  }

  const requireLogin = (): boolean => {
    if (user) return true
    setAuthOpen(true)
    return false
  }

  const goCheckout = () => {
    if (items.length === 0) {
      setNotice("Tambahkan minimal satu menu ke keranjang terlebih dahulu.")
      return
    }
    setStep("cart")
  }

  const buildBillingAddress = (): string => {
    const lines = [
      billing.name.trim() +
        (billing.phone.trim() ? ` · ${billing.phone.trim()}` : ""),
      billing.address.trim(),
      billing.city.trim() +
        (billing.postalCode.trim() ? `, ${billing.postalCode.trim()}` : ""),
    ]
    return lines.join("\n")
  }

  const placeOrder = async () => {
    if (items.length === 0) return
    if (
      !billing.name.trim() ||
      !billing.address.trim() ||
      !billing.city.trim()
    ) {
      setBillingError("Lengkapi nama, alamat, dan kota pada alamat penagihan.")
      return
    }
    setBillingError(null)
    setError(null)
    setSubmitting(true)
    try {
      const order = await ordersApi.create({
        placeId: items[0].placeId,
        checkoutSessionId: crypto.randomUUID(),
        items: items.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
        note: note.trim() || undefined,
        billingAddress: buildBillingAddress(),
        couponCode: NEW_USER_COUPON,
      })
      setCreatedOrder(order)
      if (order.guestToken && typeof window !== "undefined") {
        sessionStorage.setItem(`Coffidoor_guest_order_${order.id}`, order.guestToken)
      }

      const payment = await paymentsApi.create({
        orderId: order.id,
        amount: order.total,
        customer: {
          firstName: billing.name || user?.name || "Coffidoor Customer",
          email: user?.email || "customer@coffidoor.test",
          phone: billing.phone || "081234567890",
        },
        guestToken: order.guestToken ?? undefined,
      })

      if (payment.redirect_url) {
        window.location.assign(payment.redirect_url)
        return
      }

      setShowMidtransPanel(true)
      setStep("checkout")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat pesanan.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadProof = async (file: File | null) => {
    if (!file) return
    setUploadingProof(true)
    setError(null)
    try {
      const { url } = await uploadFile(file)
      setProofUrl(url)
      setProofName(file.name)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengunggah bukti pembayaran.",
      )
    } finally {
      setUploadingProof(false)
    }
  }

  const confirmPayment = async () => {
    if (!createdOrder) return

    if (paymentMethod === "Bayar di Kafe") {
      setError(null)
      setSubmitting(true)
      try {
        const paid = await ordersApi.pay(
          createdOrder.id,
          paymentMethod,
          proofUrl ?? undefined,
          guestTokenFor(createdOrder.id),
        )
        setCreatedOrder(paid)
        clear()
        setNote("")
        setProofUrl(null)
        setProofName("")
        setStep("done")
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memproses pembayaran.",
        )
      } finally {
        setSubmitting(false)
      }
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const payment = await paymentsApi.create({
        orderId: createdOrder.id,
        amount: createdOrder.total,
        customer: {
          firstName: billing.name || user?.name || "Coffidoor Customer",
          email: user?.email || "customer@Coffidoor.test",
          phone: billing.phone || "081234567890",
        },
        guestToken: guestTokenFor(createdOrder.id),
      })

      if (payment.redirect_url) {
        window.location.href = payment.redirect_url
        return
      }

      const paid = await ordersApi.pay(createdOrder.id, "Midtrans")
      setCreatedOrder(paid)
      clear()
      setNote("")
      setProofUrl(null)
      setProofName("")
      setStep("done")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memproses pembayaran.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const resetFlow = () => {
    setCreatedOrder(null)
    setError(null)
    setStep("menu")
  }

  const renderStepIndicator = () => {
    const currentIndex = STEPS.findIndex((s) => s.key === step)
    return (
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                i === currentIndex
                  ? "bg-[#d1d5db] text-[#111113]"
                  : i < currentIndex
                    ? "footer-glass-pill text-muted-foreground"
                    : "footer-glass-pill text-muted-foreground/50"
              }`}
            >
              <span>{i + 1}</span>
              <span>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="text-muted-foreground/40 text-xs">→</span>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderMenuStep = () => (
    <div>
      <div className="mb-6">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Pilih Kafe
        </label>
        <select
          value={selectedPlaceId}
          onChange={(e) => setSelectedPlaceId(e.target.value)}
          className={inputClass}
        >
          <option value="">Semua Kafe (paling diminati)</option>
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.city}
            </option>
          ))}
        </select>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl border border-[rgba(209,213,219,0.35)] bg-[rgba(209,213,219,0.08)] px-4 py-3 text-sm text-[#d1d5db]">
          {notice}
        </div>
      )}

      {loadingMenus ? (
        <div className="text-center text-muted-foreground animate-pulse py-16">
          Memuat menu...
        </div>
      ) : menuError ? (
        <div className="text-center text-destructive py-16">{menuError}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menus.map((m) => (
            <MenuProductCard
              key={m.id}
              menu={m}
              quantity={items.find((i) => i.id === m.id)?.quantity ?? 0}
              onNotice={setNotice}
              onBuyNow={handleBuyNow}
            />
          ))}
          {menus.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-16">
              Belum ada menu tersedia di kafe ini.
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderCartStep = () => {
    if (
      items.length === 0 &&
      savedForLater.length === 0 &&
      wishlist.length === 0
    ) {
      return (
        <div className="glass-card rounded-3xl p-10 text-center max-w-md mx-auto">
          <div className="text-4xl mb-3">🛒</div>
          <h2 className="text-xl font-black text-foreground mb-2">
            Keranjang masih kosong
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Yuk pilih menu favoritmu dulu.
          </p>
          <button
            onClick={() => setStep("menu")}
            className="bg-[#d1d5db] text-[#111113] font-black px-6 py-3 rounded-full text-sm"
          >
            Pilih Menu
          </button>
        </div>
      )
    }

    const handleCartPlaceChange = (value: string) => {
      if (!value || value === items[0]?.placeId) return
      clear()
      setSelectedPlaceId(value)
      setStep("menu")
    }

    const actionPill =
      "flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1.5 footer-glass-pill text-muted-foreground hover:text-foreground transition-colors"

    return (
      <div className="glass-card rounded-3xl p-6 md:p-8 max-w-2xl mx-auto">
        <div className="mb-5">
          <span className="tag-pill mb-3 inline-block">List Order</span>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Pilih Kafe
          </label>
          <div className="flex items-center gap-3">
            <select
              value={items[0]?.placeId ?? ""}
              onChange={(e) => handleCartPlaceChange(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Pilih kafe untuk pesanan...
              </option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.city}
                </option>
              ))}
            </select>
            <button
              onClick={() => setStep("menu")}
              className="shrink-0 flex items-center gap-1.5 footer-glass-pill px-4 py-3 rounded-full text-sm text-muted-foreground hover:text-foreground"
            >
              <MdArrowBack className="w-4 h-4" />
              Tambah Menu
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex flex-col divide-y divide-border">
            {items.map((item: CartItem) => (
              <div key={item.id} className="flex items-center gap-3 py-4">
                <img
                  src={menuImageUrl(item.category, item.imageUrl, item.name)}
                  alt={item.name}
                  className="w-11 h-11 rounded-xl object-cover shrink-0 border border-border"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatRupiah(item.price)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <button
                      onClick={() => remove(item.id)}
                      className={actionPill}
                      title="Hapus dari pesanan"
                    >
                      <MdDelete className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                    <button
                      onClick={() => saveForLater(item.id)}
                      className={actionPill}
                      title="Simpan untuk nanti"
                    >
                      <MdBookmarkAdd className="w-3.5 h-3.5" />
                      Simpan untuk Nanti
                    </button>
                    <button
                      onClick={() => moveToWishlist(item.id)}
                      className={actionPill}
                      title="Pindahkan ke daftar keinginan"
                    >
                      <MdFavoriteBorder className="w-3.5 h-3.5" />
                      Wishlist
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <MdRemove className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <MdAdd className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-20 text-right text-sm font-semibold text-foreground">
                  {formatRupiah(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        )}

        {savedForLater.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-2">
              <MdBookmarkAdd className="w-4 h-4" />
              Simpan untuk Nanti ({savedForLater.length})
            </div>
            <div className="flex flex-col divide-y divide-border">
              {savedForLater.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-3">
                  <img
                    src={menuImageUrl(s.category, s.imageUrl, s.name)}
                    alt={s.name}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-border"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm truncate">
                      {s.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.quantity} × {formatRupiah(s.price)}
                    </div>
                  </div>
                  <button
                    onClick={() => restoreSaved(s.id)}
                    className="flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1.5 bg-[#d1d5db]/15 text-[#d1d5db] hover:bg-[#d1d5db]/25 transition-colors"
                  >
                    <MdRestore className="w-3.5 h-3.5" />
                    Kembalikan
                  </button>
                  <button
                    onClick={() => removeSaved(s.id)}
                    className="flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1.5 footer-glass-pill text-muted-foreground hover:text-destructive transition-colors"
                    title="Hapus dari daftar"
                  >
                    <MdClose className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {wishlist.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-2">
              <MdFavoriteBorder className="w-4 h-4" />
              Daftar Keinginan ({wishlist.length})
            </div>
            <div className="flex flex-col divide-y divide-border">
              {wishlist.map((w) => (
                <div key={w.id} className="flex items-center gap-3 py-3">
                  <img
                    src={menuImageUrl(w.category, w.imageUrl, w.name)}
                    alt={w.name}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-border"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm truncate">
                      {w.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {w.quantity} × {formatRupiah(w.price)}
                    </div>
                  </div>
                  <button
                    onClick={() => moveFromWishlist(w.id)}
                    className="flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1.5 bg-[#d1d5db]/15 text-[#d1d5db] hover:bg-[#d1d5db]/25 transition-colors"
                  >
                    <MdAdd className="w-3.5 h-3.5" />
                    Pindah ke Keranjang
                  </button>
                  <button
                    onClick={() => removeFromWishlist(w.id)}
                    className="flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1.5 footer-glass-pill text-muted-foreground hover:text-destructive transition-colors"
                    title="Hapus dari daftar"
                  >
                    <MdClose className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-black text-foreground">
                {formatRupiah(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 text-sm text-emerald-600 dark:text-emerald-400">
              <span>Kupon pengguna baru ({NEW_USER_COUPON})</span>
              <span className="font-semibold">
                -{formatRupiah(subtotal - discountedSubtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-semibold text-foreground">
                Total
              </span>
              <span className="font-black text-lg text-[#d1d5db]">
                {formatRupiah(discountedSubtotal)}
              </span>
            </div>

            <button
              onClick={() => {
                if (items.length === 0) {
                  setNotice("Tambahkan minimal satu menu ke keranjang terlebih dahulu.")
                  return
                }
                setStep("checkout")
              }}
              className="mt-6 w-full bg-[#d1d5db] text-[#111113] font-black px-6 py-3.5 rounded-full text-sm hover:bg-[#f3f4f6] transition-colors"
            >
              Lanjut ke Checkout
            </button>
          </>
        )}
      </div>
    )
  }

  const renderCheckoutStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
      <div className="flex flex-col gap-6 min-w-0">
        <div className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-5">
            <MdLocationOn className="w-5 h-5 text-[#d1d5db]" />
            <h2
              className="text-xl font-black text-foreground"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Alamat Penagihan
            </h2>
          </div>

          {billingError && (
            <div className="mb-4 rounded-xl border border-[rgba(220,38,38,0.35)] bg-[rgba(220,38,38,0.08)] px-4 py-3 text-sm text-destructive">
              {billingError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Nama Penerima
              </label>
              <input
                value={billing.name}
                onChange={(e) =>
                  setBilling((b) => ({ ...b, name: e.target.value }))
                }
                placeholder="Nama lengkap"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                No. HP
              </label>
              <input
                value={billing.phone}
                onChange={(e) =>
                  setBilling((b) => ({ ...b, phone: e.target.value }))
                }
                placeholder="08xxxxxxxxxx"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Alamat
              </label>
              <textarea
                value={billing.address}
                onChange={(e) =>
                  setBilling((b) => ({ ...b, address: e.target.value }))
                }
                rows={2}
                placeholder="Nama jalan, nomor, RT/RW, kelurahan, kecamatan"
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Kota
              </label>
              <input
                value={billing.city}
                onChange={(e) =>
                  setBilling((b) => ({ ...b, city: e.target.value }))
                }
                placeholder="Contoh: Bandung"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Kode Pos
              </label>
              <input
                value={billing.postalCode}
                onChange={(e) =>
                  setBilling((b) => ({ ...b, postalCode: e.target.value }))
                }
                placeholder="Contoh: 40123"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6 md:p-8 lg:sticky lg:top-24">
        <span className="tag-pill mb-3 inline-block">Ringkasan Pesanan</span>
        <div className="mb-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Kafe
          </div>
          <div className="font-semibold text-foreground">
            {items[0]?.placeName}
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <img
                  src={menuImageUrl(item.category, item.imageUrl, item.name)}
                  alt={item.name}
                  className="w-8 h-8 rounded-lg object-cover border border-border"
                  loading="lazy"
                />
                {item.name}{" "}
                <span className="text-foreground font-semibold">
                  × {item.quantity}
                </span>
              </span>
              <span className="font-semibold text-foreground">
                {formatRupiah(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Catatan Pesanan
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Contoh: tanpa gula, susu diganti oat, dll."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex items-center justify-between py-3 border-t border-border">
          <span className="font-semibold text-foreground">
            Total Pembayaran
          </span>
          <span className="font-black text-lg text-[#d1d5db]">
            {formatRupiah(discountedSubtotal)}
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[rgba(220,38,38,0.35)] bg-[rgba(220,38,38,0.08)] px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setStep("cart")}
            className="footer-glass-pill px-5 py-3 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Kembali
          </button>
          {!showMidtransPanel && (
            <button
              onClick={placeOrder}
              disabled={submitting}
              className="flex-1 bg-[#d1d5db] text-[#111113] font-black px-6 py-3 rounded-full text-sm hover:bg-[#f3f4f6] transition-colors disabled:opacity-60"
            >
              {submitting ? "Menyimpan..." : "Checkout"}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  const renderPayStep = () => {
    const isQris = paymentMethod === "QRIS"
    const isVa = paymentMethod.includes("Virtual Account")
    const isBayarDiKafe = paymentMethod === "Bayar di Kafe"

    return (
      <div className="glass-card rounded-3xl p-6 md:p-8 max-w-2xl mx-auto">
        <span className="tag-pill mb-2 inline-block">Pembayaran</span>
        <h2
          className="text-2xl font-black text-foreground mb-1"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Selesaikan Pembayaran
        </h2>
        <div className="text-sm text-muted-foreground mb-5">
          Pesanan #{createdOrder?.id.slice(-8)} · {paymentMethod}
        </div>

        {paymentRedirectState === "success" && (
          <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            Pembayaran berhasil diterima. Silakan tunggu proses selanjutnya dari kafe.
          </div>
        )}

        {paymentRedirectState === "failed" && (
          <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            Pembayaran dibatalkan atau gagal. Anda masih bisa mencoba ulang dari tahap pembayaran.
          </div>
        )}

        {isQris && (
          <div className="rounded-2xl border border-border p-5 mb-5 flex flex-col items-center text-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Scan QRIS berikut untuk membayar
            </div>
            <div className="bg-white rounded-2xl p-4 inline-block">
              <QRCodeSVG
                value={`Coffidoor-QRIS:${createdOrder?.id}:${createdOrder?.total}`}
                size={184}
                bgColor="#ffffff"
                fgColor="#111113"
              />
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              Buka aplikasi e-wallet atau mobile banking lalu pindai kode QR di
              atas.
            </div>
          </div>
        )}

        {isVa && (
          <div className="rounded-2xl border border-border p-5 mb-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Nomor Virtual Account
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[rgba(156,163,175,0.08)] border border-[rgba(156,163,175,0.2)] px-5 py-4">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  Bank Digital
                </div>
                <div className="font-black text-foreground text-xl tracking-widest select-all">
                  {vaNumber(createdOrder?.id ?? "")}
                </div>
              </div>
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(
                    vaNumber(createdOrder?.id ?? ""),
                  )
                }
                className="shrink-0 text-xs font-semibold rounded-full px-4 py-2 bg-[#d1d5db] text-[#111113] hover:bg-[#f3f4f6] transition-colors"
              >
                Salin
              </button>
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              Lakukan transfer ke nomor virtual account di atas melalui aplikasi
              bank Anda.
            </div>
          </div>
        )}

        {!isQris && !isVa && !isBayarDiKafe && (
          <div className="rounded-2xl border border-border p-5 mb-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Instruksi Pembayaran
            </div>
            <p className="text-sm text-foreground">
              Lanjutkan pembayaran melalui {paymentMethod}, lalu unggah bukti
              pembayaran di bawah.
            </p>
          </div>
        )}

        {isBayarDiKafe && (
          <div className="rounded-2xl border border-border p-5 mb-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Bayar di Kafe
            </div>
            <p className="text-sm text-foreground">
              Selesaikan pembayaran langsung di kafe saat mengambil pesanan.
              Tidak perlu mengunggah bukti.
            </p>
          </div>
        )}

        {!isBayarDiKafe && (
          <div className="rounded-2xl border border-border p-5 mb-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Bukti Pembayaran
            </div>
            {proofUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={proofUrl}
                  alt="Bukti pembayaran"
                  className="w-14 h-14 rounded-xl object-cover border border-border"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {proofName || "Bukti terkirim"}
                  </div>
                  <button
                    onClick={() => {
                      setProofUrl(null)
                      setProofName("")
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Hapus bukti
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 cursor-pointer hover:border-[#d1d5db] transition-colors">
                <MdUpload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploadingProof ? "Mengunggah..." : "Kirim Bukti Pembayaran"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleUploadProof(e.target.files?.[0] ?? null)
                  }
                />
              </label>
            )}
          </div>
        )}

        <div className="flex items-center justify-between py-3 border-t border-border">
          <span className="font-semibold text-foreground">
            Total Pembayaran
          </span>
          <span className="font-black text-lg text-[#d1d5db]">
            {formatRupiah(createdOrder?.total ?? discountedSubtotal)}
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[rgba(220,38,38,0.35)] bg-[rgba(220,38,38,0.08)] px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setStep("checkout")}
            className="footer-glass-pill px-5 py-3 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Kembali
          </button>
          <button
            onClick={confirmPayment}
            disabled={submitting}
            className="flex-1 bg-[#d1d5db] text-[#111113] font-black px-6 py-3 rounded-full text-sm hover:bg-[#f3f4f6] transition-colors disabled:opacity-60"
          >
            {submitting ? "Memproses..." : "Konfirmasi Pembayaran"}
          </button>
        </div>
      </div>
    )
  }

  const renderDoneStep = () => (
    <div className="glass-card rounded-3xl p-10 text-center max-w-md mx-auto">
      <MdCheckCircle className="w-14 h-14 text-[#d1d5db] mx-auto mb-4" />
      <h2
        className="text-2xl font-black text-foreground mb-2"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        Pembayaran Berhasil!
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Pesananmu sudah dikonfirmasi dan sedang diproses kafe.
      </p>
      <div className="rounded-2xl bg-[rgba(156,163,175,0.08)] border border-[rgba(156,163,175,0.2)] p-4 text-left text-sm space-y-1.5 mb-6">
        <div className="flex justify-between">
          <span className="text-muted-foreground">No. Pesanan</span>
          <span className="font-semibold text-foreground">
            #{createdOrder?.id.slice(-8)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Kafe</span>
          <span className="font-semibold text-foreground">
            {createdOrder?.place.name}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Metode</span>
          <span className="font-semibold text-foreground">
            {createdOrder?.paymentMethod}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Alamat Penagihan</span>
          <span className="font-semibold text-foreground text-right max-w-[55%]">
            {billingSummary(createdOrder)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className="font-semibold text-[#d1d5db]">
            {createdOrder ? PAYMENT_LABEL[createdOrder.paymentStatus] : ""}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-black text-[#d1d5db]">
            {formatRupiah(createdOrder?.total ?? 0)}
          </span>
        </div>
      </div>
      {createdOrder?.paymentProofUrl && (
        <div className="rounded-2xl border border-border p-3 mb-6 flex items-center justify-center">
          <img
            src={createdOrder.paymentProofUrl}
            alt="Bukti pembayaran"
            className="h-24 rounded-xl object-cover"
          />
        </div>
      )}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={resetFlow}
          className="footer-glass-pill px-5 py-3 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Pesan Lagi
        </button>
        <button
          onClick={() => navigate("/order/keranjang")}
          className="bg-[#d1d5db] text-[#111113] font-black px-5 py-3 rounded-full text-sm hover:bg-[#f3f4f6] transition-colors"
        >
          Lihat Keranjang
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 text-muted-foreground animate-pulse">
        Memuat...
      </div>
    )
  }

  return (
    <div className="pt-16">
      <div className="mx-auto px-6 md:px-12 py-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="tag-pill mb-3 inline-block">Pesan Kopi</span>
            <h1
              className="text-3xl md:text-4xl font-black text-foreground"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Pesan & Ambil Kopimu
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Pilih menu favorit dari berbagai kafe, lalu checkout dan bayar
              langsung dari sini.
            </p>
          </div>
          <button
            onClick={() => navigate("/order/keranjang")}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full footer-glass-pill text-sm font-bold text-muted-foreground hover:text-[#d1d5db] transition-colors"
          >
            <MdReceiptLong className="w-4 h-4" />
            Keranjang
          </button>
        </div>

        {step !== "menu" && step !== "done" && renderStepIndicator()}
        {step === "menu" && renderMenuStep()}
        {step === "cart" && renderCartStep()}
        {step === "checkout" && renderCheckoutStep()}
        {step === "pay" && renderPayStep()}
        {step === "done" && renderDoneStep()}

        {(step === "menu" || step === "cart") && count > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <button
              onClick={() => setStep("cart")}
              className="flex items-center gap-2 bg-[#d1d5db] text-[#111113] font-black px-6 py-3 rounded-full shadow-lg hover:bg-[#f3f4f6] transition-colors"
            >
              <MdShoppingCart className="w-5 h-5" />
              Lihat Pesanan · {count} item
            </button>
          </div>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
