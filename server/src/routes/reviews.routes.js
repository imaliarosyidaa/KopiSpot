import { Router } from "express"
import { prisma } from "../db.js"
import { optionalAuth } from "../auth.js"

const router = Router()

const MAX_IMAGES = 5
const MAX_COMMENT = 2000

const REVIEW_MENU_ITEM_SELECT = {
  id: true,
  name: true,
  price: true,
  category: true,
  imageUrl: true,
}

const REVIEW_INCLUDE = {
  orderItem: {
    select: {
      id: true,
      quantity: true,
      price: true,
      menuItem: { select: REVIEW_MENU_ITEM_SELECT },
    },
  },
  order: {
    select: {
      id: true,
      createdAt: true,
      place: { select: { id: true, name: true } },
    },
  },
}

function safeParseImages(json) {
  try {
    const parsed = JSON.parse(json || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeImages(input) {
  if (!Array.isArray(input)) return []
  return input
    .filter((x) => typeof x === "string" && x.trim())
    .map((x) => x.trim())
    .slice(0, MAX_IMAGES)
}

function serializeReview(r) {
  return {
    id: r.id,
    userId: r.userId,
    orderId: r.orderId,
    orderItemId: r.orderItemId,
    menuItemId: r.menuItemId,
    placeId: r.placeId,
    rating: r.rating,
    comment: r.comment,
    images: safeParseImages(r.imagesJson),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    orderItem: r.orderItem,
    order: r.order,
  }
}

async function attachProductRating(menuItems) {
  if (!menuItems.length) return
  const ids = menuItems.map((m) => m.id)
  const agg = await prisma.productReview.groupBy({
    by: ["menuItemId"],
    where: { menuItemId: { in: ids } },
    _avg: { rating: true },
    _count: { _all: true },
  })
  const map = new Map(
    agg.map((a) => [a.menuItemId, { avgRating: a._avg.rating ?? 0, ratingCount: a._count._all }]),
  )
  menuItems.forEach((m) => {
    const r = map.get(m.id)
    m.avgRating = r ? r.avgRating : 0
    m.ratingCount = r ? r.ratingCount : 0
  })
}

// GET /api/reviews/pending — produk dari pesanan COMPLETED milik user/guest yang belum dinilai
router.get("/pending", optionalAuth, async (req, res) => {
  const guestToken =
    typeof req.query.guestToken === "string" ? req.query.guestToken.trim() : ""
  const ownership = req.userId
    ? { userId: req.userId }
    : guestToken
      ? { guestToken }
      : null
  if (!ownership) return res.json([])

  const orders = await prisma.order.findMany({
    where: { ...ownership, status: "COMPLETED" },
    include: {
      place: { select: { id: true, name: true } },
      items: {
        include: {
          menuItem: { select: REVIEW_MENU_ITEM_SELECT },
          productReview: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const pending = []
  const menuItemsToRate = []
  for (const order of orders) {
    for (const item of order.items) {
      if (item.productReview) continue // sudah pernah dinilai
      menuItemsToRate.push(item.menuItem)
      pending.push({
        orderItem: {
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          menuItem: item.menuItem,
        },
        order: {
          id: order.id,
          createdAt: order.createdAt,
          place: order.place,
        },
      })
    }
  }
  await attachProductRating(menuItemsToRate)
  res.json(pending)
})

// GET /api/reviews/mine — seluruh ulasan milik user/guest
router.get("/mine", optionalAuth, async (req, res) => {
  const guestToken =
    typeof req.query.guestToken === "string" ? req.query.guestToken.trim() : ""
  const ownership = req.userId
    ? { userId: req.userId }
    : guestToken
      ? { guestToken }
      : null
  if (!ownership) return res.json([])

  const reviews = await prisma.productReview.findMany({
    where: ownership,
    include: REVIEW_INCLUDE,
    orderBy: { createdAt: "desc" },
  })
  const menuItems = reviews.map((r) => r.orderItem.menuItem)
  await attachProductRating(menuItems)
  res.json(reviews.map(serializeReview))
})

// POST /api/reviews — buat ulasan (validasi kepemilikan & status COMPLETED)
router.post("/", optionalAuth, async (req, res) => {
  const body = req.body || {}
  const orderItemId = typeof body.orderItemId === "string" ? body.orderItemId.trim() : ""
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : ""
  const guestToken =
    typeof body.guestToken === "string" ? body.guestToken.trim() : ""
  const rating = Math.floor(Number(body.rating))
  const comment =
    typeof body.comment === "string" ? body.comment.trim().slice(0, MAX_COMMENT) : null
  const images = normalizeImages(body.images)

  if (!orderItemId || !orderId) {
    return res.status(400).json({ error: "Data pesanan tidak lengkap." })
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Pilih rating 1–5 bintang." })
  }

  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: { select: { id: true, userId: true, guestToken: true, status: true, placeId: true } },
      menuItem: { select: REVIEW_MENU_ITEM_SELECT },
    },
  })
  if (!orderItem) {
    return res.status(404).json({ error: "Item pesanan tidak ditemukan." })
  }
  const ownsOrder =
    orderItem.order.userId === req.userId ||
    (orderItem.order.guestToken != null && orderItem.order.guestToken === guestToken)
  if (!ownsOrder) {
    return res.status(403).json({ error: "Pesanan bukan milik Anda." })
  }
  if (orderItem.order.status !== "COMPLETED") {
    return res.status(403).json({ error: "Pesanan belum selesai, belum bisa dinilai." })
  }
  if (orderItem.orderId !== orderId) {
    return res.status(400).json({ error: "Pesanan tidak cocok dengan item." })
  }

  const existing = await prisma.productReview.findUnique({ where: { orderItemId } })
  if (existing) {
    return res.status(409).json({ error: "Produk ini sudah pernah dinilai." })
  }

  try {
    const review = await prisma.productReview.create({
      data: {
        userId: req.userId ?? null,
        guestToken: req.userId ? null : guestToken || null,
        orderId,
        orderItemId,
        menuItemId: orderItem.menuItemId,
        placeId: orderItem.order.placeId,
        rating,
        comment,
        imagesJson: JSON.stringify(images),
      },
      include: REVIEW_INCLUDE,
    })
    res.status(201).json(serializeReview(review))
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Produk ini sudah pernah dinilai." })
    }
    throw err
  }
})

// PUT /api/reviews/:id — edit ulasan milik sendiri
router.put("/:id", optionalAuth, async (req, res) => {
  const guestToken =
    typeof req.query.guestToken === "string" ? req.query.guestToken.trim() : ""
  const review = await prisma.productReview.findUnique({ where: { id: req.params.id } })
  if (!review) {
    return res.status(404).json({ error: "Ulasan tidak ditemukan." })
  }
  const ownsReview =
    review.userId === req.userId ||
    (review.guestToken != null && review.guestToken === guestToken)
  if (!ownsReview) {
    return res.status(403).json({ error: "Ulasan bukan milik Anda." })
  }

  const body = req.body || {}
  const rating =
    body.rating !== undefined ? Math.floor(Number(body.rating)) : review.rating
  const comment =
    body.comment !== undefined
      ? typeof body.comment === "string"
        ? body.comment.trim().slice(0, MAX_COMMENT)
        : null
      : review.comment
  const images =
    body.images !== undefined ? normalizeImages(body.images) : safeParseImages(review.imagesJson)

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Pilih rating 1–5 bintang." })
  }

  const updated = await prisma.productReview.update({
    where: { id: review.id },
    data: { rating, comment, imagesJson: JSON.stringify(images) },
    include: REVIEW_INCLUDE,
  })
  res.json(serializeReview(updated))
})

// DELETE /api/reviews/:id — hapus ulasan milik sendiri
router.delete("/:id", optionalAuth, async (req, res) => {
  const guestToken =
    typeof req.query.guestToken === "string" ? req.query.guestToken.trim() : ""
  const review = await prisma.productReview.findUnique({ where: { id: req.params.id } })
  if (!review) {
    return res.status(404).json({ error: "Ulasan tidak ditemukan." })
  }
  const ownsReview =
    review.userId === req.userId ||
    (review.guestToken != null && review.guestToken === guestToken)
  if (!ownsReview) {
    return res.status(403).json({ error: "Ulasan bukan milik Anda." })
  }
  await prisma.productReview.delete({ where: { id: review.id } })
  res.json({ ok: true })
})

export default router
