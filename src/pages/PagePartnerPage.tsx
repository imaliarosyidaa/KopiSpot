import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  MdAdd,
  MdClose,
  MdDashboard,
  MdDelete,
  MdEdit,
  MdLocationOn,
  MdMenuBook,
  MdReceiptLong,
  MdStore,
  MdUpload,
} from "react-icons/md"
import {
  partnerApi,
  placesApi,
  uploadFile,
  type OrderStatus,
  type PartnerDashboard,
  type PartnerMenuItem,
  type PartnerOrder,
  type PartnerPlace,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import AuthModal from "@/components/ui/auth-modal"
import { PLACE_CATEGORIES } from "@/lib/constants"
import { formatDate, formatRupiah, timeAgo } from "@/lib/format"

type Tab = "ringkasan" | "usaha" | "menu" | "pesanan"

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  PREPARING: "Disiapkan",
  READY: "Siap Diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
}

const MENU_CATEGORIES: { value: string; label: string }[] = [
  { value: "coffee", label: "Kopi" },
  { value: "non-coffee", label: "Non Kopi" },
  { value: "food", label: "Makanan" },
  { value: "dessert", label: "Dessert" },
]

const PLACE_TABS: { key: Tab; label: string; icon: typeof MdDashboard }[] = [
  { key: "ringkasan", label: "Ringkasan", icon: MdDashboard },
  { key: "usaha", label: "Usaha", icon: MdStore },
  { key: "menu", label: "Menu", icon: MdMenuBook },
  { key: "pesanan", label: "Pesanan", icon: MdReceiptLong },
]

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[#b07d3f] focus:ring-2 focus:ring-[rgba(176,125,63,0.25)]"

const labelClass = "block text-xs font-semibold text-muted-foreground mb-1"

function statusClass(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-[rgba(176,125,63,0.15)] text-[#b07d3f]"
    case "CONFIRMED":
      return "bg-[rgba(59,130,246,0.15)] text-blue-600"
    case "PREPARING":
      return "bg-[rgba(234,179,8,0.15)] text-yellow-600"
    case "READY":
      return "bg-[rgba(16,185,129,0.15)] text-emerald-600"
    case "COMPLETED":
      return "bg-[rgba(107,114,128,0.15)] text-gray-600"
    case "CANCELLED":
      return "bg-[rgba(220,38,38,0.12)] text-destructive"
  }
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
}

const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Terima Pesanan",
  CONFIRMED: "Mulai Disiapkan",
  PREPARING: "Tandai Siap",
  READY: "Tandai Selesai",
}

interface PlaceFormValues {
  name: string
  category: string
  description: string
  address: string
  city: string
  price: string
  openHours: string
  imageUrl: string
  tags: string
}

function emptyPlaceForm(): PlaceFormValues {
  return {
    name: "",
    category: PLACE_CATEGORIES[1].value,
    description: "",
    address: "",
    city: "",
    price: "",
    openHours: "",
    imageUrl: "",
    tags: "",
  }
}

interface MenuFormValues {
  name: string
  price: string
  category: string
  description: string
  calories: string
  sugar: string
  ingredients: string
  imageUrl: string
}

function emptyMenuForm(): MenuFormValues {
  return {
    name: "",
    price: "",
    category: "coffee",
    description: "",
    calories: "",
    sugar: "",
    ingredients: "",
    imageUrl: "",
  }
}

