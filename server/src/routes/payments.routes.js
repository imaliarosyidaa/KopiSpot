import { Router } from "express"
import crypto from "node:crypto"
import snap, { coreApi } from "../midtrans.js"
import { prisma } from "../db.js"
import { optionalAuth } from "../auth.js"

const router = Router()

router.get("/status/:id", optionalAuth, async (req, res) => {
  const guestToken =
    typeof req.query.guestToken === "string" ? req.query.guestToken.trim() : ""
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { id: true, userId: true, guestToken: true, total: true },
  })

  const ownsOrder =
    order && (order.userId === req.userId || order.guestToken === guestToken)
  if (!ownsOrder) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan." })
  }
  try {
    const status = await coreApi.transaction.status(order.id)
    const transactionStatus = String(status.transaction_status || "")
    const fraudStatus = String(status.fraud_status || "")
    const paid =
      transactionStatus === "settlement" ||
      (transactionStatus === "capture" && fraudStatus === "accept")
    const cancelled = ["cancel", "deny"].includes(transactionStatus)
    const expired = transactionStatus === "expire"

    if (paid || cancelled || expired) {
      await applyMidtransStatus({
        orderId: order.id,
        transactionStatus,
        fraudStatus,
        transactionId: String(status.transaction_id || order.id),
      })
    }

    return res.json({
      paymentStatus: paid ? "PAID" : cancelled || expired ? "FAILED" : "PENDING",
    })
  } catch (error) {
    console.error("Midtrans status error:", error)
    return res.status(502).json({ error: "Status pembayaran Midtrans belum dapat diperiksa." })
  }
})

router.post("/notification", async (req, res) => {
  const notification = req.body || {}
  const orderId = typeof notification.order_id === "string" ? notification.order_id : ""
  const statusCode = String(notification.status_code || "")
  const grossAmount = String(notification.gross_amount || "")
  const signature = String(notification.signature_key || "")
  const expected = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${process.env.MIDTRANS_SERVER_KEY || ""}`)
    .digest("hex")

  if (!orderId || !signature || signature !== expected) {
    return res.status(401).json({ error: "Signature Midtrans tidak valid." })
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return res.status(404).json({ error: "Order tidak ditemukan." })

  const notifiedAmount = Math.round(Number(grossAmount))
  if (!Number.isFinite(notifiedAmount) || notifiedAmount !== order.total) {
    return res.status(400).json({ error: "Nominal notifikasi Midtrans tidak cocok." })
  }

  const transactionStatus = String(notification.transaction_status || "")
  const fraudStatus = String(notification.fraud_status || "")
  await applyMidtransStatus({
    orderId: order.id,
    transactionStatus,
    fraudStatus,
    transactionId: String(notification.transaction_id || order.paymentTransactionId || order.id),
  })

  return res.json({ ok: true })
})

async function applyMidtransStatus({ orderId, transactionStatus, fraudStatus, transactionId }) {
  const paid =
    transactionStatus === "settlement" ||
    (transactionStatus === "capture" && fraudStatus === "accept")
  const cancelled = ["cancel", "deny"].includes(transactionStatus)
  const expired = transactionStatus === "expire"

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { paymentStatus: true, status: true },
    })
    if (!order) return null
    if (order.paymentStatus === "PAID" && (!paid || order.status === "PACKED")) return order

    return tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: paid ? "PAID" : cancelled || expired ? "FAILED" : "PENDING",
        status: paid ? "PACKED" : expired ? "EXPIRED" : cancelled ? "CANCELLED" : "PENDING_PAYMENT",
        paymentMethod: "Midtrans",
        midtransTransactionStatus: transactionStatus,
        ...(paid || cancelled || expired ? { paymentTransactionId: transactionId } : {}),
      },
    })
  })
}

router.post("/create", optionalAuth, async (req, res) => {
  const orderId = typeof req.body?.orderId === "string" ? req.body.orderId.trim() : ""
  const amount = Number(req.body?.amount ?? 0)
  const customer = req.body?.customer || {}
  const guestToken =
    typeof req.body?.guestToken === "string" ? req.body.guestToken.trim() : ""

  if (!orderId) {
    return res.status(400).json({ error: "Order ID wajib diisi." })
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Nominal transaksi tidak valid." })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
      select: {
        id: true,
        userId: true,
        guestToken: true,
        total: true,
        paymentStatus: true,
        midtransRedirectUrl: true,
        midtransSnapToken: true,
        midtransTransactionStatus: true,
      },
  })

  const ownsOrder = order && (order.userId === req.userId || order.guestToken === guestToken)
  if (!ownsOrder) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan." })
  }
  if (Math.round(amount) !== order.total) {
    return res.status(400).json({ error: "Nominal transaksi tidak cocok dengan total order." })
  }
  if (order.paymentStatus === "PAID") {
    return res.status(409).json({ error: "Pesanan sudah dibayar." })
  }

  if (order.midtransRedirectUrl && order.midtransTransactionStatus === "pending") {
    try {
      const current = await coreApi.transaction.status(order.id)
      const currentStatus = String(current.transaction_status || "")
      if (currentStatus === "pending") {
        return res.json({
          success: true,
          orderId: order.id,
          amount: order.total,
          token: order.midtransSnapToken,
          redirect_url: order.midtransRedirectUrl,
          paymentId: order.midtransSnapToken,
        })
      }
    } catch (error) {
      console.warn("Midtrans existing transaction status unavailable:", error)
    }
  }

  const firstName =
    typeof customer.firstName === "string" && customer.firstName.trim()
      ? customer.firstName.trim()
      : "coffidoor Customer"

  const email =
    typeof customer.email === "string" && customer.email.trim()
      ? customer.email.trim()
      : "customer@coffidoor.test"

  const phone =
    typeof customer.phone === "string" && customer.phone.trim()
      ? customer.phone.trim()
      : "081234567890"

  const grossAmount = Math.round(Number(order.total))
  const appOrigin = (
    req.headers.origin ||
    process.env.CLIENT_ORIGIN ||
    "http://localhost:8443"
  ).replace(/\/$/, "")

  try {
    const parameter = {
      transaction_details: {
        order_id: order.id,
        gross_amount: grossAmount,
      },
      item_details: [
        {
          id: order.id,
          name: "Pesanan coffidoor",
          price: grossAmount,
          quantity: 1,
        },
      ],
      customer_details: {
        first_name: firstName,
        email,
        phone,
      },
      credit_card: {
        secure: true,
      },
      callbacks: {
        finish: `${appOrigin}/order/keranjang?payment=success&order_id=${order.id}`,
        error: `${appOrigin}/order/keranjang?payment=failed&order_id=${order.id}`,
        unfinish: `${appOrigin}/order/keranjang?payment=pending&order_id=${order.id}`,
      },
    }

    const transaction = await snap.createTransaction(parameter)

    await prisma.order.update({
      where: { id: order.id },
      data: {
        midtransOrderId: order.id,
        midtransSnapToken: transaction.token,
        midtransRedirectUrl: transaction.redirect_url,
        midtransTransactionStatus: "pending",
        paymentMethod: "Midtrans",
      },
    })

    return res.json({
      success: true,
      orderId: order.id,
      amount: grossAmount,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      paymentId: transaction.token,
    })
  } catch (error) {
    console.error("Midtrans createTransaction error:", error)
    return res.status(400).json({
      error:
        error instanceof Error && error.message
          ? `Midtrans gagal membuat transaksi: ${error.message}`
          : "Midtrans gagal membuat transaksi. Cek konfigurasi key dan mode sandbox/production.",
    })
  }
})

export default router