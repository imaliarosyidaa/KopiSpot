import { useEffect, useRef, useState } from "react"
import { MdClose, MdPhotoCamera } from "react-icons/md"
import { uploadFile, ApiError } from "@/lib/api"
import StarRating from "./star-rating"

const MAX_IMAGES = 5
const MAX_COMMENT = 2000

const RATING_LABELS: Record<number, string> = {
  1: "Sangat Tidak Puas",
  2: "Tidak Puas",
  3: "Cukup",
  4: "Puas",
  5: "Sangat Puas",
}

interface ReviewModalProps {
  open: boolean
  mode: "create" | "edit"
  product: {
    name: string
    imageUrl: string | null
    category?: string
    storeName: string
    avgRating?: number
    ratingCount?: number
  }
  initial?: { rating: number; comment: string; images: string[] }
  submitting?: boolean
  error?: string | null
  onSubmit: (data: { rating: number; comment: string; images: string[] }) => Promise<void>
  onClose: () => void
}

export default function ReviewModal({
  open,
  mode,
  product,
  initial,
  submitting = false,
  error = null,
  onSubmit,
  onClose,
}: ReviewModalProps) {
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [comment, setComment] = useState(initial?.comment ?? "")
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setRating(initial?.rating ?? 0)
      setComment(initial?.comment ?? "")
      setImages(initial?.images ?? [])
      setUploadError(null)
      setUploading(false)
    }
  }, [open, initial])

  if (!open) return null

  const handleUpload = async (file: File | null) => {
    if (!file) return
    if (images.length >= MAX_IMAGES) {
      setUploadError(`Maksimal ${MAX_IMAGES} foto.`)
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const { url } = await uploadFile(file, "reviews")
      setImages((prev) => [...prev, url].slice(0, MAX_IMAGES))
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Gagal mengunggah foto.")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = () => {
    if (rating < 1) return
    void onSubmit({ rating, comment: comment.trim(), images })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2
            className="text-lg font-black text-foreground"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {mode === "edit" ? "Edit Penilaian" : "Beri Penilaian"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label="Tutup"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-3">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-14 w-14 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-black text-primary">
                {product.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-foreground">{product.name}</div>
              <div className="text-xs text-muted-foreground">{product.storeName}</div>
              {typeof product.avgRating === "number" && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Rating produk: {product.avgRating.toFixed(1)} ★ ·{" "}
                  {product.ratingCount ?? 0} ulasan
                </div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-semibold text-foreground">
              Bagaimana kualitas produk ini?
            </div>
            <div className="flex items-center gap-3">
              <StarRating rating={rating} interactive size="h-8 w-8" onRate={setRating} />
              {rating > 0 && (
                <span className="text-sm font-bold text-primary">{RATING_LABELS[rating]}</span>
              )}
            </div>
            {rating === 0 && (
              <p className="mt-1 text-xs text-destructive">Pilih rating 1–5 bintang.</p>
            )}
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Bagikan pengalaman kamu
            </label>
            <textarea
              value={comment}
              maxLength={MAX_COMMENT}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Ceritakan pengalaman kamu dengan produk ini..."
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">
              {comment.length}/{MAX_COMMENT}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-sm font-semibold text-foreground">Tambahkan foto</div>
            <div className="flex flex-wrap gap-3">
              {images.map((src, i) => (
                <div key={src} className="relative h-20 w-20">
                  <img
                    src={src}
                    alt={`Foto ulasan ${i + 1}`}
                    className="h-20 w-20 rounded-xl object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow"
                    aria-label="Hapus foto"
                  >
                    <MdClose className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <>
                      <MdPhotoCamera className="h-5 w-5" />
                      <span className="text-xs">Tambah</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
              />
            </div>
            {uploadError && <p className="mt-2 text-xs text-destructive">{uploadError}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="footer-glass-pill px-5 py-3 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={rating < 1 || submitting}
            className="flex-1 bg-primary px-5 py-3 rounded-full text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Menyimpan..."
              : mode === "edit"
                ? "Simpan Perubahan"
                : "Kirim Penilaian"}
          </button>
        </div>
      </div>
    </div>
  )
}
