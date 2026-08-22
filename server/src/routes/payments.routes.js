import { Router } from "express"
import crypto from "node:crypto"
import snap from "../midtrans.js"
import { prisma } from "../db.js"
import { optionalAuth } from "../auth.js"

const router = Router()

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

  if (order.paymentStatus === "PAID") {
    return res.json({ ok: true })
  }

  const transactionStatus = String(notification.transaction_status || "")
  const fraudStatus = String(notification.fraud_status || "")
  const paid = transactionStatus === "settlement" || (transactionStatus === "capture" && fraudStatus !== "deny")
  const cancelled = ["cancel", "deny", "expire"].includes(transactionStatus)
  const nextPaymentStatus = paid ? "PAID" : cancelled ? "FAILED" : "UNPAID"
  const nextOrderStatus = paid ? "PREPARING" : cancelled ? "CANCELLED" : order.status

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: nextPaymentStatus,
      status: nextOrderStatus,
      paymentMethod: "Midtrans",
      paymentTransactionId: String(notification.transaction_id || order.paymentTransactionId || order.id),
    },
  })

  return res.json({ ok: true })
})

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
    select: { id: true, userId: true, guestToken: true, total: true },
  })

  const ownsOrder = order && (order.userId === req.userId || order.guestToken === guestToken)
  if (!ownsOrder) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan." })
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

  const grossAmount = Math.max(1000, Math.round(Number(order.total)))
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
      finish_redirect_url: `${appOrigin}/order/keranjang?payment=success&order_id=${order.id}`,
      error_redirect_url: `${appOrigin}/order/keranjang?payment=failed&order_id=${order.id}`,
    }

    const transaction = await snap.createTransaction(parameter)

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