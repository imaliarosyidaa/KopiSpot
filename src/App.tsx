import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CinematicFooter } from "@/components/ui/motion-footer";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const places = [
  {
    id: 1,
    name: "Anomali Coffee",
    location: "Senopati, Jakarta Selatan",
    category: ["Ngopi", "Foto-foto"],
    rating: 4.8,
    reviewCount: 2341,
    price: "Rp 45.000 – 75.000",
    bestFor: "Pour over & single origin",
    image: "https://images.unsplash.com/photo-1685718913827-4321d75a19cd?w=800&h=600&fit=crop&auto=format",
    reviewText: "Spot paling ikonik buat coffee enthusiast. Interior bata merah ekspos dengan pencahayaan warm yang bikin setiap foto keliatan editorial banget. Kopinya serius — single origin Flores dan Toraja.",
    tags: ["Specialty Coffee", "Instagramable", "Work-Friendly"],
    openHour: "07.00 – 22.00",
    wifi: true,
    cozy: true,
  },
  {
    id: 2,
    name: "Kopi Tuku",
    location: "Cipete, Jakarta Selatan",
    category: ["Ngopi", "Ngerjakan Tugas"],
    rating: 4.7,
    reviewCount: 1876,
    price: "Rp 28.000 – 55.000",
    bestFor: "Kopi susu kekinian",
    image: "https://images.unsplash.com/photo-1749631236680-bcdb75bd1001?w=800&h=600&fit=crop&auto=format",
    reviewText: "Pelopor kopi susu kekinian yang masih relevan. Antrian panjang tapi worth it. Konsepnya kasual dengan nuansa kampung kota yang hangat dan genuine — bukan pura-pura artsy.",
    tags: ["Kopi Susu", "Viral", "Casual"],
    openHour: "07.00 – 21.00",
    wifi: true,
    cozy: true,
  },
  {
    id: 3,
    name: "Nusantara Coffee",
    location: "Ubud, Bali",
    category: ["Foto-foto", "Ngopi"],
    rating: 4.9,
    reviewCount: 3102,
    price: "Rp 35.000 – 65.000",
    bestFor: "Pemandangan sawah + kopi Bali",
    image: "https://images.unsplash.com/photo-1759156240748-c873004abdb2?w=800&h=600&fit=crop&auto=format",
    reviewText: "Duduk di tepi sawah dengan secangkir kopi Kintamani panas. Suasana Ubud yang tenang bikin produktivitas naik drastis. Golden hour di sini literally surga buat fotografer.",
    tags: ["Rice Field View", "Viral", "Outdoor"],
    openHour: "08.00 – 20.00",
    wifi: true,
    cozy: true,
  },
  {
    id: 4,
    name: "Tanamera Coffee",
    location: "Sudirman, Jakarta",
    category: ["Ngerjakan Tugas", "Ngopi"],
    rating: 4.6,
    reviewCount: 987,
    price: "Rp 50.000 – 85.000",
    bestFor: "Filter coffee & workspace vibe",
    image: "https://images.unsplash.com/photo-1776483751775-36ca104e7349?w=800&h=600&fit=crop&auto=format",
    reviewText: "Konsep roastery yang bersih dan profesional. Langit-langit tinggi, meja lebar, outlet di mana-mana. Tempat paling produktif di Jakarta buat remote work marathon seharian.",
    tags: ["Roastery", "Work-Friendly", "Specialty"],
    openHour: "07.30 – 21.30",
    wifi: true,
    cozy: false,
  },
  {
    id: 5,
    name: "Common Grounds",
    location: "SCBD, Jakarta Selatan",
    category: ["Foto-foto", "Ngopi", "Ngerjakan Tugas"],
    rating: 4.7,
    reviewCount: 1654,
    price: "Rp 55.000 – 95.000",
    bestFor: "All-day dining & coffee",
    image: "https://images.unsplash.com/photo-1774758959178-094de5122e29?w=800&h=600&fit=crop&auto=format",
    reviewText: "Desain interior paling cincin di Jakarta — kombinasi tanaman hijau, kayu gelap, dan beton ekspos. Perfect spot buat meeting atau sekadar tampil keren di Instagram feed.",
    tags: ["Instagramable", "All-Day", "Premium"],
    openHour: "07.00 – 23.00",
    wifi: true,
    cozy: true,
  },
  {
    id: 6,
    name: "Folks Coffee",
    location: "Bandung, Jawa Barat",
    category: ["Ngopi", "Foto-foto"],
    rating: 4.8,
    reviewCount: 2209,
    price: "Rp 30.000 – 60.000",
    bestFor: "Aesthetic minimalis + kopi Sundanese",
    image: "https://images.unsplash.com/photo-1621871305450-7d9a2c6e6149?w=800&h=600&fit=crop&auto=format",
    reviewText: "Hidden gem Bandung yang selalu ramai di weekend. Konsep Japandi dengan sentuhan lokal — bambu, bata, tanaman. Kopi Priangan mereka punya karakter asam citrus yang segar.",
    tags: ["Japandi", "Hidden Gem", "Local Coffee"],
    openHour: "08.00 – 21.00",
    wifi: false,
    cozy: true,
  },
];

