import { Router } from "express"
import { OrderStatus, PlaceCategory, Role } from "@prisma/client"
import { prisma } from "../db.js"
import { requireAuth } from "../auth.js"
import { parseTags } from "../serialize.js"

const router = Router()

const VALID_CATEGORIES = Object.values(PlaceCategory)
const VALID_ORDER_STATUSES = Object.values(OrderStatus)
const MENU_CATEGORIES = ["coffee", "non-coffee", "food", "dessert"]
const NEXT_ORDER_STATUS = {
  PACKED: "SHIPPED",
  SHIPPED: "COMPLETED",
}

const MENU_INCLUDE_PLACE = {
  place: { select: { id: true, name: true, authorId: true } },
}

async function requireOwnedPlace(req, res) {
  const place = await prisma.place.findUnique({
    where: { id: req.params.placeId },
    select: { id: true, authorId: true },
  })
  if (!place) {
    res.status(404).json({ error: "Usaha tidak ditemukan." })
    return null
  }
  if (place.authorId !== req.userId) {
    res.status(403).json({ error: "Kamu bukan pemilik usaha ini." })
    return null
  }
  return place
}

function validateMenuBody(body) {
  const errors = []
  if (typeof body?.name !== "string" || !body.name.trim()) {
    errors.push("Nama menu wajib diisi.")
  }
  if (!Number.isInteger(Number(body?.price)) || Number(body.price) < 0) {
    errors.push("Harga harus berupa angka dan tidak negatif.")
  }
  if (!MENU_CATEGORIES.includes(body?.category)) {
    errors.push("Kategori menu tidak valid.")
  }
  return errors
}

// ─── DAFTARKAN MITRA ────────────────────────────────────────────────────────
router.post("/register", requireAuth, async (req, res) => {
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
  if (!body.name.trim() || body.name.trim().length > 120) {
    return res.status(400).json({ error: "Nama usaha maksimal 120 karakter." })
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t) => typeof t === "string").slice(0, 10)
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

  await prisma.user.update({
    where: { id: req.userId },
    data: { role: Role.BUSINESS_OWNER },
  })

  res.status(201).json({ place: { ...place, tags }, role: Role.BUSINESS_OWNER })
})

