import "dotenv/config"
import midtransClient from "midtrans-client"

const MIDTRANS_SERVER_KEY =
  process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-CHANGE_ME"
const MIDTRANS_CLIENT_KEY =
  process.env.MIDTRANS_CLIENT_KEY || "SB-Mid-client-CHANGE_ME"
const MIDTRANS_IS_PRODUCTION =
  String(process.env.MIDTRANS_IS_PRODUCTION ?? "false").toLowerCase() === "true"

const snap = new midtransClient.Snap({
  isProduction: MIDTRANS_IS_PRODUCTION,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
})

export default snap