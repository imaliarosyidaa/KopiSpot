import { Router } from "express"
import { prisma } from "../db.js"
import { parseTags } from "../serialize.js"

const router = Router()

router.get("/right", async (_req, res) => {
  const [trendingPlaces, topContributors, latestReviews] = await Promise.all([
    prisma.place.findMany({
      include: {
        _count: { select: { views: true, ratings: true, comments: true } },
      },
      orderBy: { views: { _count: "desc" } },
      take: 5,
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        xp: true,
        level: true,
        _count: { select: { posts: true } },
      },
      orderBy: { xp: "desc" },
      take: 5,
    }),
    prisma.comment.findMany({
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        place: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const placesWithStats = trendingPlaces.map((p) => {
    const { tagsJson, _count, ...rest } = p
    return {
      ...rest,
      tags: parseTags(p),
      viewCount: _count.views,
      ratingCount: _count.ratings,
      commentCount: _count.comments,
    }
  })

  const tagsMap = new Map()
  for (const p of trendingPlaces) {
    for (const tag of parseTags(p)) {
      tagsMap.set(tag, (tagsMap.get(tag) ?? 0) + 1)
    }
  }
  const popularTags = Array.from(tagsMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  res.json({
    trendingPlaces: placesWithStats,
    topContributors,
    popularTags,
    latestReviews,
  })
})

export default router
