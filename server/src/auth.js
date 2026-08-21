import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const { compare, hash } = bcrypt

const JWT_SECRET = process.env.JWT_SECRET || "Coffidoor-dev-secret-change-me"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: "Silakan login terlebih dahulu." })
  }

  try {
    const payload = verifyToken(token)
    req.userId = payload.sub
    req.userEmail = payload.email
    next()
  } catch {
    return res
      .status(401)
      .json({ error: "Sesi tidak valid, silakan login ulang." })
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null

  if (token) {
    try {
      const payload = verifyToken(token)
      req.userId = payload.sub
      req.userEmail = payload.email
    } catch {
      // token invalid => treat as guest
    }
  }
  next()
}

export { compare, hash }
