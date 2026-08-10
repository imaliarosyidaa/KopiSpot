import { Router } from "express"
import { prisma } from "../db.js"

const router = Router()

export const SHORTCUTS = [
  "Berapa kalori Kopi Latte?",
  "Berapa kadar gula Es Kopi Susu?",
  "Ingredients dari V60?",
  "Waktu terbaik untuk minum kopi?",
  "Kafe estetik hits di Bandung",
]

const CITIES = [
  "bandung",
  "jakarta",
  "bogor",
  "surabaya",
  "bali",
  "ubud",
  "yogyakarta",
  "semarang",
  "malang",
  "depok",
  "tangerang",
  "bekasi",
]

// Kata yang hanya bagian dari kalimat pertanyaan, bukan nama menu.
const STOPWORDS = new Set([
  "berapa",
  "kalori",
  "kadar",
  "gula",
  "ingredients",
  "ingredient",
  "bahan",
  "komposisi",
  "menu",
  "harga",
  "dari",
  "untuk",
  "saya",
  "mau",
  "tanya",
  "tolong",
  "coba",
  "kasih",
  "tahu",
  "sebutkan",
  "berikan",
  "per",
  "gram",
  "cangkir",
  "di",
  "yang",
  "dan",
  "apa",
  "mana",
  "tentang",
  "info",
  "ada",
  "dengan",
  "atau",
  "ke",
  "pada",
  "akan",
  "bisa",
  "kah",
  "enak",
  "enaknya",
  "bagus",
  "baik",
  "suka",
  "dong",
  ...CITIES,
])

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenize(value) {
  return normalize(value)
    .split(" ")
    .filter((t) => t.length > 1)
}

async function findMenuItems(text) {
  const norm = normalize(text)
  const items = await prisma.menuItem.findMany({
    include: { place: { select: { id: true, name: true, city: true } } },
  })

  // Nama menu lengkap muncul di dalam pertanyaan.
  const bySubstring = items.filter((it) => norm.includes(normalize(it.name)))
  if (bySubstring.length) {
    return bySubstring.slice(0, 6)
  }

  // Cocokkan kata-kata nama menu dengan pertanyaan (berdasarkan cakupan token).
  const tokens = tokenize(norm).filter((t) => !STOPWORDS.has(t))
  if (tokens.length) {
    const scored = items
      .map((it) => {
        const nameTokens = tokenize(it.name)
        const matched = nameTokens.filter((t) => tokens.includes(t)).length
        return { it, coverage: matched / tokens.length }
      })
      .filter((x) => x.coverage > 0)
      .sort((a, b) => b.coverage - a.coverage)
    const best = scored.length ? scored[0].coverage : 0
    if (scored.length && best >= 0.6) {
      return scored
        .filter((x) => x.coverage >= best)
        .map((x) => x.it)
        .slice(0, 6)
    }
    return []
  }

  // Pertanyaan umum soal kopi — tampilkan minuman kopi yang tersedia.
  return items.filter((it) => it.category === "coffee").slice(0, 6)
}

async function findPlaceByName(text) {
  const norm = normalize(text)
  const places = await prisma.place.findMany({
    select: {
      id: true,
      name: true,
      city: true,
      menuItems: { where: { isAvailable: true }, orderBy: { category: "asc" } },
    },
  })
  return places.find((p) => norm.includes(normalize(p.name))) ?? null
}

async function listPlacesForReply(city) {
  const places = await prisma.place.findMany({
    include: {
      ratings: { select: { value: true } },
      _count: { select: { views: true } },
    },
  })
  const filtered = city
    ? places.filter(
        (p) =>
          normalize(p.city).includes(city) || normalize(p.name).includes(city),
      )
    : places
  return filtered
    .map((p) => {
      const values = p.ratings.map((r) => r.value)
      const avg = values.length
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0
      return { p, avg }
    })
    .sort((a, b) => b.avg - a.avg || b.p._count.views - a.p._count.views)
    .slice(0, 3)
}

function waktuReply() {
  return [
    "Rekomendasi waktu terbaik minum kopi:",
    "",
    "☕ Pagi (09.30 – 11.30): saat kadar kortisol mulai menurun, efek kafein terasa paling maksimal. Hindari langsung minum kopi begitu bangun tidur.",
    "",
    "⚡ 30 – 60 menit sebelum olahraga: kafein membantu fokus dan performa.",
    "",
    "🌙 Hindari kopi sekitar 6 jam sebelum tidur supaya kualitas tidur tetap terjaga.",
    "",
    "💡 Batas aman kafein harian sekitar 400 mg (± 4 cangkir espresso).",
  ].join("\n")
}

function menuLine(it) {
  return `• ${it.name} — ${it.place.name} (${it.place.city})`
}

function kaloriReply(items) {
  const lines = items.map(
    (it) =>
      `${menuLine(it)}\n  ${it.calories ?? "kalori tidak tercantum"} kkal`,
  )
  return [
    "Info kalori untuk:",
    "",
    lines.join("\n"),
    "",
    "💡 Kebutuhan kalori harian rata-rata sekitar 2000 – 2500 kkal. Nikmati secukupnya ya ☕",
  ].join("\n")
}

