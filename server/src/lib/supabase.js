import { createClient } from "@supabase/supabase-js"
import { randomUUID } from "node:crypto"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

// Single shared bucket for all app uploads. Override with SUPABASE_BUCKET if needed.
export const BUCKET = process.env.SUPABASE_BUCKET || "app-uploads"

if (!url || !key) {
  // Don't crash the server, but warn loudly so misconfiguration is obvious.
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum di-set. Upload ke Supabase Storage tidak akan berfungsi.",
  )
}

// Publishable key is safe server-side for Storage operations on a public bucket.
// Never put a service-role key here or ship it to the browser.

// Node's built-in fetch (undici) can hang on IPv6 / proxy in some networks,
// producing "Connect Timeout". Build a dispatcher that forces IPv4, waits longer,
// and honours HTTP(S)_PROXY when set.
let customFetch
try {
  const { Agent, ProxyAgent, fetch: undiciFetch } = await import("undici")
  const proxy =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy
  const dispatcher = proxy
    ? new ProxyAgent(proxy)
    : new Agent({ connect: { timeout: 30000, family: 4, autoSelectFamily: true } })
  customFetch = (u, opts) => undiciFetch(u, { ...opts, dispatcher })
} catch (e) {
  console.warn("[supabase] custom fetch unavailable, using global fetch:", e?.message)
}

export const supabase = createClient(
  url ?? "",
  key ?? "",
  customFetch ? { fetch: customFetch } : {},
)

const MIME_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

export function isAllowedMime(mime) {
  return Object.prototype.hasOwnProperty.call(MIME_EXT, mime)
}

export function extForMime(mime) {
  return MIME_EXT[mime] || "jpg"
}

// Upload a Buffer to Supabase Storage and return the public URL.
export async function uploadImage(buffer, mimetype, folder = "misc") {
  const safeFolder = String(folder).replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 32) || "misc"
  const filename = `${randomUUID()}.${extForMime(mimetype)}`
  const path = `${safeFolder}/${filename}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimetype,
    upsert: false,
    cacheControl: "3600",
  })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// Delete a previously uploaded file by its stored URL. No-op for legacy
// local (/uploads/...) paths so old data is never touched.
export async function deleteImageByUrl(url) {
  if (!url || typeof url !== "string") return
  const marker = `/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const path = url.slice(idx + marker.length)
  if (!path) return
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) console.error("[supabase] gagal menghapus file:", error.message)
}
