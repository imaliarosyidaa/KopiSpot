import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"
import { notificationsApi, type Notification } from "./api"
import { ensureGuestToken } from "./guest"

type NotificationContextValue = {
  count: number
  items: Notification[]
  open: boolean
  loading: boolean
  setOpen: (open: boolean) => void
  refresh: () => void
  markRead: (id: string) => void
  markAllRead: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

// Database is the source of truth; this context only caches the unread count
// and (when opened) the recent list. Refreshes on auth change + periodic poll.
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const token = () => (user ? undefined : ensureGuestToken())

  const fetchCount = useCallback(async () => {
    try {
      const { count } = await notificationsApi.unreadCount(token())
      setCount(count)
    } catch {
      // keep previous count on transient errors
    }
  }, [user])

  const refresh = useCallback(() => {
    void fetchCount()
  }, [fetchCount])

  useEffect(() => {
    void fetchCount()
    const id = window.setInterval(() => void fetchCount(), 20000)
    return () => window.clearInterval(id)
  }, [fetchCount])

  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    notificationsApi
      .list(token())
      .then((list) => {
        if (active) setItems(list)
      })
      .catch(() => {
        if (active) setItems([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, user])

  const markRead = useCallback(
    (id: string) => {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      setCount((c) => Math.max(0, c - 1))
      notificationsApi.markRead(id, token()).catch(() => {})
    },
    [user],
  )

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setCount(0)
    notificationsApi.markAllRead(token()).catch(() => {})
  }, [user])

  return (
    <NotificationContext.Provider
      value={{ count, items, open, loading, setOpen, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotifications harus dipakai di dalam NotificationProvider")
  return ctx
}
