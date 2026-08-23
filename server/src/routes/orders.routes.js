import { Router } from "express"
import crypto from "node:crypto"
import { prisma } from "../db.js"
import { optionalAuth, requireAuth } from "../auth.js"
import { notifyOrderCreated, notifyPaymentSuccess, notifyOrderStatus, safe } from "../notifications.js"

const router = Router()

const ORDER_INCLUDE = {
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
  place: { select: { id: true, name: true, city: true, imageUrl: true } },
}

// GET /api/orders — riwayat pesanan (login -> userId, tamu -> guestToken)
// Identitas TIDAK boleh dicampur dalam satu query (spec: tidak ada OR userId|guestToken).
router.get("/", optionalAuth, async (req, res) => {
  if (req.userId) {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
    })
    return res.json(orders)
  }

  const guestTokensRaw = req.query.guestTokens
  const guestTokens =
    typeof guestTokensRaw === "string" && guestTokensRaw
      ? guestTokensRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : []
  if (guestTokens.length === 0) {
    return res.json([])
  }

  const orders = await prisma.order.findMany({
    where: { guestToken: { in: guestTokens } },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  })
  res.json(orders)
})

// GET /api/orders/ratings — kafe yang sudah dinilai oleh pengguna
router.get("/ratings", requireAuth, async (req, res) => {
  const ratings = await prisma.rating.findMany({
    where: { userId: req.userId },
    select: { orderId: true },
  })
  res.json(ratings.map((rating) => rating.orderId).filter(Boolean))
})

// GET /api/orders/:id — detail pesanan (pemilik via userId ATAU guestToken, tidak keduanya)
router.get("/:id", optionalAuth, async (req, res) => {
  const guestToken =
    typeof req.query.guestToken === "string" ? req.query.guestToken.trim() : ""
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: ORDER_INCLUDE,
  })
  if (!order) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan." })
  }
  const ownsOrder =
    order.userId === req.userId ||
    (order.guestToken != null && order.guestToken === guestToken)
  if (!ownsOrder) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan." })
  }
  res.json(order)
})

// POST /api/orders — buat pesanan (checkout) dari keranjang
router.post("/", optionalAuth, async (req, res) => {
  const body = req.body || {}
  const placeId = typeof body.placeId === "string" ? body.placeId : ""
  const items = Array.isArray(body.items) ? body.items : []
  const note = typeof body.note === "string" ? body.note.trim() : ""
  const billingAddress =
    typeof body.billingAddress === "string" ? body.billingAddress.trim() : ""
  const couponCode =
    typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : ""
  const checkoutSessionId =
    typeof body.checkoutSessionId === "string" ? body.checkoutSessionId.trim() : ""
  const shippingFee = Math.max(0, Math.floor(Number(body.shippingFee) || 0))
  const providedGuestToken =
    typeof body.guestToken === "string" ? body.guestToken.trim() : ""
  const guestToken = req.userId
    ? null
    : providedGuestToken || crypto.randomBytes(32).toString("hex")

  if (!placeId) {
    return res.status(400).json({ error: "Kafe wajib dipilih." })
  }
  if (items.length === 0) {
    return res.status(400).json({ error: "Pesanan minimal berisi satu menu." })
  }
  if (!checkoutSessionId || checkoutSessionId.length > 100) {
    return res.status(400).json({ error: "Checkout session wajib diisi." })
  }
  if (note.length > 500) {
    return res.status(400).json({ error: "Catatan maksimal 500 karakter." })
  }
  if (billingAddress.length > 1000) {
    return res
      .status(400)
      .json({ error: "Alamat penagihan maksimal 1000 karakter." })
  }

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { id: true },
  })
  if (!place) {
    return res.status(404).json({ error: "Kafe tidak ditemukan." })
  }

  const existingOrder = await prisma.order.findUnique({
    where: { checkoutSessionId },
    include: ORDER_INCLUDE,
  })
  if (existingOrder) {
    if ((existingOrder.userId ?? null) !== (req.userId ?? null)) {
      return res.status(409).json({ error: "Checkout session sudah digunakan." })
    }
    return res.status(200).json({ ...existingOrder, guestToken: existingOrder.guestToken })
  }

  const requested = items.map((item) => ({
    menuItemId: String(item?.menuItemId ?? ""),
    quantity: Math.max(1, Math.floor(Number(item?.quantity) || 1)),
  }))

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: requested.map((r) => r.menuItemId) },
      placeId,
      isAvailable: true,
    },
  })

  if (menuItems.length !== requested.length) {
    return res.status(400).json({ error: "Beberapa menu tidak tersedia." })
  }

  const subtotal = requested.reduce((sum, r) => {
    const item = menuItems.find((m) => m.id === r.menuItemId)
    return sum + (item ? item.price * r.quantity : 0)
  }, 0)
  const total =
    couponCode === "KOPI10"
      ? Math.max(1000, Math.round(subtotal * 0.9) + shippingFee)
      : subtotal + shippingFee

  let order
  try {
    order = await prisma.order.create({
      data: {
        userId: req.userId ?? null,
        placeId,
        guestToken,
        checkoutSessionId,
        total,
        note: note || null,
        billingAddress: billingAddress || null,
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
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
      include: ORDER_INCLUDE,
    })
  } catch (error) {
    if (error?.code !== "P2002") throw error
    order = await prisma.order.findUnique({
      where: { checkoutSessionId },
      include: ORDER_INCLUDE,
    })
    if (!order || (order.userId ?? null) !== (req.userId ?? null)) {
      return res.status(409).json({ error: "Checkout session sudah digunakan." })
    }
  }

  res.status(201).json({ ...order, guestToken })
  void safe(notifyOrderCreated(order))
})

// PUT /api/orders/:id/pay — konfirmasi pembayaran pesanan
router.put("/:id/pay", optionalAuth, async (req, res) => {
  const method =
    typeof req.body?.method === "string" ? req.body.method.trim() : ""
  const proofUrl =
    typeof req.body?.proofUrl === "string" && req.body.proofUrl.trim()
      ? req.body.proofUrl.trim()
      : null
  const guestToken =
    typeof req.body?.guestToken === "string" ? req.body.guestToken.trim() : ""
  if (!method) {
    return res.status(400).json({ error: "Pilih metode pembayaran." })
  }

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { id: true, userId: true, guestToken: true, paymentStatus: true },
  })
  const ownsOrder = order && (order.userId === req.userId || order.guestToken === guestToken)
  if (!ownsOrder) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan." })
  }
  if (order.paymentStatus === "PAID") {
    return res.status(400).json({ error: "Pesanan sudah dibayar." })
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      paymentMethod: method,
      paymentProofUrl: proofUrl,
      paymentStatus: "PAID",
      status: "PACKED",
    },
    include: ORDER_INCLUDE,
  })

  void safe(notifyPaymentSuccess(updated))
  void safe(notifyOrderStatus(updated, "PACKED"))
  res.json(updated)
})

// DELETE /api/orders/:id — hapus pesanan yang belum dibayar dari keranjang
router.delete("/:id", requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { id: true, userId: true, paymentStatus: true },
  })
  if (!order || order.userId !== req.userId) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan." })
  }
  if (order.paymentStatus === "PAID") {
    return res
      .status(400)
      .json({ error: "Pesanan sudah dibayar, tidak bisa dihapus." })
  }
  await prisma.order.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

export default router
