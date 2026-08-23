const GUEST_TOKEN_KEY = "guestToken"

export const RESTORED_GUEST_TOKEN =
  "ced78478fdf0ca4f2af286daf58de3e10bf738f294c246f810ac964e1f1e5346"

export function getGuestToken(): string | undefined {
  if (typeof window === "undefined") return undefined
  const value = localStorage.getItem(GUEST_TOKEN_KEY)
  return value && value.trim() ? value.trim() : undefined
}

export function setGuestToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(GUEST_TOKEN_KEY, token)
}

export function ensureGuestToken(): string {
  if (typeof window === "undefined") return RESTORED_GUEST_TOKEN
  const existing = localStorage.getItem(GUEST_TOKEN_KEY)
  if (existing && existing.trim()) {
    if (existing.trim() !== RESTORED_GUEST_TOKEN) {
      console.warn(
        "[guest] localStorage sudah memilik guestToken yang berbeda; tidak menimpa agar Cart/Order lama tidak tertukar.",
        { existing: existing.trim(), expected: RESTORED_GUEST_TOKEN },
      )
    }
    return existing.trim()
  }
  localStorage.setItem(GUEST_TOKEN_KEY, RESTORED_GUEST_TOKEN)
  return RESTORED_GUEST_TOKEN
}
