import { Router } from "express"
import multer from "multer"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { requireAuth } from "../auth.js"
import { uploadImage, isAllowedMime } from "../lib/supabase.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Kept for legacy static serving of already-uploaded local files (read-only).
export const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads")

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedMime(file.mimetype)) {
      return cb(
        new Error("Tipe file tidak didukung. Gunakan jpg/png/webp/gif."),
      )
    }
    cb(null, true)
  },
})

const ALLOWED_FOLDERS = new Set([
  "profiles",
  "posts",
  "products",
  "menus",
  "stores",
  "reviews",
  "misc",
])

function normalizeFolder(folder) {
  if (typeof folder === "string" && folder.length) {
    const f = folder.replace(/[^a-zA-Z0-9-_]/g, "")
    if (ALLOWED_FOLDERS.has(f)) return f
  }
  return "misc"
}

const router = Router()

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File wajib diunggah." })
  }
  try {
    const folder = normalizeFolder(req.body?.folder)
    const url = await uploadImage(req.file.buffer, req.file.mimetype, folder)
    res.status(201).json({ url })
  } catch (err) {
    console.error("[upload] gagal upload ke Supabase:", err)
    res.status(500).json({ error: "Gagal mengunggah gambar. Coba lagi nanti." })
  }
})

router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Ukuran file maksimal 5MB." })
  }
  if (err) {
    return res.status(400).json({ error: err.message })
  }
  res.status(500).json({ error: "Terjadi kesalahan." })
})

export default router
