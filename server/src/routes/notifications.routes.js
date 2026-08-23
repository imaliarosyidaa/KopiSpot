import { Router } from "express"
import { prisma } from "../db.js"
import { optionalAuth } from "../auth.js"

const router = Router()

// Owner is resolved from auth (userId) OR explicit guestToken — never both.
function ownership(req) {
  if (req.userId) return { userId: req.userId }
  const guestToken =
    typeof req.query.guestToken === "string" ? req.query.guestToken.trim() : ""
  return guestToken ? { guestToken } : null
}

function owns(notif, owner) {
  if (!owner) return false
  if (owner.userId) return notif.userId === owner.userId
  return notif.guestToken === owner.guestToken
}

// GET /api/notifications/unread-count
router.get("/unread-count", optionalAuth, async (req, res) => {
  const owner = ownership(req)
  if (!owner) return res.json({ count: 0 })
  const count = await prisma.notification.count({
    where: { ...owner, isRead: false },
  })
  res.json({ count })
})

// GET /api/notifications
router.get("/", optionalAuth, async (req, res) => {
  const owner = ownership(req)
  if (!owner) return res.json([])
  const list = await prisma.notification.findMany({
    where: owner,
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  res.json(list)
})

// PATCH /api/notifications/:id/read
router.patch("/:id/read", optionalAuth, async (req, res) => {
  const owner = ownership(req)
  if (!owner) return res.status(401).json({ error: "Identitas tidak valid." })
  const notif = await prisma.notification.findUnique({ where: { id: req.params.id } })
  if (!notif || !owns(notif, owner)) {
    return res.status(404).json({ error: "Notifikasi tidak ditemukan." })
  }
  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  })
  res.json(updated)
})

// PATCH /api/notifications/read-all
router.patch("/read-all", optionalAuth, async (req, res) => {
  const owner = ownership(req)
  if (!owner) return res.status(401).json({ error: "Identitas tidak valid." })
  await prisma.notification.updateMany({
    where: { ...owner, isRead: false },
    data: { isRead: true },
  })
  res.json({ ok: true })
})

export default router
