import { useEffect, useState } from "react"
import { profileApi, type LeaderboardEntry } from "@/lib/api"
import { levelProgress, initials } from "@/lib/format"

const MEDALS = ["🥇", "🥈", "🥉"]

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    profileApi
      .leaderboard()
      .then((d) => active && setEntries(d))
      .catch(() => active && setEntries([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="pt-24 px-6 md:px-12 max-w-4xl mx-auto pb-20">
      <span className="tag-pill mb-3 inline-block">Papan Peringkat</span>
      <h1
        className="text-4xl md:text-5xl font-black text-foreground mb-2"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        Kontributor Teratas
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Dapatkan XP dan lencana dari setiap ulasan, rating, dan postingan yang
        kamu buat.
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl h-20 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <div
              key={e.id}
              className="glass-card rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="w-10 shrink-0 text-center text-2xl font-black">
                {MEDALS[e.rank - 1] ?? (
                  <span className="text-muted-foreground text-base">
                    #{e.rank}
                  </span>
                )}
              </div>
              <div className="w-12 h-12 rounded-full bg-[rgba(156,163,175,0.22)] border border-[rgba(156,163,175,0.35)] flex items-center justify-center text-[#d1d5db] font-bold overflow-hidden shrink-0">
                {e.image ? (
                  <img
                    src={e.image}
                    alt={e.name ?? ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials(e.name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground truncate">
                    {e.name ?? "Pengguna"}
                  </span>
                  <span className="tag-pill">Lv.{e.level}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {e.xp.toLocaleString()} XP · {e.stats.posts} postingan ·{" "}
                  {e.stats.ratings} rating · {e.stats.reviews} ulasan
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#d1d5db]"
                    style={{
                      width: `${Math.round(levelProgress(e.xp, e.level) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[160px]">
                {e.badges.slice(0, 3).map((b) => (
                  <span key={b.id} title={b.name} className="text-lg">
                    {b.icon}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="glass-card rounded-3xl p-12 text-center text-muted-foreground">
              Belum ada kontributor. Yuk mulai berpartisipasi!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
