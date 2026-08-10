import { Router } from "express"
import multer from "multer"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { requireAuth } from "../auth.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads")

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"])
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED.has(ext)) {
      return cb(
        new Error("Tipe file tidak didukung. Gunakan jpg/png/webp/gif."),
      )
    }
    cb(null, true)
  },
})

const router = Router()

router.post("/", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File wajib diunggah." })
  }
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
  res.status(201).json({ url })
})

router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Ukuran file maksimal 5MB." })
  }
  if (err) {
    return res.status(400).json({ error: err.message })
  }
  next()
})

export default router
