import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
      <div className="relative h-56 overflow-hidden bg-[#1a1610]">
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
          <span className="bg-black/60 backdrop-blur-sm border border-[rgba(200,150,90,0.2)] text-[#c8965a] text-xs font-bold px-3 py-1 rounded-full">
            {place.openHour}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-bold text-[#f5f0e8] leading-tight">{place.name}</h3>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[#c8965a] font-black text-lg leading-none">{place.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={place.rating} />
          <span className="text-[#8a7d6b] text-xs">({place.reviewCount.toLocaleString()} ulasan)</span>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <svg className="w-3.5 h-3.5 text-[#8a7d6b] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[#8a7d6b] text-xs">{place.location}</span>
        </div>

        <p className="text-[#c8b89a] text-sm leading-relaxed mb-4 line-clamp-3">{place.reviewText}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {place.tags.map((t) => (
            <span key={t} className="tag-pill">{t}</span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[rgba(200,150,90,0.1)]">
          <span className="text-[#c8965a] font-semibold text-sm">{place.price}</span>
          <div className="flex items-center gap-2">
            {place.wifi && (
              <span title="WiFi tersedia" className="text-[#8a7d6b]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </span>
            )}
            {place.cozy && (
              <span title="Cozy & nyaman" className="text-[#8a7d6b]">
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
        <div className="w-10 h-10 rounded-full bg-[rgba(200,150,90,0.15)] border border-[rgba(200,150,90,0.25)] flex items-center justify-center text-[#c8965a] font-bold text-sm shrink-0">
          {review.avatar}
        </div>
        <div>
          <div className="font-semibold text-[#f5f0e8] text-sm">{review.name}</div>
          <div className="text-[#8a7d6b] text-xs">{review.date}</div>
        </div>
        <div className="ml-auto">
          <StarRating rating={review.rating} />
        </div>
      </div>
      <p className="text-[#c8b89a] text-sm leading-relaxed">{review.text}</p>
    </div>
  );
}

// ─── CINEMATIC FOOTER ────────────────────────────────────────────────────────

function MarqueeItem() {
  return (
    <div className="flex items-center space-x-12 px-6">
      <span>Kopi Terbaik Indonesia</span> <span className="text-[#c8965a]">✦</span>
      <span>Tempat Aesthetic & Viral</span> <span className="text-[#8a7d6b]">✦</span>
      <span>Review Jujur & Terpercaya</span> <span className="text-[#c8965a]">✦</span>
      <span>Foto-worthy Spots</span> <span className="text-[#8a7d6b]">✦</span>
      <span>Work-Friendly Cafes</span> <span className="text-[#c8965a]">✦</span>
    </div>
  );
}

function CinematicFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(giantTextRef.current,
        { y: "10vh", scale: 0.8, opacity: 0 },
        { y: "0vh", scale: 1, opacity: 1, ease: "power1.out",
          scrollTrigger: { trigger: wrapperRef.current, start: "top 80%", end: "bottom bottom", scrub: 1 } }
      );
      gsap.fromTo([headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.15, ease: "power3.out",
          scrollTrigger: { trigger: wrapperRef.current, start: "top 40%", end: "bottom bottom", scrub: 1 } }
      );
    }, wrapperRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-screen w-full" style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}>
      <footer className="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-[#0a0805] text-[#f5f0e8] cinematic-footer-wrapper">
        <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
        <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

        <div ref={giantTextRef} className="footer-giant-bg-text absolute -bottom-[5vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none">
          NGOPI
        </div>

        <div className="absolute top-12 left-0 w-full overflow-hidden border-y border-[rgba(200,150,90,0.15)] bg-[rgba(10,8,5,0.6)] backdrop-blur-md py-4 z-10 -rotate-2 scale-110 shadow-2xl">
          <div className="flex w-max animate-footer-scroll-marquee text-xs font-bold tracking-[0.3em] text-[#8a7d6b] uppercase">
            <MarqueeItem /><MarqueeItem />
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-20 w-full max-w-4xl mx-auto">
          <h2 ref={headingRef} className="text-5xl md:text-8xl font-black footer-text-glow tracking-tighter mb-4 text-center" style={{ fontFamily: "'Fraunces', serif" }}>
            Temukan Spot<br/>Favoritmu.
          </h2>
          <p className="text-[#8a7d6b] text-center text-sm md:text-base mb-10 max-w-md">Ratusan tempat ngopi terbaik, tersaring khusus untuk kamu yang suka kopi, kerja dari cafe, atau sekadar foto-foto.</p>

          <div ref={linksRef} className="flex flex-col items-center gap-4 w-full">
            <div className="flex flex-wrap justify-center gap-4">
              <MagneticButton className="footer-glass-pill px-10 py-4 rounded-full text-[#f5f0e8] font-bold text-sm flex items-center gap-2">
                <svg className="w-5 h-5 text-[#c8965a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Temukan Dekat Saya
              </MagneticButton>
              <MagneticButton className="footer-glass-pill px-10 py-4 rounded-full text-[#c8965a] font-bold text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Simpan Wishlist
              </MagneticButton>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {["Jakarta", "Bali", "Bandung", "Yogyakarta", "Surabaya"].map((city) => (
                <MagneticButton key={city} className="footer-glass-pill px-5 py-2 rounded-full text-[#8a7d6b] font-medium text-xs hover:text-[#f5f0e8]">
                  {city}
                </MagneticButton>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-20 w-full pb-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[#8a7d6b] text-[10px] font-semibold tracking-widest uppercase order-2 md:order-1">
            © 2026 KopiSpot. Semua hak dilindungi.
          </div>
          <div className="footer-glass-pill px-5 py-2.5 rounded-full flex items-center gap-2 order-1 md:order-2">
            <span className="text-[#8a7d6b] text-[10px] font-bold uppercase tracking-widest">Dibuat dengan</span>
            <span className="animate-footer-heartbeat text-sm text-red-400">❤</span>
            <span className="text-[#8a7d6b] text-[10px] font-bold uppercase tracking-widest">untuk</span>
            <span className="text-[#c8965a] font-black text-xs ml-1">Pecinta Kopi</span>
          </div>
          <MagneticButton
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-11 h-11 rounded-full footer-glass-pill flex items-center justify-center text-[#8a7d6b] hover:text-[#f5f0e8] order-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </MagneticButton>
        </div>
      </footer>
    </div>
  );
}

// ─── FILTER BAR ──────────────────────────────────────────────────────────────

const filters = ["Semua", "Ngopi", "Ngerjakan Tugas", "Foto-foto"];

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  const filtered = activeFilter === "Semua"
    ? places
    : places.filter((p) => p.category.includes(activeFilter));

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.2 }
      );
      gsap.fromTo(subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.5 }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="relative w-full bg-[#0a0805] min-h-screen overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-[rgba(10,8,5,0.8)] backdrop-blur-md border-b border-[rgba(200,150,90,0.1)]">
        <div className="flex items-center gap-2">
          <span className="text-[#c8965a]">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 21v-2h2V5H2V3h13v2h-2v3h4l3 4v6h-2v2h-2v-2H6v2H2zm4-4h12v-4l-2-3h-4V5H6v12zm3-4h2v-2H9v2zm4 0h2v-2h-2v2z"/>
            </svg>
          </span>
          <span className="text-[#f5f0e8] font-black text-lg tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>KopiSpot</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          {["Explore", "Kota", "Top Picks", "Review"].map((item) => (
            <a key={item} href="#" className="text-[#8a7d6b] hover:text-[#f5f0e8] text-sm font-medium transition-colors">{item}</a>
          ))}
        </div>
        <button className="footer-glass-pill px-5 py-2 rounded-full text-[#c8965a] font-semibold text-sm">
          Tambah Tempat
        </button>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-6 overflow-hidden">
        <div className="hero-gradient absolute inset-0 pointer-events-none" />

        {/* BG image collage */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <img src="https://images.unsplash.com/photo-1775991072532-5a56d1419daa?w=1400&h=900&fit=crop&auto=format" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0805]/60 via-transparent to-[#0a0805]" />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <span className="tag-pill mb-6 inline-block">✦ Rekomendasi Terkurasi 2026</span>
          <h1
            ref={titleRef}
            className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-6 text-[#f5f0e8]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Tempat Ngopi<br/>
            <span className="text-[#c8965a] italic">Aesthetic</span> &<br/>
            Viral Indonesia
          </h1>
          <p ref={subtitleRef} className="text-[#8a7d6b] text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10">
            Dari sudut Jakarta sampai sawah Ubud — temukan cafe paling instagramable, work-friendly, dan tentunya kopi terbaik.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => document.getElementById("places")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-[#c8965a] text-[#0a0805] font-black px-8 py-4 rounded-full text-base hover:bg-[#e8c48a] transition-colors duration-300"
            >
              Jelajahi Sekarang
            </button>
            <button className="footer-glass-pill px-8 py-4 rounded-full text-[#f5f0e8] font-semibold text-base">
              Lihat Peta
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 mt-20 grid grid-cols-3 gap-6 md:gap-12 max-w-2xl w-full mx-auto">
          {[
            { num: "500+", label: "Cafe Terdaftar" },
            { num: "12K+", label: "Ulasan Pengguna" },
            { num: "48", label: "Kota di Indonesia" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl md:text-4xl font-black text-[#c8965a]" style={{ fontFamily: "'Fraunces', serif" }}>{s.num}</div>
              <div className="text-[#8a7d6b] text-xs md:text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#8a7d6b]">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-[#c8965a] to-transparent" />
        </div>
      </section>

      {/* ── MARQUEE DIVIDER ── */}
      <div className="w-full overflow-hidden border-y border-[rgba(200,150,90,0.1)] bg-[rgba(10,8,5,0.9)] py-3">
        <div className="flex w-max animate-marquee text-xs font-bold tracking-[0.25em] text-[#8a7d6b] uppercase">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-10 px-10">
              <span>Kopi Specialty</span><span className="text-[#c8965a]">✦</span>
              <span>Latte Art</span><span className="text-[#c8965a]">✦</span>
              <span>Aesthetic Interior</span><span className="text-[#c8965a]">✦</span>
              <span>Work From Cafe</span><span className="text-[#c8965a]">✦</span>
              <span>Hidden Gems</span><span className="text-[#c8965a]">✦</span>
              <span>Instagramable Spots</span><span className="text-[#c8965a]">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PLACES GRID ── */}
      <section id="places" className="px-6 md:px-12 py-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="tag-pill mb-3 inline-block">Pilihan Editor</span>
            <h2 className="text-4xl md:text-6xl font-black text-[#f5f0e8] leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
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
                    ? "bg-[#c8965a] text-[#0a0805]"
                    : "footer-glass-pill text-[#8a7d6b] hover:text-[#f5f0e8]"
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
          <div className="relative h-72 md:h-auto bg-[#1a1610]">
            <img
              src="https://images.unsplash.com/photo-1759314710754-bb3e11fbaa7b?w=900&h=700&fit=crop&auto=format"
              alt="Latte art kopi aesthetic"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#13110d]/50" />
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <span className="tag-pill mb-4 inline-block w-fit">⭐ Spot Terfavorit</span>
            <h3 className="text-3xl md:text-5xl font-black text-[#f5f0e8] leading-tight mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
              Pengalaman<br/>Ngopi yang<br/>Tak Terlupakan
            </h3>
            <p className="text-[#8a7d6b] leading-relaxed mb-6 text-sm md:text-base">
              Setiap tegukan adalah cerita. Dari biji kopi single origin Flores hingga Kintamani Bali — Indonesia punya kopi terbaik dunia, dan kami tahu di mana menemukannya.
            </p>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-black text-[#c8965a]" style={{ fontFamily: "'Fraunces', serif" }}>4.8</div>
                <StarRating rating={4.8} />
                <div className="text-[#8a7d6b] text-xs mt-1">Rata-rata rating</div>
              </div>
              <div className="w-px h-12 bg-[rgba(200,150,90,0.2)]" />
              <div className="text-center">
                <div className="text-2xl font-black text-[#c8965a]" style={{ fontFamily: "'Fraunces', serif" }}>12K+</div>
                <div className="text-[#8a7d6b] text-xs mt-1">Total ulasan</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PHOTO GALLERY STRIP ── */}
      <section className="py-16 overflow-hidden">
        <div className="px-6 md:px-12 max-w-7xl mx-auto mb-8">
          <span className="tag-pill mb-3 inline-block">Galeri Foto</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#f5f0e8]" style={{ fontFamily: "'Fraunces', serif" }}>Momen dari Cafe</h2>
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
            <div key={i} className="relative shrink-0 w-44 md:w-56 h-64 md:h-72 rounded-2xl overflow-hidden bg-[#1a1610] group">
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
          <h2 className="text-4xl md:text-5xl font-black text-[#f5f0e8]" style={{ fontFamily: "'Fraunces', serif" }}>Review<br/>Pengguna</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
        </div>
      </section>

      {/* ── CINEMATIC FOOTER ── */}
      <CinematicFooter />
    </div>
  );
}
