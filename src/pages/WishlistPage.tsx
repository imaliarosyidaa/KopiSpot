import { Link } from "react-router-dom"
import { MdDeleteOutline, MdShoppingCart } from "react-icons/md"
import { useCartStore, type CartItem } from "@/lib/cart-store"
import { formatRupiah } from "@/lib/format"
import { menuImageUrl } from "@/lib/menu-images"

export default function WishlistPage(): React.JSX.Element {
  const wishlist = useCartStore((state) => state.wishlist)
  const add = useCartStore((state) => state.add)
  const removeFromWishlist = useCartStore((state) => state.removeFromWishlist)
  const addToCart = (item: CartItem) => {
    const { quantity: _quantity, ...cartItem } = item
    add(cartItem)
  }

  return (
    <main className="min-h-screen bg-background px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4"><div><span className="tag-pill mb-2 inline-block">Koleksi pribadi</span><h1 className="text-3xl font-black text-foreground">Wishlist</h1></div><Link to="/order" className="text-sm font-bold text-primary hover:underline">Jelajahi menu</Link></div>
        {wishlist.length === 0 ? <div className="glass-card rounded-2xl px-6 py-16 text-center"><h2 className="font-bold text-foreground">Wishlist masih kosong</h2><p className="mt-2 text-sm text-muted-foreground">Tekan ikon hati pada menu yang ingin kamu simpan.</p></div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{wishlist.map((item: CartItem) => <article key={item.id} className="glass-card overflow-hidden rounded-2xl"><img src={menuImageUrl(item.category, item.imageUrl, item.name)} alt={item.name} className="h-40 w-full object-cover" /><div className="p-4"><h2 className="truncate text-sm font-bold text-foreground">{item.name}</h2><p className="truncate text-xs text-muted-foreground">{item.placeName}</p><p className="mt-1 text-sm font-black text-primary">{formatRupiah(item.price)}</p><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => addToCart(item)} className="flex items-center justify-center gap-1 rounded-xl bg-primary px-2 py-2 text-[11px] font-bold text-primary-foreground"><MdShoppingCart />Tambah</button><button type="button" onClick={() => removeFromWishlist(item.id)} aria-label={`Hapus ${item.name}`} className="flex items-center justify-center rounded-xl border border-border px-2 py-2 text-destructive hover:bg-destructive/10"><MdDeleteOutline className="h-4 w-4" /></button></div></div></article>)}</div>}
      </div>
    </main>
  )
}
