import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  MdAdd,
  MdArrowForward,
  MdBookmarkAdd,
  MdCheck,
  MdDeleteOutline,
  MdFavoriteBorder,
  MdRemove,
  MdStorefront,
} from "react-icons/md"
import { formatRupiah } from "@/lib/format"
import { menuImageUrl } from "@/lib/menu-images"
import { useCartStore, type CartItem } from "@/lib/cart-store"
import { ordersApi, type Order } from "@/lib/api"

const NEW_USER_COUPON = "KOPI10"

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
  const items = useCartStore((state) => state.items)
  const setItems = useCartStore((state) => state.setItems)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)
  const saveForLater = useCartStore((state) => state.saveForLater)
  const moveFromWishlist = useCartStore((state) => state.moveFromWishlist)
  const wishlist = useCartStore((state) => state.wishlist)
  const clear = useCartStore((state) => state.clear)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [paidOrder, setPaidOrder] = useState<Order | null>(null)

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
    if (!orderId || !payment) return

    if (payment === "success") {
      const token = sessionStorage.getItem(`Coffidoor_guest_order_${orderId}`) ?? undefined
      ordersApi
        .pay(orderId, "Midtrans", undefined, token)
        .then((order) => {
          setPaidOrder(order)
          clear()
        })
        .catch(() => setNotice("Pembayaran berhasil, tetapi ticket belum dapat dimuat."))
    } else {
      setNotice("Pembayaran dibatalkan. Produk tetap tersimpan di keranjang.")
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
    setItems(selectedItems)
    navigate("/order", { state: { step: "cart" } })
  }

  if (paidOrder) {
    return (
      <div className="min-h-screen px-4 pb-20 pt-28 sm:px-6">
        <div className="glass-card mx-auto max-w-lg rounded-3xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <MdCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
            Pembayaran Berhasil
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Simpan ticket ini untuk mengambil pesananmu.</p>
          <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4 text-left text-sm">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">No. Ticket</span><strong>#{paidOrder.id.slice(-8)}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Kafe</span><strong>{paidOrder.place.name}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Total</span><strong className="text-primary">{formatRupiah(paidOrder.total)}</strong></div>
          </div>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Kembali ke Beranda <MdArrowForward /></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-40 pt-24 sm:pb-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="tag-pill mb-3 inline-block">Marketplace</span>
            <h1 className="text-3xl font-black text-foreground sm:text-4xl" style={{ fontFamily: "'Fraunces', serif" }}>Keranjang</h1>
            <p className="mt-2 text-sm text-muted-foreground">Periksa produk pilihanmu sebelum menyelesaikan pesanan.</p>
          </div>
          <Link to="/order" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"><MdAdd /> Tambah Produk</Link>
        </div>

        {notice && <div role="status" className="mb-5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground">{notice}</div>}

        {items.length === 0 ? (
          <div className="glass-card rounded-3xl px-6 py-16 text-center">
            <MdStorefront className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-black text-foreground">Keranjang masih kosong</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Tambahkan kopi favoritmu dan produk akan tersimpan selama sesi ini.</p>
            <Link to="/order" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Mulai Belanja</Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-card/70 px-4 py-3">
              <div className="flex items-center gap-3"><IndeterminateCheckbox checked={allSelected} indeterminate={selectedIds.length > 0 && !allSelected} onChange={toggleAll} label="Pilih semua produk" /><span className="text-sm font-bold text-foreground">Pilih Semua</span><span className="text-xs text-muted-foreground">({items.length} produk)</span></div>
              <button type="button" onClick={removeSelected} disabled={selectedIds.length === 0} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"><MdDeleteOutline className="h-5 w-5" /> Hapus</button>
            </div>

            {groups.map((group) => {
              const groupIds = group.items.map((item) => item.id)
              const selectedInGroup = groupIds.filter((id) => selectedIds.includes(id)).length
              return (
                <section key={group.id} className="overflow-hidden rounded-2xl border border-border bg-card/60 shadow-sm">
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-3"><IndeterminateCheckbox checked={selectedInGroup === group.items.length} indeterminate={selectedInGroup > 0 && selectedInGroup < group.items.length} onChange={() => toggleStore(group)} label={`Pilih semua produk dari ${group.name}`} /><MdStorefront className="h-5 w-5 text-primary" /><strong className="text-sm text-foreground">{group.name}</strong><span className="hidden text-xs text-muted-foreground sm:inline">Voucher toko tersedia</span></div>
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
                              <button type="button" onClick={() => saveForLater(item.id)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"><MdBookmarkAdd /> Simpan</button>
                              <button type="button" onClick={() => remove(item.id)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive"><MdDeleteOutline /> Hapus</button>
                            </div>
                          </div>
                          <div className="col-start-2 flex items-center justify-between gap-4 sm:col-auto sm:flex-col sm:items-end">
                            <div className="text-right"><div className="text-xs text-muted-foreground">Harga satuan</div><div className="font-black text-primary">{formatRupiah(item.price)}</div></div>
                            <div className="flex items-center rounded-lg border border-border bg-background"><button type="button" onClick={() => setQuantity(item.id, Math.max(1, item.quantity - 1))} className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={`Kurangi ${item.name}`}><MdRemove /></button><span className="flex h-8 min-w-8 items-center justify-center border-x border-border px-2 text-sm font-bold">{item.quantity}</span><button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={`Tambah ${item.name}`}><MdAdd /></button></div>
                            <div className="text-right"><div className="text-xs text-muted-foreground">Subtotal</div><div className="font-black text-foreground">{formatRupiah(item.price * item.quantity)}</div></div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between border-t border-border bg-primary/[0.035] px-4 py-3 text-xs sm:px-5"><span className="text-muted-foreground">Voucher toko <strong className="text-primary">{NEW_USER_COUPON}</strong> aktif saat checkout</span><span className="font-bold text-foreground">{group.items.length} produk</span></div>
                </section>
              )
            })}

            {wishlist.length > 0 && <section className="rounded-2xl border border-border bg-card/50 px-4 py-4"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground"><MdFavoriteBorder className="text-primary" /> Wishlist ({wishlist.length})</div><div className="flex flex-wrap gap-2">{wishlist.map((item) => <button type="button" key={item.id} onClick={() => moveFromWishlist(item.id)} className="rounded-xl border border-border px-3 py-2 text-left text-xs hover:border-primary"><span className="block font-bold text-foreground">{item.name}</span><span className="text-muted-foreground">Pindahkan ke keranjang</span></button>)}</div></section>}
          </div>
        )}
      </div>

      {items.length > 0 && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 py-3 shadow-[0_-12px_30px_rgba(17,17,19,0.08)] backdrop-blur-xl sm:py-4"><div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-2"><IndeterminateCheckbox checked={allSelected} indeterminate={selectedIds.length > 0 && !allSelected} onChange={toggleAll} label="Pilih semua produk" /><span className="hidden text-sm text-foreground sm:inline">Pilih Semua</span></div><button type="button" onClick={removeSelected} disabled={selectedIds.length === 0} className="hidden text-sm font-semibold text-muted-foreground hover:text-destructive disabled:opacity-40 sm:inline">Hapus</button><div className="ml-auto text-right"><div className="text-xs text-muted-foreground">{selectedCount} item terpilih</div><div className="text-lg font-black text-primary">{formatRupiah(selectedTotal)}</div></div><button type="button" onClick={checkout} disabled={selectedItems.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Checkout <MdArrowForward /></button></div></div>}
    </div>
  )
}