function gulaReply(items) {
  const lines = items.map(
    (it) =>
      `${menuLine(it)}\n  ${it.sugar ?? "kadar gula tidak tercantum"} gram`,
  )
  return [
    "Info kadar gula:",
    "",
    lines.join("\n"),
    "",
    "💡 WHO menyarankan batas gula tambahan harian maksimal 25 – 50 gram (± 6 – 12 sendok teh).",
  ].join("\n")
}

function komposisiReply(items) {
  const lines = items.map((it) =>
    [
      `${menuLine(it)}`,
      `  Kalori: ${it.calories ?? "tidak tercantum"} kkal`,
      `  Gula: ${it.sugar ?? "tidak tercantum"} gram`,
      `  Bahan: ${it.ingredients ?? "tidak tercantum"}`,
    ].join("\n"),
  )
  return [
    "Komposisi minuman:",
    "",
    lines.join("\n\n"),
    "",
    "💡 Batas gula tambahan harian yang disarankan WHO adalah 25 – 50 gram.",
  ].join("\n")
}

function menuReply(items) {
  const lines = items.map(
    (it) =>
      `• ${it.name} — ${it.place.name} (${it.place.city}) — Rp ${it.price.toLocaleString("id-ID")}`,
  )
  return [
    "Menu yang aku temukan:",
    "",
    lines.join("\n"),
    "",
    "Mau tanya kalori, kadar gula, atau ingredients dari menu ini?",
  ].join("\n")
}

function menuPlaceReply(place) {
  return [
    `Menu di ${place.name} (${place.city}):`,
    "",
    place.menuItems.length
      ? place.menuItems
          .map((m) => `• ${m.name} — Rp ${m.price.toLocaleString("id-ID")}`)
          .join("\n")
      : "Belum ada menu yang tercatat.",
    "",
    "Mau tanya kalori, kadar gula, atau ingredients dari salah satu menu?",
  ].join("\n")
}

function cafeReply(rows, city) {
  const label = city
    ? `di ${city.charAt(0).toUpperCase()}${city.slice(1)}`
    : "buat kamu"
  const lines = rows.map(({ p, avg }) =>
    [
      `☕ ${p.name} — rating ${avg.toFixed(1)}`,
      `   ${p.address}, ${p.city} — ${p.price}`,
    ].join("\n"),
  )
  return [
    `Rekomendasi kafe ${label}:`,
    "",
    lines.join("\n\n"),
    "",
    "Mau lihat menu, kalori, atau kadar gula di salah satu kafe ini?",
  ].join("\n")
}

function notFoundReply(intent) {
  return [
    `Hmm, aku belum menemukan info ${intent} untuk menu itu.`,
    "",
    "Coba tanya dengan nama menu yang tersedia, misalnya:",
    ...SHORTCUTS.slice(0, 3).map((s) => `• ${s}`),
  ].join("\n")
}

function fallbackReply() {
  return [
    "Aku asisten KopiSpot ☕ Aku bisa bantu jawab seputar kalori, kadar gula, ingredients menu, waktu terbaik minum kopi, dan rekomendasi kafe.",
    "",
    "Coba tanya salah satu ini:",
    ...SHORTCUTS.map((s) => `• ${s}`),
  ].join("\n")
}

async function answer(text) {
  const norm = normalize(text)
  const city = CITIES.find((c) => norm.includes(c))

  if (
    /waktu terbaik|best time/.test(norm) ||
    /(waktu|jam|kapan)\s.*(minum|terbaik|bagus)/.test(norm)
  ) {
    return waktuReply()
  }

  if (/ingredients|bahan|komposisi|terbuat/.test(norm)) {
    const items = await findMenuItems(norm)
    return items.length ? komposisiReply(items) : notFoundReply("komposisi")
  }
  if (/kalori/.test(norm)) {
    const items = await findMenuItems(norm)
    return items.length ? kaloriReply(items) : notFoundReply("kalori")
  }
  if (/kadar gula|gula/.test(norm)) {
    const items = await findMenuItems(norm)
    return items.length ? gulaReply(items) : notFoundReply("kadar gula")
  }
  if (/menu|harga/.test(norm)) {
    const place = await findPlaceByName(norm)
    if (place) return menuPlaceReply(place)
    const items = await findMenuItems(norm)
    return items.length ? menuReply(items) : fallbackReply()
  }

  if (
    /kafe|rekomendasi|tempat ngopi|estetik|estetis|aesthetic|aestetik|hits|viral/.test(
      norm,
    ) ||
    city
  ) {
    const rows = await listPlacesForReply(city)
    return rows.length ? cafeReply(rows, city) : fallbackReply()
  }

  return fallbackReply()
}

router.post("/", async (req, res) => {
  const raw = typeof req.body?.message === "string" ? req.body.message : ""
  if (!normalize(raw)) {
    return res.status(400).json({ error: "Tulis pertanyaanmu dulu ya ☕" })
  }

  try {
    const reply = await answer(raw)
    res.json({ reply, suggestions: SHORTCUTS })
  } catch (err) {
    console.error(err)
    res
      .status(500)
      .json({ error: "Terjadi kesalahan saat memproses pertanyaan." })
  }
})

export default router
