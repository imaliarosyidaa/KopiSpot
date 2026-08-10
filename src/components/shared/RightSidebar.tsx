import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { feedApi, type FeedRight } from "@/lib/api"
import { timeAgo } from "@/lib/format"

export default function RightSidebar() {
  const [data, setData] = useState<FeedRight | null>(null)

  useEffect(() => {
    let active = true
    feedApi
      .right()
      .then((d) => active && setData(d))
      .catch(() => active && setData(null))
    return () => {
      active = false
    }
  }, [])

  return (
    <aside className="hidden lg:block w-72 shrink-0 sticky top-24 self-start space-y-6">
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          🔥 Kafe Sedang Tren
        </h3>
        <div className="flex flex-col gap-3">
          {(data?.trendingPlaces ?? []).map((p) => (
            <Link
              key={p.id}
              to={`/places/${p.id}`}
              className="flex items-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground group-hover:text-[#b07d3f] transition-colors truncate">
                  {p.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.city} · {p.viewCount.toLocaleString()} dilihat
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          🏆 Kontributor Teratas
        </h3>
        <div className="flex flex-col gap-3">
          {(data?.topContributors ?? []).map((u, i) => (
            <div key={u.id} className="flex items-center gap-3">
              <span className="w-5 text-sm font-black text-[#b07d3f]">
                {i + 1}
              </span>
              <div className="w-9 h-9 rounded-full bg-[rgba(140,95,40,0.22)] border border-[rgba(140,95,40,0.35)] flex items-center justify-center text-[#b07d3f] font-bold text-xs overflow-hidden shrink-0">
                {u.image ? (
                  <img
                    src={u.image}
                    alt={u.name ?? ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (u.name || "?")[0].toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground truncate">
                  {u.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  Lv.{u.level} · {u.xp.toLocaleString()} XP
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          # Tag Populer
        </h3>
        <div className="flex flex-wrap gap-2">
          {(data?.popularTags ?? []).map((t) => (
            <span key={t.tag} className="tag-pill cursor-default">
              #{t.tag}
            </span>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          💬 Ulasan Terbaru
        </h3>
        <div className="flex flex-col gap-4">
          {(data?.latestReviews ?? []).map((r) => (
            <div
              key={r.id}
              className="border-l-2 border-[rgba(140,95,40,0.3)] pl-3"
            >
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {r.body}
              </p>
              <div className="text-xs mt-1.5">
                <span className="text-foreground font-semibold">
                  {r.user.name}
                </span>
                <span className="text-muted-foreground"> di </span>
                <Link
                  to={`/places/${r.place.id}`}
                  className="text-[#b07d3f] font-semibold hover:underline"
                >
                  {r.place.name}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  · {timeAgo(r.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
