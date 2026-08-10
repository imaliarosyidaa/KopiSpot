import { Router } from "express"
import { prisma } from "../db.js"
import { compare, hash, requireAuth, signToken } from "../auth.js"

const router = Router()

router.post("/register", async (req, res) => {
  const { name, email, password, username } = req.body || {}

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Nama, email, dan password wajib diisi." })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: "Format email tidak valid." })
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password minimal 6 karakter." })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })
  if (existing) {
    return res.status(409).json({ error: "Email sudah terdaftar." })
  }

  let normalizedUsername = typeof username === "string" ? username.trim() : ""
  if (normalizedUsername) {
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(normalizedUsername)) {
      return res
        .status(400)
        .json({ error: "Username 3-20 karakter (huruf, angka, _ atau .)." })
    }
    const clash = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    })
    if (clash) {
      return res.status(409).json({ error: "Username sudah dipakai." })
    }
  }

  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: normalizedEmail,
      password: await hash(String(password), 10),
      username: normalizedUsername || null,
    },
  })

  const token = signToken({ sub: user.id, email: user.email })
  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image,
      role: user.role,
      xp: user.xp,
      level: user.level,
    },
  })
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." })
  }

  const user = await prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() },
  })

  if (!user || !(await compare(String(password), user.password))) {
    return res.status(401).json({ error: "Email atau password salah." })
  }

  const token = signToken({ sub: user.id, email: user.email })
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image,
      role: user.role,
      xp: user.xp,
      level: user.level,
    },
  })
})

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: {
      places: { orderBy: { createdAt: "desc" } },
      ratings: { include: { place: true }, orderBy: { createdAt: "desc" } },
      orders: { include: { place: true }, orderBy: { createdAt: "desc" } },
      reservations: {
        include: { place: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!user) {
    return res.status(404).json({ error: "User tidak ditemukan." })
  }

  const { password, ...rest } = user
  res.json(rest)
})

export default router
