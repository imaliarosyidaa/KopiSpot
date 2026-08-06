import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, optionalAuth } from "../auth.js";
import { recomputeGamification } from "../gamification.js";

const router = Router();

function parseJsonList(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializePost(post, viewerId = null) {
  const { tagsJson, imagesJson, ...rest } = post;
  return {
    ...rest,
    tags: parseJsonList(tagsJson),
    images: parseJsonList(imagesJson),
    likedByMe: viewerId ? (post.likes ?? []).some((l) => l.userId === viewerId) : false,
    savedByMe: viewerId ? (post.saves ?? []).some((s) => s.userId === viewerId) : false,
    likesCount: post._count?.likes ?? post.likes?.length ?? 0,
    commentsCount: post._count?.comments ?? 0,
    savesCount: post._count?.saves ?? 0,
  };
}

const POST_INCLUDE = (viewerId) => {
  const include = {
    author: { select: { id: true, name: true, username: true, image: true, xp: true, level: true } },
    place: { select: { id: true, name: true, city: true, imageUrl: true } },
    _count: { select: { likes: true, comments: true, saves: true } },
  };
  if (viewerId) {
    include.likes = { where: { userId: viewerId }, select: { userId: true } };
    include.saves = { where: { userId: viewerId }, select: { userId: true } };
  }
  return include;
};

// ─── LIST ────────────────────────────────────────────────────────────────────
router.get("/", optionalAuth, async (req, res) => {
  const { q, category, sort } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  const where = {};
  if (category && category !== "SEMUA") where.category = category;
  if (q) {
    const like = { contains: String(q) };
    where.OR = [
      { caption: like },
      { place: { name: like } },
      { place: { city: like } },
      { author: { name: like } },
    ];
  }

  const orderBy =
    sort === "popular"
      ? [{ likes: { _count: "desc" } }, { createdAt: "desc" }]
      : { createdAt: "desc" };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: POST_INCLUDE(req.userId),
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  res.json({
    data: posts.map((p) => serializePost(p, req.userId)),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// ─── CREATE ─────────────────────────────────────────────────────────────────
router.post("/", requireAuth, async (req, res) => {
  const body = req.body || {};
  const caption = typeof body.caption === "string" ? body.caption.trim() : "";

  if (!caption) {
    return res.status(400).json({ error: "Keterangan postingan wajib diisi." });
  }
  if (caption.length > 2000) {
    return res.status(400).json({ error: "Keterangan maksimal 2000 karakter." });
  }

  let placeId = body.placeId ? String(body.placeId) : null;
  if (placeId) {
    const place = await prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true },
    });
    if (!place) return res.status(400).json({ error: "Kafe terkait tidak ditemukan." });
  }

  const tags = Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === "string") : [];
  const images = Array.isArray(body.images)
    ? body.images.filter((i) => typeof i === "string" && i.trim())
    : [];

  const post = await prisma.post.create({
    data: {
      authorId: req.userId,
      caption,
      placeId,
      category: typeof body.category === "string" && body.category.trim() ? body.category.trim().toUpperCase() : "UMUM",
      tagsJson: JSON.stringify(tags),
      imagesJson: JSON.stringify(images),
    },
    include: POST_INCLUDE(req.userId),
  });

  await recomputeGamification(req.userId);
  res.status(201).json(serializePost(post, req.userId));
});

// ─── DETAIL ─────────────────────────────────────────────────────────────────
router.get("/:id", optionalAuth, async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      ...POST_INCLUDE(req.userId),
      comments: {
        include: { user: { select: { id: true, name: true, username: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) {
    return res.status(404).json({ error: "Postingan tidak ditemukan." });
  }

  res.json(serializePost(post, req.userId));
});

// ─── UPDATE / DELETE (owner) ────────────────────────────────────────────────
router.put("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.post.findUnique({
    where: { id: req.params.id },
    select: { id: true, authorId: true },
  });
  if (!existing) {
    return res.status(404).json({ error: "Postingan tidak ditemukan." });
  }
  if (existing.authorId !== req.userId) {
    return res.status(403).json({ error: "Kamu bukan pemilik postingan ini." });
  }

  const body = req.body || {};
  const data = {};
  if (typeof body.caption === "string" && body.caption.trim()) {
    data.caption = body.caption.trim();
  }
  if (typeof body.category === "string" && body.category.trim()) {
    data.category = body.category.trim().toUpperCase();
  }
  if (body.placeId === null || typeof body.placeId === "string") {
    if (body.placeId) {
      const place = await prisma.place.findUnique({ where: { id: body.placeId }, select: { id: true } });
      if (!place) return res.status(400).json({ error: "Kafe terkait tidak ditemukan." });
      data.placeId = body.placeId;
    } else {
      data.placeId = null;
    }
  }
  if (Array.isArray(body.tags)) data.tagsJson = JSON.stringify(body.tags);
  if (Array.isArray(body.images)) data.imagesJson = JSON.stringify(body.images);

  const post = await prisma.post.update({
    where: { id: req.params.id },
    data,
    include: POST_INCLUDE(req.userId),
  });

  res.json(serializePost(post, req.userId));
});

