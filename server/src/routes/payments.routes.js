import { Router } from "express"
import snap from "../midtrans.js"
import { prisma } from "../db.js"
import { requireAuth } from "../auth.js"

const router = Router()

router.post("/create", requireAuth, async (req, res) => {
  const orderId = typeof req.body?.orderId === "string" ? req.body.orderId.trim() : ""
  const amount = Number(req.body?.amount ?? 0)
  const customer = req.body?.customer || {}

  if (!orderId) {
    return res.status(400).json({ error: "Order ID wajib diisi." })
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Nominal transaksi tidak valid." })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, total: true },
  })

  if (!order || order.userId !== req.userId) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan." })
  }

  const firstName =
    typeof customer.firstName === "string" && customer.firstName.trim()
      ? customer.firstName.trim()
      : "Coffidoor Customer"

  const email =
    typeof customer.email === "string" && customer.email.trim()
      ? customer.email.trim()
      : "customer@Coffidoor.test"

  const phone =
    typeof customer.phone === "string" && customer.phone.trim()
      ? customer.phone.trim()
      : "081234567890"

  const grossAmount = Math.max(1000, Math.round(amount))
  const appOrigin = (req.headers.origin || "http://localhost:8443").replace(/\/$/, "")

  try {
    const parameter = {
      transaction_details: {
        order_id: order.id,
        gross_amount: grossAmount,
      },
      item_details: [
        {
          id: order.id,
          name: "Pesanan Coffidoor",
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
      error: "Midtrans gagal membuat transaksi. Cek konfigurasi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY.",
    })
  }
})

export default router