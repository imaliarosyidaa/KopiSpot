import { Router } from "express"

import { prisma } from "../db.js"

import { compare, hash, requireAuth } from "../auth.js"

const router = Router()

function parseJsonList(value) {
  try {
    const parsed = JSON.parse(value || "[]")

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function serializePost(post) {
  const { tagsJson, imagesJson, ...rest } = post

  return {
    ...rest,

    tags: parseJsonList(tagsJson),

    images: parseJsonList(imagesJson),

    likesCount: post._count?.likes ?? 0,

    commentsCount: post._count?.comments ?? 0,

    savesCount: post._count?.saves ?? 0,
  }
}

// ─── PROFILE SAYA ───────────────────────────────────────────────────────────

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },

    include: {
      _count: {
        select: {
          posts: true,
          ratings: true,
          comments: true,
          savedPosts: true,
        },
      },

      achievements: {
        include: { badge: true },

        orderBy: { earnedAt: "desc" },
      },

      posts: {
        include: {
          author: {
            select: { id: true, name: true, username: true, image: true, xp: true, level: true },
          },

          place: {
            select: { id: true, name: true, city: true, imageUrl: true },
          },

          _count: { select: { likes: true, comments: true, saves: true } },
        },

        orderBy: { createdAt: "desc" },
      },

      savedPosts: {
        include: {
          post: {
            include: {
              author: {
                select: { id: true, name: true, username: true, image: true },
              },

              place: {
                select: { id: true, name: true, city: true, imageUrl: true },
              },

              _count: { select: { likes: true, comments: true, saves: true } },
            },
          },
        },

        orderBy: { createdAt: "desc" },
      },

      ratings: {
        include: {
          place: {
            select: { id: true, name: true, city: true, imageUrl: true },
          },
        },

        orderBy: { createdAt: "desc" },
      },

      comments: {
        include: {
          place: {
            select: { id: true, name: true, city: true, imageUrl: true },
          },
        },

        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!user) {
    return res.status(404).json({ error: "User tidak ditemukan." })
  }

  const { password, ...safeUser } = user

  res.json({
    ...safeUser,

    badges: user.achievements.map((a) => a.badge),

    stats: {
      posts: user._count.posts,

      ratings: user._count.ratings,

      reviews: user._count.comments,

      saved: user._count.savedPosts,
    },

    savedPosts: user.savedPosts.map((s) => ({
      savedAt: s.createdAt,
      post: serializePost(s.post),
    })),

    posts: user.posts.map(serializePost),
  })
})

// ─── EDIT PROFIL ────────────────────────────────────────────────────────────

router.put("/me", requireAuth, async (req, res) => {
  const body = req.body || {}

  const data = {}

  if (typeof body.name === "string") {
    const name = body.name.trim()

    if (!name)
      return res.status(400).json({ error: "Nama tidak boleh kosong." })

    data.name = name
  }

  if (body.username !== undefined) {
    const username =
      typeof body.username === "string" ? body.username.trim() : ""

    if (username) {
      const clash = await prisma.user.findUnique({ where: { username } })

      if (clash && clash.id !== req.userId) {
        return res.status(409).json({ error: "Username sudah dipakai." })
      }

      data.username = username
    } else {
      data.username = null
    }
  }

  if (typeof body.bio === "string")
    data.bio = body.bio.trim().slice(0, 500) || null

  if (typeof body.image === "string") data.image = body.image.trim() || null

  const user = await prisma.user.update({
    where: { id: req.userId },

    data,

    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      image: true,
      xp: true,
      level: true,
    },
  })

  res.json(user)
})

// ─── GANTI PASSWORD ─────────────────────────────────────────────────────────

router.put("/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {}

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Password lama dan baru wajib diisi." })
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: "Password baru minimal 6 karakter." })
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },

    select: { password: true },
  })

  if (!(await compare(String(currentPassword), user.password))) {
    return res.status(401).json({ error: "Password lama salah." })
  }

  await prisma.user.update({
    where: { id: req.userId },

    data: { password: await hash(String(newPassword), 10) },
  })

  res.json({ ok: true })
})

// ─── LEADERBOARD ────────────────────────────────────────────────────────────

router.get("/leaderboard", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,

      name: true,

      username: true,

      image: true,

      xp: true,

      level: true,

      _count: { select: { posts: true, ratings: true, comments: true } },

      achievements: { include: { badge: true } },
    },

    orderBy: [{ xp: "desc" }, { level: "desc" }],

    take: 50,
  })

  res.json(
    users.map((u, index) => ({
      rank: index + 1,

      id: u.id,

      name: u.name,

      username: u.username,

      image: u.image,

      xp: u.xp,

      level: u.level,

      stats: {
        posts: u._count.posts,
        ratings: u._count.ratings,
        reviews: u._count.comments,
      },

      badges: u.achievements.map((a) => a.badge),
    })),
  )
})

export default router
