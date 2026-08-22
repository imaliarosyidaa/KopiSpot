import { Router } from "express"

import { PlaceCategory } from "@prisma/client"

import { prisma } from "../db.js"

import { requireAuth } from "../auth.js"

import {
  parseTags,
  serializePlace,
  serializePlaceWithStats,
} from "../serialize.js"

const router = Router()

const VALID_CATEGORIES = Object.values(PlaceCategory)

// ─── LIST / SEARCH ──────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  const { category, city, q } = req.query

  const where = {}

  if (category && category !== "SEMUA") {
    where.category = category
  }

  if (city && city !== "SEMUA") {
    where.city = String(city)
  }

  if (q) {
    const like = { contains: String(q) }

    where.OR = [{ name: like }, { city: like }, { address: like }]
  }

  const places = await prisma.place.findMany({
    where,

    include: { ratings: { select: { value: true } } },

    orderBy: { createdAt: "desc" },
  })

  res.json(places.map(serializePlaceWithStats))
})

// ─── CREATE ─────────────────────────────────────────────────────────────────

router.post("/", requireAuth, async (req, res) => {
  const body = req.body || {}

  if (!VALID_CATEGORIES.includes(body.category)) {
    return res.status(400).json({ error: "Kategori tidak valid." })
  }

  for (const field of [
    "name",
    "description",
    "address",
    "city",
    "price",
    "openHours",
  ]) {
    if (typeof body[field] !== "string" || !body[field].trim()) {
      return res.status(400).json({ error: `Field ${field} wajib diisi.` })
    }
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t) => typeof t === "string")
    : []

  const place = await prisma.place.create({
    data: {
      name: body.name.trim(),

      category: body.category,

      description: body.description.trim(),

      address: body.address.trim(),

      city: body.city.trim(),

      price: body.price.trim(),

      openHours: body.openHours.trim(),

      imageUrl:
        typeof body.imageUrl === "string" && body.imageUrl.trim()
          ? body.imageUrl.trim()
          : "",

      tagsJson: JSON.stringify(tags),

      authorId: req.userId,
    },
  })

  res.status(201).json({ ...place, tags })
})

// ─── DETAIL ─────────────────────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  const place = await prisma.place.findUnique({
    where: { id: req.params.id },

    include: {
      author: { select: { id: true, name: true, image: true } },

      comments: {
        include: { user: { select: { id: true, name: true, image: true } } },

        orderBy: { createdAt: "desc" },
      },

      menuItems: { where: { isAvailable: true }, orderBy: { category: "asc" } },

      ratings: { select: { userId: true, value: true } },

      _count: { select: { ratings: true, views: true, comments: true } },
    },
  })

  if (!place) {
    return res.status(404).json({ error: "Tempat tidak ditemukan." })
  }

  const { tagsJson, ratings, _count, ...rest } = place

  const values = ratings.map((r) => r.value)
  const ratingByUser = new Map(ratings.map((rating) => [rating.userId, rating.value]))
  const ratingBreakdown = Object.fromEntries([1, 2, 3, 4, 5].map((value) => [value, 0]))
  for (const value of values) ratingBreakdown[value] += 1

  const total = values.reduce((sum, v) => sum + v, 0)

  res.json({
    ...rest,

    tags: parseTags(place),

    avgRating: values.length ? total / values.length : 0,

    ratingCount: _count.ratings,

    viewCount: _count.views,

    commentCount: _count.comments,
    ratingBreakdown,
    comments: rest.comments.map((comment) => ({
      ...comment,
      rating: ratingByUser.get(comment.userId) ?? null,
    })),
  })
})

// ─── UPDATE / DELETE (owner only) ───────────────────────────────────────────