const reviews = [
  { name: "Dira Kusuma", date: "3 hari lalu", rating: 5, text: "Anomali Coffee selalu jadi langganan saya tiap kali meeting klien. Ambiance-nya premium tapi nggak bikin kikuk. Barista-nya juga ramah dan mau jelasin origin kopi.", avatar: "DK" },
  { name: "Rizal Firmansyah", date: "1 minggu lalu", rating: 5, text: "Kopi Tuku nggak ada tandingannya buat kopi susu kekinian. Sudah coba puluhan tempat tapi selalu balik ke sini. The classic never dies!", avatar: "RF" },
  { name: "Salsabila Putri", date: "2 minggu lalu", rating: 5, text: "Nusantara Coffee di Ubud literally healing buat jiwa. Scroll sambil dengerin suara angin sawah dengan segelas Kintamani — definition of perfect morning.", avatar: "SP" },
  { name: "Agung Wibowo", date: "3 minggu lalu", rating: 4, text: "Tanamera jadi basecamp WFH saya. Wifi kenceng, colokan banyak, dan kopinya konsisten. Satu-satunya minus adalah agak ramai di jam makan siang.", avatar: "AW" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < Math.floor(rating) ? "star-filled" : "star-empty"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── MAGNETIC BUTTON ─────────────────────────────────────────────────────────

function MagneticButton({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: x * 0.35, y: y * 0.35, rotationX: -y * 0.12, rotationY: x * 0.12, scale: 1.05, ease: "power2.out", duration: 0.4 });
    };
    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1, ease: "elastic.out(1, 0.3)", duration: 1.2 });
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, []);

  return (
    <button ref={ref} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

// ─── PLACE CARD ──────────────────────────────────────────────────────────────

function PlaceCard({ place, index }: { place: typeof places[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1, y: 0, duration: 0.7, delay: index * 0.08,
        scrollTrigger: { trigger: cardRef.current, start: "top 85%", once: true },
      }
    );
  }, [index]);

  return (
    <div
      ref={cardRef}
      className="glass-card rounded-2xl overflow-hidden group cursor-pointer transition-all duration-500"
      style={{ transform: hovered ? "translateY(-6px)" : "translateY(0)", transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-[#eaeaea]">
        <img
          src={place.image}
          alt={place.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {place.category.map((c) => (
            <span key={c} className="tag-pill">{c}</span>
          ))}
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/60 backdrop-blur-sm border border-[rgba(140,95,40,0.3)] text-[#b07d3f] text-xs font-bold px-3 py-1 rounded-full">
            {place.openHour}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-bold text-[#1a1a1a] leading-tight">{place.name}</h3>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[#b07d3f] font-black text-lg leading-none">{place.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={place.rating} />
          <span className="text-[#6b6b6b] text-xs">({place.reviewCount.toLocaleString()} ulasan)</span>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <svg className="w-3.5 h-3.5 text-[#6b6b6b] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[#6b6b6b] text-xs">{place.location}</span>
        </div>

        <p className="text-[#6b6b6b] text-sm leading-relaxed mb-4 line-clamp-3">{place.reviewText}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {place.tags.map((t) => (
            <span key={t} className="tag-pill">{t}</span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[rgba(140,95,40,0.18)]">
          <span className="text-[#b07d3f] font-semibold text-sm">{place.price}</span>
          <div className="flex items-center gap-2">
            {place.wifi && (
              <span title="WiFi tersedia" className="text-[#6b6b6b]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </span>
            )}
            {place.cozy && (
              <span title="Cozy & nyaman" className="text-[#6b6b6b]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REVIEW CARD ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: typeof reviews[0] }) {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[rgba(140,95,40,0.22)] border border-[rgba(140,95,40,0.35)] flex items-center justify-center text-[#b07d3f] font-bold text-sm shrink-0">
          {review.avatar}
        </div>
        <div>
          <div className="font-semibold text-[#1a1a1a] text-sm">{review.name}</div>
          <div className="text-[#6b6b6b] text-xs">{review.date}</div>
        </div>
        <div className="ml-auto">
          <StarRating rating={review.rating} />
        </div>
      </div>
      <p className="text-[#6b6b6b] text-sm leading-relaxed">{review.text}</p>
    </div>
  );
}

// ─── CINEMATIC HERO ──────────────────────────────────────────────────────────

function HeroMarqueeItem() {
  return (
    <div className="flex items-center space-x-12 px-6">
      <span>Kopi Terbaik Indonesia</span> <span className="text-[#b07d3f]">✦</span>
      <span>Tempat Aesthetic & Viral</span> <span className="text-[#6b6b6b]">✦</span>
      <span>Review Jujur & Terpercaya</span> <span className="text-[#b07d3f]">✦</span>
      <span>Foto-worthy Spots</span> <span className="text-[#6b6b6b]">✦</span>
      <span>Work-Friendly Cafes</span> <span className="text-[#b07d3f]">✦</span>
    </div>
  );
}

function CinematicHero() {
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targets = [headingRef.current, subRef.current, linksRef.current].filter(Boolean);
    const ctx = gsap.context(() => {
      if (giantTextRef.current) {
        gsap.fromTo(giantTextRef.current,
          { y: 40, scale: 0.9, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, duration: 1.4, ease: "power3.out", delay: 0.1 }
        );
      }
      if (targets.length) {
        gsap.fromTo(targets,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.15, duration: 1, ease: "power3.out", delay: 0.3 }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative w-full flex flex-col bg-[#f7f7f7] text-[#1a1a1a] cinematic-footer-wrapper overflow-x-hidden" style={{ minHeight: "100svh" }}>
      {/* Ambient glow */}
      <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
      <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

      {/* Giant background text — pinned near bottom */}
      <div ref={giantTextRef} className="footer-giant-bg-text absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none">
        NGOPI
      </div>

      {/* Diagonal marquee — sits just below navbar */}
      <div className="relative w-full overflow-hidden border-b border-[rgba(140,95,40,0.22)] bg-[rgba(247,247,247,0.7)] backdrop-blur-md py-3.5 z-10 -rotate-2 scale-110 shadow-2xl mt-16">
        <div className="flex w-max animate-footer-scroll-marquee text-xs font-bold tracking-[0.3em] text-[#6b6b6b] uppercase">
          <HeroMarqueeItem /><HeroMarqueeItem />
        </div>
      </div>

      {/* Main content — centered vertically in remaining space */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 w-full max-w-4xl mx-auto text-center">
        <span className="tag-pill mb-6 inline-block">✦ Rekomendasi Terkurasi 2026</span>
        <h1
          ref={headingRef}
          className="text-5xl md:text-8xl font-black footer-text-glow tracking-tighter mb-5"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Temukan Spot<br />Favoritmu.
        </h1>
        <p ref={subRef} className="text-[#6b6b6b] text-sm md:text-base mb-10 max-w-md leading-relaxed">
          Ratusan tempat ngopi terbaik, tersaring khusus untuk kamu yang suka kopi, kerja dari cafe, atau sekadar foto-foto.
        </p>

        <div ref={linksRef} className="flex flex-col items-center gap-4 w-full">
          <div className="flex flex-wrap justify-center gap-4">
            <MagneticButton
              onClick={() => document.getElementById("places")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-[#b07d3f] text-[#1a1a1a] font-black px-10 py-4 rounded-full text-sm hover:bg-[#c9974f] transition-colors duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Jelajahi Sekarang
            </MagneticButton>
            <MagneticButton className="footer-glass-pill px-10 py-4 rounded-full text-[#b07d3f] font-bold text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Simpan Wishlist
            </MagneticButton>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {["Jakarta", "Bali", "Bandung", "Yogyakarta", "Surabaya"].map((city) => (
              <MagneticButton key={city} className="footer-glass-pill px-5 py-2 rounded-full text-[#6b6b6b] font-medium text-xs hover:text-[#1a1a1a]">
                {city}
              </MagneticButton>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row — anchored to bottom */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 pb-12 grid grid-cols-3 gap-6">
        {[
          { num: "500+", label: "Cafe Terdaftar" },
          { num: "12K+", label: "Ulasan Pengguna" },
          { num: "48", label: "Kota di Indonesia" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl md:text-3xl font-black text-[#b07d3f]" style={{ fontFamily: "'Fraunces', serif" }}>{s.num}</div>
            <div className="text-[#6b6b6b] text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── FILTER BAR ──────────────────────────────────────────────────────────────

const filters = ["Semua", "Ngopi", "Ngerjakan Tugas", "Foto-foto"];

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [activeFilter, setActiveFilter] = useState("Semua");

  const filtered = activeFilter === "Semua"
    ? places
    : places.filter((p) => p.category.includes(activeFilter));

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden">

      {/* Content layer — sits above the fixed cinematic footer so it is only
          revealed once the user scrolls to the bottom. */}
      <div className="relative z-10 bg-[#f7f7f7]">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-[rgba(247,247,247,0.85)] backdrop-blur-md border-b border-[rgba(140,95,40,0.18)]">
        <div className="flex items-center gap-2">
          <span className="text-[#b07d3f]">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 21v-2h2V5H2V3h13v2h-2v3h4l3 4v6h-2v2h-2v-2H6v2H2zm4-4h12v-4l-2-3h-4V5H6v12zm3-4h2v-2H9v2zm4 0h2v-2h-2v2z"/>
            </svg>
          </span>
          <span className="text-[#1a1a1a] font-black text-lg tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>KopiSpot</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          {["Explore", "Kota", "Top Picks", "Review"].map((item) => (
            <a key={item} href="#" className="text-[#6b6b6b] hover:text-[#1a1a1a] text-sm font-medium transition-colors">{item}</a>
          ))}
        </div>
        <button className="footer-glass-pill px-5 py-2 rounded-full text-[#b07d3f] font-semibold text-sm">
          Tambah Tempat
        </button>
      </nav>

      {/* ── CINEMATIC HERO ── */}
      <CinematicHero />

      {/* ── MARQUEE DIVIDER ── */}
      <div className="w-full overflow-hidden border-y border-[rgba(140,95,40,0.18)] bg-[rgba(247,247,247,0.9)] py-3">
        <div className="flex w-max animate-marquee text-xs font-bold tracking-[0.25em] text-[#6b6b6b] uppercase">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-10 px-10">
              <span>Kopi Specialty</span><span className="text-[#b07d3f]">✦</span>
              <span>Latte Art</span><span className="text-[#b07d3f]">✦</span>
              <span>Aesthetic Interior</span><span className="text-[#b07d3f]">✦</span>
              <span>Work From Cafe</span><span className="text-[#b07d3f]">✦</span>
              <span>Hidden Gems</span><span className="text-[#b07d3f]">✦</span>
              <span>Instagramable Spots</span><span className="text-[#b07d3f]">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PLACES GRID ── */}
      <section id="places" className="px-6 md:px-12 py-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="tag-pill mb-3 inline-block">Pilihan Editor</span>
            <h2 className="text-4xl md:text-6xl font-black text-[#1a1a1a] leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
              Spot Paling<br/>Dicari
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeFilter === f
                    ? "bg-[#b07d3f] text-[#1a1a1a]"
                    : "footer-glass-pill text-[#6b6b6b] hover:text-[#1a1a1a]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((place, i) => (
            <PlaceCard key={place.id} place={place} index={i} />
          ))}
        </div>
      </section>

      {/* ── FEATURED SPOT (big card) ── */}
      <section className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
        <div className="glass-card rounded-3xl overflow-hidden grid md:grid-cols-2 gap-0">
          <div className="relative h-72 md:h-auto bg-[#eaeaea]">
            <img
              src="https://images.unsplash.com/photo-1759314710754-bb3e11fbaa7b?w=900&h=700&fit=crop&auto=format"
              alt="Latte art kopi aesthetic"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#ffffff]/60" />
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <span className="tag-pill mb-4 inline-block w-fit">⭐ Spot Terfavorit</span>
            <h3 className="text-3xl md:text-5xl font-black text-[#1a1a1a] leading-tight mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
              Pengalaman<br/>Ngopi yang<br/>Tak Terlupakan
            </h3>
            <p className="text-[#6b6b6b] leading-relaxed mb-6 text-sm md:text-base">
              Setiap tegukan adalah cerita. Dari biji kopi single origin Flores hingga Kintamani Bali — Indonesia punya kopi terbaik dunia, dan kami tahu di mana menemukannya.
            </p>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-black text-[#b07d3f]" style={{ fontFamily: "'Fraunces', serif" }}>4.8</div>
                <StarRating rating={4.8} />
                <div className="text-[#6b6b6b] text-xs mt-1">Rata-rata rating</div>
              </div>
              <div className="w-px h-12 bg-[rgba(140,95,40,0.3)]" />
              <div className="text-center">
                <div className="text-2xl font-black text-[#b07d3f]" style={{ fontFamily: "'Fraunces', serif" }}>12K+</div>
                <div className="text-[#6b6b6b] text-xs mt-1">Total ulasan</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PHOTO GALLERY STRIP ── */}
      <section className="py-16 overflow-hidden">
        <div className="px-6 md:px-12 max-w-7xl mx-auto mb-8">
          <span className="tag-pill mb-3 inline-block">Galeri Foto</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#1a1a1a]" style={{ fontFamily: "'Fraunces', serif" }}>Momen dari Cafe</h2>
        </div>
        <div className="flex gap-4 px-6 md:px-12 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
          {[
            { url: "https://images.unsplash.com/photo-1780130650902-ba20c8158fc9?w=400&h=500&fit=crop&auto=format", label: "Latte Art" },
            { url: "https://images.unsplash.com/photo-1764277639919-1f77aaee0ab5?w=400&h=500&fit=crop&auto=format", label: "Cold Brew" },
            { url: "https://images.unsplash.com/photo-1785486249846-ae7d82db4e63?w=400&h=500&fit=crop&auto=format", label: "Outdoor Vibes" },
            { url: "https://images.unsplash.com/photo-1784391169939-c67b30d5dddc?w=400&h=500&fit=crop&auto=format", label: "Sunset Cafe" },
            { url: "https://images.unsplash.com/photo-1695824431539-873b615cf220?w=400&h=500&fit=crop&auto=format", label: "Morning Cup" },
            { url: "https://images.unsplash.com/photo-1782209345407-5a0f45912a9e?w=400&h=500&fit=crop&auto=format", label: "Latte Foam" },
          ].map((photo, i) => (
            <div key={i} className="relative shrink-0 w-44 md:w-56 h-64 md:h-72 rounded-2xl overflow-hidden bg-[#eaeaea] group">
              <img src={photo.url} alt={photo.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-3 left-3 tag-pill">{photo.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="px-6 md:px-12 py-16 max-w-7xl mx-auto">
        <div className="mb-10">
          <span className="tag-pill mb-3 inline-block">Kata Mereka</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#1a1a1a]" style={{ fontFamily: "'Fraunces', serif" }}>Review<br/>Pengguna</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
        </div>
      </section>

      </div>

      {/* ── CINEMATIC FOOTER ── */}
      <CinematicFooter />
    </div>
  );
}
