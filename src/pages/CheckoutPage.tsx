import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { MdArrowBack, MdLocationOn, MdLocalShipping, MdStorefront } from "react-icons/md"
import { useAuth } from "@/lib/auth-context"
import { getGuestToken } from "@/lib/guest"
import { ordersApi, paymentsApi } from "@/lib/api"
import { formatRupiah } from "@/lib/format"
import { menuImageUrl } from "@/lib/menu-images"
import { useCartStore, type CartItem } from "@/lib/cart-store"

const COUPON = "KOPI10"
const SHIPPING_FEE = 0

type Address = { name: string; phone: string; address: string; city: string; postalCode: string; label: string }

function readCheckoutItems(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const value = JSON.parse(sessionStorage.getItem("Coffidoor_checkout_items") ?? "[]") as unknown
    return Array.isArray(value) ? (value as CartItem[]) : []
  } catch {
    return []
  }
}

  function getCheckoutSessionId(): string {
    const key = "Coffidoor_checkout_session"
    const existing = sessionStorage.getItem(key)
    if (existing) return existing
    const value = crypto.randomUUID()
    sessionStorage.setItem(key, value)
    return value
  }

export default function CheckoutPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { user } = useAuth()
  const remove = useCartStore((state) => state.remove)
  const items = useMemo(readCheckoutItems, [])
  const [address, setAddress] = useState<Address>({ name: user?.name ?? "", phone: "", address: "", city: "", postalCode: "", label: "Rumah" })
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const discount = Math.round(subtotal * 0.1)
  const total = Math.max(1000, subtotal - discount + SHIPPING_FEE)
  const storeName = items[0]?.placeName ?? "Toko"

  const createOrder = async () => {
    if (submitting) return
    if (!items.length) {
      setError("Tidak ada produk yang dipilih. Kembali ke keranjang.")
      return
    }
    if (!address.name.trim() || !address.phone.trim() || !address.address.trim() || !address.city.trim()) {
      setError("Lengkapi alamat pengiriman sebelum membuat pesanan.")
      return
    }
    if (new Set(items.map((item) => item.placeId)).size > 1) {
      setError("Checkout saat ini hanya dapat dilakukan untuk satu toko.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const order = await ordersApi.create({
        placeId: items[0].placeId,
        items: items.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
        couponCode: COUPON,
        shippingFee: SHIPPING_FEE,
        note: note.trim() || undefined,
        checkoutSessionId: getCheckoutSessionId(),
        billingAddress: `${address.name} · ${address.phone}\n${address.address}\n${address.city} ${address.postalCode}`,
        guestToken: user ? undefined : getGuestToken(),
      })
      const payment = await paymentsApi.create({
        orderId: order.id,
        amount: order.total,
        guestToken: order.guestToken,
        customer: { firstName: address.name, email: user?.email ?? "guest@coffidoor.test", phone: address.phone },
      })
      if (payment.redirect_url) {
        sessionStorage.setItem(`Coffidoor_payment_url_${order.id}`, payment.redirect_url)
      }
      items.forEach((item) => remove(item.id))
      sessionStorage.removeItem("Coffidoor_checkout_items")
      if (payment.redirect_url) window.location.assign(payment.redirect_url)
      else navigate("/order/keranjang")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat pesanan.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!items.length) {
    return <div className="min-h-screen px-4 pb-20 pt-28 text-center"><h1 className="text-2xl font-black text-foreground">Tidak ada produk untuk checkout</h1><Link to="/order/keranjang" className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Kembali ke Keranjang</Link></div>
  }

  return (
    <div className="min-h-screen bg-background pb-32 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center gap-4"><Link to="/order/keranjang" aria-label="Kembali ke keranjang" className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary"><MdArrowBack /></Link><div><span className="tag-pill mb-1 inline-block">Pembelian</span><h1 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Checkout</h1></div></header>
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <main className="space-y-4">
            <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-black text-foreground"><MdLocationOn className="text-primary" /> Alamat Pengiriman</h2><span className="text-xs font-bold text-primary">{address.label}</span></div><div className="grid gap-3 sm:grid-cols-2"><input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} placeholder="Nama penerima" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" /><input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="Nomor telepon" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" /><textarea value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} placeholder="Alamat lengkap" rows={3} className="resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary sm:col-span-2" /><input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="Kota" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" /><input value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} placeholder="Kode pos" className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" /></div></section>
            <section className="rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="flex items-center gap-2 font-black text-foreground"><MdStorefront className="text-primary" /> {storeName}</h2><span className="text-xs text-muted-foreground">{items.length} produk</span></div>{items.map((item) => <div key={item.id} className="flex items-center gap-3 border-b border-border px-5 py-4 last:border-0"><img src={menuImageUrl(item.category, item.imageUrl, item.name)} alt={item.name} className="h-16 w-16 rounded-xl object-cover" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-foreground">{item.name}</div><div className="text-xs text-muted-foreground">Variasi standar · x{item.quantity}</div></div><div className="text-right text-sm font-black text-primary">{formatRupiah(item.price * item.quantity)}<div className="text-xs font-normal text-muted-foreground">{formatRupiah(item.price)} / item</div></div></div>)}<div className="flex items-center gap-2 px-5 py-4"><MdLocalShipping className="text-primary" /><div className="flex-1"><div className="text-sm font-bold text-foreground">GrabExpress Sameday</div><div className="text-xs text-muted-foreground">Estimasi 1-2 jam</div></div><strong className="text-sm text-foreground">{formatRupiah(SHIPPING_FEE)}</strong></div><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Pesan untuk penjual (opsional)" rows={2} className="mx-5 mb-5 w-[calc(100%-2.5rem)] resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" /></section>
          </main>
          <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24"><h2 className="mb-5 font-black text-foreground">Ringkasan Pembayaran</h2><div className="space-y-3 text-sm"><div className="flex justify-between text-muted-foreground"><span>Total Produk</span><span>{formatRupiah(subtotal)}</span></div><div className="flex justify-between text-muted-foreground"><span>Ongkos Kirim</span><span>{formatRupiah(SHIPPING_FEE)}</span></div><div className="flex justify-between text-emerald-600"><span>Diskon Voucher {COUPON}</span><span>-{formatRupiah(discount)}</span></div><div className="flex justify-between border-t border-border pt-3 text-base font-black text-foreground"><span>Total Pembayaran</span><span className="text-primary">{formatRupiah(total)}</span></div></div>{error && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}<button type="button" onClick={() => void createOrder()} disabled={submitting} className="mt-6 flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-sm font-black text-primary-foreground hover:opacity-90 disabled:opacity-50">{submitting ? "Membuat Pesanan..." : "Buat Pesanan"}</button><p className="mt-3 text-center text-xs text-muted-foreground">Pembayaran aman diproses melalui Midtrans.</p></aside>
        </div>
      </div>
    </div>
  )
}