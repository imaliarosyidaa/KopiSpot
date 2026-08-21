import { create } from "zustand"

const CART_STORAGE_KEY = "Coffidoor_session_cart"

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
    const stored = sessionStorage.getItem(CART_STORAGE_KEY)
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
  moveToWishlist: (id: string) => void
  moveFromWishlist: (id: string) => void
  removeFromWishlist: (id: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>((set) => ({
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
}))

useCartStore.subscribe((state) => {
  if (typeof window === "undefined") return
  sessionStorage.setItem(
    CART_STORAGE_KEY,
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
