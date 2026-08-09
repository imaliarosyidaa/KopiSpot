import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAdd,
  MdArrowBack,
  MdCheckCircle,
  MdDelete,
  MdPayments,
  MdReceiptLong,
  MdRemove,
  MdShoppingCart,
} from "react-icons/md";
import { menusApi, ordersApi, placesApi, type MenuItemOption, type Order, type PlaceListItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/ui/auth-modal";
import { cartCount, cartSubtotal, useCartStore, type CartItem } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";
import { menuImageUrl } from "@/lib/menu-images";

type Step = "menu" | "cart" | "checkout" | "pay" | "done";

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[#b07d3f] focus:ring-2 focus:ring-[rgba(176,125,63,0.25)]";

const PAYMENT_METHODS = [
  "QRIS",
  "Virtual Account",
  "E-Wallet (GoPay / OVO / DANA)",
  "Kartu Kredit / Debit",
  "Bayar di Kafe",
];

const PAYMENT_LABEL: Record<string, string> = {
  UNPAID: "Belum Dibayar",
  PAID: "Lunas",
  FAILED: "Gagal",
};

const STEPS: { key: Step; label: string }[] = [
  { key: "menu", label: "Pesan" },
  { key: "cart", label: "List Order" },
  { key: "checkout", label: "Checkout" },
  { key: "pay", label: "Pembayaran" },
];

function categoryLabel(value: string): string {
  const map: Record<string, string> = {
    coffee: "Kopi",
    "non-coffee": "Non Kopi",
    food: "Makanan",
    dessert: "Dessert",
  };
  return map[value] ?? value;
}

export default function OrderPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const add = useCartStore((s) => s.add);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);

  const [step, setStep] = useState<Step>("menu");
  const [places, setPlaces] = useState<PlaceListItem[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [menus, setMenus] = useState<MenuItemOption[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const count = cartCount(items);
  const subtotal = cartSubtotal(items);

  useEffect(() => {
    placesApi
      .list()
      .then(setPlaces)
      .catch(() => setPlaces([]));
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingMenus(true);
    setMenuError(null);
    menusApi
      .list(selectedPlaceId || undefined)
      .then((data) => {
        if (active) setMenus(data);
      })
      .catch((err) => {
        if (active) setMenuError(err instanceof Error ? err.message : "Gagal memuat menu.");
      })
      .finally(() => {
        if (active) setLoadingMenus(false);
      });
    return () => {
      active = false;
    };
  }, [selectedPlaceId]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  const handleAdd = (m: MenuItemOption) => {
    if (items.length > 0 && items[0].placeId !== m.place.id) {
      setNotice(`Keranjang diganti — pesanan hanya bisa berisi menu dari ${m.place.name}.`);
    }
    add({
      id: m.id,
      placeId: m.place.id,
      placeName: m.place.name,
      name: m.name,
      price: m.price,
      category: m.category,
      imageUrl: m.imageUrl,
    });
  };

  const requireLogin = (): boolean => {
    if (user) return true;
    setAuthOpen(true);
    return false;
  };

  const goCheckout = () => {
    if (!requireLogin()) return;
    setStep("cart");
  };

  const placeOrder = async () => {
    if (!requireLogin()) return;
    if (items.length === 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const order = await ordersApi.create({
        placeId: items[0].placeId,
        items: items.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
        note: note.trim() || undefined,
      });
      setCreatedOrder(order);
      setStep("pay");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat pesanan.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmPayment = async () => {
    if (!requireLogin()) return;
    if (!createdOrder) return;
    setError(null);
    setSubmitting(true);
    try {
      const paid = await ordersApi.pay(createdOrder.id, paymentMethod);
      setCreatedOrder(paid);
      clear();
      setNote("");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses pembayaran.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setCreatedOrder(null);
    setError(null);
    setStep("menu");
  };

  const renderStepIndicator = () => {
    const currentIndex = STEPS.findIndex((s) => s.key === step);
    return (
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                i === currentIndex
                  ? "bg-[#b07d3f] text-[#1a1a1a]"
                  : i < currentIndex
                    ? "footer-glass-pill text-muted-foreground"
                    : "footer-glass-pill text-muted-foreground/50"
              }`}
            >
              <span>{i + 1}</span>
              <span>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <span className="text-muted-foreground/40 text-xs">→</span>}
          </div>
        ))}
      </div>
    );
  };

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
        <div className="mb-4 rounded-xl border border-[rgba(176,125,63,0.35)] bg-[rgba(176,125,63,0.08)] px-4 py-3 text-sm text-[#b07d3f]">
          {notice}
        </div>
      )}

      {loadingMenus ? (
        <div className="text-center text-muted-foreground animate-pulse py-16">Memuat menu...</div>
      ) : menuError ? (
        <div className="text-center text-destructive py-16">{menuError}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menus.map((m) => {
            const qty = items.find((i) => i.id === m.id)?.quantity ?? 0;
            return (
              <div key={m.id} className="glass-card rounded-2xl p-4 flex flex-col gap-3">
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-[rgba(140,95,40,0.15)]">
                  <img
                    src={menuImageUrl(m.category, m.imageUrl, m.name)}
                    alt={m.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute top-2 right-2 tag-pill">{categoryLabel(m.category)}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground text-sm truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.place.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatRupiah(m.price)}
                    </div>
                  </div>
                </div>
                {m.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {m.description}
                  </p>
                )}
                <button
                  onClick={() => handleAdd(m)}
                  className={`mt-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    qty > 0
                      ? "bg-[#b07d3f] text-[#1a1a1a]"
                      : "footer-glass-pill text-[#b07d3f] hover:bg-[#b07d3f]/10"
                  }`}
                >
                  <MdAdd className="w-4 h-4" />
                  {qty > 0 ? `Di Keranjang · ${qty}` : "Tambah"}
                </button>
              </div>
            );
          })}
          {menus.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-16">
              Belum ada menu tersedia di kafe ini.
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCartStep = () => {
    if (items.length === 0) {
      return (
        <div className="glass-card rounded-3xl p-10 text-center max-w-md mx-auto">
          <div className="text-4xl mb-3">🛒</div>
          <h2 className="text-xl font-black text-foreground mb-2">Keranjang masih kosong</h2>
          <p className="text-muted-foreground text-sm mb-6">Yuk pilih menu favoritmu dulu.</p>
          <button
            onClick={() => setStep("menu")}
            className="bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm"
          >
            Pilih Menu
          </button>
        </div>
      );
    }

    const placeName = items[0].placeName;
    return (
      <div className="glass-card rounded-3xl p-6 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="tag-pill mb-2 inline-block">List Order</span>
            <h2 className="text-2xl font-black text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
              {placeName}
            </h2>
          </div>
          <button
            onClick={() => setStep("menu")}
            className="flex items-center gap-1.5 footer-glass-pill px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground"
          >
            <MdArrowBack className="w-4 h-4" />
            Tambah Menu
          </button>
        </div>

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
                <div className="font-semibold text-foreground text-sm truncate">{item.name}</div>
                <div className="text-xs text-muted-foreground">{formatRupiah(item.price)}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <MdRemove className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-foreground">{item.quantity}</span>
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
              <button
                onClick={() => remove(item.id)}
                className="w-7 h-7 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-destructive"
                title="Hapus"
              >
                <MdDelete className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="font-black text-foreground">{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <span className="font-black text-lg text-[#b07d3f]">{formatRupiah(subtotal)}</span>
        </div>

        <button
          onClick={placeOrder}
          disabled={submitting}
          className="mt-6 w-full bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3.5 rounded-full text-sm hover:bg-[#c9974f] transition-colors disabled:opacity-60"
        >
          {submitting ? "Menyimpan..." : "Lanjut ke Checkout"}
        </button>
      </div>
    );
  };

  const renderCheckoutStep = () => (
    <div className="glass-card rounded-3xl p-6 md:p-8 max-w-2xl mx-auto">
      <span className="tag-pill mb-2 inline-block">Checkout</span>
      <h2 className="text-2xl font-black text-foreground mb-5" style={{ fontFamily: "'Fraunces', serif" }}>
        Ringkasan Pesanan
      </h2>

      <div className="mb-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Kafe</div>
        <div className="font-semibold text-foreground">{items[0]?.placeName}</div>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <img
                src={menuImageUrl(item.category, item.imageUrl, item.name)}
                alt={item.name}
                className="w-8 h-8 rounded-lg object-cover border border-border"
                loading="lazy"
              />
              {item.name} <span className="text-foreground font-semibold">× {item.quantity}</span>
            </span>
            <span className="font-semibold text-foreground">{formatRupiah(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Data Pengguna</div>
        <div className="text-sm text-foreground">{user?.name ?? "-"}</div>
        <div className="text-sm text-muted-foreground">{user?.email}</div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Catatan Pesanan
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Contoh: tanpa gula, susu diganti oat, dll."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="flex items-center justify-between py-3 border-t border-border">
        <span className="font-semibold text-foreground">Total Pembayaran</span>
        <span className="font-black text-lg text-[#b07d3f]">{formatRupiah(subtotal)}</span>
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
        <button
          onClick={placeOrder}
          disabled={submitting}
          className="flex-1 bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm hover:bg-[#c9974f] transition-colors disabled:opacity-60"
        >
          {submitting ? "Menyimpan..." : "Lanjut ke Pembayaran"}
        </button>
      </div>
    </div>
  );

  const renderPayStep = () => (
    <div className="glass-card rounded-3xl p-6 md:p-8 max-w-2xl mx-auto">
      <span className="tag-pill mb-2 inline-block">Pembayaran</span>
      <h2 className="text-2xl font-black text-foreground mb-5" style={{ fontFamily: "'Fraunces', serif" }}>
        Pilih Metode Pembayaran
      </h2>

      <div className="flex flex-col gap-2.5 mb-6">
        {PAYMENT_METHODS.map((m) => (
          <label
            key={m}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 cursor-pointer transition-colors ${
              paymentMethod === m
                ? "border-[#b07d3f] bg-[rgba(176,125,63,0.08)]"
                : "border-border hover:border-[rgba(176,125,63,0.4)]"
            }`}
          >
            <input
              type="radio"
              name="payment"
              value={m}
              checked={paymentMethod === m}
              onChange={() => setPaymentMethod(m)}
              className="accent-[#b07d3f]"
            />
            <MdPayments className="w-5 h-5 text-[#b07d3f]" />
            <span className="text-sm font-semibold text-foreground">{m}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between py-3 border-t border-border">
        <span className="font-semibold text-foreground">Total Pembayaran</span>
        <span className="font-black text-lg text-[#b07d3f]">{formatRupiah(subtotal)}</span>
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
          className="flex-1 bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full text-sm hover:bg-[#c9974f] transition-colors disabled:opacity-60"
        >
          {submitting ? "Memproses..." : "Konfirmasi Pembayaran"}
        </button>
      </div>
    </div>
  );

  const renderDoneStep = () => (
    <div className="glass-card rounded-3xl p-10 text-center max-w-md mx-auto">
      <MdCheckCircle className="w-14 h-14 text-[#b07d3f] mx-auto mb-4" />
      <h2 className="text-2xl font-black text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
        Pembayaran Berhasil!
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Pesananmu sudah dikonfirmasi dan sedang diproses kafe.
      </p>
      <div className="rounded-2xl bg-[rgba(140,95,40,0.08)] border border-[rgba(140,95,40,0.2)] p-4 text-left text-sm space-y-1.5 mb-6">
        <div className="flex justify-between">
          <span className="text-muted-foreground">No. Pesanan</span>
          <span className="font-semibold text-foreground">#{createdOrder?.id.slice(-8)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Kafe</span>
          <span className="font-semibold text-foreground">{createdOrder?.place.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Metode</span>
          <span className="font-semibold text-foreground">{createdOrder?.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className="font-semibold text-[#b07d3f]">
            {createdOrder ? PAYMENT_LABEL[createdOrder.paymentStatus] : ""}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-black text-[#b07d3f]">{formatRupiah(createdOrder?.total ?? 0)}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={resetFlow}
          className="footer-glass-pill px-5 py-3 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Pesan Lagi
        </button>
        <button
          onClick={() => navigate("/order/riwayat")}
          className="bg-[#b07d3f] text-[#1a1a1a] font-black px-5 py-3 rounded-full text-sm hover:bg-[#c9974f] transition-colors"
        >
          Lihat Riwayat
        </button>
      </div>
    </div>
  );

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
            <span className="tag-pill mb-3 inline-block">Pesan Kopi</span>
            <h1 className="text-3xl md:text-4xl font-black text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
              Pesan & Ambil Kopimu
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Pilih menu favorit dari berbagai kafe, lalu checkout dan bayar langsung dari sini.
            </p>
          </div>
          <button
            onClick={() => navigate("/order/riwayat")}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full footer-glass-pill text-sm font-bold text-muted-foreground hover:text-[#b07d3f] transition-colors"
          >
            <MdReceiptLong className="w-4 h-4" />
            Riwayat
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
              className="flex items-center gap-2 bg-[#b07d3f] text-[#1a1a1a] font-black px-6 py-3 rounded-full shadow-lg hover:bg-[#c9974f] transition-colors"
            >
              <MdShoppingCart className="w-5 h-5" />
              Lihat Pesanan · {count} item
            </button>
          </div>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
