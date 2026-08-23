import { useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { MdAdd, MdFavorite, MdHome, MdLogout, MdPerson, MdReceiptLong, MdShoppingCart, MdStorefront } from "react-icons/md"
import { useAuth } from "@/lib/auth-context"
import AuthModal from "@/components/ui/auth-modal"
import ThemeSwitcher from "@/components/shared/ThemeSwitcher"
import { cartCount, useCartStore } from "@/lib/cart-store"
import LogoDark from "@/components/shared/LogoDark"
import LogoLight from "@/components/shared/LogoLight"
import { useTheme } from "@/lib/theme"

const navItems = [
  { to: "/", label: "Beranda" },
  { to: "/feed", label: "Komunitas" },
  { to: "/chat", label: "Chat" },
  { to: "/order", label: "Pesan Kopi" },
  { to: "/mitra", label: "Mitra" },
  { to: "/leaderboard", label: "Peringkat" },
]

const bottomNavItems = [
  { to: "/", label: "Beranda", icon: MdHome },
  { to: "/order/keranjang", label: "Keranjang", icon: MdReceiptLong },
  { to: "/order", label: "Pesanan", icon: MdStorefront },
  { to: "/profile", label: "Profil", icon: MdPerson },
]

export default function Navbar() {
  const { user, loading, logout } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const cartItems = useCartStore((s) => s.items)
  const wishlist = useCartStore((s) => s.wishlist)
  const cartCountTotal = cartCount(cartItems)
  const { theme } = useTheme()

  // Hide the mobile bottom bar on pages that already own the bottom area
  // (cart checkout bar / checkout page) to avoid overlap.
  const showBottomNav = !pathname.startsWith("/order/keranjang") && pathname !== "/order/checkout"

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6 md:px-12">
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5" aria-label="coffidoor beranda">
          <span className="flex h-9 w-[6.75rem] shrink-0 items-center text-[#d1d5db] sm:h-10 sm:w-[7.5rem]">
            {theme === "dark" ? <LogoDark width="100%" height="100%" /> : <LogoLight width="100%" height="100%" />}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? "text-[#d1d5db] font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <Link
            to="/wishlist"
            title="Wishlist"
            className="relative flex h-9 w-9 items-center justify-center rounded-full footer-glass-pill text-muted-foreground transition-colors hover:text-[#d1d5db]"
          >
            <MdFavorite className="h-5 w-5" />
            {wishlist.length > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d1d5db] px-1 text-[11px] font-black text-[#111113]">{wishlist.length}</span>}
          </Link>
          <Link
            to="/order/keranjang"
            title="Keranjang Pesanan"
            className="relative w-9 h-9 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-[#d1d5db] transition-colors"
          >
            <MdShoppingCart className="w-5 h-5" />
            {cartCountTotal > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d1d5db] text-[#111113] text-[11px] font-black flex items-center justify-center">
                {cartCountTotal}
              </span>
            )}
          </Link>
          <button
            onClick={() => navigate("/post/new")}
            className="hidden sm:flex items-center gap-1.5 footer-glass-pill px-4 py-2 rounded-full text-[#d1d5db] font-semibold text-sm"
          >
            <MdAdd className="w-4 h-4" />
            Buat Postingan
          </button>

          {loading ? (
            <div className="w-9 h-9 rounded-full footer-glass-pill animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2.5">
              <Link to="/profile" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-full bg-[rgba(156,163,175,0.22)] border border-[rgba(156,163,175,0.35)] flex items-center justify-center text-[#d1d5db] font-bold text-sm overflow-hidden">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name ?? "avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (user.name || user.email || "?")[0].toUpperCase()
                  )}
                </div>
                <span className="hidden lg:block text-foreground text-sm font-semibold max-w-[120px] truncate group-hover:text-[#d1d5db] transition-colors">
                  {user.name || user.email}
                </span>
              </Link>
              <button
                onClick={() => {
                  logout()
                  navigate("/")
                }}
                title="Keluar"
                className="w-9 h-9 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
              >
                <MdLogout className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="bg-[#d1d5db] text-[#111113] font-black px-5 py-2 rounded-full text-sm hover:bg-[#f3f4f6] transition-colors duration-300"
            >
              Masuk
            </button>
          )}
        </div>
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {showBottomNav && (
        <nav className="fixed inset-x-0 bottom-0 z-[60] flex border-t border-border bg-background/95 backdrop-blur-md md:hidden">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
                    isActive ? "text-[#d1d5db]" : "text-muted-foreground"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      )}
    </>
  )
}
