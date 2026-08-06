import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

type Mode = "login" | "register";

const inputClass =
  "w-full rounded-xl border border-[rgba(140,95,40,0.25)] bg-[#f7f7f7] px-4 py-3 text-sm text-[#1a1a1a] placeholder:text-[#9a9a9a] outline-none transition-all focus:border-[#b07d3f] focus:ring-2 focus:ring-[rgba(176,125,63,0.25)]";

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMode("login");
      setName("");
      setUsername("");
      setEmail("");
      setPassword("");
      setError(null);
    }
  }, [open]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password, username || undefined);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="glass-card relative w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 w-8 h-8 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-[#1a1a1a]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-[#b07d3f]">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 21v-2h2V5H2V3h13v2h-2v3h4l3 4v6h-2v2h-2v-2H6v2H2zm4-4h12v-4l-2-3h-4V5H6v12zm3-4h2v-2H9v2zm4 0h2v-2h-2v2z" />
            </svg>
          </span>
          <span className="text-[#1a1a1a] font-black text-xl tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            KopiSpot
          </span>
        </div>

        <h2 className="text-2xl font-black text-[#1a1a1a] mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
          {mode === "login" ? "Selamat Datang Kembali" : "Buat Akun Baru"}
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          {mode === "login"
            ? "Masuk untuk menyimpan wishlist dan memberikan ulasan."
            : "Bergabung untuk menyimpan wishlist dan memberikan ulasan."}
        </p>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-full footer-glass-pill mb-6">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                mode === m ? "bg-[#b07d3f] text-[#1a1a1a]" : "text-muted-foreground hover:text-[#1a1a1a]"
              }`}
            >
              {m === "login" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Nama
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap kamu"
                className={inputClass}
                required
              />
            </div>
          )}

          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username (opsional)"
                className={inputClass}
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_.]{3,20}"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Minimal 6 karakter" : "Password kamu"}
              className={inputClass}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-[rgba(220,38,38,0.35)] bg-[rgba(220,38,38,0.08)] px-4 py-3 text-sm text-[#b91c1c]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded-full bg-[#b07d3f] text-[#1a1a1a] font-black text-sm px-6 py-3.5 hover:bg-[#c9974f] transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar Sekarang"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-5">
          {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            className="text-[#b07d3f] font-bold hover:underline"
          >
            {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>
      </div>
    </div>
  );
}
