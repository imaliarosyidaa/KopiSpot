if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  await import("dotenv/config");
}
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
import reviewsRouter from "./routes/reviews.routes.js"
import paymentsRouter from "./routes/payments.routes.js"
import notificationsRouter from "./routes/notifications.routes.js"
import partnerRouter from "./routes/partner.routes.js"
import uploadRouter, { UPLOAD_DIR } from "./routes/upload.routes.js"

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Storage read-only di Vercel Serverless:", e.message);
}

const app = express()

const allowedOrigins = [
  "https://coffidoor.store",
  "https://www.coffidoor.store",
  "http://localhost:5173",
  "http://localhost:8443",
  // Tambahkan regex jika ingin mengizinkan preview deployment Vercel:
  /\.vercel\.app$/,
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });

    if (isAllowed) {
      return callback(null, true);
    }

    console.log("❌ CORS blocked for origin:", origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  optionsSuccessStatus: 204,
};

app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.path, "ORIGIN:", req.headers.origin);
  next();
});

app.use(cors(corsOptions));

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
app.use("/api/reviews", reviewsRouter)
app.use("/api/payments", paymentsRouter)
app.use("/api/notifications", notificationsRouter)
app.use("/api/partner", partnerRouter)
app.use("/api/upload", uploadRouter)

app.use((_req, res) => {
  res.status(404).json({ error: "Route tidak ditemukan." })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: "Terjadi kesalahan pada server." })
})

export default app;

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server lokal aktif di http://localhost:${PORT}`);
  });
}
