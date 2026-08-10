import express from "express"
import cors from "cors"
import fs from "node:fs"
import authRouter from "./routes/auth.routes.js"
import placesRouter from "./routes/places.routes.js"
import postsRouter from "./routes/posts.routes.js"
import profileRouter from "./routes/profile.routes.js"
import feedRouter from "./routes/feed.routes.js"
import chatRouter from "./routes/chat.routes.js"
import menusRouter from "./routes/menus.routes.js"
import ordersRouter from "./routes/orders.routes.js"
import partnerRouter from "./routes/partner.routes.js"
import uploadRouter, { UPLOAD_DIR } from "./routes/upload.routes.js"

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const app = express()

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(UPLOAD_DIR))

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

app.use("/api/auth", authRouter)
app.use("/api/places", placesRouter)
app.use("/api/posts", postsRouter)
app.use("/api/users", profileRouter)
app.use("/api/feed", feedRouter)
app.use("/api/chat", chatRouter)
app.use("/api/menus", menusRouter)
app.use("/api/orders", ordersRouter)
app.use("/api/partner", partnerRouter)
app.use("/api/upload", uploadRouter)

app.use((_req, res) => {
  res.status(404).json({ error: "Route tidak ditemukan." })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: "Terjadi kesalahan pada server." })
})

const PORT = Number(process.env.PORT) || 4000

app.listen(PORT, () => {
  console.log(`KopiSpot API berjalan di http://localhost:${PORT}`)
})
