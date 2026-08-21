import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { MdAdd, MdSearch } from "react-icons/md"
import {
  placesApi,
  postsApi,
  type PlaceListItem,
  type PostItem,
} from "@/lib/api"
import PostCard from "@/components/feed/post-card"
import LeftSidebar from "@/components/shared/LeftSidebar"
import RightSidebar from "@/components/shared/RightSidebar"

export default function FeedPage() {
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [sort, setSort] = useState<"latest" | "popular">("latest")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [places, setPlaces] = useState<PlaceListItem[]>([])
  const [activeCategory, setActiveCategory] = useState("SEMUA")
  const [activeCity, setActiveCity] = useState("SEMUA")

  const cities = useMemo(() => {
    const unique = Array.from(
      new Set(places.map((p) => p.city).filter(Boolean)),
    )
    return unique.sort()
  }, [places])

  const placesById = useMemo(
    () => new Map(places.map((p) => [p.id, p])),
    [places],
  )

  const visiblePosts = useMemo(() => {
    if (activeCategory === "SEMUA" && activeCity === "SEMUA") return posts
    return posts.filter((post) => {
      if (activeCity !== "SEMUA" && post.place?.city !== activeCity)
        return false
      if (
        activeCategory !== "SEMUA" &&
        placesById.get(post.placeId ?? "")?.category !== activeCategory
      )
        return false
      return true
    })
  }, [posts, activeCategory, activeCity, placesById])

  const load = useCallback(
    async (targetPage: number, keep: boolean) => {
      setLoading(true)
      try {
        const r = await postsApi.list({
          page: targetPage,
          limit: 10,
          q: q || undefined,
          sort,
        })
        setPosts((prev) => (keep ? [...prev, ...r.data] : r.data))
        setTotalPages(r.totalPages)
        setPage(targetPage)
      } catch {
        setPosts((prev) => (keep ? prev : []))
      } finally {
        setLoading(false)
      }
    },
    [q, sort],
  )

  useEffect(() => {
    load(1, false)
  }, [load])

  useEffect(() => {
    let active = true
    placesApi
      .list()
      .then((d) => active && setPlaces(d))
      .catch(() => active && setPlaces([]))
    return () => {
      active = false
    }
  }, [])

  const updatePost = (updated: PostItem) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  const removePost = (deleted: PostItem & { _deleted?: boolean }) => {
    if (deleted._deleted) {
      setPosts((prev) => prev.filter((p) => p.id !== deleted.id))
      return
    }
    updatePost(deleted)
  }

  return (
    <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start gap-8">
        <LeftSidebar
          cities={cities}
          activeCategory={activeCategory}
          activeCity={activeCity}
          onCategory={setActiveCategory}
          onCity={setActiveCity}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari postingan, kafe, atau pengguna..."
                className="w-full rounded-full border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#d1d5db] focus:ring-2 focus:ring-[rgba(209,213,219,0.25)]"
              />
            </div>
            <Link
              to="/post/new"
              className="flex items-center gap-2 bg-[#d1d5db] text-[#111113] font-black px-5 py-3 rounded-full text-sm hover:bg-[#f3f4f6] transition-colors w-fit"
            >
              <MdAdd className="w-4 h-4" />
              Buat Postingan
            </Link>
          </div>

          <div className="my-4 flex items-center gap-1 p-1 rounded-full footer-glass-pill w-fit">
            {(["latest", "popular"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  sort === s
                    ? "bg-[#d1d5db] text-[#111113]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "latest" ? "Terbaru" : "Terpopuler"}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-5 max-w-2xl">
            {loading && page === 1 ? (
              <div className="glass-card rounded-3xl h-80 animate-pulse" />
            ) : visiblePosts.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-foreground font-semibold">
                  Belum ada postingan yang cocok.
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Jadilah orang pertama yang berbagi cerita!
                </p>
              </div>
            ) : (
              visiblePosts.map((post) => (
                <PostCard key={post.id} post={post} onChanged={removePost} />
              ))
            )}

            {page < totalPages && (
              <button
                onClick={() => load(page + 1, true)}
                disabled={loading}
                className="footer-glass-pill px-6 py-3 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60 mx-auto"
              >
                {loading ? "Memuat..." : "Muat Lainnya"}
              </button>
            )}
          </div>
        </div>

        <RightSidebar />
      </div>
    </div>
  )
}
