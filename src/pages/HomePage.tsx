import { useEffect, useMemo, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MdSearch } from "react-icons/md"
import MagneticButton from "@/components/ui/magnetic-button"
import PlaceCard from "@/components/ui/place-card"
import StarRating from "@/components/ui/star-rating"
import InteractiveGlobe from "@/components/ui/interactive-globe"
import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns-1"
import ImageGallery, { type FeatureGalleryItem } from "@/components/ui/image-gallery"
import LeftSidebar from "@/components/shared/LeftSidebar"
import {
  feedApi,
  placesApi,
  type FeedRight,
  type PlaceListItem,
} from "@/lib/api"
import { timeAgo } from "@/lib/format"
import { PLACE_CATEGORIES } from "@/lib/constants"
import ChatPage from "./ChatPage"
import { CinematicSection } from "@/components/ui/motion"
import AppFooter from "@/components/shared/AppFooter"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

// ─── HERO ────────────────────────────────────────────────────────────────────

function HeroMarqueeItem() {
  return (
    <div className="flex items-center space-x-12 px-6">
      <span>Kopi Terbaik Indonesia</span>{" "}
      <span className="text-[#d1d5db]">✦</span>
      <span>Tempat Aesthetic & Viral</span>{" "}
      <span className="text-[#6b6b6b]">✦</span>
      <span>Review Jujur & Terpercaya</span>{" "}
      <span className="text-[#d1d5db]">✦</span>
      <span>Foto-worthy Spots</span> <span className="text-[#6b6b6b]">✦</span>
      <span>Work-Friendly Cafes</span> <span className="text-[#d1d5db]">✦</span>
    </div>
  )
}

