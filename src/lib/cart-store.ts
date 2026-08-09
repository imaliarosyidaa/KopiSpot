import { create } from "zustand";

export interface CartItem {
  id: string;
  placeId: string;
  placeName: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  add: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      // Pesanan hanya boleh berisi menu dari satu kafe.
      const base =
        state.items.length > 0 && state.items[0].placeId !== item.placeId ? [] : state.items;
      return { items: [...base, { ...item, quantity: 1 }] };
    }),
  setQuantity: (id, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.id !== id)
          : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })),
  remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
}));

export function cartCount(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.price * i.quantity, 0);
}