router.put("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.place.findUnique({
    where: { id: req.params.id },

    select: { id: true, authorId: true },
  })

  if (!existing) {
    return res.status(404).json({ error: "Tempat tidak ditemukan." })
  }

  if (existing.authorId !== req.userId) {
    return res.status(403).json({ error: "Kamu bukan pemilik tempat ini." })
  }

  const body = req.body || {}

  const data = {}

  for (const field of [
    "name",
    "description",
    "address",
    "city",
    "price",
    "openHours",
  ]) {
    if (typeof body[field] === "string" && body[field].trim()) {
      data[field] = body[field].trim()
    }
  }

  if (typeof body.imageUrl === "string") data.imageUrl = body.imageUrl.trim()

  if (VALID_CATEGORIES.includes(body.category)) data.category = body.category

  if (Array.isArray(body.tags)) data.tagsJson = JSON.stringify(body.tags)

  const place = await prisma.place.update({
    where: { id: req.params.id },

    data,
  })

  res.json(serializePlace(place))
})

router.delete("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.place.findUnique({
    where: { id: req.params.id },

    select: { id: true, authorId: true },
  })

  if (!existing) {
    return res.status(404).json({ error: "Tempat tidak ditemukan." })
  }

  if (existing.authorId !== req.userId) {
    return res.status(403).json({ error: "Kamu bukan pemilik tempat ini." })
  }

  await prisma.place.delete({ where: { id: req.params.id } })

  res.json({ ok: true })
})

// ─── VIEW ───────────────────────────────────────────────────────────────────

router.post("/:id/view", async (req, res) => {
  const exists = await prisma.place.findUnique({
    where: { id: req.params.id },

    select: { id: true },
  })

  if (!exists) {
    return res.status(404).json({ error: "Tempat tidak ditemukan." })
  }

  await prisma.placeView.create({
    data: { placeId: req.params.id, userId: req.userId ?? null },
  })

  res.json({ ok: true })
})

// ─── RATE ───────────────────────────────────────────────────────────────────

router.post("/:id/rate", requireAuth, async (req, res) => {
  const value = Number(req.body?.value)

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return res.status(400).json({ error: "Rating harus antara 1 sampai 5." })
  }

  const place = await prisma.place.findUnique({
    where: { id: req.params.id },
    select: { id: true },
  })
  if (!place) {
    return res.status(404).json({ error: "Tempat tidak ditemukan." })
  }

  const existing = await prisma.rating.findFirst({
    where: { userId: req.userId, placeId: req.params.id },
  })
  const rating = existing
    ? await prisma.rating.update({ where: { id: existing.id }, data: { value } })
    : await prisma.rating.create({
        data: { userId: req.userId, placeId: req.params.id, value },
      })

  res.json(rating)
})

router.delete("/:id/rate", requireAuth, async (req, res) => {
  await prisma.rating.deleteMany({
    where: { placeId: req.params.id, userId: req.userId },
  })

  res.json({ ok: true })
})

// ─── COMMENTS ───────────────────────────────────────────────────────────────

router.get("/:id/comments", async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { placeId: req.params.id },

    include: { user: { select: { id: true, name: true, image: true } } },

    orderBy: { createdAt: "desc" },
  })

  res.json(comments)
})

router.post("/:id/comments", requireAuth, async (req, res) => {
  const text = typeof req.body?.body === "string" ? req.body.body.trim() : ""
  const rating = req.body?.rating == null ? null : Number(req.body.rating)

  if (!text) {
    return res.status(400).json({ error: "Komentar tidak boleh kosong." })
  }

  if (text.length > 2000) {
    return res.status(400).json({ error: "Komentar maksimal 2000 karakter." })
  }

  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return res.status(400).json({ error: "Rating harus antara 1 sampai 5." })
  }

  const exists = await prisma.place.findUnique({
    where: { id: req.params.id },

    select: { id: true },
  })

  if (!exists) {
    return res.status(404).json({ error: "Tempat tidak ditemukan." })
  }

  const existingComment = await prisma.comment.findFirst({
    where: { placeId: req.params.id, userId: req.userId },
    orderBy: { createdAt: "asc" },
  })
  const comment = existingComment
    ? await prisma.comment.update({
        where: { id: existingComment.id },
        data: { body: text },
        include: { user: { select: { id: true, name: true, image: true } } },
      })
    : await prisma.comment.create({
        data: { body: text, placeId: req.params.id, userId: req.userId },
        include: { user: { select: { id: true, name: true, image: true } } },
      })

  if (rating !== null) {
    const existingRating = await prisma.rating.findFirst({
      where: { userId: req.userId, placeId: req.params.id },
    })
    if (existingRating) {
      await prisma.rating.update({
        where: { id: existingRating.id },
        data: { value: rating },
      })
    } else {
      await prisma.rating.create({
        data: { userId: req.userId, placeId: req.params.id, value: rating },
      })
    }
  }

  res.status(existingComment ? 200 : 201).json({ ...comment, rating })
})

