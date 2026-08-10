import { Router } from "express"
import { prisma } from "../db.js"

const router = Router()

// GET /api/menus?placeId=... — daftar menu tersedia dari berbagai kafe
router.get("/", async (req, res) => {
  const { placeId } = req.query

  const where = { isAvailable: true }
  if (typeof placeId === "string" && placeId.trim()) {
    where.placeId = placeId.trim()
  }

  const menus = await prisma.menuItem.findMany({
    where,
    include: {
      place: {
        select: {
          id: true,
          name: true,
          city: true,
          _count: { select: { views: true } },
        },
      },
    },
  })

  // Menu kopi yang paling ramai dilihat tampil lebih dulu (trending).
  menus.sort(
    (a, b) =>
      b.place._count.views - a.place._count.views ||
      a.place.name.localeCompare(b.place.name),
  )

  res.json(menus)
})

export default router