function CinematicHero({ onExplore }: { onExplore: () => void }) {
  const giantTextRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const linksRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const targets = [
      headingRef.current,
      subRef.current,
      linksRef.current,
    ].filter(Boolean)
    const ctx = gsap.context(() => {
      if (giantTextRef.current) {
        gsap.fromTo(giantTextRef.current, { y: 40, scale: 0.9, opacity: 0 }, {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 1.4,
          ease: "power3.out",
          delay: 0.1,
        })
      }
      if (targets.length) {
        gsap.fromTo(targets, { y: 40, opacity: 0 }, {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 1,
          ease: "power3.out",
          delay: 0.3,
        })
      }
    })
    return () => ctx.revert()
  }, [])

  return (
    <section
      className="relative w-full flex flex-col bg-background text-foreground cinematic-footer-wrapper overflow-x-hidden overflow-y-hidden"
      style={{ minHeight: "100svh" }}
    >
      <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
      <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

      <div
        ref={giantTextRef}
        className="footer-giant-bg-text absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none"
      >
        NGOPI
      </div>

      <div className="relative w-full overflow-hidden border-b border-border bg-background/70 backdrop-blur-md py-3.5 z-10 -rotate-2 scale-110 shadow-2xl mt-16">
        <div className="flex w-max animate-footer-scroll-marquee text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase">
          <HeroMarqueeItem />
          <HeroMarqueeItem />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 w-full max-w-4xl mx-auto text-center">
        <span className="tag-pill mb-6 inline-block">
          ✦ Rekomendasi Terkurasi 2026
        </span>
        <h1
          ref={headingRef}
          className="text-5xl md:text-8xl font-black footer-text-glow tracking-tighter mb-5"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Satu Akses di
          <br />
          coffidoor.
        </h1>
        <p
          ref={subRef}
          className="text-muted-foreground text-sm md:text-base mb-10 max-w-md leading-relaxed"
        >
          Coffidoor merupakan platform digital yang menghubungkan pelanggan dengan berbagai UMKM kopi dalam satu pintu digital.
        </p>

        <div ref={linksRef} className="flex flex-col items-center gap-4 w-full">
          <MagneticButton
            onClick={onExplore}
            className="bg-[#d1d5db] text-[#111113] font-black px-10 py-4 rounded-full text-sm hover:bg-[#f3f4f6] transition-colors duration-300 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            </svg>
            Jelajahi Sekarang
          </MagneticButton>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {["Jakarta", "Bali", "Bandung", "Yogyakarta", "Surabaya"].map(
              (city) => (
                <MagneticButton
                  key={city}
                  className="footer-glass-pill px-5 py-2 rounded-full text-muted-foreground font-medium text-xs hover:text-foreground"
                >
                  {city}
                </MagneticButton>
              ),
            )}
          </div>
        </div>
      </div>
      

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 pb-12 grid grid-cols-3 gap-6">
        {[
          { num: "500+", label: "Cafe Terdaftar" },
          { num: "12K+", label: "Ulasan Pengguna" },
          { num: "48", label: "Kota di Indonesia" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div
              className="text-2xl md:text-3xl font-black text-[#d1d5db]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {s.num}
            </div>
            <div className="text-muted-foreground text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [places, setPlaces] = useState<PlaceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [activeCategory, setActiveCategory] = useState("SEMUA")
  const [activeCity, setActiveCity] = useState("SEMUA")
  const [feed, setFeed] = useState<FeedRight | null>(null)

  const cities = useMemo(() => {
    const unique = Array.from(
      new Set(places.map((p) => p.city).filter(Boolean)),
    )
    return unique.sort()
  }, [places])

  useEffect(() => {
    let active = true
    setLoading(true)
    placesApi
      .list({
        q: q || undefined,
        category: activeCategory !== "SEMUA" ? activeCategory : undefined,
        city: activeCity !== "SEMUA" ? activeCity : undefined,
      })
      .then((d) => active && setPlaces(d))
      .catch(() => active && setPlaces([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [q, activeCategory, activeCity])

  useEffect(() => {
    let active = true
    feedApi
      .right()
      .then((d) => active && setFeed(d))
      .catch(() => active && setFeed(null))
    return () => {
      active = false
    }
  }, [])

  const scrollToPlaces = () => {
    document.getElementById("places")?.scrollIntoView({ behavior: "smooth" })
  }

  const featureItems: FeatureGalleryItem[] = [
    {
      name: "Jelajah Kafe",
      description: "Temukan spot kopi favorit di berbagai kota.",
      image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?q=80&w=900&auto=format&fit=crop",
      href: "/#places",
    },
    {
      name: "Pesan Kopi",
      description: "Pesan menu favorit tanpa berpindah platform.",
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=900&auto=format&fit=crop",
      href: "/order",
    },
    {
      name: "Komunitas",
      description: "Bagikan pengalaman dan rekomendasi terbaikmu.",
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=900&auto=format&fit=crop",
      href: "/feed",
    },
    {
      name: "Wishlist",
      description: "Simpan menu dan kafe yang ingin kamu kunjungi.",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=900&auto=format&fit=crop",
      href: "/wishlist",
    },
    {
      name: "Profil Kamu",
      description: "Kumpulkan ulasan, postingan, dan pencapaian.",
      image: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?q=80&w=900&auto=format&fit=crop",
      href: "/profile",
    },
    {
      name: "Mitra Kopi",
      description: "Bawa usaha kopimu bertemu lebih banyak pelanggan.",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=900&auto=format&fit=crop",
      href: "/mitra",
    },
  ]

  return (
    <>
      <CinematicHero onExplore={scrollToPlaces} />

        {/* ── MARQUEE DIVIDER (X) ── */}
        <div className="w-full overflow-hidden absolute z-20 top-[750px] md:py-36">
          {/* Marquee 1 — Kanan ke Kiri (Default) */}
          <div className="absolute left-1/2 top-1/2 w-[160vw] -translate-x-1/2 -translate-y-1/2 rotate-5 border-y border-border bg-card/95 py-3 shadow-lg">
            <div className="flex w-max animate-marquee text-xs font-bold tracking-[0.25em] text-muted-foreground uppercase">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-10 px-10">
                  <span>Kopi Specialty</span><span className="text-primary">✦</span>
                  <span>Latte Art</span><span className="text-primary">✦</span>
                  <span>Aesthetic Interior</span><span className="text-primary">✦</span>
                  <span>Work From Cafe</span><span className="text-primary">✦</span>
                  <span>Hidden Gems</span><span className="text-primary">✦</span>
                  <span>Instagramable Spots</span><span className="text-primary">✦</span>
                </div>
              ))}
            </div>
          </div>

          {/* Marquee 2 — Kiri ke Kanan (Reverse) */}
          <div className="absolute left-1/2 top-1/2 w-[160vw] -translate-x-1/2 -translate-y-1/2 -rotate-5 border-y border-border bg-card/95 py-3 shadow-lg">
            <div className="flex w-max animate-marquee-reverse text-xs font-bold tracking-[0.25em] text-muted-foreground uppercase">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-10 px-10">
                  <span>Kopi Specialty</span><span className="text-primary">✦</span>
                  <span>Latte Art</span><span className="text-primary">✦</span>
                  <span>Aesthetic Interior</span><span className="text-primary">✦</span>
                  <span>Work From Cafe</span><span className="text-primary">✦</span>
                  <span>Hidden Gems</span><span className="text-primary">✦</span>
                  <span>Instagramable Spots</span><span className="text-primary">✦</span>
                </div>
              ))}
            </div>
          </div>
        </div>

<div className="mt-24">
      <ImageGallery items={featureItems} />
</div>
      {/*
        ── ABOUT ──
      */}
      <section className="">
        <div className="rounded-3xl border border-border bg-card overflow-hidden relative footer-glass-pill">
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#d1d5db]/10 blur-3xl pointer-events-none" />

          <div className="px-6 md:px-12 py-20 mx-auto flex flex-col md:flex-row items-center md:min-h-[520px]">
            <div className="flex-1 flex flex-col justify-center relative z-10">
              <div>
                <span className="tag-pill mb-3 inline-block">
                  Komunitas Kopi Indonesia
                </span>
              </div>
              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.1] mb-4"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Eksplorasi Kafe dari
                <br />
                <span className="bg-gradient-to-r from-[#d1d5db] to-[#e0a45e] bg-clip-text text-transparent">
                  Seluruh Nusantara
                </span>
              </h2>

              <p className="text-sm md:text-base text-muted-foreground max-w-md leading-relaxed mb-8">
                <span className="font-bold">Tahukah kamu?</span> Biaya pembuatan
                Sistem Pemesanan Online Restoran (Restaurant Online Ordering
                System) bisa mencapai puluhan hingga ratusan juta. Kami membantu
                para pelaku UMKM kopi yang sedang merintis usahanya dan
                terkendala biaya dengan membangun layanan digital satu akses
                untuk menghubungkan UMKM kopi ke semua pelanggan.
              </p>

              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-2xl font-bold text-foreground">50+</p>
                  <p className="text-xs text-muted-foreground">
                    Kafe Terkurasi
                  </p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="text-2xl font-bold text-foreground">8+</p>
                  <p className="text-xs text-muted-foreground">
                    Kota di Indonesia
                  </p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="text-2xl font-bold text-foreground">12K+</p>
                  <p className="text-xs text-muted-foreground">
                    Ulasan Pengguna
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center w-full">
              <div className="w-full max-w-[440px] aspect-square">
                <InteractiveGlobe
                  size={440}
                  className="max-w-full"
                  dotColor="rgba(176, 125, 63, ALPHA)"
                  arcColor="rgba(176, 125, 63, 0.45)"
                  markerColor="rgba(201, 151, 79, 1)"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <CinematicSection />

      <section id="places" className="px-6 md:px-12 py-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <span className="tag-pill mb-3 inline-block">Pilihan Editor</span>
            <h2
              className="text-4xl md:text-6xl font-black text-foreground leading-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Spot Paling
              <br />
              Dicari
            </h2>
          </div>
          <div className="relative w-full md:w-80">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari kafe atau kota..."
              className="w-full rounded-full border border-border bg-card px-11 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#d1d5db] focus:ring-2 focus:ring-[rgba(209,213,219,0.25)] transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <LeftSidebar
            cities={cities}
            activeCategory={activeCategory}
            activeCity={activeCity}
            onCategory={setActiveCategory}
            onCity={setActiveCity}
          />

          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-6">
              {PLACE_CATEGORIES.slice(1).map((c) => (
                <button
                  key={c.value}
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === c.value ? "SEMUA" : c.value,
                    )
                  }
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                    activeCategory === c.value
                      ? "bg-[#d1d5db] text-[#111113]"
                      : "footer-glass-pill text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="glass-card rounded-2xl h-80 animate-pulse"
                  />
                ))}
              </div>
            ) : places.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">☕</div>
                <p className="text-foreground font-semibold">
                  Tidak ada kafe yang cocok.
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Coba ubah kata kunci atau filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {places.map((place, i) => (
                  <PlaceCard key={place.id} place={place} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Chatbot ── */}
      <ChatPage />

      {/* ── FEATURED SPOT ── */}
      <section className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
        <div className="glass-card rounded-3xl overflow-hidden grid md:grid-cols-2 gap-0">
          <div className="relative h-72 md:h-auto bg-muted">
            <img
              src="https://images.unsplash.com/photo-1759314710754-bb3e11fbaa7b?w=900&h=700&fit=crop&auto=format"
              alt="Latte art kopi aesthetic"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/60" />
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <span className="tag-pill mb-4 inline-block w-fit">
              ⭐ Spot Terfavorit
            </span>
            <h3
              className="text-3xl md:text-5xl font-black text-foreground leading-tight mb-4"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Pengalaman
              <br />
              Ngopi yang
              <br />
              Tak Terlupakan
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6 text-sm md:text-base">
              Setiap tegukan adalah cerita. Dari biji kopi single origin Flores
              hingga Kintamani Bali — Indonesia punya kopi terbaik dunia, dan
              kami tahu di mana menemukannya.
            </p>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div
                  className="text-2xl font-black text-[#d1d5db]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  4.8
                </div>
                <StarRating rating={4.8} />
                <div className="text-muted-foreground text-xs mt-1">
                  Rata-rata rating
                </div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div
                  className="text-2xl font-black text-[#d1d5db]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  12K+
                </div>
                <div className="text-muted-foreground text-xs mt-1">
                  Total ulasan
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GALLERY STRIP ── */}
      <section className="py-16 overflow-hidden">
        <div className="px-6 md:px-12 max-w-7xl mx-auto mb-8">
          <span className="tag-pill mb-3 inline-block">Galeri Foto</span>
          <h2
            className="text-4xl md:text-5xl font-black text-foreground"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Momen dari Cafe
          </h2>
        </div>
        <div
          className="flex gap-4 px-6 md:px-12 overflow-x-auto pb-4"
          style={{ scrollbarWidth: "none" }}
        >
          {[
            {
              url: "https://images.unsplash.com/photo-1780130650902-ba20c8158fc9?w=400&h=500&fit=crop&auto=format",
              label: "Latte Art",
            },
            {
              url: "https://images.unsplash.com/photo-1764277639919-1f77aaee0ab5?w=400&h=500&fit=crop&auto=format",
              label: "Cold Brew",
            },
            {
              url: "https://images.unsplash.com/photo-1785486249846-ae7d82db4e63?w=400&h=500&fit=crop&auto=format",
              label: "Outdoor Vibes",
            },
            {
              url: "https://images.unsplash.com/photo-1784391169939-c67b30d5dddc?w=400&h=500&fit=crop&auto=format",
              label: "Sunset Cafe",
            },
            {
              url: "https://images.unsplash.com/photo-1695824431539-873b615cf220?w=400&h=500&fit=crop&auto=format",
              label: "Morning Cup",
            },
            {
              url: "https://images.unsplash.com/photo-1782209345407-5a0f45912a9e?w=400&h=500&fit=crop&auto=format",
              label: "Latte Foam",
            },
          ].map((photo, i) => (
            <div
              key={i}
              className="relative shrink-0 w-44 md:w-56 h-64 md:h-72 rounded-2xl overflow-hidden bg-muted group"
            >
              <img
                src={photo.url}
                alt={photo.label}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-3 left-3 tag-pill">
                {photo.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="px-6 md:px-12 py-16 max-w-7xl mx-auto">
        <div className="mb-10">
          <span className="tag-pill mb-3 inline-block">Kata Mereka</span>
          <h2
            className="text-4xl md:text-5xl font-black text-foreground"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Review
            <br />
            Pengguna
          </h2>
        </div>
        {(() => {
          const testimonials: Testimonial[] = (feed?.latestReviews ?? []).map((review) => ({
            text: review.body,
            image: review.user.image,
            name: review.user.name ?? "Pengguna",
            role: timeAgo(review.createdAt),
          }))
          const columnSize = Math.ceil(testimonials.length / 3)
          const firstColumn = testimonials.slice(0, columnSize)
          const secondColumn = testimonials.slice(columnSize, columnSize * 2)
          const thirdColumn = testimonials.slice(columnSize * 2)

          return testimonials.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
              Belum ada ulasan terbaru.
            </div>
          ) : (
            <div className="testimonials-viewport flex max-h-[740px] justify-center gap-4 overflow-hidden sm:gap-6">
              <TestimonialsColumn testimonials={firstColumn} duration={15} />
              <TestimonialsColumn testimonials={secondColumn.length ? secondColumn : firstColumn} className="hidden md:block" duration={19} />
              <TestimonialsColumn testimonials={thirdColumn.length ? thirdColumn : firstColumn} className="hidden lg:block" duration={17} />
            </div>
          )
        })()}
      </section>

      {/* ── FOOTER ── */}
      <AppFooter />
    </>
  )
}