export default function PagePartnerPage() {
  const { user, loading } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  const [places, setPlaces] = useState<PartnerPlace[]>([])
  const [placesError, setPlacesError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState("")
  const [reloadTick, setReloadTick] = useState(0)
  const [tab, setTab] = useState<Tab>("ringkasan")

  const [dashboard, setDashboard] = useState<PartnerDashboard | null>(null)
  const [menus, setMenus] = useState<PartnerMenuItem[]>([])
  const [orders, setOrders] = useState<PartnerOrder[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  const [placeFormOpen, setPlaceFormOpen] = useState(false)
  const [placeEditingId, setPlaceEditingId] = useState<string | null>(null)
  const [placeForm, setPlaceForm] = useState<PlaceFormValues>(emptyPlaceForm())
  const [placeSaving, setPlaceSaving] = useState(false)
  const [placeError, setPlaceError] = useState<string | null>(null)

  const [menuFormOpen, setMenuFormOpen] = useState(false)
  const [menuEditingId, setMenuEditingId] = useState<string | null>(null)
  const [menuForm, setMenuForm] = useState<MenuFormValues>(emptyMenuForm())
  const [menuSaving, setMenuSaving] = useState(false)
  const [menuError, setMenuError] = useState<string | null>(null)
  const [uploadingMenuImage, setUploadingMenuImage] = useState(false)

  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const selected = places.find((p) => p.id === selectedId) ?? null

  const loadPlaces = useCallback(async () => {
    try {
      setPlacesError(null)
      const list = await partnerApi.places()
      setPlaces(list)
      setSelectedId((prev) =>
        list.some((p) => p.id === prev) ? prev : (list[0]?.id ?? ""),
      )
    } catch {
      setPlacesError("Gagal memuat daftar usaha.")
    }
  }, [])

  useEffect(() => {
    if (user) loadPlaces()
  }, [user, loadPlaces, reloadTick])

  useEffect(() => {
    if (!selectedId) return
    let active = true
    setDataLoading(true)
    setDataError(null)
    Promise.all([
      partnerApi.dashboard(selectedId),
      partnerApi.menus(selectedId),
      partnerApi.orders(selectedId),
    ])
      .then(([d, m, o]) => {
        if (!active) return
        setDashboard(d)
        setMenus(m)
        setOrders(o)
      })
      .catch(() => {
        if (active) setDataError("Gagal memuat data dashboard. Coba lagi.")
      })
      .finally(() => {
        if (active) setDataLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedId, reloadTick])

  const openCreatePlace = () => {
    setPlaceForm(emptyPlaceForm())
    setPlaceEditingId(null)
    setPlaceError(null)
    setPlaceFormOpen(true)
    setTab("usaha")
  }

  const openEditPlace = (place: PartnerPlace) => {
    setPlaceForm({
      name: place.name,
      category: place.category,
      description: place.description,
      address: place.address,
      city: place.city,
      price: place.price,
      openHours: place.openHours,
      imageUrl: place.imageUrl,
      tags: place.tags.join(", "),
    })
    setPlaceEditingId(place.id)
    setPlaceError(null)
    setPlaceFormOpen(true)
    setTab("usaha")
  }

  const submitPlace = async () => {
    setPlaceSaving(true)
    setPlaceError(null)
    try {
      const payload = {
        name: placeForm.name.trim(),
        category: placeForm.category,
        description: placeForm.description.trim(),
        address: placeForm.address.trim(),
        city: placeForm.city.trim(),
        price: placeForm.price.trim(),
        openHours: placeForm.openHours.trim(),
        imageUrl: placeForm.imageUrl.trim(),
        tags: placeForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10),
      }
      if (placeEditingId) {
        await placesApi.update(placeEditingId, payload)
      } else {
        const result = await partnerApi.register(payload)
        setSelectedId(result.place.id)
      }
      setPlaceFormOpen(false)
      setReloadTick((t) => t + 1)
    } catch (e) {
      setPlaceError(e instanceof Error ? e.message : "Gagal menyimpan usaha.")
    } finally {
      setPlaceSaving(false)
    }
  }

  const deletePlace = async (place: PartnerPlace) => {
    if (!window.confirm(`Hapus usaha "${place.name}" beserta semua datanya?`))
      return
    try {
      setActionError(null)
      await placesApi.remove(place.id)
      setPlaceFormOpen(false)
      setReloadTick((t) => t + 1)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Gagal menghapus usaha.")
    }
  }

  const openCreateMenu = () => {
    setMenuForm(emptyMenuForm())
    setMenuEditingId(null)
    setMenuError(null)
    setMenuFormOpen(true)
  }

  const openEditMenu = (menu: PartnerMenuItem) => {
    setMenuForm({
      name: menu.name,
      price: String(menu.price),
      category: menu.category,
      description: menu.description ?? "",
      calories: menu.calories != null ? String(menu.calories) : "",
      sugar: menu.sugar != null ? String(menu.sugar) : "",
      ingredients: menu.ingredients ?? "",
      imageUrl: menu.imageUrl ?? "",
    })
    setMenuEditingId(menu.id)
    setMenuError(null)
    setMenuFormOpen(true)
  }

  const submitMenu = async () => {
    if (!selectedId) return
    setMenuSaving(true)
    setMenuError(null)
    try {
      const payload = {
        name: menuForm.name.trim(),
        price: Number(menuForm.price),
        category: menuForm.category,
        description: menuForm.description.trim() || undefined,
        calories: menuForm.calories ? Number(menuForm.calories) : undefined,
        sugar: menuForm.sugar ? Number(menuForm.sugar) : undefined,
        ingredients: menuForm.ingredients.trim() || undefined,
        imageUrl: menuForm.imageUrl.trim() || undefined,
        isAvailable: true,
      }
      if (menuEditingId) {
        await partnerApi.updateMenu(selectedId, menuEditingId, payload)
      } else {
        await partnerApi.createMenu(selectedId, payload)
      }
      setMenuFormOpen(false)
      setReloadTick((t) => t + 1)
    } catch (e) {
      setMenuError(e instanceof Error ? e.message : "Gagal menyimpan menu.")
    } finally {
      setMenuSaving(false)
    }
  }

  const toggleMenuAvailable = async (menu: PartnerMenuItem) => {
    if (!selectedId) return
    try {
      setActionError(null)
      await partnerApi.updateMenu(selectedId, menu.id, {
        name: menu.name,
        price: menu.price,
        category: menu.category,
        description: menu.description ?? undefined,
        calories: menu.calories ?? undefined,
        sugar: menu.sugar ?? undefined,
        ingredients: menu.ingredients ?? undefined,
        imageUrl: menu.imageUrl ?? undefined,
        isAvailable: !menu.isAvailable,
      })
      setReloadTick((t) => t + 1)
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Gagal mengubah ketersediaan menu.",
      )
    }
  }

  const deleteMenu = async (menu: PartnerMenuItem) => {
    if (!selectedId) return
    if (!window.confirm(`Hapus menu "${menu.name}"?`)) return
    try {
      setActionError(null)
      await partnerApi.deleteMenu(selectedId, menu.id)
      setReloadTick((t) => t + 1)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Gagal menghapus menu.")
    }
  }

  const nextOrderStatus = async (order: PartnerOrder) => {
    if (!selectedId) return
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setStatusUpdatingId(order.id)
    setActionError(null)
    try {
      await partnerApi.setOrderStatus(selectedId, order.id, next)
      setReloadTick((t) => t + 1)
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Gagal mengubah status pesanan.",
      )
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const cancelOrder = async (order: PartnerOrder) => {
    if (!selectedId) return
    if (!window.confirm("Batalkan pesanan ini?")) return
    setStatusUpdatingId(order.id)
    setActionError(null)
    try {
      await partnerApi.setOrderStatus(selectedId, order.id, "CANCELLED")
      setReloadTick((t) => t + 1)
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Gagal membatalkan pesanan.",
      )
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const uploadMenuImage = async (file: File) => {
    setUploadingMenuImage(true)
    try {
      const { url } = await uploadFile(file)
      setMenuForm((f) => ({ ...f, imageUrl: url }))
    } catch (e) {
      setMenuError(e instanceof Error ? e.message : "Gagal mengunggah gambar.")
    } finally {
      setUploadingMenuImage(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground animate-pulse pt-16">
        Memuat...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="glass-card rounded-3xl p-10 text-center max-w-md">
          <div className="text-4xl mb-3">
            <MdStore className="text-[#b07d3f] mx-auto w-12 h-12" />
          </div>
          <h1 className="text-xl font-black text-foreground mb-2">
            Mitra Coffidoor
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Masuk untuk mendaftarkan kafenya, kelola menu, lihat pesanan, dan
            pantau pendapatan dari satu dashboard.
          </p>
          <button
            onClick={() => setAuthOpen(true)}
            className="bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm hover:bg-[#c9974f] transition-colors"
          >
            Masuk Sekarang
          </button>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    )
  }

  const needsPlaceForm = placeFormOpen || places.length === 0

  return (
    <div className="pt-24 px-6 md:px-12 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#b07d3f] font-black text-sm mb-2">
            <MdStore className="w-5 h-5" />
            MITRA USAHA
          </div>
          <h1
            className="text-2xl md:text-3xl font-black text-foreground"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Dashboard Mitra
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola kafe milikmu, menu, pesanan, dan pantau performa usaha.
          </p>
        </div>
        {places.length > 0 && (
          <button
            onClick={openCreatePlace}
            className="inline-flex items-center gap-1.5 bg-[#b07d3f] text-[#1a1a1a] font-black px-5 py-2.5 rounded-full text-sm hover:bg-[#c9974f] transition-colors"
          >
            <MdAdd className="w-4 h-4" />
            Daftarkan Usaha Baru
          </button>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {placesError && !needsPlaceForm && (
        <div className="glass-card rounded-2xl p-6 text-center mb-8">
          <p className="text-foreground font-semibold">{placesError}</p>
          <button
            onClick={() => setReloadTick((t) => t + 1)}
            className="mt-4 bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {actionError && (
        <div className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm">
          {actionError}
        </div>
      )}

      {needsPlaceForm ? (
        <section className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-foreground">
                {placeEditingId ? "Edit Detail Usaha" : "Daftarkan Kafemu"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Isi informasi usaha. Setelah terdaftar, kamu bisa mengelola menu
                dan pesanan dari sini.
              </p>
            </div>
            {places.length > 0 && (
              <button
                onClick={() => {
                  setPlaceFormOpen(false)
                  setPlaceError(null)
                }}
                className="footer-glass-pill w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive"
              >
                <MdClose className="w-5 h-5" />
              </button>
            )}
          </div>

          {placeError && (
            <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm">
              {placeError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Nama Usaha</label>
              <input
                value={placeForm.name}
                onChange={(e) =>
                  setPlaceForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="mis. Kedai Kopi Senja"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Kategori</label>
              <select
                value={placeForm.category}
                onChange={(e) =>
                  setPlaceForm((f) => ({ ...f, category: e.target.value }))
                }
                className={inputClass}
              >
                {PLACE_CATEGORIES.filter((c) => c.value !== "SEMUA").map(
                  (c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className={labelClass}>Kota</label>
              <input
                value={placeForm.city}
                onChange={(e) =>
                  setPlaceForm((f) => ({ ...f, city: e.target.value }))
                }
                placeholder="mis. Jakarta"
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Alamat</label>
              <input
                value={placeForm.address}
                onChange={(e) =>
                  setPlaceForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="mis. Jl. Kenanga No. 12, Kemang"
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Deskripsi</label>
              <textarea
                value={placeForm.description}
                onChange={(e) =>
                  setPlaceForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                placeholder="Ceritakan suasana dan keunggulan kafemu..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Rentang Harga</label>
              <input
                value={placeForm.price}
                onChange={(e) =>
                  setPlaceForm((f) => ({ ...f, price: e.target.value }))
                }
                placeholder="mis. Rp 20.000 - Rp 50.000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Jam Buka</label>
              <input
                value={placeForm.openHours}
                onChange={(e) =>
                  setPlaceForm((f) => ({ ...f, openHours: e.target.value }))
                }
                placeholder="mis. 08.00 - 22.00"
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>URL Gambar Utama (opsional)</label>
              <input
                value={placeForm.imageUrl}
                onChange={(e) =>
                  setPlaceForm((f) => ({ ...f, imageUrl: e.target.value }))
                }
                placeholder="https://..."
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>
                Tag (pisahkan dengan koma, opsional)
              </label>
              <input
                value={placeForm.tags}
                onChange={(e) =>
                  setPlaceForm((f) => ({ ...f, tags: e.target.value }))
                }
                placeholder="mis. cozy, wifi kencang, hidden gem"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={submitPlace}
              disabled={placeSaving}
              className="bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm hover:bg-[#c9974f] transition-colors disabled:opacity-60"
            >
              {placeSaving
                ? "Menyimpan..."
                : placeEditingId
                  ? "Simpan Perubahan"
                  : "Daftarkan Usaha"}
            </button>
            {placeEditingId && (
              <button
                onClick={() => {
                  setPlaceFormOpen(false)
                  setPlaceError(null)
                }}
                className="footer-glass-pill px-6 py-3 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                Batal
              </button>
            )}
          </div>
        </section>
      ) : (
        <>
          {places.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
              <label className="text-sm font-semibold text-muted-foreground">
                Pilih Usaha
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className={`${inputClass} md:max-w-sm`}
              >
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.city}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selected && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {PLACE_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                    tab === t.key
                      ? "bg-[#b07d3f] text-[#1a1a1a]"
                      : "footer-glass-pill text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {tab === "usaha" && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-foreground">
                  Usaha Milikku
                </h2>
                <button
                  onClick={openCreatePlace}
                  className="inline-flex items-center gap-1.5 footer-glass-pill px-4 py-2 rounded-full text-xs font-semibold text-[#b07d3f]"
                >
                  <MdAdd className="w-4 h-4" />
                  Daftarkan Usaha
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {places.map((p) => (
                  <div
                    key={p.id}
                    className="glass-card rounded-2xl overflow-hidden"
                  >
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-36 w-full object-cover"
                      />
                    ) : (
                      <div className="h-36 w-full bg-[rgba(140,95,40,0.15)] flex items-center justify-center text-[#b07d3f]">
                        <MdStore className="w-10 h-10" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-black text-foreground leading-tight">
                          {p.name}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditPlace(p)}
                            title="Edit"
                            className="w-8 h-8 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-[#b07d3f]"
                          >
                            <MdEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePlace(p)}
                            title="Hapus"
                            className="w-8 h-8 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-destructive"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MdLocationOn className="w-4 h-4 shrink-0" />
                        {p.address}, {p.city}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <span className="footer-glass-pill px-2.5 py-1 rounded-full">
                          {p._count.orders} pesanan
                        </span>
                        <span className="footer-glass-pill px-2.5 py-1 rounded-full">
                          {p._count.menuItems} menu
                        </span>
                        <span className="footer-glass-pill px-2.5 py-1 rounded-full">
                          {p.avgRating.toFixed(1)} rating
                        </span>
                      </div>
                      <Link
                        to={`/places/${p.id}`}
                        className="inline-block mt-4 text-[#b07d3f] text-sm font-bold hover:underline"
                      >
                        Lihat Halaman Kafe →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab !== "usaha" && !selected && (
            <div className="glass-card rounded-2xl p-10 text-center">
              <p className="text-foreground font-semibold">
                Belum ada usaha terdaftar.
              </p>
              <button
                onClick={openCreatePlace}
                className="mt-4 bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm"
              >
                Daftarkan Usaha Pertama
              </button>
            </div>
          )}

          {tab !== "usaha" && selected && dataLoading && !dashboard && (
            <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground animate-pulse">
              Memuat data...
            </div>
          )}

          {tab !== "usaha" && selected && dataError && !dataLoading && (
            <div className="glass-card rounded-2xl p-10 text-center">
              <p className="text-foreground font-semibold">{dataError}</p>
              <button
                onClick={() => setReloadTick((t) => t + 1)}
                className="mt-4 bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {tab === "ringkasan" && selected && dashboard && (
            <section>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="glass-card rounded-2xl p-5">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Total Pesanan
                  </p>
                  <p className="text-2xl font-black text-foreground">
                    {dashboard.totalOrders}
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-5">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Pendapatan
                  </p>
                  <p className="text-2xl font-black text-[#b07d3f]">
                    {formatRupiah(dashboard.totalRevenue)}
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-5">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Rating Rata-rata
                  </p>
                  <p className="text-2xl font-black text-foreground">
                    {dashboard.avgRating > 0
                      ? dashboard.avgRating.toFixed(1)
                      : "-"}
                    <span className="text-sm text-muted-foreground font-semibold">
                      {" "}
                      ({dashboard.ratingCount})
                    </span>
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-5">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Jumlah Menu
                  </p>
                  <p className="text-2xl font-black text-foreground">
                    {dashboard.menuCount}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-black text-foreground mb-4">
                    Status Pesanan
                  </h3>
                  <div className="space-y-3">
                    {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map(
                      (s) => (
                        <div
                          key={s}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-muted-foreground">
                            {ORDER_STATUS_LABEL[s]}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusClass(s)}`}
                          >
                            {dashboard.statusCounts[s] ?? 0}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-black text-foreground mb-4">
                    Menu Terlaris
                  </h3>
                  {dashboard.bestSellers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Belum ada penjualan menu.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dashboard.bestSellers.map((b) => (
                        <div
                          key={b.menuItemId}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-foreground font-semibold">
                            {b.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {b.quantity} terjual
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="glass-card rounded-2xl p-6 flex-1">
                  <h3 className="font-black text-foreground mb-4">
                    Pesanan Terbaru
                  </h3>
                  {dashboard.recentOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Belum ada pesanan.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dashboard.recentOrders.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {o.user.name ?? "Pengguna"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {timeAgo(o.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-foreground">
                              {formatRupiah(o.total)}
                            </p>
                            <p
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass(o.status)}`}
                            >
                              {ORDER_STATUS_LABEL[o.status]}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass-card rounded-2xl p-6 flex-1">
                  <h3 className="font-black text-foreground mb-4">
                    Ulasan Terbaru
                  </h3>
                  {dashboard.recentReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Belum ada ulasan.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dashboard.recentReviews.map((r) => (
                        <div key={r.id}>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">
                              {r.user.name ?? "Pengguna"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {timeAgo(r.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {r.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {tab === "menu" && selected && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-foreground">
                  Menu {selected.name}
                </h2>
                <button
                  onClick={openCreateMenu}
                  className="inline-flex items-center gap-1.5 bg-[#b07d3f] text-[#1a1a1a] font-black px-4 py-2 rounded-full text-xs hover:bg-[#c9974f] transition-colors"
                >
                  <MdAdd className="w-4 h-4" />
                  Tambah Menu
                </button>
              </div>

              {menuFormOpen && (
                <div className="glass-card rounded-2xl p-6 mb-6">
                  <div className="flex items-start justify-between mb-5">
                    <h3 className="font-black text-foreground">
                      {menuEditingId ? "Edit Menu" : "Tambah Menu Baru"}
                    </h3>
                    <button
                      onClick={() => setMenuFormOpen(false)}
                      className="footer-glass-pill w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive"
                    >
                      <MdClose className="w-4 h-4" />
                    </button>
                  </div>

                  {menuError && (
                    <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm">
                      {menuError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Nama Menu</label>
                      <input
                        value={menuForm.name}
                        onChange={(e) =>
                          setMenuForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="mis. Kopi Susu Gula Aren"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Harga (Rp)</label>
                      <input
                        type="number"
                        min={0}
                        value={menuForm.price}
                        onChange={(e) =>
                          setMenuForm((f) => ({ ...f, price: e.target.value }))
                        }
                        placeholder="25000"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Kategori</label>
                      <select
                        value={menuForm.category}
                        onChange={(e) =>
                          setMenuForm((f) => ({
                            ...f,
                            category: e.target.value,
                          }))
                        }
                        className={inputClass}
                      >
                        {MENU_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Deskripsi (opsional)</label>
                      <textarea
                        value={menuForm.description}
                        onChange={(e) =>
                          setMenuForm((f) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                        rows={2}
                        placeholder="Deskripsi singkat menu..."
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Kalori (opsional)</label>
                      <input
                        type="number"
                        min={0}
                        value={menuForm.calories}
                        onChange={(e) =>
                          setMenuForm((f) => ({
                            ...f,
                            calories: e.target.value,
                          }))
                        }
                        placeholder="mis. 180"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Gula (gram, opsional)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={menuForm.sugar}
                        onChange={(e) =>
                          setMenuForm((f) => ({ ...f, sugar: e.target.value }))
                        }
                        placeholder="mis. 25"
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Bahan (opsional)</label>
                      <input
                        value={menuForm.ingredients}
                        onChange={(e) =>
                          setMenuForm((f) => ({
                            ...f,
                            ingredients: e.target.value,
                          }))
                        }
                        placeholder="mis. espresso, susu, gula aren"
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Gambar (opsional)</label>
                      <div className="flex items-center gap-3">
                        <input
                          value={menuForm.imageUrl}
                          onChange={(e) =>
                            setMenuForm((f) => ({
                              ...f,
                              imageUrl: e.target.value,
                            }))
                          }
                          placeholder="https://..."
                          className={inputClass}
                        />
                        <label className="shrink-0 cursor-pointer inline-flex items-center gap-1.5 footer-glass-pill px-4 py-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-[#b07d3f]">
                          {uploadingMenuImage ? "Mengunggah..." : "Unggah"}
                          <MdUpload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingMenuImage}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) uploadMenuImage(file)
                              e.target.value = ""
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={submitMenu}
                      disabled={menuSaving}
                      className="bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm hover:bg-[#c9974f] transition-colors disabled:opacity-60"
                    >
                      {menuSaving
                        ? "Menyimpan..."
                        : menuEditingId
                          ? "Simpan Perubahan"
                          : "Tambah Menu"}
                    </button>
                    <button
                      onClick={() => setMenuFormOpen(false)}
                      className="footer-glass-pill px-6 py-3 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {menus.length === 0 && !menuFormOpen ? (
                <div className="glass-card rounded-2xl p-10 text-center">
                  <p className="text-foreground font-semibold">
                    Belum ada menu.
                  </p>
                  <button
                    onClick={openCreateMenu}
                    className="mt-4 bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm"
                  >
                    Tambah Menu Pertama
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menus.map((m) => (
                    <div
                      key={m.id}
                      className="glass-card rounded-2xl overflow-hidden"
                    >
                      <img
                        src={
                          m.imageUrl ??
                          `https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop&auto=format`
                        }
                        alt={m.name}
                        className="h-32 w-full object-cover"
                      />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-black text-foreground leading-tight">
                              {m.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {MENU_CATEGORIES.find(
                                (c) => c.value === m.category,
                              )?.label ?? m.category}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold ${
                              m.isAvailable
                                ? "bg-[rgba(16,185,129,0.15)] text-emerald-600"
                                : "bg-[rgba(220,38,38,0.12)] text-destructive"
                            }`}
                          >
                            {m.isAvailable ? "Tersedia" : "Habis"}
                          </span>
                        </div>
                        <p className="text-[#b07d3f] font-black mt-2">
                          {formatRupiah(m.price)}
                        </p>
                        {m.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {m.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={() => toggleMenuAvailable(m)}
                            className={`flex-1 footer-glass-pill px-3 py-2 rounded-full text-xs font-semibold transition-colors ${
                              m.isAvailable
                                ? "text-destructive"
                                : "text-emerald-600"
                            }`}
                          >
                            {m.isAvailable ? "Tandai Habis" : "Tandai Tersedia"}
                          </button>
                          <button
                            onClick={() => openEditMenu(m)}
                            title="Edit"
                            className="w-8 h-8 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-[#b07d3f]"
                          >
                            <MdEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMenu(m)}
                            title="Hapus"
                            className="w-8 h-8 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-destructive"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "pesanan" && selected && (
            <section>
              <h2 className="text-lg font-black text-foreground mb-4">
                Daftar Pesanan
              </h2>
              {orders.length === 0 ? (
                <div className="glass-card rounded-2xl p-10 text-center">
                  <p className="text-foreground font-semibold">
                    Belum ada pesanan masuk.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((o) => (
                    <div key={o.id} className="glass-card rounded-2xl p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-foreground">
                            {o.user.name ?? "Pengguna"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(o.createdAt)} · {timeAgo(o.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-[#b07d3f]">
                            {formatRupiah(o.total)}
                          </p>
                          <p
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass(o.status)}`}
                          >
                            {ORDER_STATUS_LABEL[o.status]}
                          </p>
                        </div>
                      </div>

                      <ul className="mt-4 space-y-1.5">
                        {o.items.map((it) => (
                          <li
                            key={it.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-foreground">
                              {it.menuItem.name}
                              <span className="text-muted-foreground">
                                {" "}
                                × {it.quantity}
                              </span>
                            </span>
                            <span className="text-muted-foreground">
                              {formatRupiah(it.price * it.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {o.note && (
                        <p className="mt-3 text-sm text-muted-foreground bg-muted/60 rounded-xl px-3 py-2">
                          <span className="font-semibold text-foreground">
                            Catatan:{" "}
                          </span>
                          {o.note}
                        </p>
                      )}
                      {o.billingAddress && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Alamat penagihan:{" "}
                          {o.billingAddress.replace(/\n/g, " · ")}
                        </p>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Pembayaran: {o.paymentMethod ?? "-"} ·{" "}
                        {o.paymentStatus === "PAID"
                          ? "Lunas"
                          : o.paymentStatus === "FAILED"
                            ? "Gagal"
                            : "Belum Dibayar"}
                        {o.paymentProofUrl && (
                          <a
                            href={o.paymentProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#b07d3f] font-semibold hover:underline ml-1"
                          >
                            (lihat bukti)
                          </a>
                        )}
                      </div>

                      {o.status !== "CANCELLED" && o.status !== "COMPLETED" && (
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          {NEXT_STATUS[o.status] && (
                            <button
                              onClick={() => nextOrderStatus(o)}
                              disabled={statusUpdatingId === o.id}
                              className="bg-[#b07d3f] text-[#1a1a1a] font-black px-4 py-2 rounded-full text-xs hover:bg-[#c9974f] transition-colors disabled:opacity-60"
                            >
                              {statusUpdatingId === o.id
                                ? "Menyimpan..."
                                : NEXT_STATUS_LABEL[o.status]}
                            </button>
                          )}
                          <button
                            onClick={() => cancelOrder(o)}
                            disabled={statusUpdatingId === o.id}
                            className="footer-glass-pill px-4 py-2 rounded-full text-xs font-semibold text-destructive disabled:opacity-60"
                          >
                            Batalkan
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
