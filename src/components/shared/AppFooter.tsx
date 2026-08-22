import { useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"
import {
  FaDribbble,
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaTwitter,
} from "react-icons/fa"
import {
  MdArrowForward,
  MdEmail,
  MdLocationOn,
  MdPhone,
} from "react-icons/md"
import LogoDark from "./LogoDark"
import LogoLight from "./LogoLight"
import { useTheme } from "@/lib/theme"

const COMPANY = {
  name: "coffidoor",
  description:
    "Platform penemuan kafe untuk belajar, bekerja, nongkrong, dan berfoto. Ulasan jujur dari komunitas pencinta kopi Indonesia.",
  email: "halo@coffidoor.id",
  phone: "+62 812 3456 7890",
  address: "Jakarta, Indonesia",
}

const socialLinks = [
  { icon: FaInstagram, label: "Instagram", href: "https://instagram.com" },
  { icon: FaTwitter, label: "Twitter", href: "https://twitter.com" },
  { icon: FaFacebookF, label: "Facebook", href: "https://facebook.com" },
  { icon: FaGithub, label: "GitHub", href: "https://github.com" },
  { icon: FaDribbble, label: "Dribbble", href: "https://dribbble.com" },
]

const aboutLinks = [
  { text: "Beranda", to: "/" },
  { text: "Komunitas", to: "/feed" },
  { text: "Peringkat", to: "/leaderboard" },
  { text: "Profil Saya", to: "/profile" },
]

const serviceLinks = [
  { text: "Pesan Kopi", to: "/order" },
  { text: "Keranjang", to: "/order/keranjang" },
  { text: "Daftar Mitra", to: "/mitra" },
  { text: "Chat Asisten", to: "/chat" },
]

const helpfulLinks = [
  { text: "FAQ", href: "#" },
  { text: "Pusat Bantuan", href: "#" },
  { text: "Syarat & Ketentuan", href: "#" },
  { text: "Kebijakan Privasi", href: "#", hasIndicator: true },
]

const contactInfo = [
  { icon: MdEmail, text: COMPANY.email },
  { icon: MdPhone, text: COMPANY.phone },
  { icon: MdLocationOn, text: COMPANY.address, isAddress: true },
]

const legalLinks = ["Syarat Layanan", "Kebijakan Privasi", "Cookie", "Aksesibilitas"]

export default function AppFooter() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const { theme } = useTheme()

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail("")
  }

  return (
    <footer className="relative mt-16 w-full overflow-hidden bg-secondary dark:bg-secondary/20 pt-16 pb-8">
      <div className="pointer-events-none absolute inset-0 z-0 footer-bg-grid" />
      <div className="pointer-events-none absolute top-1/4 left-1/4 z-0 h-72 w-72 rounded-full bg-[#d1d5db] opacity-10 blur-3xl" />

      <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card mb-16 rounded-3xl p-8 md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-2xl font-black md:text-3xl" style={{ fontFamily: "'Fraunces', serif" }}>
                Dapatkan Rekomendasi Kafe Terbaru
              </h3>
              <p className="mb-6 text-foreground/70 text-sm md:text-base">
                Berlangganan untuk menerima spot kopi hits, hidden gem, dan promo menarik langsung di emailmu.
              </p>
              {subscribed ? (
                <div className="flex items-center gap-2 rounded-xl border border-[rgba(209,213,219,0.4)] bg-[rgba(209,213,219,0.12)] px-4 py-3 text-sm font-semibold text-[#d1d5db]">
                  Terima kasih! Kamu sudah berlangganan.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email kamu"
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[#d1d5db] focus:ring-2 focus:ring-[rgba(209,213,219,0.25)]"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#d1d5db] px-6 py-3 text-sm font-black text-[#111113] transition hover:bg-[#f3f4f6]"
                  >
                    Berlangganan
                    <MdArrowForward className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
            <div className="hidden justify-end md:flex">
              <div className="relative">
                <div className="absolute inset-0 rotate-6 rounded-2xl bg-[rgba(209,213,219,0.2)]" />
                <img
                  src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=320&h=240&q=80"
                  alt="coffidoor"
                  className="relative w-80 rounded-2xl object-cover shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-[6.75rem] shrink-0 items-center text-[#d1d5db] sm:h-10 sm:w-[7.5rem]">
            {theme === "dark" ? <LogoDark width="100%" height="100%" /> : <LogoLight width="100%" height="100%" />}
          </span>
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-foreground/60">{COMPANY.description}</p>
            <div className="mt-6 flex space-x-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  title={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full footer-glass-pill text-muted-foreground transition hover:text-[#d1d5db]"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Tentang", links: aboutLinks.map((l) => ({ ...l, to: l.to })) },
            { title: "Layanan", links: serviceLinks.map((l) => ({ ...l, to: l.to })) },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-lg font-bold text-foreground">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.text}>
                    <Link to={link.to} className="text-sm text-foreground/60 transition hover:text-[#d1d5db]">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-4 text-lg font-bold text-foreground">Bantuan</h4>
            <ul className="space-y-3">
              {helpfulLinks.map(({ text, href, hasIndicator }) => (
                <li key={text}>
                  <a
                    href={href}
                    className={hasIndicator ? "group flex items-center gap-1.5" : "text-sm text-foreground/60 transition hover:text-[#d1d5db]"}
                  >
                    <span className="text-sm text-foreground/60 transition group-hover:text-[#d1d5db]">{text}</span>
                    {hasIndicator && (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d1d5db] opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d1d5db]" />
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-bold text-foreground">Kontak</h4>
            <ul className="space-y-4">
              {contactInfo.map(({ icon: Icon, text, isAddress }) => (
                <li key={text}>
                  <a href="#" className="flex items-center gap-2">
                    <Icon className="h-5 w-5 shrink-0 text-[#d1d5db]" />
                    {isAddress ? (
                      <address className="flex-1 text-sm text-foreground/60 not-italic">{text}</address>
                    ) : (
                      <span className="flex-1 text-sm text-foreground/60">{text}</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-foreground/60">© 2026 coffidoor. Semua hak dilindungi.</p>
          <div className="flex flex-wrap justify-center gap-6">
            {legalLinks.map((text) => (
              <a key={text} href="#" className="text-sm text-foreground/60 transition hover:text-[#d1d5db]">
                {text}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}