router.delete("/:id/comments/:commentId", requireAuth, async (req, res) => {
  const comment = await prisma.comment.findUnique({
    where: { id: req.params.commentId },

    select: { id: true, userId: true, placeId: true },
  })

  if (!comment || comment.placeId !== req.params.id) {
    return res.status(404).json({ error: "Komentar tidak ditemukan." })
  }

  if (comment.userId !== req.userId) {
    return res.status(403).json({ error: "Kamu bukan pemilik komentar ini." })
  }

  await prisma.comment.delete({ where: { id: req.params.commentId } })
  await prisma.rating.deleteMany({
    where: { placeId: req.params.id, userId: req.userId },
  })

  res.json({ ok: true })
})

// ─── ORDERS ─────────────────────────────────────────────────────────────────

router.post("/:id/orders", requireAuth, async (req, res) => {
  const items = req.body?.items

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Order minimal berisi satu item." })
  }

  const exists = await prisma.place.findUnique({
    where: { id: req.params.id },

    select: { id: true },
  })

  if (!exists) {
    return res.status(404).json({ error: "Tempat tidak ditemukan." })
  }

  const requested = items.map((item) => ({
    menuItemId: String(item.menuItemId ?? ""),

    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
  }))

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: requested.map((r) => r.menuItemId) },

      placeId: req.params.id,

      isAvailable: true,
    },
  })

  if (menuItems.length !== requested.length) {
    return res.status(400).json({ error: "Beberapa item tidak tersedia." })
  }

  const total = requested.reduce((sum, r) => {
    const item = menuItems.find((m) => m.id === r.menuItemId)

    return sum + (item ? item.price * r.quantity : 0)
  }, 0)

  const order = await prisma.order.create({
    data: {
      userId: req.userId,

      placeId: req.params.id,

      total,

      items: {
        create: requested.map((r) => {
          const item = menuItems.find((m) => m.id === r.menuItemId)

          return {
            menuItemId: r.menuItemId,

            quantity: r.quantity,

            price: item.price,
          }
        }),
      },
    },

    include: {
      items: { include: { menuItem: true } },

      place: { select: { id: true, name: true } },
    },
  })

  res.status(201).json(order)
})

// ─── RESERVATIONS ───────────────────────────────────────────────────────────

router.post("/:id/reservations", requireAuth, async (req, res) => {
  const body = req.body || {}

  const date = new Date(body.date)

  const partySize = Number(body.partySize)

  const note = typeof body.note === "string" ? body.note.trim() : ""

  if (isNaN(date.getTime())) {
    return res.status(400).json({ error: "Tanggal reservasi tidak valid." })
  }

  if (date.getTime() <= Date.now()) {
    return res
      .status(400)
      .json({ error: "Tanggal reservasi harus di masa depan." })
  }

  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 50) {
    return res
      .status(400)
      .json({ error: "Jumlah orang harus antara 1 sampai 50." })
  }

  const exists = await prisma.place.findUnique({
    where: { id: req.params.id },

    select: { id: true },
  })

  if (!exists) {
    return res.status(404).json({ error: "Tempat tidak ditemukan." })
  }

  const reservation = await prisma.reservation.create({
    data: {
      userId: req.userId,

      placeId: req.params.id,

      date,

      partySize,

      note: note || null,
    },

    include: { place: { select: { id: true, name: true } } },
  })

  res.status(201).json(reservation)
})

export default router
