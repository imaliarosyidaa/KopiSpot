import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { MdAddPhotoAlternate, MdClose } from "react-icons/md"
import { placesApi, postsApi, uploadFile, type PlaceListItem } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import AuthModal from "@/components/ui/auth-modal"
import { POST_CATEGORIES } from "@/lib/constants"

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[#d1d5db] focus:ring-2 focus:ring-[rgba(209,213,219,0.25)]"

export default function CreatePostPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = useState(false)

  const [caption, setCaption] = useState("")
  const [placeId, setPlaceId] = useState("")
  const [category, setCategory] = useState("NGOPI")
  const [tagsInput, setTagsInput] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [places, setPlaces] = useState<PlaceListItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    placesApi
      .list()
      .then(setPlaces)
      .catch(() => setPlaces([]))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground animate-pulse pt-16">
        Memuat...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="glass-card rounded-3xl p-10 text-center max-w-md">
          <div className="text-4xl mb-3">✍️</div>
          <h1 className="text-xl font-black text-foreground mb-2">
            Masuk untuk membuat postingan
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Kamu harus login dulu untuk berbagi cerita di komunitas coffidoor.
          </p>
          <button
            onClick={() => setAuthOpen(true)}
            className="bg-[#d1d5db] text-[#111113] font-black px-6 py-3 rounded-full text-sm hover:bg-[#f3f4f6] transition-colors"
          >
            Masuk Sekarang
          </button>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    )
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    setUploading(true)
    setError(null)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files).slice(0, 4 - images.length)) {
        const r = await uploadFile(file)
        uploaded.push(r.url)
      }
      setImages((prev) => [...prev, ...uploaded])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah gambar.")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean)
        .slice(0, 8)
      await postsApi.create({
        caption: caption.trim(),
        placeId: placeId || null,
        category,
        tags,
        images,
      })
      navigate("/feed")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat postingan.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-24 px-6 md:px-12 lg:max-w-2xl xl:max-w-7xl mx-auto pb-20">
      <span className="tag-pill mb-3 inline-block">Buat Postingan</span>
      <h1
        className="text-4xl font-black text-foreground mb-8"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        Bagikan Ceritamu
      </h1>

      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-3xl p-6 md:p-8 flex flex-col gap-5"
      >
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Keterangan
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            required
            placeholder="Ceritakan pengalaman ngopimu... (maks 2000 karakter)"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Kafe Terkait
          </label>
          <select
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className={inputClass}
          >
            <option value="">— Pilih kafe (opsional) —</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Kategori
          </label>
          <div className="flex flex-wrap gap-2">
            {POST_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  category === c.value
                    ? "bg-[#d1d5db] text-[#111113]"
                    : "footer-glass-pill text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Tag (pisahkan dengan koma)
          </label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="healing, kopi susu, hidden gem"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Foto
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative h-28 rounded-xl overflow-hidden bg-muted"
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
                >
                  <MdClose className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <label className="relative h-28 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#d1d5db] text-muted-foreground hover:text-foreground transition-colors">
                <MdAddPhotoAlternate className="w-5 h-5" />
                <span className="text-[10px] font-semibold">
                  {uploading ? "Mengunggah..." : "Tambah Foto"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => handleFiles(e.target.files)}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[rgba(220,38,38,0.35)] bg-[rgba(220,38,38,0.08)] px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-[#d1d5db] text-[#111113] font-black px-6 py-3.5 rounded-full text-sm hover:bg-[#f3f4f6] transition-colors disabled:opacity-60"
        >
          {submitting ? "Memposting..." : "Publikasikan"}
        </button>
      </form>
    </div>
  )
}
