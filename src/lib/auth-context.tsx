import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import type { ReactNode } from "react"
import { authApi, clearToken, getToken, setToken, type AuthUser } from "./api"

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    username?: string,
  ) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      if (getToken()) {
        try {
          const me = await authApi.me()
          if (active)
            setUser({
              id: me.id,
              name: me.name,
              username: me.username,
              email: me.email,
              image: me.image,
              xp: me.xp,
              level: me.level,
              role: me.role,
            })
        } catch {
          clearToken()
        }
      }
      if (active) setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!getToken()) return
    const me = await authApi.me()
    setUser({
      id: me.id,
      name: me.name,
      username: me.username,
      email: me.email,
      image: me.image,
      xp: me.xp,
      level: me.level,
      role: me.role,
    })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      username?: string,
    ) => {
      const data = await authApi.register(name, email, password, username)
      setToken(data.token)
      setUser(data.user)
    },
    [],
  )

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider")
  return ctx
}
