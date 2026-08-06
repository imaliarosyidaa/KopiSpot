import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import StarRating from "@/components/ui/star-rating";
import type { PlaceListItem } from "@/lib/api";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function PlaceCard({ place, index = 0 }: { place: PlaceListItem; index?: number }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay: index * 0.08,
        scrollTrigger: { trigger: cardRef.current, start: "top 85%", once: true },
      }
    );
  }, [index]);

  return (
    <Link
      to={`/places/${place.id}`}
      ref={cardRef}
      className="glass-card rounded-2xl overflow-hidden group cursor-pointer block transition-all duration-500"
      style={{ transform: hovered ? "translateY(-6px)" : "translateY(0)", transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative h-56 overflow-hidden bg-muted">
        {place.imageUrl ? (
          <img
            src={place.imageUrl}
            alt={place.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[rgba(176,125,63,0.25)] to-[rgba(176,125,63,0.05)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {place.category && (
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            <span className="tag-pill">{place.category}</span>
          </div>
        )}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/60 backdrop-blur-sm border border-[rgba(140,95,40,0.3)] text-[#b07d3f] text-xs font-bold px-3 py-1 rounded-full">
            {place.openHours}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-bold text-foreground leading-tight">{place.name}</h3>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[#b07d3f] font-black text-lg leading-none">
              {place.avgRating ? place.avgRating.toFixed(1) : "—"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={Math.round(place.avgRating ?? 0)} />
          <span className="text-muted-foreground text-xs">({place.ratingCount.toLocaleString()} ulasan)</span>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-muted-foreground text-xs">{place.city}</span>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">{place.description}</p>

        {place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {place.tags.slice(0, 3).map((t) => (
              <span key={t} className="tag-pill">{t}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-[rgba(140,95,40,0.18)]">
          <span className="text-[#b07d3f] font-semibold text-sm">{place.price}</span>
          <div className="flex items-center gap-2">
            {place.wifi && (
              <span title="WiFi tersedia" className="text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </span>
            )}
            {place.cozy && (
              <span title="Cozy & nyaman" className="text-muted-foreground">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
