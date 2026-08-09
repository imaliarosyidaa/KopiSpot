import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { MdAdd, MdLogout, MdShoppingCart } from "react-icons/md";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/ui/auth-modal";
import ThemeSwitcher from "@/components/shared/ThemeSwitcher";
import { cartCount, useCartStore } from "@/lib/cart-store";

const navItems = [
  { to: "/", label: "Beranda" },
  { to: "/feed", label: "Komunitas" },
  { to: "/chat", label: "Chat" },
  { to: "/leaderboard", label: "Peringkat" },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const cartItems = useCartStore((s) => s.items);
  const cartCountTotal = cartCount(cartItems);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-background/85 backdrop-blur-md border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-[#b07d3f]">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 21v-2h2V5H2V3h13v2h-2v3h4l3 4v6h-2v2h-2v-2H6v2H2zm4-4h12v-4l-2-3h-4V5H6v12zm3-4h2v-2H9v2zm4 0h2v-2h-2v2z" />
            </svg>
          </span>
          <span className="text-foreground font-black text-lg tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            KopiSpot
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? "text-[#b07d3f] font-bold" : "text-muted-foreground hover:text-foreground"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <Link
            to="/order"
            title="Pesan Kopi"
            className="relative w-9 h-9 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-[#b07d3f] transition-colors"
          >
            <MdShoppingCart className="w-5 h-5" />
            {cartCountTotal > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#b07d3f] text-[#1a1a1a] text-[11px] font-black flex items-center justify-center">
                {cartCountTotal}
              </span>
            )}
          </Link>
          <button
            onClick={() => navigate("/post/new")}
            className="hidden sm:flex items-center gap-1.5 footer-glass-pill px-4 py-2 rounded-full text-[#b07d3f] font-semibold text-sm"
          >
            <MdAdd className="w-4 h-4" />
            Buat Postingan
          </button>

          {loading ? (
            <div className="w-9 h-9 rounded-full footer-glass-pill animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2.5">
              <Link to="/profile" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-full bg-[rgba(140,95,40,0.22)] border border-[rgba(140,95,40,0.35)] flex items-center justify-center text-[#b07d3f] font-bold text-sm overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt={user.name ?? "avatar"} className="w-full h-full object-cover" />
                  ) : (
                    (user.name || user.email || "?")[0].toUpperCase()
                  )}
                </div>
                <span className="hidden lg:block text-foreground text-sm font-semibold max-w-[120px] truncate group-hover:text-[#b07d3f] transition-colors">
                  {user.name || user.email}
                </span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
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
              className="bg-[#b07d3f] text-[#1a1a1a] font-black px-5 py-2 rounded-full text-sm hover:bg-[#c9974f] transition-colors duration-300"
            >
              Masuk
            </button>
          )}
        </div>
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