// ─── DAFTAR USAHA MILIK USER ────────────────────────────────────────────────
router.get("/places", requireAuth, async (req, res) => {
  const places = await prisma.place.findMany({
    where: { authorId: req.userId },
    include: {
      _count: { select: { orders: true, menuItems: true, ratings: true } },
      ratings: { select: { value: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  res.json(
    places.map((p) => {
      const { tagsJson, ratings, ...rest } = p
      const values = ratings.map((r) => r.value)
      return {
        ...rest,
        tags: parseTags(p),
        avgRating: values.length
          ? values.reduce((s, v) => s + v, 0) / values.length
          : 0,
      }
    }),
  )
})

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
router.get("/dashboard/:placeId", requireAuth, async (req, res) => {
  const owned = await requireOwnedPlace(req, res)
  if (!owned) return

  const placeId = owned.id

  const [
    totalOrders,
    revenueAgg,
    statusGroups,
    bestSellerGroups,
    recentOrders,
    ratingAgg,
    recentReviews,
    menuCount,
  ] = await Promise.all([
    prisma.order.count({ where: { placeId } }),
    prisma.order.aggregate({
      where: { placeId, paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { placeId },
      _count: { status: true },
    }),
    prisma.orderItem.groupBy({
      by: ["menuItemId"],
      where: { order: { placeId } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 6,
    }),
    prisma.order.findMany({
      where: { placeId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { id: true, name: true, image: true } },
        items: { include: { menuItem: { select: { id: true, name: true } } } },
      },
    }),
    prisma.rating.aggregate({
      where: { placeId },
      _avg: { value: true },
      _count: { value: true },
    }),
    prisma.comment.findMany({
      where: { placeId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { id: true, name: true, image: true } } },
    }),
    prisma.menuItem.count({ where: { placeId } }),
  ])

  const ids = bestSellerGroups.map((g) => g.menuItemId)
  const menuNames = await prisma.menuItem.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  })
  const nameMap = new Map(menuNames.map((m) => [m.id, m.name]))

  const statusCounts = Object.fromEntries(
    VALID_ORDER_STATUSES.map((s) => [s, 0]),
  )
  for (const g of statusGroups) statusCounts[g.status] = g._count.status

  res.json({
    totalOrders,
    totalRevenue: revenueAgg._sum.total ?? 0,
    statusCounts,
    bestSellers: bestSellerGroups.map((g) => ({
      menuItemId: g.menuItemId,
      name: nameMap.get(g.menuItemId) ?? "Menu dihapus",
      quantity: g._sum.quantity ?? 0,
    })),
    recentOrders,
    avgRating: ratingAgg._avg.value ?? 0,
    ratingCount: ratingAgg._count.value ?? 0,
    recentReviews,
    menuCount,
  })
})

// ─── CRUD MENU ──────────────────────────────────────────────────────────────
router.get("/places/:placeId/menus", requireAuth, async (req, res) => {
  const owned = await requireOwnedPlace(req, res)
  if (!owned) return
  const menus = await prisma.menuItem.findMany({
    where: { placeId: owned.id },
    orderBy: [{ isAvailable: "desc" }, { category: "asc" }],
  })
  res.json(menus)
})

router.post("/places/:placeId/menus", requireAuth, async (req, res) => {
  const owned = await requireOwnedPlace(req, res)
  if (!owned) return
  const errors = validateMenuBody(req.body)
  if (errors.length) {
    return res.status(400).json({ error: errors.join(" ") })
  }

  const menu = await prisma.menuItem.create({
    data: {
      placeId: owned.id,
      name: req.body.name.trim(),
      price: Number(req.body.price),
      category: req.body.category,
      description:
        typeof req.body.description === "string" && req.body.description.trim()
          ? req.body.description.trim()
          : null,
      calories: Number.isInteger(Number(req.body.calories))
        ? Number(req.body.calories)
        : null,
      sugar: Number.isInteger(Number(req.body.sugar))
        ? Number(req.body.sugar)
        : null,
      ingredients:
        typeof req.body.ingredients === "string" && req.body.ingredients.trim()
          ? req.body.ingredients.trim()
          : null,
      imageUrl:
        typeof req.body.imageUrl === "string" && req.body.imageUrl.trim()
          ? req.body.imageUrl.trim()
          : null,
      isAvailable: req.body.isAvailable !== false,
    },
  })

  res.status(201).json(menu)
})

router.put("/places/:placeId/menus/:menuId", requireAuth, async (req, res) => {
  const owned = await requireOwnedPlace(req, res)
  if (!owned) return

  const existing = await prisma.menuItem.findUnique({
    where: { id: req.params.menuId },
    select: { id: true, placeId: true },
  })
  if (!existing || existing.placeId !== owned.id) {
    return res.status(404).json({ error: "Menu tidak ditemukan." })
  }

  const errors = validateMenuBody(req.body)
  if (errors.length) {
    return res.status(400).json({ error: errors.join(" ") })
  }

  const menu = await prisma.menuItem.update({
    where: { id: existing.id },
    data: {
      name: req.body.name.trim(),
      price: Number(req.body.price),
      category: req.body.category,
      description:
        typeof req.body.description === "string" && req.body.description.trim()
          ? req.body.description.trim()
          : null,
      calories: Number.isInteger(Number(req.body.calories))
        ? Number(req.body.calories)
        : null,
      sugar: Number.isInteger(Number(req.body.sugar))
        ? Number(req.body.sugar)
        : null,
      ingredients:
        typeof req.body.ingredients === "string" && req.body.ingredients.trim()
          ? req.body.ingredients.trim()
          : null,
      imageUrl:
        typeof req.body.imageUrl === "string" && req.body.imageUrl.trim()
          ? req.body.imageUrl.trim()
          : null,
      isAvailable: req.body.isAvailable !== false,
    },
  })

  res.json(menu)
})

router.delete(
  "/places/:placeId/menus/:menuId",
  requireAuth,
  async (req, res) => {
    const owned = await requireOwnedPlace(req, res)
    if (!owned) return

    const existing = await prisma.menuItem.findUnique({
      where: { id: req.params.menuId },
      select: { id: true, placeId: true },
    })
    if (!existing || existing.placeId !== owned.id) {
      return res.status(404).json({ error: "Menu tidak ditemukan." })
    }

    await prisma.menuItem.delete({ where: { id: existing.id } })
    res.json({ ok: true })
  },
)

// ─── PESANAN MITRA ──────────────────────────────────────────────────────────
router.get("/places/:placeId/orders", requireAuth, async (req, res) => {
  const owned = await requireOwnedPlace(req, res)
  if (!owned) return

  const orders = await prisma.order.findMany({
    where: { placeId: owned.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, image: true } },
      items: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              price: true,
              category: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  })
  res.json(orders)
})

router.put(
  "/places/:placeId/orders/:orderId/status",
  requireAuth,
  async (req, res) => {
    const owned = await requireOwnedPlace(req, res)
    if (!owned) return

    const status = String(req.body?.status ?? "").trim()
    if (!VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Status pesanan tidak valid." })
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      select: { id: true, placeId: true, status: true, paymentStatus: true },
    })
    if (!order || order.placeId !== owned.id) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." })
    }
    if (
      order.paymentStatus !== "PAID" &&
      ["PACKED", "SHIPPED", "COMPLETED"].includes(status)
    ) {
      return res.status(409).json({
        error: "Pesanan belum dibayar melalui Midtrans.",
      })
    }
    if (status !== "CANCELLED" && NEXT_ORDER_STATUS[order.status] !== status) {
      return res.status(409).json({ error: "Urutan status pesanan tidak valid." })
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, image: true } },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                category: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    })
    res.json(updated)
  },
)

export default router
