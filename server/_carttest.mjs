const store = new Map()
globalThis.window = {}
globalThis.sessionStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k),
}
const { useCartStore } = await import("./src/lib/cart-store.ts")

const s = () => useCartStore.getState()

// Guest adds items
s().add({ id: "v60", placeId: "p1", placeName: "Kopi", name: "V60 Flores Bajawa", price: 10000, category: "coffee", imageUrl: null })
s().add({ id: "esp", placeId: "p1", placeName: "Kopi", name: "Espresso", price: 12000, category: "coffee", imageUrl: null })
console.log("GUEST cart:", s().items.map((i) => i.name))

// Now login as user u123
s().setIdentity("u123")
console.log("AFTER login cart:", s().items.map((i) => i.name))

// Stored keys
for (const [k, v] of store.entries()) {
  console.log(k, "=>", JSON.parse(v).items.map((i) => i.name))
}
