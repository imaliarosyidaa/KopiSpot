import { prisma } from "./db.js"

const STATUS_META = {
  PACKED: { type: "ORDER_PACKED", title: "Pesanan Dikemas", message: "Pesanan kamu sedang dikemas." },
  SHIPPED: { type: "ORDER_SHIPPED", title: "Pesanan Dikirim", message: "Pesanan kamu sedang dikirim." },
  COMPLETED: { type: "ORDER_COMPLETED", title: "Pesanan Selesai", message: "Pesanan kamu telah selesai. Selamat menikmati!" },
  CANCELLED: { type: "ORDER_CANCELLED", title: "Pesanan Dibatalkan", message: "Pesanan kamu dibatalkan." },
  EXPIRED: { type: "ORDER_EXPIRED", title: "Pesanan Kedaluwarsa", message: "Pesanan kamu telah kedaluwarsa." },
}

// Owner is EITHER userId OR guestToken — never both.
async function createNotification({
  userId,
  guestToken,
  type,
  title,
  message,
  referenceId,
  referenceType,
}) {
  const owner = userId ? { userId } : guestToken ? { guestToken } : null
  if (!owner) return null

  // Idempotency: one notification per (owner, reference, type) to avoid duplicates
  // when the same order/payment event is processed more than once (e.g. Midtrans retries).
  if (referenceId && type) {
    const existing = await prisma.notification.findFirst({
      where: { ...owner, referenceId, type },
      select: { id: true },
    })
    if (existing) return null
  }

  return prisma.notification.create({
    data: {
      userId: userId ?? null,
      guestToken: userId ? null : guestToken ?? null,
      type,
      title,
      message: message ?? null,
      referenceId: referenceId ?? null,
      referenceType: referenceType ?? null,
      isRead: false,
    },
  })
}

export async function notifyOrderCreated(order) {
  return createNotification({
    userId: order.userId,
    guestToken: order.guestToken,
    type: "ORDER_CREATED",
    title: "Pesanan Berhasil",
    message: `Pesanan #${String(order.id).slice(-8)} berhasil dibuat.`,
    referenceId: order.id,
    referenceType: "ORDER",
  })
}

export async function notifyPaymentSuccess(order) {
  return createNotification({
    userId: order.userId,
    guestToken: order.guestToken,
    type: "PAYMENT_SUCCESS",
    title: "Pembayaran Berhasil",
    message: `Pembayaran pesanan #${String(order.id).slice(-8)} berhasil.`,
    referenceId: order.id,
    referenceType: "ORDER",
  })
}

export async function notifyOrderStatus(order, status) {
  const meta = STATUS_META[status]
  if (!meta) return null
  return createNotification({
    userId: order.userId,
    guestToken: order.guestToken,
    type: meta.type,
    title: meta.title,
    message: meta.message,
    referenceId: order.id,
    referenceType: "ORDER",
  })
}

// Best-effort wrappers so notification failures never break the main flow.
export const safe = (promise) => Promise.resolve(promise).catch(() => null)
