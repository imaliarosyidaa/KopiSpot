import { create } from "zustand"
import { ensureGuestToken } from "./guest"

const userCartKey = (userId: string) => `Coffidoor_cart_user_${userId}`
const guestCartKey = () => `Coffidoor_cart_${ensureGuestToken()}`

let activeKey = guestCartKey()

export interface CartItem {
  id: string
  placeId: string
  placeName: string
  name: string
  price: number
  category: string
  imageUrl: string | null
  quantity: number
}

interface StoredCart {
  items: CartItem[]
  savedForLater: CartItem[]
  wishlist: CartItem[]
}

function readStoredCart(): StoredCart {
  if (typeof window === "undefined") {
    return { items: [], savedForLater: [], wishlist: [] }
  }

  try {
    const stored = localStorage.getItem(activeKey)
    if (!stored) return { items: [], savedForLater: [], wishlist: [] }
    const parsed = JSON.parse(stored) as Partial<StoredCart>
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      savedForLater: Array.isArray(parsed.savedForLater)
        ? parsed.savedForLater
        : [],
      wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
    }
  } catch {
    return { items: [], savedForLater: [], wishlist: [] }
  }
}

interface CartState {
  items: CartItem[]
  savedForLater: CartItem[]
  wishlist: CartItem[]
  add: (item: Omit<CartItem, "quantity">) => void
  setItems: (items: CartItem[]) => void
  setQuantity: (id: string, quantity: number) => void
  remove: (id: string) => void
  saveForLater: (id: string) => void
  restoreSaved: (id: string) => void
  removeSaved: (id: string) => void
  addToWishlist: (item: Omit<CartItem, "quantity">) => void
  toggleWishlist: (item: Omit<CartItem, "quantity">) => void
  moveToWishlist: (id: string) => void
  moveFromWishlist: (id: string) => void
  removeFromWishlist: (id: string) => void
  clear: () => void
  setIdentity: (userId: string | null) => void
}

export const useCartStore = create<CartState>((set, get) => ({
  ...readStoredCart(),
  add: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        }
      }
      return { items: [...state.items, { ...item, quantity: 1 }] }
    }),
  setItems: (items) => set({ items }),
  setQuantity: (id, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.id !== id)
          : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })),
  remove: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  saveForLater: (id) =>
    set((state) => {
      const item = state.items.find((i) => i.id === id)
      if (!item) return state
      return {
        items: state.items.filter((i) => i.id !== id),
        savedForLater: state.savedForLater.some((s) => s.id === id)
          ? state.savedForLater
          : [...state.savedForLater, item],
      }
    }),
  restoreSaved: (id) =>
    set((state) => {
      const item = state.savedForLater.find((i) => i.id === id)
      if (!item) return state
      return {
        items: [...state.items, item],
        savedForLater: state.savedForLater.filter((i) => i.id !== id),
      }
    }),
  removeSaved: (id) =>
    set((state) => ({
      savedForLater: state.savedForLater.filter((i) => i.id !== id),
    })),
  addToWishlist: (item) =>
    set((state) =>
      state.wishlist.some((wishlistItem) => wishlistItem.id === item.id)
        ? state
        : { wishlist: [...state.wishlist, { ...item, quantity: 1 }] },
    ),
  toggleWishlist: (item) =>
    set((state) =>
      state.wishlist.some((wishlistItem) => wishlistItem.id === item.id)
        ? { wishlist: state.wishlist.filter((wishlistItem) => wishlistItem.id !== item.id) }
        : { wishlist: [...state.wishlist, { ...item, quantity: 1 }] },
    ),
  moveToWishlist: (id) =>
    set((state) => {
      const item = state.items.find((i) => i.id === id)
      if (!item) return state
      return {
        items: state.items.filter((i) => i.id !== id),
        wishlist: state.wishlist.some((w) => w.id === id)
          ? state.wishlist
          : [...state.wishlist, item],
      }
    }),
  moveFromWishlist: (id) =>
    set((state) => {
      const item = state.wishlist.find((i) => i.id === id)
      if (!item) return state
      return {
        items: [...state.items, item],
        wishlist: state.wishlist.filter((i) => i.id !== id),
      }
    }),
  removeFromWishlist: (id) =>
    set((state) => ({ wishlist: state.wishlist.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
  setIdentity: (userId) => {
    const state = get()
    if (typeof window !== "undefined") {
      localStorage.setItem(
        activeKey,
        JSON.stringify({
          items: state.items,
          savedForLater: state.savedForLater,
          wishlist: state.wishlist,
        }),
      )
    }
    activeKey = userId ? userCartKey(userId) : guestCartKey()
    set(readStoredCart())
  },
}))

useCartStore.subscribe((state) => {
  if (typeof window === "undefined") return
  localStorage.setItem(
    activeKey,
    JSON.stringify({
      items: state.items,
      savedForLater: state.savedForLater,
      wishlist: state.wishlist,
    }),
  )
})

export function cartCount(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.quantity, 0)
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.price * i.quantity, 0)
}