router.delete("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.post.findUnique({
    where: { id: req.params.id },
    select: { id: true, authorId: true },
  });
  if (!existing) {
    return res.status(404).json({ error: "Postingan tidak ditemukan." });
  }
  if (existing.authorId !== req.userId) {
    return res.status(403).json({ error: "Kamu bukan pemilik postingan ini." });
  }

  await prisma.post.delete({ where: { id: req.params.id } });
  await recomputeGamification(req.userId);
  res.json({ ok: true });
});

// ─── LIKE / SAVE (toggle) ───────────────────────────────────────────────────
router.post("/:id/like", requireAuth, async (req, res) => {
  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId: req.params.id, userId: req.userId } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
  } else {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      select: { id: true, authorId: true },
    });
    if (!post) {
      return res.status(404).json({ error: "Postingan tidak ditemukan." });
    }
    await prisma.postLike.create({ data: { postId: req.params.id, userId: req.userId } });
    await recomputeGamification(post.authorId);
  }

  const likesCount = await prisma.postLike.count({ where: { postId: req.params.id } });
  await recomputeGamification(req.userId);
  res.json({ liked: !existing, likesCount });
});

router.post("/:id/save", requireAuth, async (req, res) => {
  const existing = await prisma.savedPost.findUnique({
    where: { postId_userId: { postId: req.params.id, userId: req.userId } },
  });

  if (existing) {
    await prisma.savedPost.delete({ where: { id: existing.id } });
  } else {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!post) {
      return res.status(404).json({ error: "Postingan tidak ditemukan." });
    }
    await prisma.savedPost.create({ data: { postId: req.params.id, userId: req.userId } });
  }

  const savesCount = await prisma.savedPost.count({ where: { postId: req.params.id } });
  res.json({ saved: !existing, savesCount });
});

// ─── COMMENTS ───────────────────────────────────────────────────────────────
router.get("/:id/comments", async (req, res) => {
  const comments = await prisma.postComment.findMany({
    where: { postId: req.params.id },
    include: { user: { select: { id: true, name: true, username: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(comments);
});

router.post("/:id/comments", requireAuth, async (req, res) => {
  const text = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  if (!text) {
    return res.status(400).json({ error: "Komentar tidak boleh kosong." });
  }
  if (text.length > 2000) {
    return res.status(400).json({ error: "Komentar maksimal 2000 karakter." });
  }

  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    select: { id: true, authorId: true },
  });
  if (!post) {
    return res.status(404).json({ error: "Postingan tidak ditemukan." });
  }

  const comment = await prisma.postComment.create({
    data: { postId: req.params.id, userId: req.userId, body: text },
    include: { user: { select: { id: true, name: true, username: true, image: true } } },
  });

  await recomputeGamification(req.userId);
  await recomputeGamification(post.authorId);
  res.status(201).json(comment);
});

router.delete("/:id/comments/:commentId", requireAuth, async (req, res) => {
  const comment = await prisma.postComment.findUnique({
    where: { id: req.params.commentId },
    select: { id: true, userId: true, postId: true },
  });

  if (!comment || comment.postId !== req.params.id) {
    return res.status(404).json({ error: "Komentar tidak ditemukan." });
  }
  if (comment.userId !== req.userId) {
    return res.status(403).json({ error: "Kamu bukan pemilik komentar ini." });
  }

  await prisma.postComment.delete({ where: { id: req.params.commentId } });
  await recomputeGamification(req.userId);
  res.json({ ok: true });
});

export default router;
